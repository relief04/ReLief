import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Modal } from '@/components/ui/Modal';
import { Award, Loader2 } from 'lucide-react';
import styles from './PointsHistoryModal.module.css';

interface PointsHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

interface PointHistoryEntry {
    id: string;
    amount: number;
    action: string;
    source: string;
    created_at: string;
}

export function PointsHistoryModal({ isOpen, onClose, userId }: PointsHistoryModalProps) {
    const [history, setHistory] = useState<PointHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPoints, setTotalPoints] = useState(0);

    useEffect(() => {
        if (!isOpen || !userId) return;

        async function fetchHistory() {
            setLoading(true);
            try {
                // Fetch user balance
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('balance')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    setTotalPoints(profile.balance || 0);
                }

                // Fetch history
                const { data, error } = await supabase
                    .from('points_history')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) {
                    // Suppress error if table doesn't exist yet while running tests locally
                    if (!error.message.includes('relation "points_history" does not exist')) {
                        console.error('Error fetching points history:', error);
                    }
                } else {
                    setHistory(data || []);
                }
            } catch (error) {
                console.error('Unexpected error fetching points history:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [isOpen, userId]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Points History">
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.totalBadge}>
                        <Award className={styles.headerIcon} />
                        <div>
                            <div className={styles.totalLabel}>Current Balance</div>
                            <div className={styles.totalValue}>{totalPoints} KP</div>
                        </div>
                    </div>
                </div>

                <div className={styles.listContainer}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <Loader2 className={styles.spinner} />
                            <p>Loading your history...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No points history found yet.</p>
                            <span className={styles.emptySubtext}>Complete quizzes, log footprints, or scan bills to earn points!</span>
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {history.map((entry) => (
                                <div key={entry.id} className={styles.historyItem}>
                                    <div className={styles.itemDetails}>
                                        <div className={styles.itemAction}>{entry.action}</div>
                                        <div className={styles.itemMeta}>
                                            <span className={styles.itemSource}>{entry.source}</span>
                                            <span className={styles.dot}>•</span>
                                            <span className={styles.itemDate}>
                                                {new Date(entry.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.itemAmount}>
                                        +{entry.amount} <span className={styles.kp}>KP</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
