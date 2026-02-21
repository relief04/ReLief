import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import styles from './SuccessStoryCard.module.css';

interface SuccessStoryCardProps {
    story: {
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
    };
    onLike: (storyId: number) => void;
    onDelete?: (storyId: number) => void;
}

export function SuccessStoryCard({ story, onLike, onDelete }: SuccessStoryCardProps) {
    const [liking, setLiking] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleLikeClick = async () => {
        setLiking(true);
        await onLike(story.id);
        setLiking(false);
    };

    const { confirm } = useToast();

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Story',
            message: 'Are you sure you want to delete this story?',
            danger: true,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        });
        if (onDelete && confirmed) {
            onDelete(story.id);
        }
    };

    return (
        <>
            <Card className={styles.storyCard} padding="none">
                <div className={styles.imagesContainer}>
                    {story.before_image_url ? (
                        <div className={styles.imageWrapper} key="before">
                            <img
                                src={story.before_image_url}
                                alt="Story Image"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedImage(story.before_image_url)}
                            />
                        </div>
                    ) : null}
                    {story.after_image_url ? (
                        <div className={styles.imageWrapper} key="after">
                            <img
                                src={story.after_image_url}
                                alt="Story Image"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedImage(story.after_image_url)}
                            />
                        </div>
                    ) : null}
                    {!story.before_image_url && !story.after_image_url ? (
                        <div className={styles.imageWrapper} style={{ backgroundColor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }} key="placeholder">
                            <span style={{ fontSize: '3rem' }}>🌟</span>
                        </div>
                    ) : null}
                </div>

                <div className={styles.content}>
                    <h3>{story.title}</h3>
                    <span className={styles.typeBadge}>{story.achievement_type}</span>
                    <p>{story.story}</p>
                </div>

                <div className={styles.footer}>
                    <div className={styles.author}>
                        {story.author_avatar ? (
                            <img src={story.author_avatar} alt={story.author_name} className={styles.avatarPlaceholder} style={{ objectFit: 'cover' }} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>👤</div>
                        )}
                        <span>{story.author_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleLikeClick}
                            disabled={liking}
                            className={story.user_liked ? styles.liked : ''}
                        >
                            {story.user_liked ? '❤️' : '🤍'} {story.likes}
                        </Button>
                        {onDelete && (
                            <button onClick={handleDelete} className={styles.deleteBtn}>
                                🗑️
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '-10px',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '2rem',
                                cursor: 'pointer',
                                zIndex: 10000
                            }}
                        >
                            &times;
                        </button>
                        <img
                            src={selectedImage || undefined}
                            alt="Preview"
                            style={{
                                maxWidth: '100vw',
                                maxHeight: '100vh',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
