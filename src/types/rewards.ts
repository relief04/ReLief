export type RewardType = 'Badge' | 'Profile Border' | 'Tree Donation' | 'Event Access' | 'Certificate' | 'Quiz Reward' | 'Streak Revive';

export type RewardStatus = 'Locked' | 'Unlocked' | 'Claimable' | 'Claimed' | 'Redeemed' | 'Expired';

export type RewardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Reward {
    id: number;
    name: string; // Mapped from title in Supabase? Need to check
    title?: string;
    description: string;
    cost: number; // 0 if it's an achievement reward
    type: RewardType;
    rarity: RewardRarity;
    isPurchasable: boolean;
    unlockCondition?: string; // e.g. "streak_7", "quiz_level_3"
    validityDays?: number; // How many days it stays valid after unlocking/purchasing
    partnerInfo?: {
        name: string;
        website?: string;
    };
}

export interface UserReward {
    id: number; // Unique instance ID
    userId: string;
    rewardId: number;
    status: RewardStatus;
    earnedDate: string;
    expiryDate?: string;
    redeemedDate?: string;
    source: 'Store' | 'Achievement';
}

export interface RewardTransaction {
    id: string;
    userId: string;
    rewardId: string;
    action: 'Purchase' | 'Claim' | 'Redeem' | 'Expire';
    cost: number;
    timestamp: string;
}

export interface KarmaLedger {
    id: string;
    userId: string;
    amount: number; // Positive for earning, Negative for spending
    event: string; // "Reward Purchase", "Daily Streak", "Quiz Complete"
    timestamp: string;
}
