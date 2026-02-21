"use client";

import React from 'react';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    ReferenceLine
} from 'recharts';

// ReLief brand colors
const COLORS = {
    primary: '#22c55e',      // Green
    secondary: '#3b82f6',    // Blue
    accent: '#f59e0b',       // Amber
    danger: '#ef4444',       // Red
    warning: '#8b5cf6',      // Purple
    info: '#06b6d4'          // Cyan
};

const ChartGradients = () => (
    <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
            <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
    </svg>
);

interface TimelineChartProps {
    data: { date: string; total_co2: number }[];
    budget?: number;
}

export function TimelineChart({ data, budget }: TimelineChartProps) {
    const dailyBudget = budget || 0;

    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No carbon data available for the selected period.</p>
                <p style={{ fontSize: '0.875rem' }}>Start logging activities to see your timeline!</p>
            </div>
        );
    }

    return (
        <>
            <ChartGradients />
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            padding: '12px'
                        }}
                        itemStyle={{ color: COLORS.primary, fontWeight: 'bold' }}
                        formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)} kg`, 'CO₂ Emissions'] : ['N/A', 'CO₂ Emissions']}
                        labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    {dailyBudget > 0 && (
                        <ReferenceLine
                            y={dailyBudget}
                            stroke={COLORS.danger}
                            strokeDasharray="5 5"
                            label={{ value: `Limit: ${dailyBudget.toFixed(1)}kg`, position: 'top', fill: COLORS.danger, fontSize: 10, fontWeight: 'bold' }}
                        />
                    )}
                    <Line
                        type="monotone"
                        dataKey="total_co2"
                        stroke={COLORS.primary}
                        strokeWidth={4}
                        dot={{ fill: COLORS.primary, r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0, fill: COLORS.primary, filter: 'url(#glow)' }}
                        name="Daily CO₂"
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </>
    );
}

interface ComparisonBarChartProps {
    data: { week: string; emissions: number }[];
}

export function ComparisonBarChart({ data }: ComparisonBarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No comparison data available.</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)} kg`, 'CO₂ Emissions'] : ['N/A', 'CO₂ Emissions']}
                />
                <Bar
                    dataKey="emissions"
                    fill={COLORS.primary}
                    name="Weekly CO₂"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

interface TrendLineChartProps {
    data: { month: string; total_co2: number }[];
}

export function TrendLineChart({ data }: TrendLineChartProps) {
    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No trend data available.</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        return `${month}/${year.substring(2)}`;
                    }}
                />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)} kg`, 'Monthly CO₂'] : ['N/A', 'CO₂ Emissions']}
                />
                <Line
                    type="monotone"
                    dataKey="total_co2"
                    stroke={COLORS.secondary}
                    strokeWidth={4}
                    dot={{ fill: COLORS.secondary, r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: COLORS.secondary, filter: 'url(#glow)' }}
                    name="Monthly Trend"
                    animationDuration={2000}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

interface CategoryPieChartProps {
    data: { category: string; total_co2: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
    // UI Display Names
    'Travel': '#6366f1',      // Indigo
    'Food': '#f97316',        // Orange
    'Electricity': '#eab308',  // Yellow
    'LPG': '#ec4899',         // Pink
    'Waste': '#06b6d4',       // Cyan
    'Other': '#10b981',       // Emerald
    // Database Keys (snake_case)
    'transport': '#6366f1',
    'energy': '#eab308',
    'food': '#f97316',
    'waste': '#06b6d4',
    'bill_upload': '#14b8a6', // Teal
    'calculator': '#f59e0b',   // Amber
    'daily_login': '#94a3b8'   // Slate
};

const formatCategory = (name: string): string => {
    if (!name) return 'Other';
    return name
        .split(/[_-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No category data available.</p>
            </div>
        );
    }

    // Format data for display and filter out irrelevant categories like daily_login
    const formattedData = data
        .filter(item => item.category !== 'daily_login')
        .map(item => ({
            ...item,
            name: formatCategory(item.category)
        }));

    return (
        <ResponsiveContainer width="100%" height={320}>
            <PieChart>
                <Pie
                    data={formattedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="total_co2"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                    stroke="none"
                    animationDuration={1500}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other']}
                            style={{ filter: 'drop-shadow(0px 5px 10px rgba(0,0,0,0.1))' }}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: '800' }}
                    formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(2)} kg`, 'CO₂ Emissions'] : ['N/A', 'CO₂ Emissions']}
                />
                <Legend verticalAlign="bottom" height={40} iconType="diamond" />
            </PieChart>
        </ResponsiveContainer>
    );
}

// Export all charts in a container component
interface CarbonChartsProps {
    timelineData: { date: string; total_co2: number }[];
    categoryData: { category: string; total_co2: number }[];
    comparisonData: { week: string; emissions: number }[];
    trendData: { month: string; total_co2: number }[];
    budget?: number;
}

export default function CarbonCharts({
    timelineData,
    categoryData,
    comparisonData,
    trendData,
    budget
}: CarbonChartsProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>📊</span> Carbon Footprint Timeline
                </h3>
                <TimelineChart data={timelineData} budget={budget} />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '1.35rem', fontWeight: '800', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>🥧</span> Emissions Distribution
                </h3>
                <CategoryPieChart data={categoryData} />
            </div>

        </div>
    );
}
