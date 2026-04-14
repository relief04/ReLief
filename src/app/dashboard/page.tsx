"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useRefresh } from '@/context/RefreshContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import styles from './page.module.css';
import { supabase } from '@/lib/supabaseClient';
import { ensureUserProfile } from '@/lib/userUtils';
import { recordLogin } from '@/lib/streakUtils';
import { TimelineChart, CategoryPieChart } from '@/components/charts/CarbonCharts';
import { PointsHistoryModal } from '@/components/profile/PointsHistoryModal';
import { formatDate } from '@/lib/dateUtils';

// Premium Hybrid Elements
import { FloatingAIScanner } from '@/components/dashboard/FloatingAIScanner';
import { TierBadge } from '@/components/badges/TierBadge';
import { KarmaDisplay } from '@/components/rewards/KarmaDisplay';
import { AQIStatus } from '@/components/aqi/AQIStatus';
import { getAQIDataByCoords, AQIData } from '@/lib/aqi';

interface DashboardData {
    username: string;
    carbonTotal: number;
    carbonSavings: number;
    streak: number;
    balance: number;
    carbonBudget: number;
    monthlyEmissionsTotal: number;
    recentActivity: Activity[];
    weeklyEmissions: { date: string; total_co2: number }[];
    categoryEmissions: { category: string; total_co2: number }[];
    onboardingCompleted: boolean;
}

interface Activity {
    id: number | string;
    source: 'activity' | 'bill';
    category: string;
    desc: string;
    impact: number;
    date: string;
}

interface DbActivity {
    id: string;
    source: 'activity' | 'bill';
    category: string;
    description: string;
    emissions: number;
    created_at: string;
}

const DEFAULT_DATA: DashboardData = {
    username: '',
    carbonTotal: 0,
    carbonSavings: 0,
    streak: 0,
    balance: 0,
    carbonBudget: 500,
    monthlyEmissionsTotal: 0,
    recentActivity: [],
    weeklyEmissions: [],
    categoryEmissions: [],
    onboardingCompleted: true
};

export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const { toast } = useToast();
    const { refreshKey } = useRefresh();
    const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
    const [loading, setLoading] = useState(true);
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [newBudgetValue, setNewBudgetValue] = useState<string>('');
    const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
    const [liveAqi, setLiveAqi] = useState<AQIData | null>(null);

    // Fetch Geo-located Live AQI Non-Blocking
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const data = await getAQIDataByCoords(position.coords.latitude, position.coords.longitude);
                        setLiveAqi(data);
                    } catch (error) {
                        console.error('Failed to fetch local AQI:', error);
                    }
                },
                (error) => console.warn('Geolocation denied or failed:', error)
            );
        }
    }, []);

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;
            setLoading(true);

            try {
                // Ensure profile exists
                await ensureUserProfile(
                    user.id,
                    user.emailAddresses[0]?.emailAddress,
                    user.firstName || user.username || 'User',
                    user.imageUrl
                );
                await recordLogin(user.id);

                // parallel fetching
                const [profileRes, budgetRes, summaryRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', user.id).single(),
                    supabase.from('carbon_budgets').select('*').eq('user_id', user.id).single(),
                    supabase.from('user_emissions_summary')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                ]);

                if (profileRes.data) {
                    const profile = profileRes.data;
                    const activities = (summaryRes.data || []) as DbActivity[];
                    const budget = budgetRes.data?.monthly_limit || 500;

                    // Process Recent Activity
                    const recentActivity = activities.slice(0, 5).map((a) => ({
                        id: a.id || Math.random().toString(),
                        source: a.source,
                        category: a.category,
                        desc: a.description,
                        impact: a.emissions,
                        date: formatDate(a.created_at)
                    }));

                    // Process Weekly Timeline (Last 7 days)
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                    const weeklyTimeline: Record<string, number> = {};
                    for (let i = 0; i < 7; i++) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        weeklyTimeline[d.toISOString().split('T')[0]] = 0;
                    }

                    activities.forEach((a) => {
                        const date = a.created_at.split('T')[0];
                        if (weeklyTimeline[date] !== undefined) {
                            weeklyTimeline[date] += Number(a.emissions);
                        }
                    });

                    const weeklyEmissions = Object.entries(weeklyTimeline)
                        .map(([date, total_co2]) => ({ date, total_co2 }))
                        .sort((a, b) => a.date.localeCompare(b.date));

                    // Process Category Breakdown (Full History)
                    const categories: Record<string, number> = {};
                    activities.forEach((a) => {
                        categories[a.category] = (categories[a.category] || 0) + Number(a.emissions);
                    });

                    const categoryEmissions = Object.entries(categories).map(([category, total_co2]) => ({
                        category,
                        total_co2
                    }));

                    // Monthly Total
                    const thisMonthStart = new Date();
                    thisMonthStart.setDate(1);
                    thisMonthStart.setHours(0, 0, 0, 0);

                    const monthlyTotal = activities
                        .filter((a) => new Date(a.created_at) >= thisMonthStart)
                        .reduce((sum: number, a) => sum + Number(a.emissions), 0);

                    // Dynamic Tier Logic
                    const totalEmissions = profile.carbon_total;
                    let calculatedTier: 'starter' | 'seedling' | 'guardian' | 'champion' = 'starter';
                    if (totalEmissions > 5000) calculatedTier = 'champion';
                    else if (totalEmissions > 1000) calculatedTier = 'guardian';
                    else if (totalEmissions > 200) calculatedTier = 'seedling';

                    setData({
                        username: profile.username || user.fullName || 'Eco Hero',
                        carbonTotal: profile.carbon_total,
                        carbonSavings: profile.carbon_savings,
                        streak: profile.streak,
                        balance: profile.balance,
                        carbonBudget: budget,
                        monthlyEmissionsTotal: monthlyTotal,
                        recentActivity,
                        weeklyEmissions,
                        categoryEmissions,
                        onboardingCompleted: profile.onboarding_completed ?? false,
                        // @ts-ignore dynamic runtime injection
                        computedTier: calculatedTier
                    });

                    // --- Redirection Logic ---
                    if (profile.onboarding_completed !== true) {
                        const createdAt = new Date(profile.created_at);
                        const now = new Date();
                        if ((now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000) {
                            router.push('/onboarding');
                            return;
                        }
                    }
                }
            } catch (error) {
                console.error('Dashboard Fetch Error:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [user, refreshKey]);

    const handleBudgetUpdate = async () => {
        if (!user || !newBudgetValue) {
            setIsEditingBudget(false);
            return;
        }

        const val = parseFloat(newBudgetValue);
        if (isNaN(val) || val <= 0) {
            toast('Please enter a valid positive number', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from('carbon_budgets')
                .upsert({ user_id: user.id, monthly_limit: val }, { onConflict: 'user_id' });

            if (error) throw error;

            setData(prev => ({ ...prev, carbonBudget: val }));
            setIsEditingBudget(false);
        } catch (err) {
            console.error('Error updating budget:', err);
            toast('Failed to update budget. Please try again.', 'error');
        }
    };

    if (!isLoaded || loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Gathering your eco-stats...</p>
        </div>
    );

    const budgetProgress = Math.min((data.monthlyEmissionsTotal / data.carbonBudget) * 100, 100);
    const isBudgetExceeded = data.monthlyEmissionsTotal > data.carbonBudget;

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div className={styles.greetingWrapper}>
                    <div className={styles.greeting}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                            <AQIStatus aqi={liveAqi ? liveAqi.aqi : 42} city={liveAqi ? liveAqi.city : "Mumbai"} variant="pill" />
                        </div>
                        <h1 style={{ marginTop: 0 }}>Welcome back, <span className={styles.userName}>{user?.username || 'Eco Hero'}</span></h1>
                        <p style={{ marginTop: '0.2rem' }}>Your carbon footprint analysis is ready.</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/calculator">
                        <Button variant="primary">Log Activity</Button>
                    </Link>
                </div>
            </header>

            {!data.onboardingCompleted && !loading && (
                <div className={styles.onboardingCta}>
                    <div className={styles.onboardingContent}>
                        <h2>✨ Personalize Your Experience</h2>
                        <p>Complete the 1-minute onboarding quiz to get a tailored carbon budget and insights.</p>
                    </div>
                    <Link href="/onboarding">
                        <Button variant="primary">Start Onboarding</Button>
                    </Link>
                </div>
            )}

            {/* Premium Stats Bento Grid */}
            <section className="bento-grid stagger-container">
                {/* Top Metrics Row */}
                <div className={`bento-card col-span-4 ${styles.statTotal} ${styles.interactiveGridCard}`}>
                    <span className={styles.miniLabel}>Total Footprint</span>
                    <span className={styles.miniVal}>{data.carbonTotal.toFixed(2)} <small>kg</small></span>
                </div>
                <div className={`bento-card col-span-4 ${styles.statBudget} ${styles.interactiveGridCard}`}>
                    <span className={styles.miniLabel}>Monthly Balance</span>
                    <span className={styles.miniVal}>{data.monthlyEmissionsTotal.toFixed(1)} <small>/ {data.carbonBudget}kg</small></span>
                </div>
                <div className={`bento-card col-span-4 ${styles.statSaved} ${styles.interactiveGridCard}`}>
                    <span className={styles.miniLabel}>Carbon Saved</span>
                    <span className={styles.miniVal} style={{ color: 'var(--color-success)' }}>{data.carbonSavings.toFixed(1)} <small>kg</small></span>
                </div>

                {/* Second Row: Timeline vs Activity */}
                <div className={`bento-card col-span-8 ${styles.interactiveGridCard}`} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.timelineHeader}>
                        <div className={styles.timelineTitle}>
                            <h3>Carbon Timeline</h3>
                            <p>Daily emissions over the last 7 days</p>
                        </div>
                        <div className={styles.budgetControls}>
                            {isEditingBudget ? (
                                <div className={styles.budgetEditForm}>
                                    <input
                                        type="number"
                                        className={styles.budgetInputSmall}
                                        value={newBudgetValue}
                                        onChange={(e) => setNewBudgetValue(e.target.value)}
                                        autoFocus
                                        placeholder="Budget"
                                    />
                                    <div className={styles.budgetEditActions}>
                                        <button className={styles.saveButtonSmall} onClick={handleBudgetUpdate}>Save</button>
                                        <button className={styles.cancelButtonSmall} onClick={() => setIsEditingBudget(false)}>✕</button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.budgetDisplay}>
                                    <div className={styles.budgetLabel}>
                                        <span>Limit: </span>
                                        <strong>{data.carbonBudget}kg</strong>
                                    </div>
                                    <button onClick={() => { setIsEditingBudget(true); setNewBudgetValue(data.carbonBudget.toString()); }} className={styles.editBudgetBtn}>EditLimit</button>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Budget Progress Bar */}
                    <div className={styles.budgetProgressBarContainer}>
                        <div className={styles.budgetProgressLabels}>
                            <span>{Math.round(budgetProgress)}% used</span>
                            <span>{data.monthlyEmissionsTotal.toFixed(0)} / {data.carbonBudget} kg</span>
                        </div>
                        <div className={styles.budgetProgressBarBg}>
                            <div
                                className={`${styles.budgetProgressBarFill} ${isBudgetExceeded ? styles.progressDanger : ''}`}
                                style={{ width: `${budgetProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* 2x2 Quick Log Habit Grid Mobile */}
                    <div className={`col-span-12 ${styles.mobileQuickLogContainer}`}>
                        <div className={styles.historyHeader} style={{ marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>Quick-Log Habits</h3>
                        </div>
                        <div className={styles.quickLogGrid}>
                            <Link href="/calculator?tab=transport" className={styles.quickLogBtn}>
                                <span className={styles.quickLogIcon}>🚗</span> Transport
                            </Link>
                            <Link href="/calculator?tab=energy" className={styles.quickLogBtn}>
                                <span className={styles.quickLogIcon}>⚡</span> Energy
                            </Link>
                            <Link href="/calculator?tab=food" className={styles.quickLogBtn}>
                                <span className={styles.quickLogIcon}>🥗</span> Food
                            </Link>
                            <Link href="/calculator?tab=shopping" className={styles.quickLogBtn}>
                                <span className={styles.quickLogIcon}>🛍️</span> Shopping
                            </Link>
                        </div>
                    </div>

                    <div className={styles.chartWrapper}>
                        <TimelineChart data={data.weeklyEmissions} budget={data.carbonBudget / 30} />
                    </div>
                </div>

                <div className={`bento-card col-span-4 ${styles.interactiveGridCard}`} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.historyHeader}>
                        <h3>Recent Impact</h3>
                        <Link href="/history">View All</Link>
                    </div>
                    <div className={styles.activityList}>
                        {data.recentActivity.length > 0 ? (
                            data.recentActivity.map((activity) => (
                                <div key={activity.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>
                                        {activity.source === 'bill' ? '📄' : '🌱'}
                                    </div>
                                    <div className={styles.activityMeta}>
                                        <h4>{activity.desc}</h4>
                                        <span>{activity.category}</span>
                                    </div>
                                    <div className={styles.activityImpact}>
                                        {activity.impact}<small>kg</small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={styles.empty}>No recent sessions tracked.</p>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Pie, merged Impact/Streak components */}
                <div className={`bento-card col-span-6 ${styles.interactiveGridCard}`} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.timelineHeader}>
                        <div className={styles.timelineTitle}>
                            <h3>Emissions by Category</h3>
                            <p>Global breakdown of your footprint</p>
                        </div>
                    </div>
                    <div className={styles.chartWrapper}>
                        <CategoryPieChart data={data.categoryEmissions} />
                    </div>
                </div>

                {/* HYBRID INJECTION: Impact KarmaDisplay Widget (3 cols) */}
                <div
                    className={`bento-card col-span-3 ${styles.interactiveGridCard} ${styles.impactCard}`}
                    onClick={() => setIsPointsModalOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setIsPointsModalOpen(true)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', padding: '1.5rem 0' }}
                >
                    <span className={styles.miniLabel} style={{ marginBottom: '0.5rem', fontSize: '0.95rem', color: '#10b981' }}>Impact Balance</span>
                    <div style={{ transform: 'scale(1.3)', margin: '1rem 0' }}>
                        <KarmaDisplay points={data.balance} maxPoints={20000} />
                    </div>
                    <span className={styles.helperText} style={{ marginTop: '0.5rem' }}>Click to view history</span>
                </div>

                {/* HYBRID INJECTION: Activity Streak Widget (3 cols) */}
                 <div className={`bento-card col-span-3 ${styles.interactiveGridCard} ${styles.streakCard}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', textAlign: 'center' }}>
                    <span className={styles.miniLabel} style={{ fontSize: '0.95rem', color: '#fcd34d' }}>Daily Streak</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%', margin: '0.5rem 0' }}>
                        <span className={`${styles.flameIcon} ${styles.animatedFlame}`} style={{ fontSize: '4.5rem' }}>🔥</span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className={styles.glowTextAmber} style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1 }}>{data.streak}</span>
                            <span style={{ fontSize: '1.1rem', color: '#fcd34d', fontWeight: 700, marginTop: '-0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Days</span>
                        </div>
                    </div>
                    <span className={styles.helperText} style={{ opacity: 0.8, fontWeight: 500 }}>Keep it up!</span>
                </div>
            </section>

            <PointsHistoryModal isOpen={isPointsModalOpen} onClose={() => setIsPointsModalOpen(false)} userId={user?.id || ''} />

            {/* HYBRID INJECTION: Universal Floating Platform AI Context */}
            <FloatingAIScanner />
        </div>
    );
}
