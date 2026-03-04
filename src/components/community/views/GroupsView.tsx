"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { GroupCard } from '@/components/community/GroupCard';
import { Button } from '@/components/ui/Button';
import { GroupDetailView } from './GroupDetailView';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { SkeletonLoader } from '@/components/community/SkeletonLoader';
import { createGroupAction, updateGroupAction, deleteGroupAction, joinGroupAction, leaveGroupAction } from '@/lib/groupsServerActions';
import { useToast } from '@/context/ToastContext';
import { useRefresh } from '@/context/RefreshContext';
import styles from './GroupsView.module.css';

interface Group {
    id: string;
    name: string;
    description: string;
    group_type: string;
    avatar_url: string | null;
    member_count: number;
    is_private: boolean;
    created_by: string;
    is_member?: boolean;
    user_role?: string;
}

export function GroupsView() {
    const { user } = useUser();
    const { refreshKey, triggerRefresh } = useRefresh();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'discover' | 'my-groups'>('discover');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [newGroup, setNewGroup] = useState({
        name: '',
        description: '',
        group_type: 'general',
        is_private: false
    });

    const fetchGroups = useCallback(async () => {
        setLoading(true);

        const { data: groupsData, error } = await supabase
            .from('groups')
            .select('*')
            .order('member_count', { ascending: false });

        if (groupsData && !error) {
            // Check membership and roles
            const userRoles = new Map<string, string>();
            if (user) {
                const { data: membersData } = await supabase
                    .from('group_members')
                    .select('group_id, role')
                    .eq('user_id', user.id);

                if (membersData) {
                    membersData.forEach((m: { group_id: string; role: string }) => userRoles.set(m.group_id, m.role));
                }
            }

            const formattedGroups = groupsData.map((group: Partial<Group>) => ({
                ...group,
                is_member: userRoles.has(group.id!),
                user_role: userRoles.get(group.id!)
            })) as Group[];

            setGroups(formattedGroups);
        }

        setLoading(false);
    }, [user, refreshKey]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!user) {
            setFormError("You must be signed in to create a group.");
            return;
        }
        if (!newGroup.name.trim()) {
            setFormError("Group name is required.");
            return;
        }
        if (!newGroup.description.trim()) {
            setFormError("Description is required.");
            return;
        }

        setSubmitting(true);

        // 1. Edit or Create Group
        if (editingGroup) {
            const res = await updateGroupAction(editingGroup.id, newGroup);

            if (res.success) {
                const updatedGroup = { ...editingGroup, ...newGroup };
                setGroups(groups.map(g => g.id === editingGroup.id ? updatedGroup : g));
                if (selectedGroup?.id === editingGroup.id) {
                    setSelectedGroup(updatedGroup);
                }
                setShowCreateModal(false);
                setEditingGroup(null);
                setNewGroup({ name: '', description: '', group_type: 'general', is_private: false });
            } else {
                setFormError(`Failed to update group: ${res.error}`);
            }
        } else {
            const res = await createGroupAction(newGroup);

            if (res.success && res.groupData) {
                const newGroupWithMeta: Group = {
                    ...res.groupData,
                    is_member: true,
                    user_role: 'admin'
                } as Group;

                setGroups([newGroupWithMeta, ...groups]);
                setShowCreateModal(false);
                setNewGroup({ name: '', description: '', group_type: 'general', is_private: false });
                triggerRefresh('group');
            } else {
                console.error("Error creating group:", res.error);
                setFormError(`Failed to create group: ${res.error || 'Unknown error'}`);
            }
        }
        setSubmitting(false);
    };

    const openEditGroup = (groupToEdit: Group) => {
        setNewGroup({
            name: groupToEdit.name,
            description: groupToEdit.description,
            group_type: groupToEdit.group_type,
            is_private: groupToEdit.is_private
        });
        setEditingGroup(groupToEdit);
        setShowCreateModal(true);
        setFormError(null);
    };

    const { confirm } = useToast();

    const handleDeleteGroup = async (groupId: string) => {
        if (!user) return;
        const confirmed = await confirm({
            title: 'Delete Group',
            message: 'Are you sure you want to delete this group? This action cannot be undone.',
            danger: true,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        });
        if (!confirmed) return;

        // Optimistic remove
        setGroups(groups.filter(g => g.id !== groupId));

        const res = await deleteGroupAction(groupId);

        if (!res.success) {
            console.error("Error deleting group:", res.error);
            fetchGroups(); // Revert on error
        } else {
            // If we are currently viewing this group, close the detail view
            if (selectedGroup?.id === groupId) {
                setSelectedGroup(null);
            }
            triggerRefresh('group');
        }
    };

    const handleJoin = async (groupId: string) => {
        if (!user) return;

        const res = await joinGroupAction(groupId);

        if (res.success) {
            const groupToJoin = groups.find(g => g.id === groupId);
            const updatedGroup = {
                ...groupToJoin!,
                is_member: true,
                member_count: (groupToJoin?.member_count || 0) + 1,
                user_role: res.role as string
            };
            setGroups(groups.map(g =>
                g.id === groupId ? updatedGroup : g
            ));

            // Auto-open the group after joining
            setSelectedGroup(updatedGroup);
            triggerRefresh('group');
        } else {
            console.error("Error joining group:", res.error);
        }
    };

    const handleLeave = async (groupId: string) => {
        if (!user) return;

        const res = await leaveGroupAction(groupId);

        if (res.success) {
            setGroups(groups.map(g =>
                g.id === groupId
                    ? { ...g, is_member: false, member_count: g.member_count - 1, user_role: undefined }
                    : g
            ));
            // Close the group detail view and return to groups list
            setSelectedGroup(null);
            triggerRefresh('group');
        } else {
            console.error("Error leaving group:", res.error);
        }
    };

    const filteredGroups = groups.filter(g => {
        // 1. Search Filter
        const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.description.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Tab Filter (My Groups vs Discover)
        const matchesView = viewMode === 'discover' ? true : g.is_member;

        // 3. Category Filter (only applies in Discover mode usually, but can apply to both)
        const matchesCategory = filter === 'all' ? true : g.group_type === filter;

        return matchesSearch && matchesView && matchesCategory;
    });

    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const renderCreateModal = () => (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>{editingGroup ? 'Edit Group' : 'Create a New Group'}</h3>
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
                <form onSubmit={handleCreateGroup}>
                    <div className={styles.formGroup}>
                        <label>Group Name</label>
                        <input
                            type="text"
                            value={newGroup.name}
                            onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                            required
                            placeholder="e.g. Green Warriors"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            value={newGroup.description}
                            onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                            required
                            placeholder="What is this group about?"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Type</label>
                        <select
                            value={newGroup.group_type}
                            onChange={e => setNewGroup({ ...newGroup, group_type: e.target.value })}
                        >
                            <option value="general">🌍 General</option>
                            <option value="school">🏫 School/University</option>
                            <option value="corporate">🏢 Corporate/Office</option>
                            <option value="neighborhood">🏘️ Neighborhood/Community</option>
                        </select>
                    </div>
                    <div className={styles.formActions}>
                        <Button type="button" variant="ghost" onClick={() => {
                            setShowCreateModal(false);
                            setEditingGroup(null);
                            setFormError(null);
                            setNewGroup({ name: '', description: '', group_type: 'general', is_private: false });
                        }}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : (editingGroup ? 'Save Changes' : 'Create Group')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );

    // ... (keep existing effects)

    if (loading) return (
        <div className={styles.container}>
            <SkeletonLoader type="card" count={4} />
        </div>
    );

    if (selectedGroup) {
        return (
            <>
                <GroupDetailView
                    group={selectedGroup}
                    onBack={() => setSelectedGroup(null)}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onEdit={openEditGroup}
                    onDelete={handleDeleteGroup}
                />
                {showCreateModal && renderCreateModal()}
            </>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>🤝 Community Groups</h2>
                <p>Join forces with others to make a bigger impact</p>
            </header>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.viewToggle}>
                    <button
                        className={viewMode === 'discover' ? styles.activeView : ''}
                        onClick={() => setViewMode('discover')}
                    >
                        🌍 Discover
                    </button>
                    <button
                        className={viewMode === 'my-groups' ? styles.activeView : ''}
                        onClick={() => setViewMode('my-groups')}
                    >
                        👤 My Groups
                    </button>
                </div>

                <Button onClick={() => { setShowCreateModal(true); setFormError(null); }}>+ Create Group</Button>
            </div>

            {viewMode === 'discover' && (
                <div className={styles.filters}>
                    <button className={filter === 'all' ? styles.active : ''} onClick={() => setFilter('all')}>All</button>
                    <button className={filter === 'school' ? styles.active : ''} onClick={() => setFilter('school')}>🏫 Schools</button>
                    <button className={filter === 'corporate' ? styles.active : ''} onClick={() => setFilter('corporate')}>🏢 Corporate</button>
                    <button className={filter === 'neighborhood' ? styles.active : ''} onClick={() => setFilter('neighborhood')}>🏘️ Neighborhood</button>
                    <button className={filter === 'general' ? styles.active : ''} onClick={() => setFilter('general')}>🌍 General</button>
                </div>
            )}

            {showCreateModal && renderCreateModal()}

            <div className={styles.groupsGrid}>
                {filteredGroups.length > 0 ? (
                    filteredGroups.map(group => (
                        <div key={group.id} onClick={() => setSelectedGroup(group)} style={{ cursor: 'pointer' }}>
                            <GroupCard
                                group={group}
                                onJoin={(id) => { handleJoin(id); setSelectedGroup(prev => prev?.id === id ? { ...prev, is_member: true, member_count: prev.member_count + 1 } : prev) }}
                                onLeave={(id) => { handleLeave(id); setSelectedGroup(prev => prev?.id === id ? { ...prev, is_member: false, member_count: prev.member_count - 1 } : prev) }}
                                onDelete={group.user_role === 'admin' ? handleDeleteGroup : undefined}
                            />
                        </div>
                    ))
                ) : (
                    <Card className={styles.emptyState}>
                        <p>No groups found. Create one to get started!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
