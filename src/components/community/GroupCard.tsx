import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './GroupCard.module.css';

interface GroupCardProps {
    group: {
        id: string;
        name: string;
        description: string;
        group_type: string;
        avatar_url: string | null;
        member_count: number;
        is_private: boolean;
        is_member?: boolean;
    };
    onJoin: (groupId: string) => void;
    onLeave: (groupId: string) => void;
    onDelete?: (groupId: string) => void;
}

export function GroupCard({ group, onJoin, onLeave, onDelete }: GroupCardProps) {
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        setLoading(true);
        await onJoin(group.id);
        setLoading(false);
    };

    const handleLeave = async () => {
        setLoading(true);
        await onLeave(group.id);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (onDelete) {
            setLoading(true);
            await onDelete(group.id);
            setLoading(false);
        }
    };

    const getGroupIcon = (type: string) => {
        switch (type) {
            case 'school': return '🏫';
            case 'corporate': return '🏢';
            case 'neighborhood': return '🏘️';
            default: return '👥';
        }
    };

    return (
        <Card className={styles.groupCard} padding="none">
            <div className={styles.groupHeader}>
                <div className={styles.avatar}>
                    {group.avatar_url ? (
                        <img src={group.avatar_url} alt={group.name} />
                    ) : (
                        getGroupIcon(group.group_type)
                    )}
                </div>
                <div className={styles.groupInfo}>
                    <h4>{group.name}</h4>
                    <span className={styles.groupType}>
                        {group.is_private ? '🔒 ' : '🌐 '}{group.group_type}
                    </span>
                </div>
            </div>

            <p className={styles.description}>{group.description}</p>

            <div className={styles.groupFooter}>
                <div className={styles.stats}>
                    <span>👥 {group.member_count} members</span>
                </div>

                <div className={styles.actions}>
                    {onDelete && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDelete}
                            disabled={loading}
                            style={{ color: 'red', marginRight: '0.5rem' }}
                        >
                            🗑️
                        </Button>
                    )}

                    {group.is_member ? (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleLeave}
                            disabled={loading}
                        >
                            {loading ? 'Leaving...' : 'Leave'}
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={handleJoin}
                            disabled={loading}
                        >
                            {loading ? 'Joining...' : 'Join Group'}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
