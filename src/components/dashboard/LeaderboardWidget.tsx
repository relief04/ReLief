import React, { useState } from 'react';
import { Medal, Navigation } from 'lucide-react';
import styles from './LeaderboardWidget.module.css';

type Scope = 'local' | 'national' | 'global';

interface LeaderboardUser {
    id: string;
    rank: number;
    name: string;
    avatar?: string;
    karma: number;
    location: string;
    isCurrentUser?: boolean;
}

const MOCK_DATA: Record<Scope, LeaderboardUser[]> = {
    local: [
        { id: '1', rank: 1, name: 'Alex M.', karma: 14200, location: 'Mumbai', isCurrentUser: true },
        { id: '2', rank: 2, name: 'Priya S.', karma: 13850, location: 'Mumbai', isCurrentUser: false },
        { id: '3', rank: 3, name: 'Rahul D.', karma: 12100, location: 'Pune', isCurrentUser: false },
        { id: '4', rank: 4, name: 'Sneha K.', karma: 11950, location: 'Mumbai', isCurrentUser: false },
        { id: '5', rank: 5, name: 'Vikram B.', karma: 10400, location: 'Nashik', isCurrentUser: false },
    ],
    national: [
        { id: '11', rank: 1, name: 'Tenzin N.', karma: 45000, location: 'Delhi', isCurrentUser: false },
        { id: '12', rank: 2, name: 'Sarah W.', karma: 42100, location: 'Bangalore', isCurrentUser: false },
        { id: '1', rank: 38, name: 'Alex M.', karma: 14200, location: 'Mumbai', isCurrentUser: true }, // Current user injected
        { id: '13', rank: 3, name: 'Kavita R.', karma: 39800, location: 'Chennai', isCurrentUser: false },
        { id: '14', rank: 4, name: 'Rohan P.', karma: 38100, location: 'Hyderabad', isCurrentUser: false },
    ],
    global: [
        { id: '21', rank: 1, name: 'Elena G.', karma: 125000, location: 'Spain', isCurrentUser: false },
        { id: '22', rank: 2, name: 'Kenji Y.', karma: 118000, location: 'Japan', isCurrentUser: false },
        { id: '23', rank: 3, name: 'Lars O.', karma: 112000, location: 'Norway', isCurrentUser: false },
        { id: '24', rank: 4, name: 'Mia T.', karma: 105000, location: 'Canada', isCurrentUser: false },
        { id: '1', rank: 842, name: 'Alex M.', karma: 14200, location: 'Mumbai', isCurrentUser: true }, // Current user injected
    ]
};

export const LeaderboardWidget: React.FC = () => {
    const [scope, setScope] = useState<Scope>('local');

    const renderRankBadge = (rank: number) => {
        if (rank === 1) return <div className={`${styles.rankBadge} ${styles.gold}`}><Medal size={16} /></div>;
        if (rank === 2) return <div className={`${styles.rankBadge} ${styles.silver}`}><Medal size={16} /></div>;
        if (rank === 3) return <div className={`${styles.rankBadge} ${styles.bronze}`}><Medal size={16} /></div>;
        return <div className={styles.rankText}>#{rank}</div>;
    };

    return (
        <div className={`bento-card col-span-4 ${styles.container}`}>
            <div className={styles.header}>
                <h3 className={styles.title}>Impact Leaders</h3>
                <div className={styles.tabs}>
                    {(['local', 'national', 'global'] as Scope[]).map(s => (
                        <button
                            key={s}
                            className={`${styles.tabBtn} ${scope === s ? styles.activeTab : ''}`}
                            onClick={() => setScope(s)}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.list}>
                {MOCK_DATA[scope].map((user) => (
                    <div 
                        key={user.id} 
                        className={`${styles.row} ${user.isCurrentUser ? styles.currentUserRow : ''} ${user.rank === 1 ? styles.rankOneRow : ''}`}
                    >
                        <div className={styles.rankCol}>
                            {renderRankBadge(user.rank)}
                        </div>
                        
                        <div className={styles.avatarCol}>
                            <div className={styles.avatar}>
                                {user.name.charAt(0)}
                            </div>
                        </div>
                        
                        <div className={styles.infoCol}>
                            <div className={styles.name}>{user.name} {user.isCurrentUser && <span className={styles.youBadge}>(You)</span>}</div>
                            <div className={styles.location}>
                                <Navigation size={10} className={styles.locIcon} />
                                {user.location}
                            </div>
                        </div>
                        
                        <div className={styles.karmaCol}>
                            <span className={styles.karmaAmt}>{user.karma.toLocaleString()}</span>
                            <span className={styles.karmaLabel}>IP</span>
                        </div>
                    </div>
                ))}
            </div>

            <button className={styles.viewAllBtn}>
                View full leaderboard
            </button>
        </div>
    );
};
