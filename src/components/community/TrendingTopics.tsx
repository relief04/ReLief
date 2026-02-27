import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabaseClient';
import { useRefresh } from '@/context/RefreshContext';
import styles from './TrendingTopics.module.css';

interface TrendingTopic {
    hashtag: string;
    count: number;
}

interface TrendingTopicsProps {
    onHashtagClick?: (hashtag: string) => void;
}

export function TrendingTopics({ onHashtagClick }: TrendingTopicsProps) {
    const [trending, setTrending] = useState<TrendingTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const { refreshKey } = useRefresh();

    useEffect(() => {
        fetchTrendingTopics();
    }, [refreshKey]); // re-fetch silently on every new post

    const fetchTrendingTopics = async () => {
        setLoading(true);

        // Get posts from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: posts, error } = await supabase
            .from('posts')
            .select('hashtags')
            .is('group_id', null)
            .gte('created_at', sevenDaysAgo.toISOString())
            .not('hashtags', 'is', null);

        if (posts && !error) {
            // Count hashtag occurrences
            const hashtagCounts: Record<string, number> = {};

            posts.forEach((post: any) => {
                if (post.hashtags && Array.isArray(post.hashtags)) {
                    post.hashtags.forEach((tag: string) => {
                        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
                    });
                }
            });

            // Convert to array and sort by count
            const trendingArray = Object.entries(hashtagCounts)
                .map(([hashtag, count]) => ({ hashtag, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10); // Top 10

            setTrending(trendingArray);
        }

        setLoading(false);
    };

    const handleHashtagClick = (hashtag: string) => {
        if (onHashtagClick) {
            onHashtagClick(hashtag);
        }
    };

    if (loading) {
        return (
            <Card className={styles.trendingCard}>
                <h3>🔥 Trending Topics</h3>
                <p className={styles.loadingText}>Loading trends...</p>
            </Card>
        );
    }

    if (trending.length === 0) {
        return (
            <Card className={styles.trendingCard}>
                <h3>🔥 Trending Topics</h3>
                <p className={styles.emptyText}>No trending topics yet. Start using hashtags!</p>
            </Card>
        );
    }

    return (
        <Card className={styles.trendingCard}>
            <h3>🔥 Trending Topics</h3>
            <div className={styles.trendingList}>
                {trending.map((topic, index) => (
                    <div
                        key={topic.hashtag}
                        className={styles.trendingItem}
                        onClick={() => handleHashtagClick(topic.hashtag)}
                    >
                        <div className={styles.trendingRank}>#{index + 1}</div>
                        <div className={styles.trendingContent}>
                            <span className={styles.trendingHashtag}>{topic.hashtag}</span>
                            <span className={styles.trendingCount}>{topic.count} posts</span>
                        </div>
                        <div className={styles.trendingIcon}>
                            {index === 0 && '🔥'}
                            {index === 1 && '⭐'}
                            {index === 2 && '✨'}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
