"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import styles from './page.module.css';
import { supabase } from '@/lib/supabaseClient';
import { exportCarbonLogsToCSV } from '@/lib/csvExportUtils';
import { generateCarbonSummaryPDF } from '@/lib/pdfExportUtils';
import Link from 'next/link';

interface LogItem {
    id: string | number;
    source: 'activity' | 'bill';
    category: string;
    description: string;
    emissions: number;
    created_at: string;
}

export default function HistoryPage() {
    const { user, isLoaded } = useUser();
    const { toast } = useToast();
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'activity' | 'bill'>('all');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);

    useEffect(() => {
        if (!user) return;

        async function fetchHistory() {
            setLoading(true);
            try {
                let query = supabase
                    .from('user_emissions_summary')
                    .select('*')
                    .eq('user_id', user?.id)
                    .neq('category', 'daily_login') // Exclude daily login entries from all views
                    .order('created_at', { ascending: false });

                if (filter === 'bill') {
                    query = query.or('source.eq.bill,category.eq.bill_upload');
                } else if (filter === 'activity') {
                    query = query.eq('source', 'activity').neq('category', 'bill_upload');
                }


                if (selectedCategories.length > 0) {
                    query = query.in('category', selectedCategories);
                }

                const { data, error } = await query;
                if (error) throw error;
                setLogs(data || []);

                // Extract all unique categories for the filter pills if not already set
                if (data && availableCategories.length === 0) {
                    const cats = Array.from(new Set(data.map((l: LogItem) => l.category)))
                        .filter((c: string) => !['daily_login', 'bill_upload', 'calculator'].includes(c)); // Exclude technical types
                    setAvailableCategories(cats);
                }
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [user, filter, selectedCategories]);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setFilter('all');
    };

    const handleExportCSV = () => {
        // Map to CarbonLog format for existing util
        const carbonLogs = logs.map(l => ({
            id: Number(l.id) || 0,
            user_id: user?.id || '',
            created_at: l.created_at,
            category: l.category,
            activity: l.description,
            co2_amount: l.emissions,
            notes: `Source: ${l.source}`
        }));

        if (carbonLogs.length === 0) {
            toast('No data to export', 'error');
            return;
        }
        exportCarbonLogsToCSV(carbonLogs);
    };

    const handleExportPDF = async () => {
        if (!user) return;

        const totalEmissions = logs.reduce((sum, l) => sum + l.emissions, 0);
        const topCategory = logs.length > 0 ?
            Object.entries(logs.reduce((acc, l) => {
                acc[l.category] = (acc[l.category] || 0) + l.emissions;
                return acc;
            }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0][0] : 'N/A';

        await generateCarbonSummaryPDF(
            { name: user?.firstName || 'User', email: user?.emailAddresses[0]?.emailAddress },
            {
                totalEmissions,
                savedCarbon: 0, // Placeholder
                topCategory,
                weeklyChange: 0
            }
        );
    };

    if (!isLoaded || loading) return (
        <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your footprint history...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1>Emission History</h1>
                    <p>Track every gram of CO₂ impact over time.</p>
                </div>
                <div className={styles.actions}>
                    <button onClick={handleExportCSV} className={styles.exportBtn}>Export CSV</button>
                    <button onClick={handleExportPDF} className={styles.exportBtn}>Export PDF</button>
                </div>
            </header>

            <div className={styles.controls}>
                <div className={styles.topFilterRow}>
                    <div className={styles.filters}>
                        <button
                            className={`${styles.filterTab} ${filter === 'all' ? styles.activeTab : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All History
                        </button>
                        <button
                            className={`${styles.filterTab} ${filter === 'bill' ? styles.activeTab : ''}`}
                            onClick={() => setFilter('bill')}
                        >
                            📄 Bills
                        </button>
                        <button
                            className={`${styles.filterTab} ${filter === 'activity' ? styles.activeTab : ''}`}
                            onClick={() => setFilter('activity')}
                        >
                            🌱 Activities
                        </button>
                    </div>

                </div>

                <div className={styles.secondaryFilterRow}>

                    <div className={styles.categoryPills}>
                        {availableCategories.map(cat => (
                            <button
                                key={cat}
                                className={`${styles.pill} ${selectedCategories.includes(cat) ? styles.pillActive : ''}`}
                                onClick={() => toggleCategory(cat)}
                            >
                                {cat === 'calculator' ? 'Carbon Footprint' : cat}
                            </button>
                        ))}
                    </div>

                    {(selectedCategories.length > 0) && (
                        <button className={styles.clearBtn} onClick={clearFilters}>
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className={styles.resultsCount}>
                    Showing {logs.length} entries
                </div>
            </div>

            <Card className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th className={styles.textCenter}>Emissions (kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={`${log.source}-${log.id}-${log.created_at}`}>
                                        <td className={styles.dateCol}>
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </td>
                                        <td className={styles.categoryCol}>
                                            {log.category === 'calculator' ? 'Carbon Footprint' :
                                                log.category === 'bill_upload' ? 'Bill Scan' :
                                                    log.category}
                                        </td>
                                        <td className={styles.descCol}>{log.description}</td>
                                        <td className={`${styles.emissionsCol} ${styles.textCenter}`}>
                                            {log.emissions.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className={styles.empty}>
                                        No entries found. <Link href="/scanner">Start scanning bills!</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
