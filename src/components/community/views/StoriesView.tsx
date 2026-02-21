"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { SkeletonLoader } from '@/components/community/SkeletonLoader';
import { SuccessStoryCard } from '@/components/community/SuccessStoryCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import styles from './StoriesView.module.css';

interface Story {
    id: number;
    title: string;
    story: string;
    before_image_url: string | null;
    after_image_url: string | null;
    achievement_type: string;
    likes: number;
    author_name: string;
    author_avatar: string | null;
    user_liked?: boolean;
    user_id?: string;
}

export function StoriesView() {
    const { user } = useUser();
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [newStory, setNewStory] = useState({
        title: '',
        story: '',
        achievement_type: 'lifestyle'
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fetchStories = useCallback(async () => {
        setLoading(true);
        const { data: storiesData, error } = await supabase
            .from('success_stories')
            .select('*')
            .order('likes', { ascending: false });

        if (storiesData && !error) {
            // Fetch user likes
            let userLikes: number[] = [];
            if (user) {
                const { data: likesData } = await supabase
                    .from('story_likes')
                    .select('story_id')
                    .eq('user_id', user.id);

                if (likesData) {
                    userLikes = likesData.map((like: { story_id: number }) => like.story_id);
                }
            }

            const storiesWithMeta = storiesData.map((s: Partial<Story>) => ({
                ...s,
                // Don't show user IDs or encoded strings - use friendly fallback
                author_name: (s.author_name &&
                    !s.author_name.startsWith('user_') &&
                    !s.author_name.includes('http') &&
                    s.author_name.length < 50)
                    ? s.author_name : 'Eco Warrior',
                author_avatar: null,
                user_liked: s.id ? userLikes.includes(s.id) : false
            })) as Story[];
            setStories(storiesWithMeta);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `story-${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `story-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('community')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        const { data } = supabase.storage
            .from('community')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleShareStory = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!user) {
            setFormError("You must be signed in to share a story.");
            return;
        }
        if (!newStory.title.trim()) {
            setFormError("Title is required.");
            return;
        }
        if (!newStory.story.trim()) {
            setFormError("Story content is required.");
            return;
        }

        setSubmitting(true);

        let afterImageUrl: string | null = null;
        if (imageFile) {
            afterImageUrl = await uploadImage(imageFile);
        }

        const { data, error } = await supabase
            .from('success_stories')
            .insert([{
                title: newStory.title,
                story: newStory.story,
                achievement_type: newStory.achievement_type,
                user_id: user.id,
                author_name: user.fullName || user.username || 'Anonymous',
                likes: 0,
                after_image_url: afterImageUrl
            }])
            .select()
            .single();

        if (data && !error) {
            const newStoryObj: Story = {
                ...data,
                user_liked: false,
                author_avatar: user.imageUrl || null
            };
            setStories([newStoryObj, ...stories]);
            setShowShareModal(false);
            setNewStory({ title: '', story: '', achievement_type: 'lifestyle' });
            setImageFile(null);
            setImagePreview(null);
        } else {
            console.error("Error sharing story:", JSON.stringify(error, null, 2));
            setFormError(`Failed to share story: ${error?.message || 'Unknown error'}`);
        }
        setSubmitting(false);
    };

    const handleDeleteStory = async (storyId: number) => {
        if (!user) return;

        const { error } = await supabase
            .from('success_stories')
            .delete()
            .eq('id', storyId)
            .eq('user_id', user.id);

        if (!error) {
            setStories(stories.filter(s => s.id !== storyId));
        }
    };

    const [likingInProgress, setLikingInProgress] = useState<Set<number>>(new Set());

    const handleLike = async (storyId: number) => {
        if (!user || likingInProgress.has(storyId)) return;

        const story = stories.find(s => s.id === storyId);
        if (!story) return;

        const alreadyLiked = story.user_liked;

        // Prevent double-clicks
        setLikingInProgress(prev => new Set(prev).add(storyId));

        // Optimistic update
        setStories(stories.map(s =>
            s.id === storyId
                ? {
                    ...s,
                    likes: alreadyLiked ? Math.max(0, s.likes - 1) : s.likes + 1,
                    user_liked: !alreadyLiked
                }
                : s
        ));

        if (alreadyLiked) {
            // Unlike: remove from story_likes (trigger decrements likes count)
            await supabase
                .from('story_likes')
                .delete()
                .eq('story_id', storyId)
                .eq('user_id', user.id);
        } else {
            // Like: insert into story_likes (trigger increments likes count)
            await supabase
                .from('story_likes')
                .insert({ story_id: storyId, user_id: user.id });
        }

        setLikingInProgress(prev => {
            const next = new Set(prev);
            next.delete(storyId);
            return next;
        });
    };

    if (loading) return (
        <div className={styles.container}>
            <SkeletonLoader type="card" count={3} />
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>🌟 Success Stories</h2>
                <p>Inspiring transformations from our community</p>
                <Button onClick={() => { setShowShareModal(true); setFormError(null); }} style={{ marginTop: '1rem' }}>Share Your Story</Button>
            </header>

            {showShareModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Share Your Success Story</h3>
                        {formError && (
                            <div style={{
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                border: '1px solid #fca5a5',
                                textAlign: 'center'
                            }}>
                                {formError}
                            </div>
                        )}
                        <form onSubmit={handleShareStory}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newStory.title}
                                    onChange={e => setNewStory({ ...newStory, title: e.target.value })}
                                    required
                                    placeholder="e.g. My Zero Waste Journey"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Your Story</label>
                                <textarea
                                    value={newStory.story}
                                    onChange={e => setNewStory({ ...newStory, story: e.target.value })}
                                    required
                                    placeholder="Tell us about your achievement..."
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Achievement Type</label>
                                <select
                                    value={newStory.achievement_type}
                                    onChange={e => setNewStory({ ...newStory, achievement_type: e.target.value })}
                                >
                                    <option value="lifestyle">🌱 Lifestyle Change</option>
                                    <option value="energy">⚡ Energy Saving</option>
                                    <option value="community">🤝 Community Impact</option>
                                    <option value="conservation">🌳 Conservation</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Proof / Photo (Optional)</label>
                                {imagePreview ? (
                                    <div className={styles.imagePreview}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeImage}
                                            style={{ marginTop: '0.5rem', color: 'red' }}
                                        >
                                            Remove Photo
                                        </Button>
                                    </div>
                                ) : (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                    />
                                )}
                            </div>
                            <div className={styles.formActions}>
                                <Button type="button" variant="ghost" onClick={() => { setShowShareModal(false); setFormError(null); }}>Cancel</Button>
                                <Button type="submit" disabled={submitting}>{submitting ? 'Sharing...' : 'Share Story'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className={styles.storiesGrid}>
                {stories.length > 0 ? (
                    stories.map(story => (
                        <SuccessStoryCard
                            key={story.id}
                            story={story}
                            onLike={handleLike}
                            onDelete={(user && story.user_id === user.id) ? handleDeleteStory : undefined}
                        />
                    ))
                ) : (
                    <Card className={styles.emptyState}>
                        <p>No stories shared yet. Be the first to inspire others!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
