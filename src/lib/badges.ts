import { supabase } from './supabaseClient';

// Badge System - Type Definitions and Badge Data
export type BadgeCategory = 'carbon' | 'streak' | 'community' | 'action' | 'milestone';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type RequirementType =
    | 'activities_count'
    | 'carbon_saved'
    | 'streak_days'
    | 'teams_joined'
    | 'teams_created'
    | 'challenges_completed'
    | 'shares_count'
    | 'bike_commutes'
    | 'transit_uses'
    | 'zero_waste_days'
    | 'plant_based_meals'
    | 'energy_reductions'
    | 'water_savings'
    | 'badges_earned'
    | 'quizzes_completed'
    | 'items_redeemed'
    | 'karma_earned'
    | 'aqi_checks'
    | 'relax_sessions'
    | 'user_rank'
    | 'late_night_log'
    | 'early_morning_log'
    | 'countries_logged'
    | 'perfect_quizzes'
    | 'helped_friends'
    | 'bills_count'
    | 'team_top_rank';

export interface Badge {
    id: string;
    name: string;
    description: string;
    category: BadgeCategory;
    icon: string;
    requirement_type: RequirementType;
    requirement_value: number;
    rarity: BadgeRarity;
    karma_reward: number;
    created_at?: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    earned_at: string;
    progress: number;
    badge?: Badge; // Populated from join
}

export interface BadgeProgress {
    badge: Badge;
    current: number;
    required: number;
    percentage: number;
    isEarned: boolean;
}

// Badge UI Helpers
export const RARITY_COLORS: Record<BadgeRarity, { bg: string; border: string; text: string; glow: string }> = {
    common: {
        bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        border: '#81c784',
        text: '#2e7d32',
        glow: 'rgba(129, 199, 132, 0.3)'
    },
    rare: {
        bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        border: '#64b5f6',
        text: '#1976d2',
        glow: 'rgba(100, 181, 246, 0.3)'
    },
    epic: {
        bg: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
        border: '#ba68c8',
        text: '#7b1fa2',
        glow: 'rgba(186, 104, 200, 0.3)'
    },
    legendary: {
        bg: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
        border: '#ffd54f',
        text: '#f57f17',
        glow: 'rgba(255, 213, 79, 0.4)'
    }
};

export const CATEGORY_INFO: Record<BadgeCategory, { label: string; icon: string; color: string }> = {
    carbon: { label: 'Carbon Reduction', icon: '🌍', color: '#2e7d32' },
    streak: { label: 'Consistency', icon: '🔥', color: '#ef6c00' },
    community: { label: 'Community', icon: '🤝', color: '#1976d2' },
    action: { label: 'Actions', icon: '⚡', color: '#7b1fa2' },
    milestone: { label: 'Milestones', icon: '🏆', color: '#f57f17' }
};

// Server functions have been moved to badgesServer.ts

// Helper functions
export function calculateBadgeProgress(badge: Badge, userStats: Record<string, number>): BadgeProgress {
    const current = userStats[badge.requirement_type] || 0;
    const required = badge.requirement_value;
    const percentage = Math.min((current / required) * 100, 100);
    const isEarned = current >= required;

    return { badge, current, required, percentage, isEarned };
}

export function checkBadgeEligibility(badge: Badge, userStats: Record<string, number>): boolean {
    const current = userStats[badge.requirement_type] || 0;
    return current >= badge.requirement_value;
}

export function formatBadgeProgress(progress: BadgeProgress): string {
    if (progress.isEarned) return 'Earned!';
    const { current, required, badge } = progress;
    switch (badge.requirement_type) {
        case 'carbon_saved': return `${current.toFixed(1)} / ${required} kg CO₂`;
        case 'streak_days': return `${current} / ${required} days`;
        case 'activities_count': return `${current} / ${required} actions`;
        case 'karma_earned': return `${current} / ${required} KP`;
        default: return `${current} / ${required}`;
    }
}

export interface UserStatsForBadges {
    activities_count: number;
    carbon_saved: number;
    streak_days: number;
    teams_joined: number;
    teams_created: number;
    challenges_completed: number;
    shares_count: number;
    badges_earned: number;
    karma_earned: number;
    [key: string]: number;
}

export function sortBadges(badges: Badge[], criterion: 'rarity' | 'name' | 'category' = 'rarity'): Badge[] {
    const rarityOrder: Record<BadgeRarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };
    switch (criterion) {
        case 'rarity': return [...badges].sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
        case 'name': return [...badges].sort((a, b) => a.name.localeCompare(b.name));
        case 'category': return [...badges].sort((a, b) => a.category.localeCompare(b.category));
        default: return badges;
    }
}

export function filterBadges(badges: Badge[], filters: { category?: BadgeCategory; rarity?: BadgeRarity; search?: string; }): Badge[] {
    let filtered = badges;
    if (filters.category) filtered = filtered.filter(b => b.category === filters.category);
    if (filters.rarity) filtered = filtered.filter(b => b.rarity === filters.rarity);
    if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(b => b.name.toLowerCase().includes(query) || b.description.toLowerCase().includes(query));
    }
    return filtered;
}
