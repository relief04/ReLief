import React, { useState } from 'react';
import Link from 'next/link';
import { Home, Compass, BarChart2, Users, Settings, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TierBadge } from '@/components/badges/TierBadge';
import { useUser } from '@clerk/nextjs';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
    const { user } = useUser();
    const [collapsed, setCollapsed] = useState(false);

    const LINKS = [
        { href: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
        { href: '/discover', label: 'Discover', icon: <Compass size={20} /> },
        { href: '/history', label: 'Analytics', icon: <BarChart2 size={20} /> },
        { href: '/community', label: 'Community', icon: <Users size={20} /> },
        { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.header}>
                {!collapsed && <h2 className={styles.brand}>ReLief</h2>}
                <button 
                    className={styles.collapseBtn} 
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className={styles.nav}>
                {LINKS.map(link => (
                    <Link key={link.href} href={link.href} className={styles.navLink}>
                        <span className={styles.icon}>{link.icon}</span>
                        {!collapsed && <span className={styles.label}>{link.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className={styles.footer}>
                {!collapsed ? (
                    <div className={styles.userProfile}>
                        <div className={styles.avatar}>
                            {user?.username?.charAt(0) || 'U'}
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.username || 'Eco Hero'}</span>
                            <span className={styles.karmaPoints}>
                                <CheckCircle2 size={12} color="var(--color-accent)" /> 14,200 IP
                            </span>
                        </div>
                        <div className={styles.badgeWrapper}>
                            <TierBadge tier="guardian" tierName="" />
                        </div>
                    </div>
                ) : (
                    <div className={styles.avatarSmall}>
                        {user?.username?.charAt(0) || 'U'}
                    </div>
                )}
            </div>
        </aside>
    );
};
