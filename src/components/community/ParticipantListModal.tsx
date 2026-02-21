import React from 'react';
import { Button } from '@/components/ui/Button';
import styles from './ParticipantListModal.module.css';

interface Participant {
    user_id: string;
    username: string;
    avatar_url: string | null;
    status: 'going' | 'interested';
}

interface ParticipantListModalProps {
    isOpen: boolean;
    onClose: () => void;
    participants: Participant[];
    title: string;
}

export function ParticipantListModal({ isOpen, onClose, participants, title }: ParticipantListModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{title}</h3>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.list}>
                    {participants.length > 0 ? (
                        participants.map((p) => (
                            <div key={p.user_id} className={styles.participantRow}>
                                <div className={styles.avatar}>
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} alt={p.username} />
                                    ) : (
                                        <span>👤</span>
                                    )}
                                </div>
                                <div className={styles.info}>
                                    <span className={styles.username}>{p.username}</span>
                                    <span className={`${styles.status} ${styles[p.status]}`}>
                                        {p.status === 'going' ? '✓ Going' : '⭐ Interested'}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={styles.emptyState}>No participants yet. Be the first to join!</p>
                    )}
                </div>

                <div className={styles.footer}>
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}
