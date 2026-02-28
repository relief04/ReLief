"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { isAdminEmail } from '@/lib/admin';
import styles from './page.module.css';
import { useToast } from '@/context/ToastContext';

interface Stats { users: number; posts: number; groups: number; badges: number; }
interface RecentPost { id: number; author_name: string; content: string; created_at: string; user_id: string; }
interface RecentUser { id: string; username: string; email: string; created_at: string; balance: number; }

export default function AdminPage() {
    const { toast, confirm } = useToast();
    const { user, isLoaded } = useUser();
    const [stats, setStats] = useState<Stats | null>(null);
    const [posts, setPosts] = useState<RecentPost[]>([]);
    const [users, setUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

    const showStatus = (text: string, ok: boolean) => {
        toast(text, ok ? 'success' : 'error');
    };

    const email = user?.emailAddresses?.[0]?.emailAddress;
    const isAdmin = isAdminEmail(email);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
            const data = await res.json();
            setStats(data.stats);
            setPosts(data.recentPosts);
            setUsers(data.recentUsers);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isLoaded && isAdmin) fetchData();
        else if (isLoaded) setLoading(false);
    }, [isLoaded, isAdmin, fetchData]);

    // ── UPDATE post ──────────────────────────────────────────────
    const handleUpdate = async (id: number) => {
        const res = await fetch(`/api/admin/posts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent }),
        });
        if (res.ok) {
            showStatus('Post updated successfully.', true);
        } else {
            const err = await res.json().catch(() => ({}));
            showStatus(`Failed to update: ${err.error || res.status}`, false);
        }
        setEditingPostId(null);
        fetchData();
    };

    // ── DELETE post ──────────────────────────────────────────────
    const handleDeletePost = async (id: number) => {
        const confirmed = await confirm({
            title: 'Delete Post',
            message: 'Are you sure you want to delete this post? This cannot be undone.',
            confirmLabel: 'Delete',
            danger: true
        });
        if (!confirmed) return;

        const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showStatus('Post deleted successfully.', true);
        } else {
            const err = await res.json().catch(() => ({}));
            showStatus(`Failed to delete post: ${err.error || res.status}`, false);
        }
        fetchData();
    };

    const handleDeleteUser = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete User Profile',
            message: 'Are you sure you want to delete this user profile? This cannot be undone.',
            confirmLabel: 'Delete',
            danger: true
        });
        if (!confirmed) return;

        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showStatus('User profile deleted successfully.', true);
        } else {
            const err = await res.json().catch(() => ({}));
            showStatus(`Failed to delete user: ${err.error || res.status}`, false);
        }
        fetchData();
    };

    if (!isLoaded || (isAdmin && loading)) {
        return (
            <div className={styles.adminContainer}>
                <div className={styles.loading}><span>⚙️</span><span>Loading Admin Dashboard…</span></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className={styles.adminContainer}>
                <div className={styles.denied}>
                    <div className={styles.deniedIcon}>🚫</div>
                    <h1 className={styles.deniedTitle}>Access Denied</h1>
                    <p className={styles.deniedSub}>You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    const statCards = [
        { icon: '👥', label: 'Total Users', value: stats?.users ?? 0 },
        { icon: '📝', label: 'Total Posts', value: stats?.posts ?? 0 },
        { icon: '🤝', label: 'Total Groups', value: stats?.groups ?? 0 },
        { icon: '🏅', label: 'Badges Awarded', value: stats?.badges ?? 0 },
    ];

    return (
        <div className={styles.adminContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerIcon}>⚙️</div>
                <div>
                    <h1 className={styles.headerTitle}>Admin Dashboard</h1>
                    <p className={styles.headerSub}>Signed in as {email}</p>
                </div>
                <button className={styles.refreshBtn} onClick={fetchData}>↻ Refresh</button>
            </div>

            {/* Status banner */}
            {statusMsg && (
                <div style={{
                    padding: '0.75rem 1.25rem',
                    marginBottom: '1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: statusMsg.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${statusMsg.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    color: statusMsg.ok ? 'var(--color-primary)' : 'var(--color-danger)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                }}>
                    {statusMsg.ok ? '✓ ' : '✕ '}{statusMsg.text}
                </div>
            )}

            {/* Stats */}
            <div className={styles.statsGrid}>
                {statCards.map(card => (
                    <div key={card.label} className={styles.statCard}>
                        <div className={styles.statIcon}>{card.icon}</div>
                        <div className={styles.statValue}>{card.value.toLocaleString()}</div>
                        <div className={styles.statLabel}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Tables */}
            <div className={styles.tablesGrid}>
                {/* Posts */}
                <div className={styles.tableCard}>
                    <h2 className={styles.tableTitle}>📝 Recent Posts</h2>
                    <div className={styles.tableScroll}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Author</th>
                                    <th>Content</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map(post => (
                                    <tr key={post.id}>
                                        <td title={post.author_name}>{post.author_name || 'Unknown'}</td>
                                        <td>
                                            {editingPostId === post.id ? (
                                                <input
                                                    className={styles.inlineInput}
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                />
                                            ) : (
                                                <span title={post.content}>{post.content?.slice(0, 50) ?? '—'}</span>
                                            )}
                                        </td>
                                        <td>{new Date(post.created_at).toLocaleDateString()}</td>
                                        <td>
                                            {editingPostId === post.id ? (
                                                <span className={styles.actionGroup}>
                                                    <button className={styles.saveBtn} onClick={() => handleUpdate(post.id)}>Save</button>
                                                    <button className={styles.cancelBtn} onClick={() => setEditingPostId(null)}>✕</button>
                                                </span>
                                            ) : (
                                                <span className={styles.actionGroup}>
                                                    <button className={styles.editBtn} onClick={() => { setEditingPostId(post.id); setEditContent(post.content); }}>✏️</button>
                                                    <button className={styles.deleteBtn} onClick={() => handleDeletePost(post.id)}>🗑️</button>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {posts.length === 0 && (
                                    <tr><td colSpan={4} className={styles.empty}>No posts yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Users */}
                <div className={styles.tableCard}>
                    <h2 className={styles.tableTitle}>👥 Recent Users</h2>
                    <div className={styles.tableScroll}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Karma</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td title={u.username}>{u.username || 'N/A'}</td>
                                        <td title={u.email}>{u.email || '—'}</td>
                                        <td>{u.balance ?? 0} KP</td>
                                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDeleteUser(u.id)}
                                                title="Delete user profile"
                                            >🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan={5} className={styles.empty}>No users yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
