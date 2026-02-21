import React from 'react';
import { X, ShieldCheck, TreePine, Ticket, Award, Zap, Lock as LockIcon } from 'lucide-react';
import { Reward } from '@/types/rewards';

interface RewardWithStatus extends Reward {
    status?: string;
    instanceId?: string;
    earnedDate?: string;
}

interface RewardDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    reward: RewardWithStatus | null;
    onAction: (rewardId: number, action: 'purchase' | 'claim' | 'redeem') => void;
    isProcessing: boolean;
    userPoints: number;
}

export default function RewardDetailsDrawer({ isOpen, onClose, reward, onAction, isProcessing, userPoints }: RewardDetailsDrawerProps) {
    if (!isOpen || !reward) return null;

    const { status, type, cost, name, description, rarity, validityDays, unlockCondition } = reward;
    const isLocked = status === 'Locked';
    const isClaimable = status === 'Claimable';
    const isOwned = status === 'Claimed' || status === 'Owned';
    const isRedeemed = status === 'Redeemed';

    const Icon = (({
        'Badge': ShieldCheck,
        'Profile Border': Award,
        'Tree Donation': TreePine,
        'Event Access': Ticket,
        'Certificate': Award,
        'Streak Revive': Zap
    } as any)[type]) || Award;

    const rarityColor = {
        Common: 'bg-gray-500',
        Rare: 'bg-blue-500',
        Epic: 'bg-purple-500',
        Legendary: 'bg-gradient-to-r from-yellow-500 to-orange-500'
    }[rarity] || 'bg-gray-500';

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-all animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-10 fade-in zoom-in-95 border border-gray-200 dark:border-gray-800 overflow-hidden">

                {/* Header Image/Banner Area */}
                <div className="h-32 bg-gray-100 dark:bg-gray-800 relative flex items-center justify-center overflow-hidden">
                    <div className={`absolute top-0 w-full h-1 ${rarityColor}`}></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <Icon size={64} className="text-gray-300 dark:text-gray-700 opacity-20 absolute scale-150 rotate-12" />

                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-gray-500 transition-colors z-10">
                        <X size={20} />
                    </button>

                    <div className={`w-20 h-20 rounded-2xl ${rarityColor} shadow-xl flex items-center justify-center text-white relative z-0`}>
                        <Icon size={40} />
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1 block">{rarity} • {type}</span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{name}</h2>
                        </div>
                        {cost > 0 && (
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold px-3 py-1 rounded-lg text-sm">
                                💎 {cost}
                            </div>
                        )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                        {description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {validityDays && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Validity</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{validityDays} Days</div>
                            </div>
                        )}
                        {unlockCondition && isLocked && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 col-span-2">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">How to Unlock</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <LockIcon size={14} /> {unlockCondition}
                                </div>
                            </div>
                        )}
                        {reward.earnedDate && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Earned On</div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{new Date(reward.earnedDate).toLocaleDateString()}</div>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="w-full">
                        {isLocked ? (
                            <button disabled className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 font-bold cursor-not-allowed">
                                Locked
                            </button>
                        ) : isClaimable ? (
                            <button
                                onClick={() => onAction(reward.id, reward.cost > 0 ? 'purchase' : 'claim')}
                                disabled={isProcessing}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isProcessing ? 'Processing...' : reward.cost > 0 ? `Claim Reward (-${cost} KP)` : 'Claim Achievement'}
                            </button>
                        ) : isOwned ? (
                            <button
                                onClick={() => onAction(reward.id, 'redeem')}
                                disabled={isProcessing}
                                className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                            >
                                {isProcessing ? 'Redeeming...' : 'Redeem Now'}
                            </button>
                        ) : isRedeemed ? (
                            <div className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-green-600 dark:text-green-500 font-bold flex items-center justify-center gap-2">
                                <ShieldCheck size={18} /> Redeemed Successfully
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
