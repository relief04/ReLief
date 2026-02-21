"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getHistoricalAQIData, AQIHistoryData } from '@/lib/aqi';
import { Card } from '@/components/ui/Card';
import styles from './AQIHistoryGraph.module.css';

interface Props {
    city: string;
}

export const AQIHistoryGraph: React.FC<Props> = ({ city }) => {
    const [timeRange, setTimeRange] = useState(365); // Default 1 Year
    const [data, setData] = useState<AQIHistoryData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            // Sanitize: remove any remnant parens
            const cleanCity = city.replace(/\(.*\)/, '').trim();
            // Try explicit first
            const query = `${cleanCity}, India`;

            // We could implement retry here too, but let's try the robust query first
            const result = await getHistoricalAQIData(query, timeRange);

            // If empty trends (maybe geocoding failed internally or no data), try simple name
            if (result.trends.length === 0 && cleanCity !== query) {
                const fallbackResult = await getHistoricalAQIData(cleanCity, timeRange);
                if (fallbackResult.trends.length > 0) {
                    setData(fallbackResult);
                    setLoading(false);
                    return;
                }
            }

            setData(result);
            setLoading(false);
        };

        fetchHistory();
    }, [city, timeRange]);

    const RANGES = [
        { label: 'Last 1 Month', days: 30 },
        { label: 'Last 6 Months', days: 180 },
        { label: 'Last 1 Year', days: 365 },
        { label: 'Last 3 Years', days: 365 * 3 }, // Note: Open Meteo History limits might apply, but key logic is here
    ];

    if (loading && !data) return <div className={styles.loading}>Loading History...</div>;

    if (!data || !data.trends || data.trends.length === 0) {
        return (
            <Card className={styles.historyCard}>
                <div className={styles.loading}>
                    Historical data is not available for this specific location.
                </div>
            </Card>
        );
    }

    return (
        <Card className={styles.historyCard}>
            <div className={styles.header}>
                <h3>Pollution Trends History</h3>
                <div className={styles.ranges}>
                    {RANGES.map(r => (
                        <button
                            key={r.days}
                            className={`${styles.rangeBtn} ${timeRange === r.days ? styles.active : ''}`}
                            onClick={() => setTimeRange(r.days)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.trends}>
                        <defs>
                            <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                                const d = new Date(str);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                            minTickGap={30}
                        />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--color-bg-100)', borderRadius: '8px', border: '1px solid var(--color-primary)' }}
                            labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="aqi"
                            stroke="var(--color-primary)"
                            fillOpacity={1}
                            fill="url(#colorAqi)"
                            name="AQI Level"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                    <span>Average AQI</span>
                    <strong>{data.summary.avgAQI}</strong>
                </div>
                <div className={styles.summaryItem}>
                    <span>Best Day</span>
                    <strong>{data.summary.bestAQI}</strong>
                    <small>{data.summary.bestDate}</small>
                </div>
                <div className={styles.summaryItem}>
                    <span>Worst Day</span>
                    <strong>{data.summary.worstAQI}</strong>
                    <small>{data.summary.worstDate}</small>
                </div>
                <div className={styles.summaryItem}>
                    <span>Trend</span>
                    <strong>Using {timeRange} days data</strong>
                </div>
            </div>
        </Card>
    );
};
