import React from 'react';
import { Gift, Lock, CheckCircle2, Star, AlertCircle, Clock } from 'lucide-react';
import { Reward, RewardStatus } from '@/types/rewards';

interface RewardCardProps {
    reward: Reward & { status?: string; instanceId?: string }; // status string to accommodate 'App Store' statuses
    view: 'store' | 'wallet' | 'history';
    onAction: (rewardId: number, action: 'purchase' | 'claim' | 'redeem') => void;
    isProcessing: boolean;
}

export default function RewardCard({ reward, view, onAction, isProcessing }: RewardCardProps) {
    // Helper to determine display state
    const isOwned = reward.status === 'Owned' || reward.status === 'Claimed' || reward.status === 'Redeemed';
    const isLocked = reward.status === 'Locked';
    const isRedeemed = reward.status === 'Redeemed';
    const isUnlockable = reward.status === 'Unlockable' || reward.status === 'Claimable'; // Purchasable or Claimable

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'border-yellow-500 shadow-yellow-500/20 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/10';
            case 'Epic': return 'border-purple-500 shadow-purple-500/20 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/10';
            case 'Rare': return 'border-blue-500 shadow-blue-500/20 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/10';
            default: return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
        }
    };

    return (
        <div className={`
            relative flex flex-col p-4 rounded-xl border transition-all duration-300
            ${getRarityColor(reward.rarity)}
            ${isLocked ? 'opacity-70 contrast-75' : 'hover:-translate-y-1 hover:shadow-lg'}
        `}>
            {/* Rarity Badge */}
            <div className={`
                absolute top-2 right-2 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full text-white shadow-sm
                ${reward.rarity === 'Legendary' ? 'bg-yellow-500' :
                    reward.rarity === 'Epic' ? 'bg-purple-500' :
                        reward.rarity === 'Rare' ? 'bg-blue-500' : 'bg-gray-500'}
            `}>
                {reward.rarity}
            </div>

            {/* Icon / Image Placeholder */}
            <div className="h-28 w-full bg-gray-100 dark:bg-gray-700/50 rounded-lg mb-4 flex items-center justify-center text-gray-400 overflow-hidden relative group">
                {isLocked ? (
                    <Lock size={32} />
                ) : (
                    <Gift size={32} className={`
                        transition-transform duration-500 group-hover:scale-110
                        ${isOwned ? 'text-green-500' : 'text-blue-500'}
                    `} />
                )}
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight">{reward.name}</h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5em]">
                {reward.description}
            </p>

            {/* Meta Info */}
            <div className="flex flex-col gap-1 mb-4 text-xs">
                {reward.validityDays && (
                    <div className="flex items-center text-gray-500">
                        <Clock size={12} className="mr-1" />
                        Valid for {reward.validityDays} days
                    </div>
                )}
                {reward.partnerInfo && (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                        <Star size={12} className="mr-1" />
                        Partner: {reward.partnerInfo.name}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                {/* Price / Unlock Condition Label */}
                <div className="text-sm font-semibold">
                    {reward.isPurchasable ? (
                        <span className="flex items-center text-yellow-600 dark:text-yellow-500">
                            <span className="mr-1">💎</span> {reward.cost} KP
                        </span>
                    ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-xs italic">
                            {reward.unlockCondition ? `Unlock: ${reward.unlockCondition}` : 'Achievement'}
                        </span>
                    )}
                </div>

                {/* Primary Action Button */}
                {view === 'store' && (
                    <button
                        onClick={() => onAction(reward.id, 'purchase')}
                        disabled={isOwned || isLocked || isProcessing}
                        className={`
                            px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                            ${isOwned
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : isLocked
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md hover:shadow-lg hover:from-yellow-400 hover:to-orange-400'
                            }
                        `}
                    >
                        {isOwned ? 'Purchased' : 'Buy'}
                    </button>
                )}

                {view === 'wallet' && (
                    <>
                        {isRedeemed ? (
                            <span className="flex items-center text-gray-400 text-xs font-bold cursor-default">
                                <CheckCircle2 size={14} className="mr-1" /> Used
                            </span>
                        ) : (
                            <button
                                onClick={() => onAction(reward.id, reward.status === 'Claimable' ? 'claim' : 'redeem')}
                                disabled={isRedeemed || isProcessing}
                                className={`
                                    px-4 py-1.5 rounded-lg text-xs font-bold transition-all
                                    ${reward.status === 'Claimable'
                                        ? 'bg-blue-600 text-white hover:bg-blue-500 pulse-animation'
                                        : 'bg-green-600 text-white hover:bg-green-500'
                                    }
                                `}
                            >
                                {reward.status === 'Claimable' ? 'Claim' : 'Redeem'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
