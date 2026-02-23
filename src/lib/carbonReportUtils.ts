import { supabase } from './supabaseClient';

export interface CarbonLog {
    id: number;
    user_id: string;
    created_at: string;
    category: string;
    activity: string;
    co2_amount: number;
    notes?: string;
}

export interface CategoryTotal {
    category: string;
    total_co2: number;
    count: number;
}

export interface WeeklyComparison {
    current_week: number;
    previous_week: number;
    change_percent: number;
}

/**
 * Fetch user's carbon history within a date range
 */
export async function getUserCarbonHistory(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<CarbonLog[]> {
    const { data, error } = await supabase
        .from('carbon_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching carbon history:', error);
        return [];
    }

    return data || [];
}

/**
 * Get carbon emissions aggregated by category for a time period
 */
export async function getCarbonByCategory(
    userId: string,
    days: number = 30
): Promise<CategoryTotal[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('carbon_logs')
        .select('category, co2_amount')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

    if (error) {
        console.error('Error fetching carbon by category:', error);
        return [];
    }

    // Aggregate by category
    const categoryMap = new Map<string, { total: number; count: number }>();

    data?.forEach((log: any) => {
        const existing = categoryMap.get(log.category) || { total: 0, count: 0 };
        categoryMap.set(log.category, {
            total: existing.total + log.co2_amount,
            count: existing.count + 1
        });
    });

    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        total_co2: stats.total,
        count: stats.count
    }));
}

/**
 * Compare current week's emissions to previous week
 */
export async function getWeeklyComparison(userId: string): Promise<WeeklyComparison> {
    const now = new Date();
    const currentWeekStart = new Date();
    currentWeekStart.setDate(now.getDate() - 7);

    const previousWeekStart = new Date();
    previousWeekStart.setDate(now.getDate() - 14);

    // Get current week total
    const currentWeekData = await getUserCarbonHistory(userId, currentWeekStart, now);
    const currentWeekTotal = currentWeekData.reduce((sum, log) => sum + log.co2_amount, 0);

    // Get previous week total
    const previousWeekData = await getUserCarbonHistory(userId, previousWeekStart, currentWeekStart);
    const previousWeekTotal = previousWeekData.reduce((sum, log) => sum + log.co2_amount, 0);

    // Calculate change percentage
    const changePercent = previousWeekTotal === 0
        ? 0
        : ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;

    return {
        current_week: currentWeekTotal,
        previous_week: previousWeekTotal,
        change_percent: changePercent
    };
}

/**
 * Get monthly carbon trends (last N months)
 */
export async function getMonthlyTrends(
    userId: string,
    months: number = 6
): Promise<{ month: string; total_co2: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    const logs = await getUserCarbonHistory(userId, startDate, endDate);

    // Group by month
    const monthlyData = new Map<string, number>();

    logs.forEach((log) => {
        const date = new Date(log.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const currentTotal = monthlyData.get(monthKey) || 0;
        monthlyData.set(monthKey, currentTotal + log.co2_amount);
    });

    return Array.from(monthlyData.entries())
        .map(([month, total_co2]) => ({ month, total_co2 }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate total carbon saved (baseline - actual)
 * Assumes baseline of 50 kg CO2/day per person
 */
export async function getTotalCarbonSaved(userId: string): Promise<number> {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // Last year
    const endDate = new Date();

    const logs = await getUserCarbonHistory(userId, startDate, endDate);

    const totalEmissions = logs.reduce((sum, log) => sum + log.co2_amount, 0);
    const daysSinceStart = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const baseline = daysSinceStart * 50; // 50 kg CO2/day baseline
    const saved = baseline - totalEmissions;

    return Math.max(0, saved); // Return 0 if negative
}

/**
 * Get daily carbon totals for the last N days (for timeline chart)
 */
export async function getDailyTotals(
    userId: string,
    days: number = 7
): Promise<{ date: string; total_co2: number }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const logs = await getUserCarbonHistory(userId, startDate, endDate);

    // Group by date
    const dailyData = new Map<string, number>();

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(endDate.getDate() - (days - 1 - i));
        const dateKey = date.toISOString().split('T')[0];
        dailyData.set(dateKey, 0);
    }

    // Add actual data
    logs.forEach((log) => {
        const dateKey = log.created_at.split('T')[0];
        const currentTotal = dailyData.get(dateKey) || 0;
        dailyData.set(dateKey, currentTotal + log.co2_amount);
    });

    return Array.from(dailyData.entries())
        .map(([date, total_co2]) => ({ date, total_co2 }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
