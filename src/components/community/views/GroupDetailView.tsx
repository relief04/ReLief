"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/context/ToastContext';
import { SkeletonLoader } from '@/components/community/SkeletonLoader';
import { EventCard } from '@/components/community/EventCard';
import { GroupChat } from './GroupChat';
import { ArrowLeft, Calendar, Users, MessageCircle, MapPin, Clock } from 'lucide-react';
import styles from './GroupDetailView.module.css';
import { ParticipantListModal } from '@/components/community/ParticipantListModal';

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

interface Member {
    id: string; // profile id
    username: string;
    avatar_url: string | null;
    role: string; // group role
}

interface GroupDetailProps {
    group: Group;
    onBack: () => void;
    onJoin: (groupId: string) => void;
    onLeave: (groupId: string) => void;
    onEdit?: (group: Group) => void;
    onDelete?: (groupId: string) => void;
}

interface EventParticipant {
    user_id: string;
    username: string;
    avatar_url: string | null;
    status: 'going' | 'interested';
}

interface GroupMemberDb {
    user_id: string;
    role: string;
}

interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
}

interface RsvpRow {
    event_id: number;
    user_id: string;
    status: string;
}

interface EventWithDetails {
    id: number;
    title: string;
    description: string;
    event_type: string;
    location: string;
    event_date: string;
    created_by: string;
    group_id: string;
    participants: number;
    user_rsvp?: 'going' | 'interested' | null;
    participant_list?: EventParticipant[];
}

export function GroupDetailView({ group, onBack, onJoin, onLeave, onEdit, onDelete }: GroupDetailProps) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<'chat' | 'events' | 'members'>('chat');
    const [members, setMembers] = useState<Member[]>([]);
    const [events, setEvents] = useState<EventWithDetails[]>([]);
    const [loading, setLoading] = useState(false);

    // Participant Modal State
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [selectedEventParticipants, setSelectedEventParticipants] = useState<EventParticipant[]>([]);
    const [selectedEventTitle, setSelectedEventTitle] = useState('');

    // Create/Edit Event State
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EventWithDetails | null>(null);
    const [newEvent, setNewEvent] = useState({
        title: '', description: '', event_type: 'meetup', location: '', event_date: '', event_time: ''
    });
    const [submittingEvent, setSubmittingEvent] = useState(false);
    const [eventError, setEventError] = useState<string | null>(null);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setEventError(null);

        if (!user) {
            setEventError("You must be signed in to create an event.");
            return;
        }

        if (!newEvent.event_date || !newEvent.event_time) {
            setEventError("Please select both date and time.");
            return;
        }

        setSubmittingEvent(true);

        try {
            const dateStr = `${newEvent.event_date}T${newEvent.event_time}:00`;
            const dateObj = new Date(dateStr);
            const datetime = dateObj.toISOString();

            if (editingEvent) {
                const { error } = await supabase
                    .from('events')
                    .update({
                        title: newEvent.title,
                        description: newEvent.description,
                        event_type: newEvent.event_type,
                        location: newEvent.location,
                        event_date: datetime,
                    })
                    .eq('id', editingEvent.id)
                    .eq('created_by', user.id);

                if (error) throw error;

                setEvents(prev => prev.map(ev => ev.id === editingEvent.id
                    ? { ...ev, title: newEvent.title, description: newEvent.description, event_type: newEvent.event_type, location: newEvent.location, event_date: datetime }
                    : ev));
            } else {
                const payload = {
                    title: newEvent.title,
                    description: newEvent.description,
                    event_type: newEvent.event_type,
                    location: newEvent.location,
                    event_date: datetime,
                    created_by: user.id,
                    group_id: group.id
                };

                const { data, error } = await supabase
                    .from('events')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    const newEventEntry: EventWithDetails = {
                        ...data,
                        participants: 0,
                        user_rsvp: null,
                        participant_list: []
                    };
                    setEvents(prev => [...prev, newEventEntry]);
                }
            }

            setShowCreateEvent(false);
            setEditingEvent(null);
            setNewEvent({ title: '', description: '', event_type: 'meetup', location: '', event_date: '', event_time: '' });

        } catch (error) {
            console.error("Event creation/edit error:", error);
            const message = error instanceof Error ? error.message : "Failed to save event. Please try again.";
            setEventError(message);
        } finally {
            setSubmittingEvent(false);
        }
    };

    const handleDeleteEvent = async (eventId: number) => {
        if (!user) return;
        const { error } = await supabase.from('events').delete()
            .eq('id', eventId).eq('created_by', user.id);
        if (!error) {
            setEvents(prev => prev.filter(e => e.id !== eventId));
        }
    };

    const openEditEvent = (event: EventWithDetails) => {
        const d = new Date(event.event_date);
        const pad = (n: number) => String(n).padStart(2, '0');
        setNewEvent({
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            location: event.location,
            event_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
            event_time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
        });
        setEditingEvent(event);
        setShowCreateEvent(true);
        setEventError(null);
    };

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        const { data: membersData, error } = await supabase
            .from('group_members')
            .select('user_id, role')
            .eq('group_id', group.id);

        if (membersData && !error) {
            const groupMembers = membersData as GroupMemberDb[];
            const userIds = groupMembers.map((m) => m.user_id);
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds);

                if (profiles) {
                    const merged = (profiles as Profile[]).map((p: Profile) => ({
                        ...p,
                        role: groupMembers.find((m) => m.user_id === p.id)?.role || 'member'
                    }));
                    setMembers(merged);
                }
            } else {
                setMembers([]);
            }
        }
        setLoading(false);
    }, [group.id]);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .eq('group_id', group.id)
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true });

        if (eventsData && !eventsError) {
            const eventIds = eventsData.map((e: { id: number }) => e.id);

            const { data: rsvpsData } = await supabase
                .from('event_rsvps')
                .select('event_id, user_id, status')
                .in('event_id', eventIds);

            let formattedEvents: EventWithDetails[] = [];

            if (rsvpsData && rsvpsData.length > 0) {
                const typedRsvps = rsvpsData as RsvpRow[];
                const userIds = [...new Set(typedRsvps.map((r: RsvpRow) => r.user_id))];
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds);

                const profilesMap = new Map((profilesData as Profile[] | null)?.map((p: Profile) => [p.id, p]));

                formattedEvents = eventsData.map((event: { id: number;[key: string]: unknown }) => {
                    const eventRsvps = typedRsvps.filter((r: RsvpRow) => r.event_id === event.id);
                    const participantList = eventRsvps.map((r: RsvpRow) => {
                        const profile = profilesMap.get(r.user_id);
                        return {
                            user_id: r.user_id,
                            username: profile?.username || 'Unknown User',
                            avatar_url: profile?.avatar_url || null,
                            status: r.status as 'going' | 'interested'
                        };
                    });

                    const currentUserRsvp = eventRsvps.find((r: RsvpRow) => r.user_id === user?.id);

                    return {
                        ...event,
                        participants: eventRsvps.filter((r: RsvpRow) => r.status === 'going').length,
                        user_rsvp: currentUserRsvp?.status || null,
                        participant_list: participantList
                    };
                });
            } else {
                formattedEvents = eventsData.map((e: { id: number;[key: string]: unknown }) => ({
                    ...e,
                    participants: 0,
                    user_rsvp: null,
                    participant_list: []
                }));
            }
            setEvents(formattedEvents);
        } else {
            console.log("Could not fetch group events:", eventsError);
            setEvents([]);
        }
        setLoading(false);
    }, [group.id, user?.id]);

    const handleRSVP = async (eventId: number, status: 'going' | 'interested') => {
        if (!user) return;

        const ev = events.find(e => e.id === eventId);
        if (!ev) return;

        const alreadySameStatus = ev.user_rsvp === status;

        if (alreadySameStatus) {
            // Unjoin: delete RSVP
            setEvents(prev => prev.map(e => e.id === eventId ? {
                ...e, user_rsvp: null,
                participants: status === 'going' ? Math.max(0, e.participants - 1) : e.participants,
                participant_list: e.participant_list?.filter(p => p.user_id !== user.id) ?? []
            } : e));

            await supabase.from('event_rsvps').delete()
                .eq('event_id', eventId).eq('user_id', user.id);
        } else {
            // Join or switch status
            const wasGoing = ev.user_rsvp === 'going';
            const nowGoing = status === 'going';

            setEvents(prev => prev.map(e => e.id === eventId ? {
                ...e, user_rsvp: status,
                participants: nowGoing && !wasGoing
                    ? e.participants + 1
                    : !nowGoing && wasGoing
                        ? Math.max(0, e.participants - 1)
                        : e.participants
            } : e));

            await supabase.from('event_rsvps').upsert({
                event_id: eventId,
                user_id: user.id,
                status
            });
            fetchEvents();
        }
    };

    const handleShowParticipants = (eventId: number) => {
        const event = events.find(e => e.id === eventId);
        if (event && event.participant_list) {
            setSelectedEventParticipants(event.participant_list);
            setSelectedEventTitle(event.title);
            setShowParticipantsModal(true);
        }
    };

    // Initial load for tab data
    useEffect(() => {
        if (activeTab === 'members') fetchMembers();
        if (activeTab === 'events') fetchEvents();
    }, [activeTab, fetchMembers, fetchEvents]);

    const [isJoining, setIsJoining] = useState(false);
    const handleJoinClick = async () => {
        setIsJoining(true);
        await onJoin(group.id);
        setIsJoining(false);
    };

    const { confirm } = useToast();

    const handleLeaveClick = async () => {
        const confirmed = await confirm({
            title: 'Leave Group',
            message: 'Are you sure you want to leave this group?',
            danger: true,
            confirmLabel: 'Leave',
            cancelLabel: 'Cancel'
        });
        if (!confirmed) return;
        setIsJoining(true);
        await onLeave(group.id);
        setIsJoining(false);
    };

    return (
        <div className={styles.container}>
            <button onClick={onBack} className={styles.backButton}>
                <ArrowLeft size={16} /> Back to Groups
            </button>

            {/* Header */}
            <div className={styles.headerCard}>
                <div className={styles.banner} />
                <div className={styles.headerContent}>
                    <div className={styles.groupIdentity}>
                        <div className={styles.avatar}>
                            {group.avatar_url ? (
                                <img src={group.avatar_url} alt={group.name} />
                            ) : (
                                <span>👥</span>
                            )}
                        </div>
                        <div className={styles.textArea}>
                            <h1>{group.name}</h1>
                            <div className={styles.meta}>
                                <span className={styles.badge}>{group.group_type}</span>
                                <span>{group.member_count} members</span>
                                {group.is_private && <span>🔒 Private</span>}
                            </div>
                        </div>
                    </div>
                    <div className={styles.actions}>
                        {group.user_role === 'admin' && onEdit && (
                            <Button variant="outline" size="sm" onClick={() => onEdit(group)} style={{ marginRight: '0.5rem' }}>
                                Edit Group
                            </Button>
                        )}
                        {group.user_role === 'admin' && onDelete && (
                            <Button variant="outline" size="sm" onClick={() => onDelete(group.id)} style={{ marginRight: '0.5rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                                Delete Group
                            </Button>
                        )}
                        {group.is_member ? (
                            <Button variant="outline" onClick={handleLeaveClick} disabled={isJoining}>
                                {isJoining ? 'Processing...' : 'Leave Group'}
                            </Button>
                        ) : (
                            <Button onClick={handleJoinClick} disabled={isJoining}>
                                {isJoining ? 'Joining...' : 'Join Group'}
                            </Button>
                        )}
                    </div>
                </div>
                <p className={styles.description}>{group.description}</p>
            </div>

            {/* Tabs */}
            <div className={styles.tabsContainer}>
                <div className={styles.segmentedControl}>
                    <button
                        className={`${styles.segment} ${activeTab === 'chat' ? styles.activeSegment : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        <MessageCircle size={16} /> <span>Chat</span>
                    </button>
                    <button
                        className={`${styles.segment} ${activeTab === 'events' ? styles.activeSegment : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        <Calendar size={16} /> <span>Events</span>
                    </button>
                    <button
                        className={`${styles.segment} ${activeTab === 'members' ? styles.activeSegment : ''}`}
                        onClick={() => setActiveTab('members')}
                    >
                        <Users size={16} /> <span>Members</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {activeTab === 'chat' && (
                    group.is_member ? (
                        <div className={styles.chatWrapper}>
                            <GroupChat groupId={group.id} />
                        </div>
                    ) : (
                        <div className={styles.emptyTab}>
                            <h3>🔒 Members Only</h3>
                            <p>Join this group to participate in the chat!</p>
                            <Button onClick={handleJoinClick}>Join Group</Button>
                        </div>
                    )
                )}

                {activeTab === 'members' && (
                    <div className={styles.membersGrid}>
                        {loading ? (
                            <SkeletonLoader type="list" count={3} />
                        ) : members.length > 0 ? (
                            members.map(member => (
                                <div key={member.id} className={styles.memberCard}>
                                    <div className={styles.memberAvatar}>
                                        {member.avatar_url ? (
                                            <img src={member.avatar_url} alt={member.username} />
                                        ) : (
                                            <span>👤</span>
                                        )}
                                    </div>
                                    <div className={styles.memberInfo}>
                                        <h4>{member.username}</h4>
                                        <span className={styles.memberRole}>{member.role}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No members found.</p>
                        )}
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className={styles.eventsTab}>
                        <div className={styles.tabActions}>
                            <h3>Upcoming Events</h3>
                            {group.is_member && <Button size="sm" onClick={() => setShowCreateEvent(true)}>+ New Event</Button>}
                        </div>

                        {loading ? (
                            <SkeletonLoader type="card" count={2} />
                        ) : events.length > 0 ? (
                            events.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    onRSVP={group.is_member ? handleRSVP : undefined}
                                    onDelete={user && event.created_by === user.id ? handleDeleteEvent : undefined}
                                    onEdit={user && event.created_by === user.id ? () => openEditEvent(event) : undefined}
                                    onShowParticipants={handleShowParticipants}
                                />
                            ))
                        ) : (
                            <div className={styles.emptyTab}>
                                <p>No upcoming events for this group.</p>
                                {group.is_member && (
                                    <Button variant="ghost" size="sm" onClick={() => setShowCreateEvent(true)}>
                                        Create one now
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Event Modal */}
            {showCreateEvent && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>{editingEvent ? 'Edit Event' : 'Plan a Group Event'}</h3>
                        {eventError && (
                            <div className={styles.errorMessage}>
                                {eventError}
                            </div>
                        )}
                        <form onSubmit={handleCreateEvent}>
                            <div className={styles.formGroup}>
                                <label>Event Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Park Cleanup"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    required
                                    placeholder="What's the plan?"
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Date</label>
                                    <div className={styles.inputIconWrapper}>
                                        <input
                                            type="date"
                                            required
                                            value={newEvent.event_date}
                                            onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Time</label>
                                    <div className={styles.inputIconWrapper}>
                                        <input
                                            type="time"
                                            required
                                            value={newEvent.event_time}
                                            onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Location</label>
                                <div className={styles.inputIconWrapper}>
                                    <MapPin size={16} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Add location"
                                        className={styles.inputWithIcon}
                                        value={newEvent.location}
                                        onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <Button type="button" variant="ghost" onClick={() => {
                                    setShowCreateEvent(false);
                                    setEditingEvent(null);
                                    setEventError(null);
                                    setNewEvent({ title: '', description: '', event_type: 'meetup', location: '', event_date: '', event_time: '' });
                                }}>Cancel</Button>
                                <Button type="submit" disabled={submittingEvent}>
                                    {submittingEvent ? 'Saving...' : (editingEvent ? 'Save Changes' : 'Create Event')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ParticipantListModal
                isOpen={showParticipantsModal}
                onClose={() => setShowParticipantsModal(false)}
                participants={selectedEventParticipants}
                title={`Going to ${selectedEventTitle}`}
            />
        </div>
    );
}
