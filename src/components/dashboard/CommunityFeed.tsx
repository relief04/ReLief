import React, { useState } from 'react';
import { Leaf, Recycle, Sun, Bike, CalendarDays } from 'lucide-react';
import { Button } from '../ui/Button';
import styles from './CommunityFeed.module.css';

const COMMUNITIES = ['All', 'Zero-Waste Living', 'Solar Advocates', 'Urban Cyclists'];

const FEED_DATA = [
    { id: 1, community: 'Zero-Waste Living', name: 'Priya S.', action: 'planted 3 trees', location: 'Mumbai', time: '2h ago', icon: <Leaf size={16} color="#059669" /> },
    { id: 2, community: 'Solar Advocates', name: 'Rahul D.', action: 'installed solar panel', location: 'Pune', time: '5h ago', icon: <Sun size={16} color="#f59e0b" /> },
    { id: 3, community: 'Urban Cyclists', name: 'Sneha K.', action: 'biked 15km to work', location: 'Bengaluru', time: '1d ago', icon: <Bike size={16} color="#0891b2" /> },
    { id: 4, community: 'Zero-Waste Living', name: 'Vikram B.', action: 'composted 5kg', location: 'Delhi', time: '1d ago', icon: <Recycle size={16} color="#059669" /> },
];

export const CommunityFeed: React.FC = () => {
    const [filter, setFilter] = useState('All');

    const filteredFeed = filter === 'All' ? FEED_DATA : FEED_DATA.filter(item => item.community === filter);

    return (
        <div className={`bento-card col-span-8 ${styles.container}`}>
            <div className={styles.header}>
                <h3 className={styles.title}>Community Action Stream</h3>
            </div>

            {/* Filter Pills */}
            <div className={styles.pillContainer}>
                {COMMUNITIES.map(c => (
                    <button 
                        key={c} 
                        className={`${styles.pill} ${filter === c ? styles.pillActive : ''}`}
                        onClick={() => setFilter(c)}
                    >
                        {c}
                    </button>
                ))}
            </div>

            <div className={styles.contentGrid}>
                {/* Left: Feed */}
                <div className={styles.feedWrapper}>
                    {filteredFeed.map(item => (
                        <div key={item.id} className={styles.feedItem}>
                            <div className={styles.avatar}>{item.name.charAt(0)}</div>
                            <div className={styles.feedDetails}>
                                <div className={styles.feedHeadline}>
                                    <span className={styles.feedName}>{item.name}</span> {item.action}
                                    <span className={styles.feedIconWrapper}>{item.icon}</span>
                                </div>
                                <div className={styles.feedMeta}>
                                    {item.location} &middot; {item.time}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredFeed.length === 0 && (
                        <p className={styles.emptyFeed}>No recent activity in this community.</p>
                    )}
                </div>

                {/* Right: Upcoming Local Event */}
                <div className={styles.eventContainer}>
                    <h4 className={styles.eventLabel}>Upcoming Local Event</h4>
                    <div className={styles.eventCard}>
                        <div className={styles.eventHeader}>
                            <CalendarDays size={20} className={styles.eventIcon} />
                            <div>
                                <h5 className={styles.eventName}>Coastal Cleanup Drive</h5>
                                <span className={styles.eventDate}>Sat, Oct 14 &middot; 8:00 AM</span>
                            </div>
                        </div>
                        <p className={styles.eventDesc}>
                            Join the community in clearing plastic waste from the local shoreline. Gloves and bags provided!
                        </p>
                        <div className={styles.eventFooter}>
                            <div className={styles.attendees}>
                                <div className={styles.overlapAvatars}>
                                    <span>P</span><span>R</span><span>S</span>
                                </div>
                                <span className={styles.attendeeCount}>+42 attending</span>
                            </div>
                            <Button variant="action" size="sm">RSVP Now</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
