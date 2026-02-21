import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/context/ToastContext';
import styles from './PostCard.module.css';

interface Comment {
    id: number;
    user_id: string;
    author_name: string;
    avatar_url: string;
    content: string;
    created_at: string;
}

interface PostCardProps {
    post: {
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
    };
    currentUserId?: string;
    currentUserName?: string;
    onLikeToggle: (postId: number) => void;
    onCommentAdded?: (postId: number) => void;
    onDelete?: (postId: number) => void;
    onEdit?: (postId: number, newContent: string) => void;
    onHashtagClick?: (hashtag: string) => void;
}

interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
}

export function PostCard({ post, currentUserId, currentUserName, onLikeToggle, onDelete, onEdit, onHashtagClick }: PostCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [showLikes, setShowLikes] = useState(false);
    const [likedByUsers, setLikedByUsers] = useState<Array<{ id: string, name: string, avatar: string }>>([]);
    const [loadingLikes, setLoadingLikes] = useState(false);

    // Comment State
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentContent, setEditCommentContent] = useState('');

    const isAuthor = currentUserId === post.user_id;

    const handleLike = async () => {
        onLikeToggle(post.id);
    };

    const { confirm, toast } = useToast();

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Post',
            message: 'Are you sure you want to delete this post?',
            danger: true,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        });
        if (onDelete && confirmed) {
            onDelete(post.id);
        }
    };

    const handleSaveEdit = () => {
        if (onEdit && editContent.trim() !== '') {
            onEdit(post.id, editContent);
            setIsEditing(false);
        }
    };

    // Helper to sanitize name (Strict Version)
    const isSafeName = (name: string | null | undefined) => {
        if (!name) return false;
        if (name.length > 25) return false;
        // Allow letters, numbers, underscores, and spaces. Reject everything else.
        if (/[^a-zA-Z0-9_ ]/.test(name)) return false;
        return true;
    };

    const loadLikes = async () => {
        // Toggle visibility if already loaded, otherwise load
        if (showLikes && !loadingLikes) {
            setShowLikes(false);
            return;
        }

        setLoadingLikes(true);
        try {
            const { data: likesData, error } = await supabase
                .from('post_likes')
                .select('user_id')
                .eq('post_id', post.id);

            if (error) throw error;

            if (likesData && likesData.length > 0) {
                const userIds = likesData.map((like: { user_id: string }) => like.user_id);

                // Fetch profiles for users who liked
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds);

                // Map profiles by user ID
                const profileMap = new Map<string, Profile>();
                if (profilesData) {
                    profilesData.forEach((profile: Profile) => {
                        profileMap.set(profile.id, profile);
                    });
                }

                // Helper to get a safe display name
                const getSafeName = (profile: Profile | undefined) => {
                    if (!profile?.username) return 'ReLief Member';

                    if (isSafeName(profile.username)) {
                        return profile.username;
                    }

                    return 'ReLief Member';
                };

                // Format likes with proper names
                const formattedLikes = userIds.map((userId: string) => {
                    const profile = profileMap.get(userId);
                    return {
                        id: userId,
                        name: getSafeName(profile),
                        avatar: profile?.avatar_url || '👤'
                    };
                });

                setLikedByUsers(formattedLikes);
            } else {
                setLikedByUsers([]); // No likes
            }
        } catch (error) {
            console.error('Error loading likes:', error);
            setLikedByUsers([]);
        } finally {
            setLoadingLikes(false);
            setShowLikes(true); // Always show after attempting to load
        }
    };

    const loadComments = async () => {
        if (showComments && !loadingComments) {
            setShowComments(false);
            return;
        }

        setLoadingComments(true);
        try {
            // 1. Fetch comments
            const { data: commentsData, error } = await supabase
                .from('post_comments')
                .select('*')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true }); // Oldest first

            if (error) throw error;

            if (commentsData && commentsData.length > 0) {
                // 2. Fetch profiles for authors
                const userIds = [...new Set(commentsData.map(c => c.user_id))];
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds);

                const profileMap = new Map<string, Profile>();
                if (profilesData) {
                    profilesData.forEach((p: Profile) => profileMap.set(p.id, p));
                }

                // Helper to get a safe display name (Reuse strict logic)
                const getAuthorName = (uid: string) => {
                    const profile = profileMap.get(uid);
                    if (!profile?.username) return 'ReLief Member';
                    return isSafeName(profile.username) ? profile.username : 'ReLief Member';
                };

                const getAuthorAvatar = (uid: string) => {
                    const profile = profileMap.get(uid);
                    return profile?.avatar_url || '👤';
                };

                // 3. Map to Comment interface
                const formattedComments: Comment[] = commentsData.map(c => ({
                    id: c.id,
                    user_id: c.user_id,
                    author_name: getAuthorName(c.user_id),
                    avatar_url: getAuthorAvatar(c.user_id),
                    content: c.content,
                    created_at: new Date(c.created_at).toLocaleString()
                }));

                setComments(formattedComments);
            } else {
                setComments([]);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoadingComments(false);
            setShowComments(true);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId) return;

        setSubmittingComment(true);
        try {
            // Fetch current user details to populate denormalized fields
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', currentUserId)
                .maybeSingle();

            if (userError && userError.code !== 'PGRST116') {
                console.warn('Could not fetch user profile:', userError);
            }

            const authorName = userData?.username || currentUserName || 'ReLief Member';
            const authorAvatar = userData?.avatar_url || '👤';

            const { error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: post.id,
                    user_id: currentUserId,
                    content: newComment.trim(),
                    author_name: authorName, // Required by DB
                    avatar_url: authorAvatar  // Required by DB
                });

            if (error) throw error;

            // BACKGROUND TASK: Trigger Email Notification
            fetch('/api/interactions/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: post.id,
                    actorId: currentUserId,
                    actionType: 'comment'
                })
            }).catch(err => console.error("Failed to trigger comment email:", err));

            setNewComment('');

            // Reload comments to show the new one
            setShowComments(false); // Hack to force reload in next call
            await loadComments();

        } catch (error: any) {
            console.error('Error adding comment:', error?.message || JSON.stringify(error, null, 2));
            toast('Failed to add comment. Please try again.', 'error');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!currentUserId) return;
        const confirmed = await confirm({
            title: 'Delete Comment',
            message: 'Are you sure you want to delete this comment?',
            danger: true,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        });
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('post_comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', currentUserId);

            if (error) throw error;

            setComments(comments.filter(c => c.id !== commentId));
        } catch (error: any) {
            console.error('Error deleting comment:', error?.message || error);
            toast('Failed to delete comment. Please try again.', 'error');
        }
    };

    const handleSaveEditComment = async (commentId: number) => {
        if (!currentUserId || !editCommentContent.trim()) return;

        try {
            const { error } = await supabase
                .from('post_comments')
                .update({ content: editCommentContent.trim() })
                .eq('id', commentId)
                .eq('user_id', currentUserId);

            if (error) throw error;

            setComments(comments.map(c =>
                c.id === commentId ? { ...c, content: editCommentContent.trim() } : c
            ));
            setEditingCommentId(null);
            setEditCommentContent('');
        } catch (error: any) {
            console.error('Error updating comment:', error?.message || error);
            toast('Failed to update comment. Please try again.', 'error');
        }
    };


    const renderContentWithoutHashtags = (content: string) => {
        // Remove hashtags and any leading/trailing whitespace they might leave
        return content.replace(/#\w+/g, '').trim();
    };


    // Debug: Log what we're receiving
    console.log('PostCard received:', { author: post.author, avatar: post.avatar, user_id: post.user_id });

    return (
        <Card className={styles.postCard}>
            <div className={styles.postHeader}>
                <div className={styles.avatar}>
                    {post.avatar?.startsWith('http') ? (
                        <img src={post.avatar} alt={post.author} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        post.avatar || '👤'
                    )}
                </div>
                <div>
                    <h4 className={styles.author}>{post.author}</h4>
                    <span className={styles.timestamp}>{post.timestamp}</span>
                </div>
                {isAuthor && (
                    <div className={styles.menuActions}>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>✏️</Button>
                        <Button variant="ghost" size="sm" onClick={handleDelete} style={{ color: 'red' }}>🗑️</Button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className={styles.editForm}>
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className={styles.editTextarea}
                    />
                    <div className={styles.editActions}>
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                </div>
            ) : (
                <p className={styles.content}>
                    {renderContentWithoutHashtags(post.content)}
                </p>
            )}

            {post.image_url && (
                <div className={styles.postImage}>
                    <img src={post.image_url} alt="Post image" />
                </div>
            )}

            {post.hashtags && post.hashtags.length > 0 && (
                <div className={styles.hashtagList}>
                    {post.hashtags.map((tag, index) => (
                        <span
                            key={index}
                            className={styles.hashtagBadge}
                            onClick={() => onHashtagClick?.(tag)}
                            style={{ cursor: onHashtagClick ? 'pointer' : 'default' }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className={styles.postFooter}>
                <button
                    className={`${styles.actionBtn} ${post.liked_by_user ? styles.liked : ''}`}
                    onClick={handleLike}
                >
                    {post.liked_by_user ? '❤️' : '🤍'} {post.likes}
                </button>
                <button
                    className={styles.actionBtn}
                    onClick={loadComments}
                >
                    💬 {comments.length > 0 ? comments.length : post.comments}
                </button>
                {post.likes > 0 && (
                    <button
                        className={styles.actionBtn}
                        onClick={loadLikes}
                    >
                        👥 {showLikes ? 'Hide' : 'Who liked'}
                    </button>
                )}
            </div>

            {showComments && (
                <div className={styles.commentsSection}>
                    {loadingComments ? (
                        <p className={styles.loadingText}>Loading comments...</p>
                    ) : (
                        <>
                            <div className={styles.commentsList}>
                                {comments.length === 0 ? (
                                    <p className={styles.noComments}>No comments yet. Be the first!</p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className={styles.comment}>
                                            <div className={styles.commentAvatar}>
                                                {comment.avatar_url?.startsWith('http') ? (
                                                    <img
                                                        src={comment.avatar_url}
                                                        alt={comment.author_name}
                                                        style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    '👤'
                                                )}
                                            </div>
                                            <div className={styles.commentContent}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <span className={styles.commentAuthor}>{comment.author_name}</span>
                                                    {currentUserId === comment.user_id && (
                                                        <div className={styles.menuActions}>
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                setEditingCommentId(comment.id);
                                                                setEditCommentContent(comment.content);
                                                            }}>✏️</Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment.id)} style={{ color: 'red' }}>🗑️</Button>
                                                        </div>
                                                    )}
                                                </div>
                                                {editingCommentId === comment.id ? (
                                                    <div className={styles.editForm}>
                                                        <textarea
                                                            value={editCommentContent}
                                                            onChange={(e) => setEditCommentContent(e.target.value)}
                                                            className={styles.editTextarea}
                                                            style={{ minHeight: '60px' }}
                                                        />
                                                        <div className={styles.editActions}>
                                                            <Button size="sm" onClick={() => handleSaveEditComment(comment.id)}>Save</Button>
                                                            <Button size="sm" variant="outline" onClick={() => {
                                                                setEditingCommentId(null);
                                                                setEditCommentContent('');
                                                            }}>Cancel</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className={styles.commentText}>{comment.content}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {currentUserId && (
                                <form onSubmit={handleAddComment} className={styles.commentForm}>
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className={styles.commentInput}
                                        disabled={submittingComment}
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={submittingComment || !newComment.trim()}
                                    >
                                        {submittingComment ? 'Posting...' : 'Post'}
                                    </Button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            )}

            {showLikes && (
                <div className={styles.likesSection}>
                    <h4>Liked by:</h4>
                    {loadingLikes ? (
                        <p>Loading...</p>
                    ) : (
                        <div className={styles.likesList}>
                            {likedByUsers.map((user) => (
                                <div key={user.id} className={styles.likeUser}>
                                    <span className={styles.likeAvatar}>
                                        {user.avatar?.startsWith('http') ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            user.avatar || '👤'
                                        )}
                                    </span>
                                    <span className={styles.likeName}>{user.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
