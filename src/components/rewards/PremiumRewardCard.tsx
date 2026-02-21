import React from 'react';
import { Lock, Check, Clock, Zap, ArrowRight, ShieldCheck, TreePine, Ticket, Award } from 'lucide-react';
import { Reward } from '@/types/rewards'; // Assumes interfaces are here

interface RewardWithStatus extends Reward {
    status?: string; // 'Locked' | 'Claimable' | 'Owned' | 'Redeemed' | ...
    instanceId?: string;
    earnedDate?: string;
}

interface PremiumRewardCardProps {
    reward: RewardWithStatus;
    onClick: (reward: RewardWithStatus) => void;
    userPoints: number;
}

export default function PremiumRewardCard({ reward, onClick, userPoints }: PremiumRewardCardProps) {
    const { status, type, cost, name, description, rarity } = reward;

    const isLocked = status === 'Locked';
    const isClaimable = status === 'Claimable';
    const isOwned = status === 'Claimed' || status === 'Owned';
    const isRedeemed = status === 'Redeemed';

    // Rarity Color Logic
    const rarityColor = {
        Common: 'from-gray-400 to-gray-500',
        Rare: 'from-blue-400 to-cyan-500',
        Epic: 'from-purple-500 to-pink-500',
        Legendary: 'from-yellow-400 to-orange-500'
    }[rarity] || 'from-gray-400 to-gray-500';

    const rarityBorder = {
        Common: 'group-hover:border-gray-300',
        Rare: 'group-hover:border-blue-400',
        Epic: 'group-hover:border-purple-400',
        Legendary: 'group-hover:border-yellow-400'
    }[rarity] || 'group-hover:border-gray-300';

    // Status Visuals
    let statusBadge = null;
    let cardOverlay = null;

    if (isLocked) {
        cardOverlay = (
            <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4 transition-opacity duration-300 group-hover:backdrop-blur-none group-hover:bg-gray-100/30 dark:group-hover:bg-gray-900/40">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-2 shadow-sm">
                    <Lock size={18} className="text-gray-400" />
                </div>
                <span className="text-xs font-bold text-gray-500 bg-white/80 dark:bg-black/50 px-2 py-1 rounded-md mb-1">
                    {reward.unlockCondition || `${cost} KP required`}
                </span>
                {cost > 0 && cost > userPoints && (
                    <div className="w-24 h-1 bg-gray-300 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-gray-500" style={{ width: `${(userPoints / cost) * 100}%` }}></div>
                    </div>
                )}
            </div>
        );
    } else if (isClaimable) {
        statusBadge = (
            <div className="absolute top-3 right-3 z-20 animate-bounce-slow">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-bold shadow-lg shadow-orange-500/30 uppercase tracking-widest flex items-center gap-1">
                    <Zap size={10} fill="currentColor" /> Claim
                </span>
            </div>
        );
    } else if (isRedeemed) {
        statusBadge = (
            <div className="absolute top-3 right-3 z-20">
                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 text-xs font-semibold flex items-center gap-1">
                    <Check size={12} /> Redeemed
                </span>
            </div>
        );
    } else if (isOwned) {
        statusBadge = (
            <div className="absolute top-3 right-3 z-20">
                <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-semibold flex items-center gap-1">
                    Owned
                </span>
            </div>
        );
    }

    // Icon Selection
    const Icon = {
        'Badge': ShieldCheck,
        'Profile Border': Award,
        'Tree Donation': TreePine,
        'Event Access': Ticket,
        'Certificate': Award, // Default fallback could be Gift
        'Streak Revive': Zap,
        'Quiz Reward': Award
    }[type] || Award; // Fallback

    return (
        <div
            onClick={() => onClick(reward)}
            className={`
                group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 
                overflow-hidden transition-all duration-300 cursor-pointer
                ${isClaimable ? 'ring-2 ring-yellow-400/50 hover:ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.15)] hover:shadow-[0_0_25px_rgba(250,204,21,0.25)] hover:-translate-y-1' : ''}
                ${isLocked ? 'hover:border-gray-300 dark:hover:border-gray-700' : 'hover:-translate-y-1 hover:shadow-xl'}
                ${isRedeemed ? 'opacity-80 grayscale-[0.5]' : ''}
            `}
        >
            {/* Status Overlays */}
            {cardOverlay}
            {statusBadge}

            {/* Card Content */}
            <div className="p-5 flex flex-col h-full">
                {/* Header: Icon + Rarity Strip */}
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${rarityColor} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={24} />
                    </div>
                </div>

                {/* Text Info */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r ${rarityColor}`}>
                            {rarity}
                        </span>
                        <span className="text-gray-300 text-[10px]">•</span>
                        <span className="text-gray-400 text-[10px] uppercase font-semibold">{type}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Footer: Price / CTA */}
                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1">
                        {cost > 0 ? (
                            <>
                                <span className="text-yellow-500">💎</span> {cost}
                            </>
                        ) : 'Free'}
                    </span>

                    {/* Hover Arrow Indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 group-hover:text-purple-600`}>
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Rarity Bottom Line */}
            <div className={`h-1 w-full bg-gradient-to-r ${rarityColor} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        </div>
    );
}
