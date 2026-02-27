"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useRefresh } from '@/context/RefreshContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import styles from './page.module.css';
import { supabase } from '@/lib/supabaseClient';
import { ensureUserProfile } from '@/lib/userUtils';
import { recordLogin } from '@/lib/streakUtils';
import { TimelineChart, CategoryPieChart } from '@/components/charts/CarbonCharts';

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
                    const recentActivity = activities.slice(0, 6).map((a) => ({
                        id: a.id || Math.random().toString(),
                        source: a.source,
                        category: a.category,
                        desc: a.description,
                        impact: a.emissions,
                        date: new Date(a.created_at).toLocaleDateString()
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
                        onboardingCompleted: profile.onboarding_completed ?? false
                    });

                    // --- Redirection Logic ---
                    // If onboarding is NOT incomplete
                    if (profile.onboarding_completed !== true) {
                        const createdAt = new Date(profile.created_at);
                        const now = new Date();
                        const isNewUser = (now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000; // 24 hours

                        // If user is NEW (< 24h) and hasn't done onboarding, force redirect
                        // Existing users (> 24h) will just see the CTA card (logic below)
                        if (isNewUser) {
                            // Double check we aren't already there (middleware handles this but good to be safe)
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
                .upsert({
                    user_id: user.id,
                    monthly_limit: val
                }, { onConflict: 'user_id' });

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
                <div className={styles.greeting}>
                    <h1>Welcome back, <span className={styles.userName}>{user?.username || 'Eco Hero'}</span></h1>
                    <p>Your carbon footprint analysis is ready.</p>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/calculator">
                        <Button variant="primary">Log Activity</Button>
                    </Link>
                </div>
            </header>

            {
                !data.onboardingCompleted && !loading && (
                    <div className={styles.onboardingCta}>
                        <div className={styles.onboardingContent}>
                            <h2>✨ Personalize Your Experience</h2>
                            <p>Complete the 1-minute onboarding quiz to get a tailored carbon budget and insights.</p>
                        </div>
                        <Link href="/onboarding">
                            <Button variant="primary" size="lg">Start Onboarding</Button>
                        </Link>
                    </div>
                )
            }

            {/* Premium Stats Bar */}
            <section className={styles.statsBar}>
                <div className={`${styles.miniStat} ${styles.statTotal}`}>
                    <span className={styles.miniLabel}>Total Footprint</span>
                    <span className={styles.miniVal}>{data.carbonTotal.toFixed(2)} <small>kg</small></span>
                </div>
                <div className={`${styles.miniStat} ${styles.statBudget}`}>
                    <span className={styles.miniLabel}>Monthly Balance</span>
                    <span className={styles.miniVal}>{data.monthlyEmissionsTotal.toFixed(1)} / {data.carbonBudget}</span>
                </div>
                <div className={`${styles.miniStat} ${styles.statSaved}`}>
                    <span className={styles.miniLabel}>Carbon Saved</span>
                    <span className={styles.miniVal} style={{ color: '#4caf50' }}>{data.carbonSavings.toFixed(1)} <small>kg</small></span>
                </div>
                <div className={`${styles.miniStat} ${styles.statKarma}`}>
                    <span className={styles.miniLabel}>Karma Balance</span>
                    <span className={styles.miniVal} style={{ color: '#ffc107' }}>{data.balance} <small>KP</small></span>
                </div>
                <div className={`${styles.miniStat} ${styles.statStreak}`}>
                    <span className={styles.miniLabel}>Daily Streak</span>
                    <span className={`${styles.miniVal} ${styles.streakVal}`}>
                        <span className={styles.flameIcon}>🔥</span>
                        {data.streak} <small>days</small>
                    </span>
                </div>
            </section>

            <div className={styles.mainGrid}>
                {/* Left Column: Analytics */}
                <div className={styles.leftCol}>
                    <Card className={styles.chartCard}>
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
                                            <span>Monthly Budget</span>
                                            <strong>{data.carbonBudget} kg</strong>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsEditingBudget(true);
                                                setNewBudgetValue(data.carbonBudget.toString());
                                            }}
                                            className={styles.editBudgetBtn}
                                        >
                                            Edit Limit
                                        </button>
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

                        <div className={styles.chartWrapper}>
                            <TimelineChart
                                data={data.weeklyEmissions}
                                budget={data.carbonBudget / 30}
                            />
                        </div>
                    </Card>

                    <Card className={styles.chartCard} style={{ marginTop: '0' }}>
                        <div className={styles.timelineHeader}>
                            <div className={styles.timelineTitle}>
                                <h3>Emissions by Category</h3>
                                <p>Global breakdown of your footprint</p>
                            </div>
                        </div>
                        <div className={styles.chartWrapper}>
                            <CategoryPieChart data={data.categoryEmissions} />
                        </div>
                    </Card>


                </div>

                {/* Right Column: History & Insights */}
                <aside className={styles.rightCol}>
                    <Card className={styles.historyCard}>
                        <div className={styles.historyHeader}>
                            <h3>Recent Activity</h3>
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
                                            <span>{activity.category} • {activity.date}</span>
                                        </div>
                                        <div className={styles.activityImpact}>
                                            {activity.impact} <small>kg</small>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.empty}>No recent sessions tracked.</p>
                            )}
                        </div>
                    </Card>

                </aside>
            </div>
        </div >
    );
}
