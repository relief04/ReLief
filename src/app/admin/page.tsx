"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { isAdminEmail } from '@/lib/admin';
import styles from './page.module.css';
import { formatDate } from '@/lib/dateUtils';
import { useToast } from '@/context/ToastContext';
import { useRefresh } from '@/context/RefreshContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats { users: number; posts: number; groups: number; badges: number; events: number; stories: number; }
interface RecentPost { id: number; author_name: string; content: string; created_at: string; user_id: string; }
interface Group { id: number; name: string; description: string; created_at: string; }
interface RecentUser { id: string; username: string; email: string; created_at: string; balance: number; is_banned?: boolean; is_admin?: boolean; }
interface ChartData { date: string, users: number }
interface AdminEvent { id: number; title: string; description: string; event_type: string; created_by: string; event_date: string; }
interface AdminStory { id: number; title: string; story: string; achievement_type: string; author_name: string; likes: number; }

export default function AdminPage() {
    const { toast, confirm } = useToast();
    const { triggerRefresh } = useRefresh();
    const { user, isLoaded } = useUser();

    // Tab State
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content'>('overview');
    const [activeContentTab, setActiveContentTab] = useState<'posts' | 'stories' | 'events' | 'groups'>('posts');

    // Data States
    const [stats, setStats] = useState<Stats | null>(null);
    const [posts, setPosts] = useState<RecentPost[]>([]);
    const [users, setUsers] = useState<RecentUser[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [stories, setStories] = useState<AdminStory[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupDesc, setEditGroupDesc] = useState('');

    const [editingImpactId, setEditingImpactId] = useState<string | null>(null);
    const [newImpactBalance, setNewImpactBalance] = useState<number | null>(null);

    const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [activeProfileTab, setActiveProfileTab] = useState<'posts' | 'badges' | 'points' | 'stories' | 'events' | 'groups'>('posts');

    const [editingProfileStoryId, setEditingProfileStoryId] = useState<string | null>(null);
    const [editProfileStoryTitle, setEditProfileStoryTitle] = useState('');
    const [editProfileStoryType, setEditProfileStoryType] = useState('');

    const [editingProfileEventId, setEditingProfileEventId] = useState<string | null>(null);
    const [editProfileEventStatus, setEditProfileEventStatus] = useState('');

    const [editingProfileGroupUserId, setEditingProfileGroupUserId] = useState<string | null>(null);
    const [editingProfileGroupId, setEditingProfileGroupId] = useState<string | null>(null);
    const [editProfileGroupRole, setEditProfileGroupRole] = useState('');
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
            setEvents(data.events ?? []);
            setStories(data.stories ?? []);
            setChartData(data.chartData ?? []);
        } else {
            const errBody = await res.json().catch(() => ({}));
            showStatus(errBody.error || 'Failed to fetch dashboard data. Did you run the SQL migration?', false);
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
        else showStatus(`Failed to delete post`, false);
        fetchData();
    };

    const handleDeleteEvent = async (id: number) => {
        const confirmed = await confirm({ title: 'Delete Event', message: 'Delete this event forever?', confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
        if (res.ok) showStatus('Event deleted successfully.', true);
        else showStatus(`Failed to delete event`, false);
        fetchData();
    };

    const handleDeleteStory = async (id: number) => {
        const confirmed = await confirm({ title: 'Delete Story', message: 'Delete this story forever?', confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        const res = await fetch(`/api/admin/stories/${id}`, { method: 'DELETE' });
        if (res.ok) showStatus('Story deleted successfully.', true);
        else showStatus(`Failed to delete story`, false);
        fetchData();
    };

    const handleUpdateGroup = async (id: number) => {
        const res = await fetch(`/api/admin/groups/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editGroupName, description: editGroupDesc }),
        });
        if (res.ok) showStatus('Group updated successfully.', true);
        else showStatus(`Failed to update group`, false);
        setEditingGroupId(null);
        fetchData();
    };

    const handleDeleteGroup = async (id: number) => {
        const confirmed = await confirm({ title: 'Delete Group', message: 'Delete this group forever?', confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
        if (res.ok) showStatus('Group deleted successfully.', true);
        else showStatus(`Failed to delete group`, false);
        fetchData();
    };

    // ── User Management ──────────────────────────────────────────────
    const fetchUserProfileData = async (userId: string) => {
        setIsProfileLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/profile`);
            const data = await res.json();
            if (data.success) {
                setSelectedUserProfile(data.user_data);
                setNewImpactBalance(data.user_data.profile?.balance || 0);
            } else {
                showStatus(`Failed to load profile: ${data.error}`, false);
                if (!selectedUserProfile) setIsProfileModalOpen(false);
            }
        } catch (e) {
            showStatus('An error occurred.', false);
        }
        setIsProfileLoading(false);
    };

    const handleViewProfile = async (id: string) => {
        setIsProfileModalOpen(true);
        setSelectedUserProfile(null);
        setNewImpactBalance(null);
        await fetchUserProfileData(id);
    };

    const handleUpdateProfileStory = async (storyId: string) => {
        const res = await fetch(`/api/admin/stories/${storyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editProfileStoryTitle, achievement_type: editProfileStoryType }),
        });
        if (res.ok) {
            showStatus('Story updated successfully.', true);
            setEditingProfileStoryId(null);
            if (selectedUserProfile?.profile?.id) await fetchUserProfileData(selectedUserProfile.profile.id);
        } else showStatus('Failed to update story.', false);
    };

    const handleDeleteProfileStory = async (storyId: string) => {
        const confirmed = await confirm({ title: 'Delete Story', message: 'Delete this success story?', confirmLabel: 'Delete', danger: true });
        if (!confirmed) return;
        const res = await fetch(`/api/admin/stories/${storyId}`, { method: 'DELETE' });
        if (res.ok) {
            showStatus('Story deleted.', true);
            if (selectedUserProfile?.profile?.id) await fetchUserProfileData(selectedUserProfile.profile.id);
        } else showStatus('Failed to delete story.', false);
    };

    const handleUpdateProfileEvent = async (rsvpId: string) => {
        const res = await fetch(`/api/admin/events/rsvp/${rsvpId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: editProfileEventStatus }),
        });
        if (res.ok) {
            showStatus('RSVP updated successfully.', true);
            setEditingProfileEventId(null);
            if (selectedUserProfile?.profile?.id) await fetchUserProfileData(selectedUserProfile.profile.id);
        } else showStatus('Failed to update RSVP.', false);
    };

    const handleDeleteProfileEvent = async (rsvpId: string) => {
        const confirmed = await confirm({ title: 'Remove RSVP', message: 'Remove user from this event?', confirmLabel: 'Remove', danger: true });
        if (!confirmed) return;
        const res = await fetch(`/api/admin/events/rsvp/${rsvpId}`, { method: 'DELETE' });
        if (res.ok) {
            showStatus('RSVP removed.', true);
            if (selectedUserProfile?.profile?.id) await fetchUserProfileData(selectedUserProfile.profile.id);
        } else showStatus('Failed to remove RSVP.', false);
    };

    const handleUpdateProfileGroup = async (userId: string, groupId: string) => {
        const res = await fetch(`/api/admin/groups/members`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, group_id: groupId, role: editProfileGroupRole }),
        });
        if (res.ok) {
            showStatus('Group role updated successfully.', true);
            setEditingProfileGroupId(null);
            setEditingProfileGroupUserId(null);
            if (selectedUserProfile?.profile?.id) await fetchUserProfileData(selectedUserProfile.profile.id);
        } else showStatus('Failed to update group role.', false);
    };

    const handleDeleteProfileGroup = async (userId: string, groupId: string) => {
        const confirmed = await confirm({ title: 'Remove from Group', message: 'Remove user from this group?', confirmLabel: 'Remove', danger: true });
        if (!confirmed) return;
        const res = await fetch(`/api/admin/groups/members`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, group_id: groupId }),
        });
        if (res.ok) {
            showStatus('Removed from group.', true);
            if (selectedUserProfile?.profile?.id) await fetchUserProfileData(selectedUserProfile.profile.id);
        } else showStatus('Failed to remove from group.', false);
    };

    const handleSetupImpactSubmit = async (id: string) => {
        if (newImpactBalance === null || newImpactBalance < 0 || newImpactBalance === selectedUserProfile.profile.balance) {
            setEditingImpactId(null);
            return;
        }

        const res = await fetch(`/api/admin/users/${id}/impact`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newBalance: newImpactBalance }),
        });
        if (res.ok) {
            showStatus(`Impact modified successfully.`, true);
            triggerRefresh('admin');
            if (isProfileModalOpen) {
                // Refresh modal data seamlessly
                const profileRes = await fetch(`/api/admin/users/${id}/profile`);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setSelectedUserProfile(data.user_data);
                    setNewImpactBalance(data.user_data.profile?.balance || 0);
                }
            }
        } else {
            showStatus(`Failed to update impact`, false);
        }

        setEditingImpactId(null);
        fetchData();
    }

    const handleSuspendUser = async (id: string, currentlyBanned: boolean) => {
        const newStatus = !currentlyBanned;
        const confirmed = await confirm({
            title: newStatus ? 'Ban User' : 'Unban User',
            message: `Are you sure you want to ${newStatus ? 'ban' : 'unban'} this user?`,
            confirmLabel: 'Confirm',
            danger: newStatus
        });
        if (!confirmed) return;

        const res = await fetch(`/api/admin/users/${id}/suspend`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBanned: newStatus }),
        });
        if (res.ok) {
            showStatus(`User ${newStatus ? 'banned' : 'unbanned'} successfully.`, true);
            triggerRefresh('admin');
            fetchData();
        } else {
            const data = await res.json().catch(() => ({}));
            showStatus(`Failed: ${data.error || 'Server error'}`, false);
        }
    };

    const handleToggleAdmin = async (id: string, currentlyAdmin: boolean) => {
        const newAdminStatus = !currentlyAdmin;
        const confirmed = await confirm({
            title: newAdminStatus ? 'Promote to Admin' : 'Revoke Admin',
            message: `Are you sure you want to ${newAdminStatus ? 'make this user an admin' : 'remove admin rights from this user'}?`,
            confirmLabel: 'Confirm',
            danger: !newAdminStatus
        });
        if (!confirmed) return;

        const res = await fetch(`/api/admin/users/${id}/role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAdmin: newAdminStatus }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            showStatus(data.message || `User Admin status updated successfully.`, true);
            triggerRefresh('admin');
            fetchData();
        } else {
            showStatus(`Failed: ${data.error || 'Server error'}`, false);
        }
    };

    const handleResetUser = async (id: string) => {
        const confirmed = await confirm({
            title: 'Reset User Data',
            message: 'Are you sure you want to reset this user? Their account will remain open, but all stats, impact, and activities will be wiped completely.',
            confirmLabel: 'Reset Data',
            danger: true
        });
        if (!confirmed) return;

        const res = await fetch(`/api/admin/users/${id}/reset`, { method: 'POST' });
        if (res.ok) {
            showStatus('User data successfully reset to 0.', true);
            triggerRefresh('admin');
            fetchData();
        } else {
            const data = await res.json().catch(() => ({}));
            showStatus(`Failed to reset: ${data.error || 'Server error'}`, false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete User',
            message: 'Are you sure you want to permanently delete this user? All their data will be removed forever.',
            confirmLabel: 'Delete Permanently',
            danger: true
        });
        if (!confirmed) return;

        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showStatus('User successfully deleted.', true);
            triggerRefresh('admin');
        }
        else showStatus(`Failed to delete user`, false);
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
        { icon: '🏅', label: 'Badges', value: stats?.badges ?? 0 },
        { icon: '🗓️', label: 'Events', value: stats?.events ?? 0 },
        { icon: '🌟', label: 'Stories', value: stats?.stories ?? 0 },
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
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--color-text-300)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(tick) => {
                                    const d = new Date(tick);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }} />
                                <YAxis stroke="var(--color-text-300)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--glass-bg)',
                                        backdropFilter: 'blur(8px)',
                                        borderColor: 'var(--glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--color-text)'
                                    }}
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
                                    <th>Joined</th>
                                    <th>Status</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td title={u.username}>{u.username || 'N/A'}</td>
                                        <td title={u.email}>{u.email || '—'}</td>
                                        <td>{formatDate(u.created_at)}</td>
                                        <td>{u.is_banned ? '🚫 Banned' : '✅ Active'}</td>
                                        <td>{u.is_admin ? '👑 Admin' : '👤 User'}</td>
                                        <td className={styles.actionsCell}>
                                            <span className={styles.actionGroup}>
                                                <button className={styles.editBtn} onClick={() => handleViewProfile(u.id)} title="View User Profile">👤 Profile</button>
                                                <button
                                                    className={`${styles.editBtn} ${u.is_admin ? styles.demoteBtn : styles.promoteBtn}`}
                                                    onClick={() => handleToggleAdmin(u.id, !!u.is_admin)}
                                                    title="Toggle Admin Role"
                                                >{u.is_admin ? 'Demote' : 'Promote'}</button>
                                                <button
                                                    className={`${styles.editBtn} ${u.is_banned ? styles.unbanBtn : styles.suspendBtn}`}
                                                    onClick={() => handleSuspendUser(u.id, !!u.is_banned)}
                                                    title="Toggle Banning"
                                                >{u.is_banned ? 'Unban' : 'Ban'}</button>
                                                <button
                                                    className={styles.resetBtn}
                                                    onClick={() => handleResetUser(u.id)}
                                                    title="Reset User Data"
                                                >🔄 Reset</button>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    title="Delete User Permanently"
                                                >🗑️ Delete</button>
                                            </span>
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
            )}

            {/* TAB: CONTENT */}
            {activeTab === 'content' && (
                <div className={styles.contentSection}>
                    <div className={styles.subNav}>
                        <button
                            className={`${styles.subTabBtn} ${activeContentTab === 'posts' ? styles.activeSubTab : ''}`}
                            onClick={() => setActiveContentTab('posts')}
                        >
                            📝 Posts
                        </button>
                        <button
                            className={`${styles.subTabBtn} ${activeContentTab === 'stories' ? styles.activeSubTab : ''}`}
                            onClick={() => setActiveContentTab('stories')}
                        >
                            🌟 Success Stories
                        </button>
                        <button
                            className={`${styles.subTabBtn} ${activeContentTab === 'events' ? styles.activeSubTab : ''}`}
                            onClick={() => setActiveContentTab('events')}
                        >
                            🗓️ Events
                        </button>
                        <button
                            className={`${styles.subTabBtn} ${activeContentTab === 'groups' ? styles.activeSubTab : ''}`}
                            onClick={() => setActiveContentTab('groups')}
                        >
                            🤝 Groups
                        </button>
                    </div>

                    <div className={styles.subContentArea}>
                        {/* Posts */}
                        {activeContentTab === 'posts' && (
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
                        )}

                        {/* Stories */}
                        {activeContentTab === 'stories' && (
                            <div className={styles.tableCard}>
                                <h2 className={styles.tableTitle}>🌟 Success Stories Moderation</h2>
                                <div className={styles.tableScroll}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Author</th>
                                                <th>Title</th>
                                                <th>Likes</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stories.map(story => (
                                                <tr key={story.id}>
                                                    <td title={story.author_name}>{story.author_name || 'Unknown'}</td>
                                                    <td title={story.story}><b>{story.title}</b></td>
                                                    <td>{story.likes}</td>
                                                    <td>
                                                        <button className={styles.deleteBtn} onClick={() => handleDeleteStory(story.id)}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {stories.length === 0 && (
                                                <tr><td colSpan={4} className={styles.empty}>No stories yet</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Events */}
                        {activeContentTab === 'events' && (
                            <div className={styles.tableCard}>
                                <h2 className={styles.tableTitle}>🗓️ Events Moderation</h2>
                                <div className={styles.tableScroll}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Event Title</th>
                                                <th>Type</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {events.map(event => (
                                                <tr key={event.id}>
                                                    <td>{formatDate(event.event_date)}</td>
                                                    <td title={event.description}><b>{event.title}</b></td>
                                                    <td>{event.event_type}</td>
                                                    <td>
                                                        <button className={styles.deleteBtn} onClick={() => handleDeleteEvent(event.id)}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {events.length === 0 && (
                                                <tr><td colSpan={4} className={styles.empty}>No events yet</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Groups */}
                        {activeContentTab === 'groups' && (
                            <div className={styles.tableCard}>
                                <h2 className={styles.tableTitle}>🤝 Groups Ecosystem</h2>
                                <div className={styles.tableScroll}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groups.map(g => (
                                                <tr key={g.id}>
                                                    <td title={g.name}>
                                                        {editingGroupId === g.id ? (
                                                            <input className={styles.inlineInput} style={{ width: '100px' }} value={editGroupName} onChange={e => setEditGroupName(e.target.value)} />
                                                        ) : (
                                                            <b>{g.name}</b>
                                                        )}
                                                    </td>
                                                    <td title={g.description}>
                                                        {editingGroupId === g.id ? (
                                                            <input className={styles.inlineInput} value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} />
                                                        ) : (
                                                            g.description?.slice(0, 80) ?? '—'
                                                        )}
                                                    </td>
                                                    <td>
                                                        {editingGroupId === g.id ? (
                                                            <span className={styles.actionGroup}>
                                                                <button className={styles.saveBtn} onClick={() => handleUpdateGroup(g.id)}>Save</button>
                                                                <button className={styles.cancelBtn} onClick={() => setEditingGroupId(null)}>✕</button>
                                                            </span>
                                                        ) : (
                                                            <span className={styles.actionGroup}>
                                                                <button className={styles.editBtn} onClick={() => { setEditingGroupId(g.id); setEditGroupName(g.name); setEditGroupDesc(g.description || ''); }}>✏️</button>
                                                                <button className={styles.deleteBtn} onClick={() => handleDeleteGroup(g.id)}>🗑️</button>
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {groups.length === 0 && (
                                                <tr><td colSpan={3} className={styles.empty}>No groups yet</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className={styles.profileModalOverlay} onClick={() => setIsProfileModalOpen(false)}>
                    <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.profileModalHeader}>
                            <h2 className={styles.profileModalTitle}>User Profile Details</h2>
                            <button className={styles.closeModalBtn} onClick={() => setIsProfileModalOpen(false)}>✕</button>
                        </div>
                        {isProfileLoading ? (
                            <div className={styles.loadingModal}>
                                <span>⌛ Fetching Data...</span>
                            </div>
                        ) : selectedUserProfile ? (
                            <div className={styles.profileModalBody}>
                                <div className={styles.profileHero}>
                                    <div className={styles.profileHeroStat}>
                                        <span className={styles.profileHeroStatLabel}>Username</span>
                                        <span className={styles.profileHeroStatValue}>{selectedUserProfile.profile.username || '—'}</span>
                                    </div>
                                    <div className={styles.profileHeroStat}>
                                        <span className={styles.profileHeroStatLabel}>Balance</span>
                                        <span className={styles.profileHeroStatValue}>{selectedUserProfile.profile.balance} IP</span>
                                    </div>
                                    <div className={styles.profileHeroStat}>
                                        <span className={styles.profileHeroStatLabel}>Carbon Savings</span>
                                        <span className={styles.profileHeroStatValue}>{Number(selectedUserProfile.profile.carbon_savings || 0).toFixed(2)} KG</span>
                                    </div>
                                    <div className={styles.profileHeroStat}>
                                        <span className={styles.profileHeroStatLabel}>Streak</span>
                                        <span className={styles.profileHeroStatValue}>{selectedUserProfile.profile.streak || 0} 🔥</span>
                                    </div>
                                </div>

                                <div className={styles.profileSection}>
                                    <h3 className={styles.profileSectionTitle}>✨ Modify Impact points</h3>
                                    <div className={styles.impactEditSection} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Current</span>
                                            <span style={{ fontWeight: 'bold' }}>{selectedUserProfile.profile.balance} IP</span>
                                        </div>
                                        <div style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>➔</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                className={styles.impactInput}
                                                value={newImpactBalance !== null ? newImpactBalance : ''}
                                                onChange={(e) => setNewImpactBalance(Number(e.target.value))}
                                                placeholder="New Balance"
                                                style={{ width: '120px', fontSize: '1.1rem', padding: '0.5rem', textAlign: 'center' }}
                                            />
                                        </div>
                                        <button
                                            className={styles.saveBtn}
                                            onClick={() => handleSetupImpactSubmit(selectedUserProfile.profile.id)}
                                            style={{ padding: '0.5rem 1rem', marginLeft: 'auto' }}
                                            disabled={newImpactBalance === null || newImpactBalance < 0 || newImpactBalance === selectedUserProfile.profile.balance}
                                        >Update</button>
                                    </div>
                                </div>

                                <div className={styles.contentSection} style={{ marginTop: '1rem' }}>
                                    <div className={styles.subNav} style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                        <button
                                            className={`${styles.subTabBtn} ${activeProfileTab === 'posts' ? styles.activeSubTab : ''}`}
                                            onClick={() => setActiveProfileTab('posts')}
                                        >
                                            📝 Posts
                                        </button>
                                        <button
                                            className={`${styles.subTabBtn} ${activeProfileTab === 'badges' ? styles.activeSubTab : ''}`}
                                            onClick={() => setActiveProfileTab('badges')}
                                        >
                                            🏅 Badges
                                        </button>
                                        <button
                                            className={`${styles.subTabBtn} ${activeProfileTab === 'points' ? styles.activeSubTab : ''}`}
                                            onClick={() => setActiveProfileTab('points')}
                                        >
                                            💰 Points
                                        </button>
                                        <button
                                            className={`${styles.subTabBtn} ${activeProfileTab === 'stories' ? styles.activeSubTab : ''}`}
                                            onClick={() => setActiveProfileTab('stories')}
                                        >
                                            🌟 Stories
                                        </button>
                                        <button
                                            className={`${styles.subTabBtn} ${activeProfileTab === 'events' ? styles.activeSubTab : ''}`}
                                            onClick={() => setActiveProfileTab('events')}
                                        >
                                            🗓️ Events
                                        </button>
                                        <button
                                            className={`${styles.subTabBtn} ${activeProfileTab === 'groups' ? styles.activeSubTab : ''}`}
                                            onClick={() => setActiveProfileTab('groups')}
                                        >
                                            🤝 Groups
                                        </button>
                                    </div>

                                    <div className={styles.subContentArea} style={{ marginTop: '1rem' }}>
                                        {activeProfileTab === 'posts' && (
                                            <div className={styles.profileSection}>
                                                <h3 className={styles.profileSectionTitle}>📝 Recent Posts</h3>
                                                <div className={styles.profileList}>
                                                    {selectedUserProfile.posts?.length > 0 ? selectedUserProfile.posts.map((post: any) => (
                                                        <div key={post.id} className={styles.profileListItem}>
                                                            {post.content}
                                                            <small>{new Date(post.created_at).toLocaleString()}</small>
                                                        </div>
                                                    )) : <div className={styles.empty}>No recent posts</div>}
                                                </div>
                                            </div>
                                        )}

                                        {activeProfileTab === 'badges' && (
                                            <div className={styles.profileSection}>
                                                <h3 className={styles.profileSectionTitle}>🏅 Earned Badges</h3>
                                                <div className={styles.profileList}>
                                                    {selectedUserProfile.badges?.length > 0 ? selectedUserProfile.badges.map((b: any) => (
                                                        <div key={b.id} className={styles.profileListItem}>
                                                            {b.badges?.name || 'Unknown Badge'}
                                                            <small>{new Date(b.earned_at).toLocaleString()}</small>
                                                        </div>
                                                    )) : <div className={styles.empty}>No badges earned</div>}
                                                </div>
                                            </div>
                                        )}

                                        {activeProfileTab === 'points' && (
                                            <div className={styles.profileSection}>
                                                <h3 className={styles.profileSectionTitle}>💰 Points History</h3>
                                                <div className={styles.profileList}>
                                                    {selectedUserProfile.pointsHistory?.length > 0 ? selectedUserProfile.pointsHistory.map((ph: any) => (
                                                        <div key={ph.id} className={styles.profileListItem}>
                                                            {ph.amount > 0 ? `+${ph.amount}` : ph.amount} IP — {ph.reason}
                                                            <small>{new Date(ph.created_at).toLocaleString()}</small>
                                                        </div>
                                                    )) : <div className={styles.empty}>No points history</div>}
                                                </div>
                                            </div>
                                        )}
                                        {activeProfileTab === 'stories' && (
                                            <div className={styles.profileSection}>
                                                <h3 className={styles.profileSectionTitle}>🌟 Shared Stories</h3>
                                                <div className={styles.profileList}>
                                                    {selectedUserProfile.stories?.length > 0 ? selectedUserProfile.stories.map((story: any) => (
                                                        <div key={story.id} className={styles.profileListItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            {editingProfileStoryId === story.id ? (
                                                                <div style={{ flex: 1, marginRight: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                    <input className={styles.inlineInput} value={editProfileStoryTitle} onChange={e => setEditProfileStoryTitle(e.target.value)} placeholder="Title" />
                                                                    <input className={styles.inlineInput} value={editProfileStoryType} onChange={e => setEditProfileStoryType(e.target.value)} placeholder="Achievement Type" />
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <b>{story.title}</b> — {story.achievement_type}
                                                                    <small>{new Date(story.created_at).toLocaleString()}</small>
                                                                </div>
                                                            )}
                                                            <div className={styles.actionGroup}>
                                                                {editingProfileStoryId === story.id ? (
                                                                    <>
                                                                        <button className={styles.saveBtn} onClick={() => handleUpdateProfileStory(story.id)}>Save</button>
                                                                        <button className={styles.cancelBtn} onClick={() => setEditingProfileStoryId(null)}>✕</button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button className={styles.editBtn} onClick={() => { setEditingProfileStoryId(story.id); setEditProfileStoryTitle(story.title); setEditProfileStoryType(story.achievement_type); }}>✏️</button>
                                                                        <button className={styles.deleteBtn} onClick={() => handleDeleteProfileStory(story.id)}>🗑️</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )) : <div className={styles.empty}>No success stories shared</div>}
                                                </div>
                                            </div>
                                        )}

                                        {activeProfileTab === 'events' && (
                                            <div className={styles.profileSection}>
                                                <h3 className={styles.profileSectionTitle}>🗓️ Event RSVPs</h3>
                                                <div className={styles.profileList}>
                                                    {selectedUserProfile.events?.length > 0 ? selectedUserProfile.events.map((rsvp: any) => (
                                                        <div key={rsvp.id} className={styles.profileListItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            {editingProfileEventId === rsvp.id ? (
                                                                <div style={{ flex: 1, marginRight: '1rem' }}>
                                                                    <b>{rsvp.events?.title || 'Unknown Event'}</b> — Status:
                                                                    <select className={styles.inlineInput} style={{ width: 'auto', marginLeft: '0.5rem' }} value={editProfileEventStatus} onChange={e => setEditProfileEventStatus(e.target.value)}>
                                                                        <option value="going">going</option>
                                                                        <option value="interested">interested</option>
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <b>{rsvp.events?.title || 'Unknown Event'}</b> — Status: {rsvp.status}
                                                                    <small>{new Date(rsvp.created_at).toLocaleString()}</small>
                                                                </div>
                                                            )}
                                                            <div className={styles.actionGroup}>
                                                                {editingProfileEventId === rsvp.id ? (
                                                                    <>
                                                                        <button className={styles.saveBtn} onClick={() => handleUpdateProfileEvent(rsvp.id)}>Save</button>
                                                                        <button className={styles.cancelBtn} onClick={() => setEditingProfileEventId(null)}>✕</button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button className={styles.editBtn} onClick={() => { setEditingProfileEventId(rsvp.id); setEditProfileEventStatus(rsvp.status); }}>✏️</button>
                                                                        <button className={styles.deleteBtn} onClick={() => handleDeleteProfileEvent(rsvp.id)}>🗑️</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )) : <div className={styles.empty}>No event RSVPs</div>}
                                                </div>
                                            </div>
                                        )}

                                        {activeProfileTab === 'groups' && (
                                            <div className={styles.profileSection}>
                                                <h3 className={styles.profileSectionTitle}>🤝 Joined Groups</h3>
                                                <div className={styles.profileList}>
                                                    {selectedUserProfile.groups?.length > 0 ? selectedUserProfile.groups.map((groupMember: any) => {
                                                        const memberKey = groupMember.user_id + '_' + groupMember.group_id;
                                                        const isEditing = editingProfileGroupUserId === groupMember.user_id && editingProfileGroupId === groupMember.group_id;
                                                        return (
                                                            <div key={memberKey} className={styles.profileListItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                {isEditing ? (
                                                                    <div style={{ flex: 1, marginRight: '1rem' }}>
                                                                        <b>{groupMember.groups?.name || 'Unknown Group'}</b> — Role:
                                                                        <select className={styles.inlineInput} style={{ width: 'auto', marginLeft: '0.5rem' }} value={editProfileGroupRole} onChange={e => setEditProfileGroupRole(e.target.value)}>
                                                                            <option value="member">member</option>
                                                                            <option value="admin">admin</option>
                                                                        </select>
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <b>{groupMember.groups?.name || 'Unknown Group'}</b> — Role: {groupMember.role}
                                                                        <small>Joined: {new Date(groupMember.joined_at).toLocaleString()}</small>
                                                                    </div>
                                                                )}
                                                                <div className={styles.actionGroup}>
                                                                    {isEditing ? (
                                                                        <>
                                                                            <button className={styles.saveBtn} onClick={() => handleUpdateProfileGroup(groupMember.user_id, groupMember.group_id)}>Save</button>
                                                                            <button className={styles.cancelBtn} onClick={() => { setEditingProfileGroupId(null); setEditingProfileGroupUserId(null); }}>✕</button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <button className={styles.editBtn} onClick={() => { setEditingProfileGroupUserId(groupMember.user_id); setEditingProfileGroupId(groupMember.group_id); setEditProfileGroupRole(groupMember.role); }}>✏️</button>
                                                                            <button className={styles.deleteBtn} onClick={() => handleDeleteProfileGroup(groupMember.user_id, groupMember.group_id)}>🗑️</button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    }) : <div className={styles.empty}>Not a member of any groups</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.loadingModal}>User data not found</div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
