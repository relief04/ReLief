"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';
import { useRealtimeLeaderboard } from '@/lib/useRealtime';

type RankingType = 'carbon_savings' | 'streak' | 'karma_points' | 'badges';

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    name: string;
    avatar_url: string | null;
    score: number;
    badge_count?: number;
    change?: number;
}

export default function LeaderboardPage() {
    const { user, isLoaded } = useUser();
    const [rankingType, setRankingType] = useState<RankingType>('carbon_savings');
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

    // Use real-time leaderboard hook
    const { leaderboard: realtimeData, loading } = useRealtimeLeaderboard(rankingType);

    // Memoize the formatted leaderboard to prevent infinite loops
    const leaderboard: LeaderboardEntry[] = useMemo(() => {
        const columnMap = {
            carbon_savings: 'carbon_savings',
            streak: 'streak',
            karma_points: 'balance',
            badges: 'badge_count'
        };
        const column = columnMap[rankingType];

        return realtimeData.map((entry: any, index) => ({
            rank: index + 1,
            user_id: entry.id,
            name: entry.username || 'Eco Warrior',
            avatar_url: entry.avatar_url,
            score: entry[column] || 0,
            badge_count: entry.badge_count || 0,
            change: 0
        }));
    }, [realtimeData, rankingType]);

    // Update user rank when leaderboard changes
    useEffect(() => {
        if (user && leaderboard.length > 0) {
            const userEntry = leaderboard.find(e => e.user_id === user.id);
            setUserRank(userEntry || null);
        }
    }, [user?.id, leaderboard]);

    if (!isLoaded || loading) {
        return (
            <div className={styles.container}>
                <div className="flex-center" style={{ height: '60vh' }}>
                    Loading leaderboard...
                </div>
            </div>
        );
    }

    const getScoreLabel = (type: RankingType): string => {
        switch (type) {
            case 'carbon_savings':
                return 'CO₂ Saved';
            case 'streak':
                return 'Day Streak';
            case 'karma_points':
                return 'Points';
            case 'badges':
                return 'Badges Earned';
        }
    };

    const formatScore = (score: number, type: RankingType): string => {
        switch (type) {
            case 'carbon_savings':
                return `${score.toFixed(1)} kg`;
            case 'streak':
                return `${score} days`;
            case 'karma_points':
                return `${score} KP`;
            case 'badges':
                return `${score} 🏅`;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    🏆 Global Leaderboard
                    <span className={styles.liveBadge}>● LIVE</span>
                </h1>
                <p className={styles.subtitle}>Real-time rankings updated instantly</p>
            </header>

            {/* Ranking Type Selector */}
            <div className={styles.typeSelector}>
                <button
                    className={`${styles.typeButton} ${rankingType === 'carbon_savings' ? styles.typeActive : ''}`}
                    onClick={() => setRankingType('carbon_savings')}
                >
                    🌍 Carbon Saved
                </button>
                <button
                    className={`${styles.typeButton} ${rankingType === 'streak' ? styles.typeActive : ''}`}
                    onClick={() => setRankingType('streak')}
                >
                    🔥 Streak
                </button>
                <button
                    className={`${styles.typeButton} ${rankingType === 'karma_points' ? styles.typeActive : ''}`}
                    onClick={() => setRankingType('karma_points')}
                >
                    💎 Points
                </button>
                <button
                    className={`${styles.typeButton} ${rankingType === 'badges' ? styles.typeActive : ''}`}
                    onClick={() => setRankingType('badges')}
                >
                    🏅 Badges
                </button>
            </div>

            {/* User's Current Rank */}
            {userRank && (
                <Card className={styles.userRankCard}>
                    <div className={styles.userRankContent}>
                        <span className={styles.userRankLabel}>Your Rank</span>
                        <div className={styles.userRankDetails}>
                            <span className={styles.userRankNumber}>#{userRank.rank}</span>
                            <span className={styles.userRankScore}>
                                {formatScore(userRank.score, rankingType)}
                            </span>
                        </div>
                    </div>
                </Card>
            )}

            {/* Leaderboard Table */}
            <Card className={styles.leaderboardCard}>
                <div className={styles.tableHeader}>
                    <span className={styles.headerRank}>Rank</span>
                    <span className={styles.headerUser}>User</span>
                    <span className={styles.headerScore}>{getScoreLabel(rankingType)}</span>
                </div>

                <div className={styles.tableBody}>
                    {leaderboard.map((entry) => (
                        <div
                            key={entry.user_id}
                            className={`${styles.tableRow} ${entry.user_id === user?.id ? styles.highlightRow : ''}`}
                        >
                            {/* Rank with Medal */}
                            <div className={styles.cellRank}>
                                {entry.rank === 1 && <span className={styles.medal}>🥇</span>}
                                {entry.rank === 2 && <span className={styles.medal}>🥈</span>}
                                {entry.rank === 3 && <span className={styles.medal}>🥉</span>}
                                {entry.rank > 3 && <span className={styles.rankNumber}>#{entry.rank}</span>}
                            </div>

                            {/* User */}
                            <div className={styles.cellUser}>
                                {entry.avatar_url ? (
                                    <img src={entry.avatar_url} alt={entry.name} className={styles.avatar} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {entry.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className={styles.userName}>
                                    {entry.name} {entry.user_id === user?.id && '(You)'}
                                </span>
                            </div>

                            {/* Score */}
                            <div className={styles.cellScore}>
                                {formatScore(entry.score, rankingType)}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
