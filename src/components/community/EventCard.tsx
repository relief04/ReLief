import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import styles from './EventCard.module.css';
import { formatDate } from '@/lib/dateUtils';

interface Participant {
    user_id: string;
    username: string;
    avatar_url: string | null;
}

interface EventCardProps {
    event: {
        id: number;
        title: string;
        description: string;
        event_type: string;
        location: string;
        event_date: string;
        participants: number;
        user_rsvp?: 'going' | 'interested' | null;
        participant_list?: Participant[];
    };
    onRSVP?: (eventId: number, status: 'going' | 'interested') => void;
    onDelete?: (eventId: number) => void;
    onEdit?: (event: EventCardProps['event']) => void;
    onShowParticipants?: (eventId: number) => void;
}

export function EventCard({ event, onRSVP, onDelete, onEdit, onShowParticipants }: EventCardProps) {
    const { confirm } = useToast();
    const eventDate = new Date(event.event_date);
    const isUpcoming = eventDate > new Date();

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'cleanup': return '🧹';
            case 'webinar': return '💻';
            case 'meetup': return '🤝';
            case 'workshop': return '🛠️';
            default: return '📅';
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Event',
            message: 'Are you sure you want to delete this event?',
            danger: true,
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        });
        if (confirmed && onDelete) {
            onDelete(event.id);
        }
    };

    return (
        <Card className={styles.eventCard}>
            <div className={styles.eventHeader}>
                <span className={styles.eventIcon}>{getEventIcon(event.event_type)}</span>
                <div className={styles.eventInfo}>
                    <h4>{event.title}</h4>
                    <span className={styles.eventType}>{event.event_type}</span>
                </div>
                <div className={styles.ownerActions}>
                    {onEdit && (
                        <Button size="sm" variant="ghost" onClick={() => onEdit(event)} title="Edit event">
                            ✏️
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDelete}
                            style={{ color: 'var(--color-error, #ef4444)' }}
                            title="Delete event"
                        >
                            🗑️
                        </Button>
                    )}
                </div>
            </div>

            <p className={styles.eventDescription}>{event.description}</p>

            <div className={styles.eventDetails}>
                <div className={styles.detail}>
                    <span>📍</span>
                    <span>{event.location}</span>
                </div>
                <div className={styles.detail}>
                    <span>📅</span>
                    <span>{formatDate(eventDate)} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Clickable participant facepile */}
                <div
                    className={`${styles.detail} ${styles.clickableDetail}`}
                    onClick={() => onShowParticipants && onShowParticipants(event.id)}
                    title="See who's going"
                >
                    <div className={styles.participantStack}>
                        {event.participant_list?.slice(0, 4).map((p, i) => (
                            <div key={p.user_id} className={styles.participantAvatar} style={{ zIndex: 4 - i }}>
                                {p.avatar_url
                                    ? <img src={p.avatar_url} alt={p.username} />
                                    : <span>{p.username.charAt(0).toUpperCase()}</span>
                                }
                            </div>
                        ))}
                        {event.participants > 0
                            ? <span className={styles.participantCount}>
                                {event.participants} {event.participants === 1 ? 'person' : 'people'} going →
                            </span>
                            : <span className={styles.participantCount}>Be the first to join! 🌿</span>
                        }
                    </div>
                </div>
            </div>

            {isUpcoming && onRSVP && (
                <div className={styles.eventActions}>
                    <Button
                        size="sm"
                        variant={event.user_rsvp === 'going' ? 'outline' : 'primary'}
                        onClick={() => onRSVP(event.id, 'going')}
                        className={event.user_rsvp === 'going' ? styles.goingButton : ''}
                    >
                        {event.user_rsvp === 'going' ? '✓ Going — Click to Leave' : '+ Join Event'}
                    </Button>
                </div>
            )}
        </Card>
    );
}
