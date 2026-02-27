"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PostCard } from '@/components/community/PostCard';
import { SkeletonLoader } from '@/components/community/SkeletonLoader';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/context/ToastContext';
import { checkAndAwardBadges } from '@/lib/badges';
import { useRefresh } from '@/context/RefreshContext';
import styles from './FeedView.module.css';

interface Post {
    id: number;
    author: string;
    avatar: string;
    content: string;
    image_url?: string;
    hashtags?: string[];
    likes: number;
    comments: number;
    timestamp: string;
    liked_by_user?: boolean;
    user_id?: string;
}

interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
}

interface FeedViewProps {
    selectedHashtag: string | null;
    onHashtagClick: (hashtag: string | null) => void;
}

export function FeedView({ selectedHashtag, onHashtagClick }: FeedViewProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const { refreshKey, triggerRefresh } = useRefresh();
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const fetchPosts = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);

        if (user) {
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('*')
                .is('group_id', null)
                .order('created_at', { ascending: false });

            if (postsError) {
                console.error('Error fetching posts:', postsError);
                if (!silent) setLoading(false);
                return;
            }

            if (postsData && mountedRef.current) {
                const userIds = [...new Set(postsData.map((p: { user_id: string }) => p.user_id))];

                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds);

                const profileMap = new Map<string, Profile>();
                if (profilesData) {
                    profilesData.forEach((profile: Profile) => {
                        profileMap.set(profile.id, profile);
                    });
                }

                const { data: likesData } = await supabase
                    .from('post_likes')
                    .select('post_id')
                    .eq('user_id', user.id);

                const userLikes = likesData?.map((like: { post_id: number }) => like.post_id) || [];

                const { data: allLikesData } = await supabase
                    .from('post_likes')
                    .select('post_id');

                const likeCounts = new Map<number, number>();
                if (allLikesData) {
                    allLikesData.forEach((like: { post_id: number }) => {
                        const count = likeCounts.get(like.post_id) || 0;
                        likeCounts.set(like.post_id, count + 1);
                    });
                }

                const formattedPosts = postsData.map((p: {
                    id: number;
                    user_id: string;
                    author_name: string;
                    avatar_url: string | null;
                    content: string;
                    image_url?: string;
                    hashtags?: string[];
                    comments_count: number;
                    created_at: string;
                }) => {
                    const profile = profileMap.get(p.user_id);

                    let displayName: string = 'Community Member';
                    let displayAvatar: string = '👤';

                    const isSafeName = (name: string | null | undefined) => {
                        if (!name) return false;
                        const lower = name.toLowerCase();
                        return !lower.startsWith('user_') &&
                            !lower.includes('http') &&
                            name.length < 50 &&
                            !name.match(/^[0-9a-f]{8}-[0-9a-f]{4}/);
                    };

                    if (profile) {
                        if (isSafeName(profile.username)) displayName = profile.username;
                        if (profile.avatar_url) displayAvatar = profile.avatar_url;
                    }

                    if (p.user_id === user.id) {
                        if (isSafeName(user.fullName)) displayName = user.fullName!;
                        else if (isSafeName(user.username)) displayName = user.username!;
                        else displayName = "You";
                        displayAvatar = user.imageUrl || '👤';
                    } else if (isSafeName(p.author_name)) {
                        displayName = p.author_name;
                        if (p.avatar_url) displayAvatar = p.avatar_url;
                    }

                    return {
                        id: p.id,
                        author: displayName,
                        avatar: displayAvatar,
                        content: p.content,
                        image_url: p.image_url,
                        hashtags: p.hashtags,
                        likes: likeCounts.get(p.id) || 0,
                        comments: p.comments_count || 0,
                        timestamp: new Date(p.created_at).toLocaleDateString(),
                        liked_by_user: userLikes.includes(p.id),
                        user_id: p.user_id
                    };
                });

                if (mountedRef.current) setPosts(formattedPosts);
            }
        }
        if (mountedRef.current) setLoading(false);
    }, [user]);

    // Initial load + forced refresh via refreshKey
    useEffect(() => {
        fetchPosts(false);
    }, [user, refreshKey, fetchPosts]);

    // Silent polling every 30 s to pick up posts from other users
    useEffect(() => {
        const poll = setInterval(() => fetchPosts(true), 30_000);
        return () => clearInterval(poll);
    }, [fetchPosts]);

    const extractHashtags = (text: string): string[] => {
        const hashtagRegex = /#\w+/g;
        const matches = text.match(hashtagRegex);
        return matches ? matches : [];
    };

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
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `post-images/${fileName}`;

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

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() && !imageFile) return;

        setUploading(true);

        let imageUrl: string | null = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        const hashtags = extractHashtags(newPost);

        // Determine safe author name for storage
        let safeAuthorName = "Community Member";
        if (user?.fullName && !user.fullName.includes('http')) safeAuthorName = user.fullName;
        else if (user?.firstName && !user.firstName.includes('http')) safeAuthorName = user.firstName;
        else if (user?.username && !user.username.startsWith('user_')) safeAuthorName = user.username;

        const { data, error } = await supabase
            .from('posts')
            .insert([
                {
                    author_name: safeAuthorName,
                    avatar_url: user?.imageUrl || "👤",
                    content: newPost,
                    image_url: imageUrl,
                    hashtags: hashtags.length > 0 ? hashtags : null,
                    user_id: user?.id
                }
            ])
            .select();

        if (data && !error) {
            // BACKGROUND TASK: Trigger Email Notification for New Post
            fetch('/api/actions/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    actionType: 'new_post',
                    metadata: { contentPreview: newPost }
                })
            }).catch(err => console.error("Failed to trigger post email:", err));

            setNewPost('');
            setImageFile(null);
            setImagePreview(null);
            setShowCreateModal(false);

            // Silent refresh — replaces optimistic entry with accurate DB data
            await fetchPosts(true);

            // Refresh user badges/points after posting
            if (user?.id) await checkAndAwardBadges(user.id);
            toast("Post created successfully! You earned karma points. 🌿", 'success');
            // Trigger global refresh for other pages
            triggerRefresh('post');
        }

        setUploading(false);
    };


    const handleLikeToggle = async (postId: number) => {
        if (!user) return;

        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const isLiked = post.liked_by_user;

        // Optimistic update
        setPosts(posts.map(p =>
            p.id === postId
                ? { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1, liked_by_user: !isLiked }
                : p
        ));

        try {
            if (isLiked) {
                // Unlike
                await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id);

                // Try to update post likes count directly
                await supabase
                    .from('posts')
                    .update({ likes: Math.max(0, post.likes - 1) })
                    .eq('id', postId);

            } else {
                // Like
                await supabase
                    .from('post_likes')
                    .insert([{ post_id: postId, user_id: user.id }]);

                // Try to update post likes count directly
                await supabase
                    .from('posts')
                    .update({ likes: post.likes + 1 })
                    .eq('id', postId);

                // BACKGROUND TASK: Trigger Email Notification
                // We do this silently (fire and forget) so it doesn't block the UI
                fetch('/api/interactions/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        postId,
                        actorId: user.id,
                        actionType: 'like'
                    })
                }).catch(err => console.error("Failed to trigger like email:", err));
            }

            // We trust the optimistic update, no need to refetch count here
            // because the rpc or count might fail depending on DB permissions
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert optimistic update on error
            setPosts(posts.map(p =>
                p.id === postId
                    ? { ...p, likes: isLiked ? p.likes + 1 : p.likes - 1, liked_by_user: isLiked }
                    : p
            ));
        }
    };



    const handleDeletePost = async (postId: number) => {
        if (!user) return;

        // Save current posts for potential revert
        const previousPosts = [...posts];

        // Optimistic update
        setPosts(posts.filter(p => p.id !== postId));

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', user.id);

            if (error) {
                throw error;
            }

            // Refresh trending topics (a deleted post may have had unique hashtags)
            triggerRefresh('post');
        } catch (error) {
            console.error('Error deleting post:', error);
            // Revert on error
            setPosts(previousPosts);
            toast("Failed to delete post. You might not have permission or there's a connection issue.", 'error');
        }
    };

    const handleEditPost = async (postId: number, newContent: string) => {
        if (!user) return;

        // Optimistic update
        setPosts(posts.map(p =>
            p.id === postId
                ? { ...p, content: newContent }
                : p
        ));

        const { error } = await supabase
            .from('posts')
            .update({ content: newContent })
            .eq('id', postId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error updating post:', error);
        }
    };

    if (loading) return (
        <div className={styles.container}>
            <SkeletonLoader type="post" count={3} />
        </div>
    );

    // Filter posts by selected hashtag
    const filteredPosts = selectedHashtag
        ? posts.filter(p => p.hashtags?.includes(selectedHashtag))
        : posts;

    return (
        <div className={styles.feed}>
            {selectedHashtag && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-surface)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Filtering by: <strong>{selectedHashtag}</strong></span>
                    <button onClick={() => onHashtagClick(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '1.2rem' }}>✕</button>
                </div>
            )}
            {/* Header with Create Action */}
            <div className={styles.header}>
                <div>
                    <h2>📰 Community Feed</h2>
                    <p>Share your journey and inspire others</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>+ Create Post</Button>
            </div>

            {/* Create Post Modal */}
            {showCreateModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Create New Post</h3>
                            <button onClick={() => setShowCreateModal(false)} className={styles.closeBtn}>✕</button>
                        </div>

                        <div className={styles.userInfo}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={user?.imageUrl || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                                alt="Your Avatar"
                                className={styles.avatar}
                            />
                            <span className={styles.userName}>{user?.fullName || user?.username || 'Community Member'}</span>
                        </div>

                        <form onSubmit={handlePost}>
                            <textarea
                                className={styles.textarea}
                                placeholder="What's on your eco-mind?"
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                autoFocus
                            />

                            {imagePreview && (
                                <div className={styles.imagePreview}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imagePreview} alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className={styles.removeImageBtn}
                                        title="Remove image"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <div className={styles.divider}></div>

                            <div className={styles.postActions}>
                                <label className={styles.imageUploadBtn}>
                                    <span>📷</span> Photo/Video
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                <div className={styles.modalActions}>
                                    <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                    <Button
                                        type="submit"
                                        disabled={(!newPost.trim() && !imageFile) || uploading}
                                    >
                                        {uploading ? 'Posting...' : 'Post'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className={styles.postsList}>
                {filteredPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</p>
                        <p style={{ fontSize: '1.1rem' }}>
                            {selectedHashtag ? `No posts found with ${selectedHashtag}` : 'No posts yet. Be the first to share!'}
                        </p>
                    </div>
                ) : (
                    filteredPosts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={user?.id}
                            currentUserName={user?.fullName || user?.username || undefined}
                            onLikeToggle={handleLikeToggle}
                            onDelete={handleDeletePost}
                            onEdit={handleEditPost}
                            onHashtagClick={onHashtagClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
