'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    ArrowLeft, Loader2, Trophy, TreePine, Gift, Star, CheckCircle2, Lock, Sparkles, MapPin, Ticket
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Reward } from '@/types/rewards';
import RewardDetailsDrawer from '@/components/rewards/RewardDetailsDrawer';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/context/ToastContext';
import { useRefresh } from '@/context/RefreshContext';
import styles from './page.module.css';

// Basic types to match API response
interface RewardWithStatus extends Reward {
    status?: string;
    instanceId?: string;
    earnedDate?: string;
    redeemedDate?: string;
}

export default function RewardsPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [userPoints, setUserPoints] = useState(0);
    const { refreshKey, triggerRefresh } = useRefresh();

    // UI State
    const [filterTab, setFilterTab] = useState<'All' | 'Claimable' | 'Owned' | 'Redeemed' | 'Locked'>('All');
    const [selectedReward, setSelectedReward] = useState<RewardWithStatus | null>(null);

    // Data State
    const [rewards, setRewards] = useState<RewardWithStatus[]>([]);
    const [stats, setStats] = useState({ totalCollected: 0, totalClaimable: 0, totalRedeemed: 0 });
    const [dataLoading, setDataLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, refreshKey]);

    const fetchData = async () => {
        if (!user) return;
        try {
            setDataLoading(true);

            // 0. Fetch User Points
            const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
            if (profile) setUserPoints(profile.balance);

            // 1. Fetch available rewards
            const { data: allRewards, error: rError } = await supabase.from('rewards').select('*');
            if (rError) throw rError;

            // 2. Fetch user's held rewards
            const { data: userRewards, error: urError } = await supabase
                .from('user_rewards')
                .select('*')
                .eq('user_id', user.id);

            if (urError) throw urError;

            // 3. Merge data
            let collected = 0;
            let claimable = 0;
            let redeemed = 0;

            const mergedRewards = allRewards.map((r: any) => {
                const userEntry = userRewards?.find((ur: { reward_id: number; id: string; status: string; acquired_at: string }) => ur.reward_id === r.id);

                let status = 'Locked';
                // Logic:
                // If user has entry -> Owned/Claimed/Redeemed
                // If no entry -> Check cost vs user points (Claimable if affordable?)
                // Actually 'Claimable' usually means "Unlocked but not claimed". 
                // For a marketplace: 
                //  - If owned => 'Owned' (or 'Redeemed')
                //  - If not owned and affordable => 'Claimable' (Purchase available)
                //  - If not owned and not affordable => 'Locked' 

                if (userEntry) {
                    status = userEntry.status === 'Redeemed' ? 'Redeemed' : 'Owned';
                    collected++;
                    if (status === 'Redeemed') redeemed++;
                } else {
                    if (r.is_purchasable && userPoints >= r.cost) {
                        status = 'Claimable';
                        claimable++;
                    } else if (!r.is_purchasable) {
                        // Achievement based? For now just Lock.
                        status = 'Locked';
                    } else {
                        status = 'Locked';
                    }
                }

                return {
                    ...r,
                    status,
                    instanceId: userEntry?.id,
                    earnedDate: userEntry?.acquired_at
                } as RewardWithStatus;
            });

            setRewards(mergedRewards);
            setStats({ totalCollected: collected, totalClaimable: claimable, totalRedeemed: redeemed });

        } catch (error) {
            console.error("Failed to fetch rewards", error);
        } finally {
            setDataLoading(false);
        }
    };

    const { confirm, toast } = useToast();

    const handleAction = async (rewardId: number, action: 'purchase' | 'claim' | 'redeem') => {
        if (!user) return;

        let confirmMsg = `Are you sure you want to ${action}?`;
        if (action === 'purchase') confirmMsg = "Spend Points to unlock this reward?";

        const confirmed = await confirm({
            title: action.charAt(0).toUpperCase() + action.slice(1),
            message: confirmMsg,
            confirmLabel: action === 'purchase' ? 'Unlock' : 'Confirm',
            cancelLabel: 'Cancel'
        });
        if (!confirmed) return;

        setProcessingId(String(rewardId));
        try {
            const reward = rewards.find(r => r.id === rewardId);
            if (!reward) return;

            if (action === 'purchase' || action === 'claim') {
                // 1. Check points
                if (userPoints < reward.cost) {
                    toast("Not enough Points!", "error");
                    return;
                }

                // 2. Deduct Points & Add Reward (Transaction)
                // Supabase doesn't support complex transactions easily from client without RPC.
                // We'll do it sequentially (optimization: use RPC later).

                // Deduct balance
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ balance: userPoints - reward.cost })
                    .eq('id', user.id);

                if (updateError) throw updateError;

                // Add to user_rewards
                const { error: insertError } = await supabase
                    .from('user_rewards')
                    .insert({
                        user_id: user.id,
                        reward_id: Number(rewardId), // Ensure ID type matches DB
                        status: 'Unlocked' // Default status
                    });

                if (insertError) {
                    // Rollback points? Complex from client. 
                    // Ideally we assume success or handle manual reversion.
                    toast("Error adding reward. Please contact support if points were deducted.", "error");
                    throw insertError;
                }

                // Update local context
                // await refreshUser(); // No longer needed, we re-fetch via fetchData
                setUserPoints(prev => prev - reward.cost); // Optimistic update

            } else if (action === 'redeem') {
                const { error } = await supabase
                    .from('user_rewards')
                    .update({ status: 'Redeemed' })
                    .eq('user_id', user.id)
                    .eq('reward_id', Number(rewardId));

                if (error) throw error;
            }

            // Success
            await fetchData();
            setSelectedReward(null);
            // Broadcast so profile/dashboard can reflect updated balance
            triggerRefresh('reward');

        } catch (error) {
            console.error("Action error", error);
            toast("Action failed. See console.", "error");
        } finally {
            setProcessingId(null);
        }
    };

    // Filter Logic
    const filteredRewards = rewards.filter(r => {
        if (filterTab === 'All') return true;
        if (filterTab === 'Claimable') return r.status === 'Claimable';
        if (filterTab === 'Owned') return r.status === 'Owned' || r.status === 'Claimed'; // Merging concepts
        if (filterTab === 'Redeemed') return r.status === 'Redeemed';
        if (filterTab === 'Locked') return r.status === 'Locked';
        return true;
    });

    // Helper to get Icon
    const getRewardIcon = (type: string) => {
        if (type === 'Badge') return Trophy;
        if (type?.includes('Tree')) return TreePine;
        if (type?.includes('Cert')) return MapPin;
        if (type?.includes('Event')) return Ticket;
        return Gift;
    };

    if (!isLoaded || dataLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
        );
    }
    if (!user) return null;

    return (
        <div className={styles.container}>
            {/* 1. Profile-Style Header */}
            <div className={styles.header}>
                <button
                    onClick={() => router.push('/dashboard')}
                    className={styles.backButton}
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className={styles.avatarContainer}>
                    {user.imageUrl ? (
                        <Image src={user.imageUrl} alt={user.fullName || 'User'} width={80} height={80} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{user.firstName?.charAt(0)}</div>
                    )}
                </div>
                <h1 className={styles.title}>{user.fullName}</h1>
                <p className={styles.subtitle}>Your eco achievements and collected rewards</p>
            </div>

            {/* 2. Stats Grid */}
            <div className={styles.statsGrid}>
                {/* Karma */}
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.statIcon}`} style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
                            <Star size={18} fill="currentColor" />
                        </div>
                        Points
                    </div>
                    <div className={styles.statValue} style={{ color: '#eab308' }}>{userPoints}</div>
                </div>

                {/* Collected */}
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.statIcon}`} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                            <Trophy size={18} />
                        </div>
                        Collected
                    </div>
                    <div className={styles.statValue} style={{ color: '#a855f7' }}>{stats.totalCollected}</div>
                </div>

                {/* Claimable */}
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.statIcon}`} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                            <Gift size={18} />
                        </div>
                        Claimable
                    </div>
                    <div className={styles.statValue} style={{ color: '#3b82f6' }}>{stats.totalClaimable}</div>
                </div>

                {/* Redeemed */}
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.statIcon}`} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>
                            <CheckCircle2 size={18} />
                        </div>
                        Redeemed
                    </div>
                    <div className={styles.statValue} style={{ color: '#22c55e' }}>{stats.totalRedeemed}</div>
                </div>
            </div>

            {/* 3. Your Rewards Section */}
            <div className={styles.sectionHeader}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className={styles.sectionTitle}>
                            <Sparkles className="text-purple-500" size={24} />
                            Your Rewards
                        </h2>
                        <p className={styles.sectionSubtitle}>Tap any reward to view details and unlock conditions.</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className={styles.filters}>
                        {['All', 'Claimable', 'Owned', 'Redeemed', 'Locked'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilterTab(tab as any)}
                                className={`${styles.filterChip} ${filterTab === tab ? styles.filterActive : ''}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Rewards Grid */}
            {dataLoading ? (
                <div className={styles.rewardsGrid}>
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>)}
                </div>
            ) : filteredRewards.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p>No rewards found directly matching this filter.</p>
                </div>
            ) : (
                <div className={styles.rewardsGrid}>
                    {filteredRewards.map(reward => {
                        const Icon = getRewardIcon(reward.type);
                        const isClaimable = reward.status === 'Claimable';
                        const isLocked = reward.status === 'Locked' || reward.status === 'Expired';
                        // @ts-ignore
                        const displayName = reward.title || reward.name;

                        return (
                            <div
                                key={reward.id}
                                className={`
                                    ${styles.rewardCard} 
                                    ${isClaimable ? styles.glowBorder : ''}
                                    ${isLocked ? styles.locked : ''}
                                `}
                                onClick={() => setSelectedReward(reward)}
                            >
                                <div className={styles.cardIcon} style={{ color: isLocked ? 'gray' : isClaimable ? '#a855f7' : '#10b981' }}>
                                    <Icon size={28} />
                                    {isLocked && <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-1 border border-gray-600"><Lock size={10} color="white" /></div>}
                                    {isClaimable && <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1 animate-pulse"><Gift size={10} color="white" /></div>}
                                </div>
                                <h3 className={styles.cardName}>{displayName}</h3>
                                {/* @ts-ignore */}
                                <div className={styles.cardCategory}>{reward.type || reward.category}</div>

                                <div className={`${styles.statusChip}`} style={{
                                    background: isClaimable ? 'rgba(168, 85, 247, 0.2)' : isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(34, 197, 94, 0.2)',
                                    color: isClaimable ? '#d8b4fe' : isLocked ? 'gray' : '#4ade80'
                                }}>
                                    {reward.status}
                                </div>

                                {isClaimable && (
                                    <button className={styles.claimButton}>
                                        {reward.cost} KP
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Details Drawer (Reused) */}
            <RewardDetailsDrawer
                isOpen={!!selectedReward}
                onClose={() => setSelectedReward(null)}
                reward={selectedReward}
                userPoints={userPoints}
                onAction={handleAction}
                isProcessing={!!processingId}
            />
        </div>
    );
}
