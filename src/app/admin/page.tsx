"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { isAdminEmail } from '@/lib/admin';
import styles from './page.module.css';
import { useToast } from '@/context/ToastContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats { users: number; posts: number; groups: number; badges: number; }
interface RecentPost { id: number; author_name: string; content: string; created_at: string; user_id: string; }
interface Group { id: number; name: string; description: string; created_at: string; }
interface RecentUser { id: string; username: string; email: string; created_at: string; balance: number; is_banned?: boolean; }
interface ChartData { date: string, users: number }

export default function AdminPage() {
    const { toast, confirm } = useToast();
    const { user, isLoaded } = useUser();

    // Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content'>('overview');

    // Data States
    const [stats, setStats] = useState<Stats | null>(null);
    const [posts, setPosts] = useState<RecentPost[]>([]);
    const [users, setUsers] = useState<RecentUser[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    // Editing States
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    const [editingKarmaId, setEditingKarmaId] = useState<string | null>(null);
    const [karmaDelta, setKarmaDelta] = useState<number>(0);

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
            setGroups(data.groups ?? []);
            setChartData(data.chartData ?? []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isLoaded && isAdmin) fetchData();
        else if (isLoaded) setLoading(false);
    }, [isLoaded, isAdmin, fetchData]);

    // ── Content Management ──────────────────────────────────────────────
    const handleUpdatePost = async (id: number) => {
        const res = await fetch(`/api/admin/posts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent }),
        });
        if (res.ok) showStatus('Post updated successfully.', true);
        else showStatus(`Failed to update`, false);
        setEditingPostId(null);
        fetchData();
    };

    const handleDeletePost = async (id: number) => {
        const confirmed = await confirm({ title: 'Delete Post', message: 'Delete this post forever?', confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
        if (res.ok) showStatus('Post deleted successfully.', true);
        else showStatus(`Failed to delete`, false);
        fetchData();
    };

    // ── User Management ──────────────────────────────────────────────
    const handleSetupKarmaSubmit = async (id: string) => {
        if (!karmaDelta || karmaDelta === 0) {
            setEditingKarmaId(null);
            return;
        }

        const res = await fetch(`/api/admin/users/${id}/karma`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ karmaDelta }),
        });
        if (res.ok) showStatus(`Karma modified successfully.`, true);
        else showStatus(`Failed to update karma`, false);

        setEditingKarmaId(null);
        setKarmaDelta(0);
        fetchData();
    }

    const handleSuspendUser = async (id: string, currentlyBanned: boolean) => {
        const newStatus = !currentlyBanned;
        const confirmed = await confirm({
            title: newStatus ? 'Suspend User' : 'Unsuspend User',
            message: `Are you sure you want to ${newStatus ? 'suspend' : 'reinstate'} this user?`,
            confirmLabel: 'Confirm',
            danger: newStatus
        });
        if (!confirmed) return;

        const res = await fetch(`/api/admin/users/${id}/suspend`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBanned: newStatus }),
        });
        if (res.ok) showStatus(`User ${newStatus ? 'suspended' : 'unsuspended'} successfully.`, true);
        else showStatus(`Failed to change suspension state`, false);
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
            <div className={styles.header}>
                <div className={styles.headerIcon}>⚙️</div>
                <div>
                    <h1 className={styles.headerTitle}>Admin Command Center</h1>
                    <p className={styles.headerSub}>Signed in as {email}</p>
                </div>
                <button className={styles.refreshBtn} onClick={fetchData}>↻ Refresh Data</button>
            </div>

            {/* Application Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('users')}>Users Management</button>
                <button className={`${styles.tabBtn} ${activeTab === 'content' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('content')}>Content Moderation</button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <>
                    <div className={styles.statsGrid}>
                        {statCards.map(card => (
                            <div key={card.label} className={styles.statCard}>
                                <div className={styles.statIcon}>{card.icon}</div>
                                <div className={styles.statValue}>{card.value.toLocaleString()}</div>
                                <div className={styles.statLabel}>{card.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.chartContainer}>
                        <h2 className={styles.tableTitle}>📈 Platform Growth (Last 30 Days)</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--color-text-300)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(tick) => {
                                    const d = new Date(tick);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }} />
                                <YAxis stroke="var(--color-text-300)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-card-background)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--color-primary)' }}
                                />
                                <Line type="monotone" dataKey="users" stroke="var(--color-primary)" strokeWidth={3} dot={{ fill: 'var(--color-primary)', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            {/* TAB: USERS */}
            {activeTab === 'users' && (
                <div className={styles.tableCard}>
                    <h2 className={styles.tableTitle}>👥 Users Ecosystem</h2>
                    <div className={styles.tableScroll}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Karma Balance</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td title={u.username}>{u.username || 'N/A'}</td>
                                        <td title={u.email}>{u.email || '—'}</td>
                                        <td>
                                            {editingKarmaId === u.id ? (
                                                <div className={styles.inputKarmaLabel}>
                                                    <input
                                                        type="number"
                                                        className={styles.karmaInput}
                                                        value={karmaDelta}
                                                        onChange={(e) => setKarmaDelta(Number(e.target.value))}
                                                        placeholder="+/- 0"
                                                    /> KP
                                                </div>
                                            ) : (
                                                <span>{u.balance ?? 0} KP</span>
                                            )}
                                        </td>
                                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td>{u.is_banned ? '🚫 Suspended' : '✅ Active'}</td>
                                        <td>
                                            {editingKarmaId === u.id ? (
                                                <span className={styles.actionGroup}>
                                                    <button className={styles.saveBtn} onClick={() => handleSetupKarmaSubmit(u.id)}>Save</button>
                                                    <button className={styles.cancelBtn} onClick={() => setEditingKarmaId(null)}>✕</button>
                                                </span>
                                            ) : (
                                                <span className={styles.actionGroup}>
                                                    <button className={styles.editBtn} onClick={() => { setEditingKarmaId(u.id); setKarmaDelta(0); }} title="Modify Karma">✨ Karma</button>
                                                    <button
                                                        className={`${styles.editBtn} ${u.is_banned ? styles.unbanBtn : styles.suspendBtn}`}
                                                        onClick={() => handleSuspendUser(u.id, !!u.is_banned)}
                                                        title="Toggle Suspension"
                                                    >{u.is_banned ? 'Unban' : 'Suspend'}</button>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan={6} className={styles.empty}>No users yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: CONTENT */}
            {activeTab === 'content' && (
                <div className={styles.tablesGrid}>
                    {/* Posts */}
                    <div className={styles.tableCard}>
                        <h2 className={styles.tableTitle}>📝 Posts Moderation</h2>
                        <div className={styles.tableScroll}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Author</th>
                                        <th>Content</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map(post => (
                                        <tr key={post.id}>
                                            <td title={post.author_name}>{post.author_name || 'Unknown'}</td>
                                            <td>
                                                {editingPostId === post.id ? (
                                                    <input className={styles.inlineInput} value={editContent} onChange={e => setEditContent(e.target.value)} />
                                                ) : (
                                                    <span title={post.content}>{post.content?.slice(0, 50) ?? '—'}</span>
                                                )}
                                            </td>
                                            <td>
                                                {editingPostId === post.id ? (
                                                    <span className={styles.actionGroup}>
                                                        <button className={styles.saveBtn} onClick={() => handleUpdatePost(post.id)}>Save</button>
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
                                        <tr><td colSpan={3} className={styles.empty}>No posts yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Groups */}
                    <div className={styles.tableCard}>
                        <h2 className={styles.tableTitle}>🤝 Groups Ecosystem</h2>
                        <div className={styles.tableScroll}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map(g => (
                                        <tr key={g.id}>
                                            <td title={g.name}><b>{g.name}</b></td>
                                            <td title={g.description}>{g.description?.slice(0, 80) ?? '—'}</td>
                                        </tr>
                                    ))}
                                    {groups.length === 0 && (
                                        <tr><td colSpan={2} className={styles.empty}>No groups yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
