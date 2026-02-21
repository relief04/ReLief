import React from 'react';
import { Badge, BadgeCategory, BadgeRarity } from '@/lib/badges';
import { BadgeCard } from './BadgeCard';
import styles from './BadgeGrid.module.css';

interface BadgeGridProps {
    badges: Badge[];
    earnedBadgeIds: Set<string>;
    badgeProgress?: Map<string, number>; // badge_id -> progress percentage
    filter?: {
        category?: BadgeCategory;
        rarity?: BadgeRarity;
        showEarned?: boolean;
        showLocked?: boolean;
    };
    onBadgeClick?: (badge: Badge) => void;
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({
    badges,
    earnedBadgeIds,
    badgeProgress = new Map(),
    filter = {},
    onBadgeClick
}) => {
    // Apply filters
    let filteredBadges = badges;

    if (filter.category) {
        filteredBadges = filteredBadges.filter(b => b.category === filter.category);
    }

    if (filter.rarity) {
        filteredBadges = filteredBadges.filter(b => b.rarity === filter.rarity);
    }

    if (filter.showEarned !== undefined || filter.showLocked !== undefined) {
        filteredBadges = filteredBadges.filter(b => {
            const isEarned = earnedBadgeIds.has(b.id);
            if (filter.showEarned === false && isEarned) return false;
            if (filter.showLocked === false && !isEarned) return false;
            return true;
        });
    }

    // Sort: earned first, then by rarity
    const sortedBadges = [...filteredBadges].sort((a, b) => {
        const aEarned = earnedBadgeIds.has(a.id);
        const bEarned = earnedBadgeIds.has(b.id);

        if (aEarned && !bEarned) return -1;
        if (!aEarned && bEarned) return 1;

        const rarityOrder: Record<BadgeRarity, number> = {
            legendary: 4,
            epic: 3,
            rare: 2,
            common: 1
        };

        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    });

    if (sortedBadges.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p className={styles.emptyIcon}>🏆</p>
                <p className={styles.emptyText}>No badges match your filters</p>
            </div>
        );
    }

    return (
        <div className={styles.badgeGrid}>
            {sortedBadges.map(badge => (
                <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isEarned={earnedBadgeIds.has(badge.id)}
                    progress={badgeProgress.get(badge.id) || 0}
                    onClick={() => onBadgeClick?.(badge)}
                    size="md"
                />
            ))}
        </div>
    );
};
