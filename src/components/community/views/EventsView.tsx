"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { EventCard } from '@/components/community/EventCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { SkeletonLoader } from '@/components/community/SkeletonLoader';
import styles from './EventsView.module.css';

interface Participant {
    user_id: string;
    username: string;
    avatar_url: string | null;
}

interface Event {
    id: number;
    title: string;
    description: string;
    event_type: string;
    location: string;
    event_date: string;
    participants: number;
    user_rsvp?: 'going' | 'interested' | null;
    created_by?: string;
    participant_list?: Participant[];
}

const EMPTY_FORM = {
    title: '',
    description: '',
    event_type: 'meetup',
    location: '',
    event_date: '',
    event_time: ''
};

export function EventsView() {
    const { user } = useUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newEvent, setNewEvent] = useState(EMPTY_FORM);

    // Edit modal
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);

    // Participants drawer
    const [participantsEvent, setParticipantsEvent] = useState<Event | null>(null);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const { data: eventsData, error } = await supabase
            .from('events')
            .select('*')
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true });

        if (eventsData && !error) {

            const eventIds = eventsData.map(e => e.id);

            const { data: rsvpsData } = await supabase
                .from('event_rsvps')
                .select('event_id, user_id, status')
                .in('event_id', eventIds);

            let eventsWithData: Event[] = [];

            if (rsvpsData && rsvpsData.length > 0) {
                const userIds = [...new Set(rsvpsData.map(r => r.user_id))];
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', userIds);

                const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

                eventsWithData = eventsData.map((event: Partial<Event>) => {
                    const eventRsvps = rsvpsData.filter(r => r.event_id === event.id);
                    const participantList = eventRsvps.map(r => {
                        const profile = profilesMap.get(r.user_id);
                        return {
                            user_id: r.user_id,
                            username: profile?.username || 'Eco Warrior',
                            avatar_url: profile?.avatar_url || null,
                            status: r.status as 'going' | 'interested'
                        };
                    });

                    const currentUserRsvp = eventRsvps.find(r => r.user_id === user?.id);

                    return {
                        ...event,
                        participants: eventRsvps.filter(r => r.status === 'going').length,
                        participant_list: participantList,
                        user_rsvp: currentUserRsvp?.status || null
                    } as Event;
                });
            } else {
                eventsWithData = eventsData.map((event: Partial<Event>) => ({
                    ...event,
                    participants: 0,
                    participant_list: [],
                    user_rsvp: null
                } as Event));
            }

            setEvents(eventsWithData);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // ── CREATE ──────────────────────────────────────────────────────────────
    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!user) { setFormError("You must be signed in."); return; }
        if (!newEvent.title.trim()) { setFormError("Title is required."); return; }
        if (!newEvent.event_date || !newEvent.event_time) { setFormError("Please select date and time."); return; }

        const dateObj = new Date(`${newEvent.event_date}T${newEvent.event_time}:00`);
        if (isNaN(dateObj.getTime())) { setFormError("Invalid date or time."); return; }

        setSubmitting(true);
        const { data, error } = await supabase.from('events').insert([{
            title: newEvent.title,
            description: newEvent.description,
            event_type: newEvent.event_type,
            location: newEvent.location,
            event_date: dateObj.toISOString(),
            created_by: user.id
        }]).select().single();

        if (error) {
            setFormError(`Failed to create event: ${error.message}`);
        } else if (data) {
            setEvents(prev => [{ ...data, participants: 0, participant_list: [], user_rsvp: null }, ...prev]
                .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
            setShowCreateModal(false);
            setNewEvent(EMPTY_FORM);
            showToast('🗓️ Event created!');
        }
        setSubmitting(false);
    };

    // ── EDIT ────────────────────────────────────────────────────────────────
    const openEdit = (event: Event) => {
        const d = new Date(event.event_date);
        const pad = (n: number) => String(n).padStart(2, '0');
        setEditForm({
            title: event.title,
            description: event.description,
            event_type: event.event_type,
            location: event.location,
            event_date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
            event_time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
        });
        setEditingEvent(event);
        setFormError(null);
    };

    const handleEditEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;
        setFormError(null);
        if (!editForm.event_date || !editForm.event_time) { setFormError("Please select date and time."); return; }

        const dateObj = new Date(`${editForm.event_date}T${editForm.event_time}:00`);
        if (isNaN(dateObj.getTime())) { setFormError("Invalid date or time."); return; }

        setSubmitting(true);
        const { error } = await supabase.from('events').update({
            title: editForm.title,
            description: editForm.description,
            event_type: editForm.event_type,
            location: editForm.location,
            event_date: dateObj.toISOString()
        }).eq('id', editingEvent.id).eq('created_by', user!.id);

        if (error) {
            setFormError(`Failed to update: ${error.message}`);
        } else {
            setEvents(prev => prev.map(ev => ev.id === editingEvent.id
                ? { ...ev, ...editForm, event_date: dateObj.toISOString() }
                : ev));
            setEditingEvent(null);
            showToast('✏️ Event updated!');
        }
        setSubmitting(false);
    };

    // ── DELETE ──────────────────────────────────────────────────────────────
    const handleDeleteEvent = async (eventId: number) => {
        if (!user) return;
        const { error } = await supabase.from('events').delete()
            .eq('id', eventId).eq('created_by', user.id);
        if (!error) {
            setEvents(prev => prev.filter(e => e.id !== eventId));
            showToast('🗑️ Event deleted.', 'info');
        }
    };

    // ── JOIN / UNJOIN ────────────────────────────────────────────────────────
    const handleRSVP = async (eventId: number, status: 'going' | 'interested') => {
        if (!user) return;

        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const alreadyGoing = event.user_rsvp === status;

        if (alreadyGoing) {
            // Unjoin
            await supabase.from('event_rsvps').delete()
                .eq('event_id', eventId).eq('user_id', user.id);

            setEvents(prev => prev.map(e => e.id === eventId ? {
                ...e,
                user_rsvp: null,
                participants: Math.max(0, e.participants - 1),
                participant_list: e.participant_list?.filter(p => p.user_id !== user.id) ?? []
            } : e));
            showToast('👋 Left the event.', 'info');
        } else {
            // Join / upsert
            const { error } = await supabase.from('event_rsvps').upsert({
                event_id: eventId,
                user_id: user.id,
                status
            });

            if (!error) {
                const wasGoing = event.user_rsvp === 'going';
                const mySelf: Participant = {
                    user_id: user.id,
                    username: user.username || user.firstName || 'You',
                    avatar_url: user.imageUrl || null
                };
                setEvents(prev => prev.map(e => e.id === eventId ? {
                    ...e,
                    user_rsvp: status,
                    participants: status === 'going'
                        ? (wasGoing ? e.participants : e.participants + 1)
                        : e.participants,
                    participant_list: status === 'going'
                        ? [mySelf, ...(e.participant_list?.filter(p => p.user_id !== user.id) ?? [])]
                        : e.participant_list
                } : e));
                showToast('🌿 You\'re going!');
            }
        }
    };

    const filteredEvents = filter === 'all' ? events : events.filter(e => e.event_type === filter);

    const renderEventForm = ({ form, setForm, onSubmit, title, submitLabel }: {
        form: typeof EMPTY_FORM;
        setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
        onSubmit: (e: React.FormEvent) => void;
        title: string;
        submitLabel: string;
    }) => (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h3>{title}</h3>
                {formError && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fca5a5' }}>
                        {formError}
                    </div>
                )}
                <form onSubmit={onSubmit}>
                    <div className={styles.formGroup}>
                        <label>Title</label>
                        <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Date</label>
                            <input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Time</label>
                            <input type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} required />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Location</label>
                        <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Type</label>
                        <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                            <option value="meetup">🤝 Meetup</option>
                            <option value="cleanup">🧹 Cleanup</option>
                            <option value="webinar">💻 Webinar</option>
                            <option value="workshop">🛠️ Workshop</option>
                        </select>
                    </div>
                    <div className={styles.formActions}>
                        <Button type="button" variant="ghost" onClick={() => { setShowCreateModal(false); setEditingEvent(null); setFormError(null); }}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : submitLabel}</Button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (loading) return <div className={styles.container}><SkeletonLoader type="card" count={3} /></div>;

    return (
        <div className={styles.container}>
            {/* Toast */}
            {toast && (
                <div className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}>
                    {toast.message}
                </div>
            )}

            <header className={styles.header}>
                <h2>🗓️ Community Events</h2>
                <p>Join upcoming sustainability events near you</p>
                <Button onClick={() => { setShowCreateModal(true); setFormError(null); setNewEvent(EMPTY_FORM); }} style={{ marginTop: '1rem' }}>
                    + Create Event
                </Button>
            </header>

            <div className={styles.filters}>
                {[
                    { key: 'all', label: 'All Events' },
                    { key: 'cleanup', label: '🧹 Cleanups' },
                    { key: 'webinar', label: '💻 Webinars' },
                    { key: 'meetup', label: '🤝 Meetups' },
                    { key: 'workshop', label: '🛠️ Workshops' },
                ].map(({ key, label }) => (
                    <button key={key} className={filter === key ? styles.activeFilter : ''} onClick={() => setFilter(key)}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && renderEventForm({
                form: newEvent,
                setForm: setNewEvent,
                onSubmit: handleCreateEvent,
                title: "Create New Event",
                submitLabel: "Create Event"
            })}

            {/* Edit Modal */}
            {editingEvent && renderEventForm({
                form: editForm,
                setForm: setEditForm,
                onSubmit: handleEditEvent,
                title: "Edit Event",
                submitLabel: "Save Changes"
            })}

            {/* Participants Drawer */}
            {participantsEvent && (
                <div className={styles.modalOverlay} onClick={() => setParticipantsEvent(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>👥 Who's Going — {participantsEvent.title}</h3>
                        {participantsEvent.participant_list && participantsEvent.participant_list.length > 0 ? (
                            <div className={styles.participantsList}>
                                {participantsEvent.participant_list.map(p => (
                                    <div key={p.user_id} className={styles.participantRow}>
                                        <div className={styles.participantAvatarLg}>
                                            {p.avatar_url
                                                ? <img src={p.avatar_url} alt={p.username} />
                                                : <span>👤</span>
                                            }
                                        </div>
                                        <span className={styles.participantName}>{p.username}</span>
                                    </div>
                                ))}
                                {participantsEvent.participants > (participantsEvent.participant_list?.length ?? 0) && (
                                    <p className={styles.moreParticipants}>
                                        +{participantsEvent.participants - (participantsEvent.participant_list?.length ?? 0)} more going
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                                No one has joined yet — be the first! 🌿
                            </p>
                        )}
                        <div className={styles.formActions}>
                            <Button variant="ghost" onClick={() => setParticipantsEvent(null)}>Close</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.eventsList}>
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onRSVP={handleRSVP}
                            onDelete={user && event.created_by === user.id ? handleDeleteEvent : undefined}
                            onEdit={user && event.created_by === user.id ? openEdit : undefined}
                            onShowParticipants={(id) => {
                                const ev = events.find(e => e.id === id);
                                if (ev) setParticipantsEvent(ev);
                            }}
                        />
                    ))
                ) : (
                    <Card className={styles.emptyState}>
                        <p>No upcoming events found. Be the first to create one!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
