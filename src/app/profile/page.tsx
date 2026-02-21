'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser, useClerk, UserButton } from '@clerk/nextjs';
import { useGlobalAudio, FOCUS_TRACKS } from '@/components/providers/GlobalAudioProvider';
import { supabase } from '@/lib/supabaseClient';
import { ensureUserProfile } from '@/lib/userUtils';
import { recordLogin } from '@/lib/streakUtils';
import { Card } from '@/components/ui/Card';
import { StreakCalendar } from '@/components/ui/StreakCalendar';
import { Modal } from '@/components/ui/Modal';
import { EmailPreferences } from '@/components/settings/EmailPreferences';
import {
    Leaf,
    Flame,
    Award,
    Sprout,
    Trees,
    Swords,
    Trophy,
    Lock,
    Unlock,
    Gift,
    Music,
    Volume2,
    Settings,
    LogOut,
    Bell
} from 'lucide-react';
import styles from './profile.module.css';
import { useRouter } from 'next/navigation';

// Mock Badges Data
const ALL_BADGES = [
    { id: 'b1', name: 'Solar Seedling', icon: Sprout, level: 'Bronze', requiredPoints: 0 },
    { id: 'b2', name: 'Green Adventurer', icon: Trees, level: 'Silver', requiredPoints: 50 },
    { id: 'b3', name: 'Carbon Warrior', icon: Swords, level: 'Gold', requiredPoints: 200 },
    { id: 'b4', name: 'Eco Champion', icon: Trophy, level: 'Diamond', requiredPoints: 1000 },
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const { isPlaying, currentTrack, togglePlay, setTrack } = useGlobalAudio();
    const [profileData, setProfileData] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'notifications'>('overview');

    useEffect(() => {
        async function loadProfile() {
            if (user) {
                // Ensure profile exists in Supabase
                await ensureUserProfile(
                    user.id,
                    user.emailAddresses[0]?.emailAddress,
                    user.fullName || user.username || 'User',
                    user.imageUrl
                );

                // Record today's login and update streak
                await recordLogin(user.id);

                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfileData(data || {});
                setLoadingData(false);
            }
        }
        if (isLoaded && user) loadProfile();
        else if (isLoaded && !user) setLoadingData(false);
    }, [user, isLoaded]);

    if (!isLoaded || (user && loadingData)) {
        return (
            <div className={styles.container} style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--color-primary)' }}>Loading Profile...</div>
            </div>
        );
    }

    if (!user) return null;

    const getRank = (points: number) => {
        if (points >= 1000) return 'Eco Champion';
        if (points >= 500) return 'Planet Guardian';
        if (points >= 200) return 'Carbon Warrior';
        return 'Eco Starter';
    };

    const getLevel = (points: number) => Math.floor(points / 100) + 1;

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.profileHeader}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    marginBottom: '1rem'
                }}>
                    <div style={{ transform: 'scale(2.5)' }}>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
                <h1 className={styles.name}>{user.fullName}</h1>
                <div className={styles.email}><span>{user.primaryEmailAddress?.emailAddress}</span></div>

                {/* Rank and Member Since */}
                <div style={{
                    display: 'flex',
                    gap: '2rem',
                    marginTop: '1.5rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Rank</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                            {getRank(profileData?.points || 0)}
                        </div>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Member Since</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '1.5rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => {
                            // Use Clerk's openUserProfile method
                            const clerk = (window as any).Clerk;
                            if (clerk) {
                                clerk.openUserProfile();
                            }
                        }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                        }}
                    >
                        <Settings size={18} />
                        Manage Account
                    </button>

                    <button
                        onClick={() => signOut({ redirectUrl: '/' })}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </div>

            {/* Tabs Container */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        background: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-bg-200)',
                        color: activeTab === 'overview' ? '#fff' : 'var(--color-text)',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        background: activeTab === 'notifications' ? 'var(--color-primary)' : 'var(--color-bg-200)',
                        color: activeTab === 'notifications' ? '#fff' : 'var(--color-text)',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Bell size={18} /> Notifications
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Metrics Grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <div className={`${styles.statIcon} ${styles.iconYellow}`}><Award size={20} /></div>
                                Trivia Points
                            </div>
                            <div className={`${styles.statValue} ${styles.textYellow}`}>{profileData?.balance || 0}</div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statHeader}>
                                <div className={`${styles.statIcon} ${styles.iconGreen}`}><Leaf size={20} /></div>
                                Total Emissions
                            </div>
                            <div className={`${styles.statValue} ${styles.textGreen}`}>{Number(profileData?.carbon_total || 0).toFixed(2)} kg</div>
                        </div>



                        <div
                            className={`${styles.statCard} cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all`}
                            onClick={() => setIsStreakModalOpen(true)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setIsStreakModalOpen(true)}
                        >
                            <div className={styles.statHeader}>
                                <div className={`${styles.statIcon} ${styles.iconOrange}`}><Flame size={20} /></div>
                                Streak
                            </div>
                            <div className={`${styles.statValue} ${styles.textYellow}`}>{profileData?.streak || 0} Days</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem' }}>Click to view calendar</div>
                        </div>

                        <div
                            className={`${styles.statCard} cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group`}
                            onClick={() => router.push('/badges')}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.statHeader}>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 group-hover:scale-110 transition-transform"><Trophy size={20} /></div>
                                Badges
                            </div>
                            <div className="flex items-center justify-between w-full mt-2">
                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">View</span>
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
                                    <span className="text-sm">➜</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Focus / Ambient Audio Zone - Themed to match (CSS Modules Fix) */}
                    <Card className={styles.audioZoneCard} style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)' }}>
                        <h2 className={`${styles.sectionTitle} font-heading`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Music className="text-emerald-400" size={24} />
                            Ambient Focus Zone
                        </h2>
                        <p className={styles.sectionSubtitle}>Select a sound to play in the background while you browse.</p>

                        <div className={styles.audioContent}>
                            {/* Now Playing Control */}
                            <div className={styles.nowPlayingCard}>
                                <div className={styles.nowPlayingEmoji}>
                                    {currentTrack.emoji}
                                </div>

                                <h3 className={styles.nowPlayingTitle}>{currentTrack.name}</h3>

                                <span className={`${styles.nowPlayingStatus} ${isPlaying ? styles.statusActive : ''}`}>
                                    {isPlaying ? 'Now Playing' : 'Paused'}
                                </span>

                                <button
                                    onClick={togglePlay}
                                    className={styles.playButton}
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? '⏸' : '▶'}
                                </button>
                            </div>

                            {/* Track Selection Grid */}
                            <div className={styles.trackGrid}>
                                {FOCUS_TRACKS.map(track => {
                                    const isActive = currentTrack.id === track.id;
                                    return (
                                        <button
                                            key={track.id}
                                            onClick={() => setTrack(track)}
                                            className={`${styles.trackBtn} ${isActive ? styles.trackBtnActive : ''}`}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span className={styles.trackBtnIcon}>{track.emoji}</span>
                                                <span style={{ fontWeight: 500 }}>{track.name}</span>
                                            </div>

                                            {isActive && isPlaying && (
                                                <Volume2 size={16} className="text-emerald-400 animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </>
            ) : (
                <Card style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell className="text-emerald-400" size={24} />
                        Notifications & Alerts
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                        Control what updates you receive in your inbox. We respect your time and only want to send what's valuable.
                    </p>
                    <EmailPreferences />
                </Card>
            )}

            {/* Streak Calendar Modal */}
            <Modal
                isOpen={isStreakModalOpen}
                onClose={() => setIsStreakModalOpen(false)}
                title="🔥 Your Login Streak"
            >
                <StreakCalendar
                    userId={user.id}
                    currentStreak={profileData?.streak || 0}
                    longestStreak={profileData?.longest_streak || 0}
                />
            </Modal>
        </div>
    );
}
