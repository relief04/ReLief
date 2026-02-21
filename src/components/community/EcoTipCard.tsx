import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import styles from './EcoTipCard.module.css';

interface EcoTipCardProps {
    tip: {
        id: number;
        title: string;
        content: string;
        category: string;
        upvotes: number;
        downvotes: number;
        author_name?: string;
        user_vote?: 'up' | 'down' | null;
    };
    onVote: (tipId: number, voteType: 'up' | 'down') => void;
    onDelete?: (tipId: number) => void;
}

export function EcoTipCard({ tip, onVote, onDelete }: EcoTipCardProps) {
    const { confirm } = useToast();
    const [voting, setVoting] = useState(false);

    const handleVote = async (voteType: 'up' | 'down') => {
        setVoting(true);
        await onVote(tip.id, voteType);
        setVoting(false);
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'energy': return '⚡';
            case 'transport': return '🚗';
            case 'food': return '🍎';
            case 'waste': return '♻️';
            case 'water': return '💧';
            default: return '🌱';
        }
    };

    const score = tip.upvotes - tip.downvotes;

    return (
        <Card className={styles.tipCard}>
            <div className={styles.tipHeader}>
                <span className={styles.categoryBadge}>
                    {getCategoryIcon(tip.category)} {tip.category}
                </span>
                <div className={styles.voteScore}>
                    <span className={score > 0 ? styles.positive : score < 0 ? styles.negative : ''}>
                        {score > 0 ? '+' : ''}{score}
                    </span>
                </div>
            </div>

            <h4 className={styles.tipTitle}>{tip.title}</h4>
            <p className={styles.tipContent}>{tip.content}</p>

            {tip.author_name && (
                <div className={styles.tipAuthor}>
                    Shared by {tip.author_name}
                </div>
            )}

            {onDelete && (
                <div className={styles.deleteAction}>
                    <button
                        onClick={async () => {
                            const confirmed = await confirm({
                                title: 'Delete Eco Tip',
                                message: 'Are you sure you want to delete this tip?',
                                danger: true,
                                confirmLabel: 'Delete',
                                cancelLabel: 'Cancel'
                            });
                            if (confirmed) onDelete(tip.id);
                        }}
                        className={styles.deleteBtn}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', marginTop: '0.5rem' }}
                    >
                        🗑️ Delete Tip
                    </button>
                </div>
            )}

            <div className={styles.tipActions}>
                <button
                    className={`${styles.voteBtn} ${tip.user_vote === 'up' ? styles.voted : ''}`}
                    onClick={() => handleVote('up')}
                    disabled={voting}
                >
                    👍 {tip.upvotes}
                </button>
                <button
                    className={`${styles.voteBtn} ${tip.user_vote === 'down' ? styles.voted : ''}`}
                    onClick={() => handleVote('down')}
                    disabled={voting}
                >
                    👎 {tip.downvotes}
                </button>
            </div>
        </Card>
    );
}
