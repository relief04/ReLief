'use client';

import React, { useState, useEffect } from 'react';
import { X, Gift, Star, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import RewardCard from './RewardCard';
import { Reward, RewardStatus } from '@/types/rewards';
import { supabase } from '@/lib/supabaseClient';

interface RewardsWalletProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function RewardsWallet({ isOpen, onClose, userId }: RewardsWalletProps) {
    const { toast } = useToast();
    const [rewards, setRewards] = useState<(Reward & { status: RewardStatus })[]>([]);
    const [userPoints, setUserPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'All' | 'Unlocked' | 'Claimable' | 'Redeemed'>('All');

    useEffect(() => {
        if (isOpen && userId) {
            fetchRewards();
        }
    }, [isOpen, userId]);

    const fetchRewards = async () => {
        try {
            setLoading(true);

            // 1. Fetch User Points
            const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
            if (profile) setUserPoints(profile.balance);

            // 2. Fetch User Rewards (Joined with Rewards Reference)
            // Note: Supabase JS simple join is tricky without knowing implementation, so fetching separately for safety.

            const { data: myRewards, error: myError } = await supabase
                .from('user_rewards')
                .select('*')
                .eq('user_id', userId);

            if (myError) throw myError;

            if (myRewards && myRewards.length > 0) {
                const rewardIds = myRewards.map(mr => mr.reward_id);
                const { data: rewardDetails } = await supabase.from('rewards').select('*').in('id', rewardIds);

                const combined = myRewards.map(mr => {
                    const detail = rewardDetails?.find(r => r.id === mr.reward_id);
                    if (!detail) return null;
                    return {
                        ...detail,
                        status: mr.status === 'Redeemed' ? 'Redeemed' : 'Claimed' // Map 'Unlocked' to Claimed for wallet view as they are owned
                    };
                }).filter(Boolean) as (Reward & { status: RewardStatus })[];

                setRewards(combined);
            } else {
                setRewards([]);
            }

        } catch (error) {
            console.error("Failed to fetch rewards", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (rewardId: number, action: 'purchase' | 'claim' | 'redeem') => {
        setProcessingId(String(rewardId));
        try {
            if (action === 'redeem') {
                // Update status
                const { error } = await supabase
                    .from('user_rewards')
                    .update({ status: 'Redeemed' })
                    .eq('user_id', userId)
                    .eq('reward_id', Number(rewardId)); // Type safety

                if (error) throw error;

                // Update local state
                setRewards(prev => prev.map(r => r.id === rewardId ? { ...r, status: 'Redeemed' } : r));
            }
        } catch (error) {
            console.error("Action error", error);
            toast("Action failed", "error");
        } finally {
            setProcessingId(null);
        }
    };

    // Filter Logic
    const filteredRewards = rewards.filter(r => {
        if (filter === 'All') return true;
        if (filter === 'Unlocked') return r.status === 'Unlocked' || r.status === 'Claimed';
        if (filter === 'Claimable') return r.status === 'Unlocked' || r.status === 'Claimed'; // Ambiguity in naming
        if (filter === 'Redeemed') return r.status === 'Redeemed';
        return true;
    });

    const collectedCount = rewards.filter(r => r.status === 'Claimed' || r.status === 'Redeemed').length;
    const availableCount = rewards.filter(r => r.status === 'Unlocked').length; // Likely 0 if we map Unlocked->Claimed

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rewards Wallet</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your earnings and exclusive perks</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white dark:bg-gray-900">
                    <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30">
                        <div className="flex items-center gap-3 mb-1">
                            <Star className="text-yellow-500" size={18} />
                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Points</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{userPoints} KP</div>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                        <div className="flex items-center gap-3 mb-1">
                            <Gift className="text-green-500" size={18} />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">Collected</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{collectedCount}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-center gap-3 mb-1">
                            <CheckCircle className="text-blue-500" size={18} />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Available</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{availableCount}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-gray-100 dark:border-gray-800 flex gap-6 overflow-x-auto">
                    {(['All', 'Unlocked', 'Claimable', 'Redeemed'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`
                                py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                ${filter === tab
                                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}
                            `}
                        >
                            {tab === 'Unlocked' ? 'Owned' : tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : filteredRewards.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No rewards found in this category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRewards.map(reward => (
                                <RewardCard
                                    key={reward.id}
                                    reward={reward}
                                    view="wallet"
                                    onAction={handleAction}
                                    isProcessing={processingId === String(reward.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
