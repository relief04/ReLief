"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { EcoTipCard } from '@/components/community/EcoTipCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { useRefresh } from '@/context/RefreshContext';
import styles from './TipsView.module.css';

interface EcoTip {
    id: number;
    title: string;
    content: string;
    category: string;
    upvotes: number;
    downvotes: number;
    author_name?: string;
    user_vote?: 'up' | 'down' | null;
    user_id: string; // Add user_id to interface
}

export function TipsView() {
    const { user } = useUser();
    const { refreshKey, triggerRefresh } = useRefresh();
    const [tips, setTips] = useState<EcoTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<string>('all');

    const [showShareModal, setShowShareModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newTip, setNewTip] = useState({
        title: '',
        content: '',
        category: 'general'
    });

    const fetchTips = useCallback(async () => {
        setLoading(true);

        const { data: tipsData, error } = await supabase
            .from('eco_tips')
            .select('*')
            .order('upvotes', { ascending: false });

        if (tipsData && !error) {
            // Fetch user votes
            const userVotes: Record<number, string> = {};
            if (user) {
                const { data: votesData } = await supabase
                    .from('tip_votes')
                    .select('tip_id, vote_type')
                    .eq('user_id', user.id);

                if (votesData) {
                    votesData.forEach((vote: { tip_id: number; vote_type: string }) => {
                        userVotes[vote.tip_id] = vote.vote_type;
                    });
                }
            }

            const formattedTips = tipsData.map((tip: Partial<EcoTip>) => ({
                ...tip,
                user_vote: tip.id ? (userVotes[tip.id] as 'up' | 'down' | null) : null
            })) as EcoTip[];

            setTips(formattedTips);
        }

        setLoading(false);
    }, [user, refreshKey]);

    useEffect(() => {
        fetchTips();
    }, [fetchTips]);

    const handleShareTip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTip.title.trim()) return;

        setSubmitting(true);

        const { data, error } = await supabase
            .from('eco_tips')
            .insert([{
                title: newTip.title,
                content: newTip.content,
                category: newTip.category,
                user_id: user.id,
                // Don't store user IDs as author names
                author_name: user.username || user.firstName || 'Eco Warrior'
            }])
            .select()
            .single();

        if (data && !error) {
            const newTipObj: EcoTip = {
                ...data,
                user_vote: null
            };
            setTips([newTipObj, ...tips]);
            setShowShareModal(false);
            setNewTip({ title: '', content: '', category: 'general' });
            triggerRefresh('tip');
        }
        setSubmitting(false);
    };

    const handleDeleteTip = async (tipId: number) => {
        if (!user) return;

        const { error } = await supabase
            .from('eco_tips')
            .delete()
            .eq('id', tipId)
            .eq('user_id', user.id);

        if (!error) {
            setTips(tips.filter(t => t.id !== tipId));
        }
    };

    const handleVote = async (tipId: number, voteType: 'up' | 'down') => {
        if (!user) return;

        const { error } = await supabase
            .from('tip_votes')
            .upsert({
                tip_id: tipId,
                user_id: user.id,
                vote_type: voteType
            });

        if (!error) {
            // Update local state
            setTips(tips.map(tip =>
                tip.id === tipId
                    ? {
                        ...tip,
                        upvotes: voteType === 'up' ? tip.upvotes + 1 : tip.upvotes,
                        downvotes: voteType === 'down' ? tip.downvotes + 1 : tip.downvotes,
                        user_vote: voteType
                    }
                    : tip
            ));
        }
    };

    const filteredTips = category === 'all'
        ? tips
        : tips.filter(t => t.category === category);

    if (loading) return <div className={styles.container}><p>Loading tips...</p></div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>💡 Eco-Tips & Resources</h2>
                <p>Community-shared sustainability tips and best practices</p>
                <Button onClick={() => setShowShareModal(true)} style={{ marginTop: '1rem' }}>+ Share Tip</Button>
            </header>

            <div className={styles.categories}>
                <button className={category === 'all' ? styles.active : ''} onClick={() => setCategory('all')}>All</button>
                <button className={category === 'energy' ? styles.active : ''} onClick={() => setCategory('energy')}>⚡ Energy</button>
                <button className={category === 'transport' ? styles.active : ''} onClick={() => setCategory('transport')}>🚗 Transport</button>
                <button className={category === 'food' ? styles.active : ''} onClick={() => setCategory('food')}>🍎 Food</button>
                <button className={category === 'waste' ? styles.active : ''} onClick={() => setCategory('waste')}>♻️ Waste</button>
                <button className={category === 'water' ? styles.active : ''} onClick={() => setCategory('water')}>💧 Water</button>
            </div>

            {showShareModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Share a Green Tip</h3>
                        <form onSubmit={handleShareTip}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newTip.title}
                                    onChange={e => setNewTip({ ...newTip, title: e.target.value })}
                                    required
                                    placeholder="e.g. Save water while brushing"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Content</label>
                                <textarea
                                    value={newTip.content}
                                    onChange={e => setNewTip({ ...newTip, content: e.target.value })}
                                    required
                                    placeholder="Explain your tip..."
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Category</label>
                                <select
                                    value={newTip.category}
                                    onChange={e => setNewTip({ ...newTip, category: e.target.value })}
                                >
                                    <option value="general">🌱 General</option>
                                    <option value="energy">⚡ Energy</option>
                                    <option value="transport">🚗 Transport</option>
                                    <option value="food">🍎 Food</option>
                                    <option value="waste">♻️ Waste</option>
                                    <option value="water">💧 Water</option>
                                </select>
                            </div>
                            <div className={styles.formActions}>
                                <Button type="button" variant="ghost" onClick={() => setShowShareModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting}>{submitting ? 'Sharing...' : 'Share Tip'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className={styles.tipsList}>
                {filteredTips.length > 0 ? (
                    filteredTips.map(tip => (
                        <EcoTipCard
                            key={tip.id}
                            tip={tip}
                            onVote={handleVote}
                            onDelete={(user && tip.user_id === user.id) ? handleDeleteTip : undefined}
                        />
                    ))
                ) : (
                    <Card className={styles.emptyState}>
                        <p>No tips found in this category yet. Be the first to share!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
