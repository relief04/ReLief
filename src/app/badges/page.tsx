"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Badge, BadgeCategory, BadgeRarity, CATEGORY_INFO } from '@/lib/badges';
import { BadgeGrid } from '@/components/badges/BadgeGrid';
import { supabase } from '@/lib/supabaseClient';
import { useRefresh } from '@/context/RefreshContext';
import styles from './page.module.css';

type FilterTab = 'all' | 'earned' | 'locked';

export default function BadgesPage() {
    const { user, isLoaded } = useUser();
    const { refreshKey } = useRefresh();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
    const [badgeProgress, setBadgeProgress] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterTab, setFilterTab] = useState<FilterTab>('all');
    const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | ''>('');
    const [rarityFilter, setRarityFilter] = useState<BadgeRarity | ''>('');

    useEffect(() => {
        async function fetchBadges() {
            if (!user) return;

            try {
                // Fetch all badges
                const { data: allBadges, error: badgesError } = await supabase
                    .from('badges')
                    .select('*')
                    .order('rarity', { ascending: false });

                if (badgesError) throw badgesError;

                // Fetch user's earned badges
                const { data: userBadges, error: userBadgesError } = await supabase
                    .from('user_badges')
                    .select('badge_id, progress')
                    .eq('user_id', user.id);

                if (userBadgesError) throw userBadgesError;

                // Create sets and maps
                const earnedIds = new Set<string>((userBadges?.map((ub: { badge_id: string; progress: number }) => ub.badge_id) || []));
                const progressMap = new Map<string, number>(
                    userBadges?.map((ub: { badge_id: string; progress: number }) => [ub.badge_id, ub.progress || 0] as [string, number]) || []
                );

                setBadges(allBadges || []);
                setEarnedBadgeIds(earnedIds);
                setBadgeProgress(progressMap);
            } catch (error) {
                console.error('Error fetching badges:', error);
            } finally {
                setLoading(false);
            }
        }

        if (isLoaded) {
            fetchBadges();
        }
    }, [user, isLoaded, refreshKey]);

    if (!isLoaded || loading) {
        return (
            <div className={styles.container}>
                <div className="flex-center" style={{ height: '60vh' }}>
                    Loading badges...
                </div>
            </div>
        );
    }

    const earnedCount = earnedBadgeIds.size;
    const totalCount = badges.length;
    const progressPercentage = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

    return (
        <div className={styles.container}>
            <div className={styles.topNav}>
                <Link href="/profile" className={styles.backLink}>
                    &larr; Back to Profile
                </Link>
            </div>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>Your Achievements</h1>
                <p className={styles.subtitle}>Collect badges by completing eco-actions and milestones</p>

                {/* Overall Progress */}
                <div className={styles.overallProgress}>
                    <div className={styles.progressInfo}>
                        <span className={styles.progressLabel}>Collection Progress</span>
                        <span className={styles.progressValue}>
                            {earnedCount} / {totalCount} Badges
                        </span>
                    </div>
                    <div className={styles.progressBarLarge}>
                        <div
                            className={styles.progressFillLarge}
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <span className={styles.progressPercentage}>
                        {progressPercentage.toFixed(1)}% Complete
                    </span>
                </div>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                {/* Tab Filters */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${filterTab === 'all' ? styles.tabActive : ''}`}
                        onClick={() => setFilterTab('all')}
                    >
                        All Badges ({totalCount})
                    </button>
                    <button
                        className={`${styles.tab} ${filterTab === 'earned' ? styles.tabActive : ''}`}
                        onClick={() => setFilterTab('earned')}
                    >
                        Earned ({earnedCount})
                    </button>
                    <button
                        className={`${styles.tab} ${filterTab === 'locked' ? styles.tabActive : ''}`}
                        onClick={() => setFilterTab('locked')}
                    >
                        Locked ({totalCount - earnedCount})
                    </button>
                </div>

                {/* Category & Rarity Filters */}
                <div className={styles.filterSelects}>
                    <select
                        className={styles.select}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as BadgeCategory | '')}
                    >
                        <option value="">All Categories</option>
                        {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                            <option key={key} value={key}>
                                {info.icon} {info.label}
                            </option>
                        ))}
                    </select>

                    <select
                        className={styles.select}
                        value={rarityFilter}
                        onChange={(e) => setRarityFilter(e.target.value as BadgeRarity | '')}
                    >
                        <option value="">All Rarities</option>
                        <option value="common">Common</option>
                        <option value="rare">Rare</option>
                        <option value="epic">Epic</option>
                        <option value="legendary">Legendary</option>
                    </select>
                </div>
            </div>

            {/* Badge Grid */}
            <BadgeGrid
                badges={badges}
                earnedBadgeIds={earnedBadgeIds}
                badgeProgress={badgeProgress}
                filter={{
                    category: categoryFilter || undefined,
                    rarity: rarityFilter || undefined,
                    showEarned: filterTab === 'locked' ? false : undefined,
                    showLocked: filterTab === 'earned' ? false : undefined
                }}
                onBadgeClick={(badge) => {
                    console.log('Badge clicked:', badge);
                }}
            />
        </div>
    );
}
