// Smart Recommendations Engine
import { supabase } from './supabaseClient';

export interface Recommendation {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category: 'transport' | 'energy' | 'food' | 'waste';
    priority: number; // 1-5
    potential_impact: number; // kg CO2
    action_type: string;
    status: 'active' | 'completed' | 'dismissed';
}

interface UserEmissionPattern {
    transport_emissions: number;
    energy_emissions: number;
    food_emissions: number;
    waste_emissions: number;
    total_emissions: number;
    activity_count: number;
}

/**
 * Analyze user's emission patterns and generate personalized recommendations
 */
export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
    try {
        // 1. Analyze user's emission patterns
        const pattern = await analyzeEmissionPattern(userId);

        // 2. Generate recommendations based on patterns
        const recommendations: Omit<Recommendation, 'id'>[] = [];

        // Transport recommendations
        if (pattern.transport_emissions > pattern.total_emissions * 0.4) {
            recommendations.push({
                user_id: userId,
                title: 'Switch to Public Transit',
                description: `Transportation accounts for ${((pattern.transport_emissions / pattern.total_emissions) * 100).toFixed(0)}% of your emissions. Try using public transit 2-3 times per week.`,
                category: 'transport',
                priority: 5,
                potential_impact: pattern.transport_emissions * 0.3,
                action_type: 'switch_transport',
                status: 'active'
            });

            recommendations.push({
                user_id: userId,
                title: 'Try Carpooling',
                description: 'Sharing rides can reduce your carbon footprint by up to 50% per trip.',
                category: 'transport',
                priority: 4,
                potential_impact: pattern.transport_emissions * 0.25,
                action_type: 'carpool',
                status: 'active'
            });
        }

        // Energy recommendations
        if (pattern.energy_emissions > pattern.total_emissions * 0.3) {
            recommendations.push({
                user_id: userId,
                title: 'Switch to LED Bulbs',
                description: 'Replace traditional bulbs with LED lights to save up to 75% energy.',
                category: 'energy',
                priority: 4,
                potential_impact: pattern.energy_emissions * 0.15,
                action_type: 'switch_to_led',
                status: 'active'
            });

            recommendations.push({
                user_id: userId,
                title: 'Unplug Idle Devices',
                description: 'Electronics use energy even when off. Unplug chargers and appliances not in use.',
                category: 'energy',
                priority: 3,
                potential_impact: pattern.energy_emissions * 0.1,
                action_type: 'unplug_devices',
                status: 'active'
            });
        }

        // Food recommendations
        if (pattern.food_emissions > pattern.total_emissions * 0.25) {
            recommendations.push({
                user_id: userId,
                title: 'Meatless Mondays',
                description: 'Going meat-free one day per week can save 7 kg of CO₂ per month.',
                category: 'food',
                priority: 5,
                potential_impact: 7,
                action_type: 'reduce_meat',
                status: 'active'
            });

            recommendations.push({
                user_id: userId,
                title: 'Buy Local Produce',
                description: 'Locally sourced food reduces transportation emissions significantly.',
                category: 'food',
                priority: 3,
                potential_impact: pattern.food_emissions * 0.2,
                action_type: 'buy_local',
                status: 'active'
            });
        }

        // General recommendations for low activity users
        if (pattern.activity_count < 10) {
            recommendations.push({
                user_id: userId,
                title: 'Start Tracking Daily',
                description: 'Log at least one eco-action per day to build awareness and earn rewards.',
                category: 'transport',
                priority: 5,
                potential_impact: 20,
                action_type: 'increase_tracking',
                status: 'active'
            });
        }

        // Waste recommendations
        recommendations.push({
            user_id: userId,
            title: 'Bring Reusable Bags',
            description: 'Avoid single-use plastic bags by carrying reusable shopping bags.',
            category: 'waste',
            priority: 3,
            potential_impact: 2,
            action_type: 'reusable_bags',
            status: 'active'
        });

        // 3. Save recommendations to database
        for (const rec of recommendations) {
            await supabase.from('recommendations').insert(rec);
        }

        // 4. Fetch and return saved recommendations
        const { data: savedRecs } = await supabase
            .from('recommendations')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('priority', { ascending: false })
            .limit(5);

        return (savedRecs as Recommendation[]) || [];
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return [];
    }
}

/**
 * Analyze user's emission patterns from activities
 */
async function analyzeEmissionPattern(userId: string): Promise<UserEmissionPattern> {
    try {
        const { data: activities } = await supabase
            .from('activities')
            .select('type, impact')
            .eq('user_id', userId);

        if (!activities || activities.length === 0) {
            return {
                transport_emissions: 0,
                energy_emissions: 0,
                food_emissions: 0,
                waste_emissions: 0,
                total_emissions: 0,
                activity_count: 0
            };
        }

        const pattern: UserEmissionPattern = {
            transport_emissions: 0,
            energy_emissions: 0,
            food_emissions: 0,
            waste_emissions: 0,
            total_emissions: 0,
            activity_count: activities.length
        };

        // Categorize activities (this is simplified - adjust based on your activity types)
        activities.forEach((activity: any) => {
            const impact = Math.abs(activity.impact || 0);

            // Simple categorization based on type
            if (activity.type?.includes('transport') || activity.type?.includes('car') || activity.type?.includes('flight')) {
                pattern.transport_emissions += impact;
            } else if (activity.type?.includes('energy') || activity.type?.includes('electricity')) {
                pattern.energy_emissions += impact;
            } else if (activity.type?.includes('food') || activity.type?.includes('meal')) {
                pattern.food_emissions += impact;
            } else if (activity.type?.includes('waste')) {
                pattern.waste_emissions += impact;
            }

            pattern.total_emissions += impact;
        });

        return pattern;
    } catch (error) {
        console.error('Error analyzing emission pattern:', error);
        return {
            transport_emissions: 0,
            energy_emissions: 0,
            food_emissions: 0,
            waste_emissions: 0,
            total_emissions: 0,
            activity_count: 0
        };
    }
}

/**
 * Mark recommendation as completed
 */
export async function completeRecommendation(recommendationId: string): Promise<void> {
    await supabase
        .from('recommendations')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', recommendationId);
}

/**
 * Dismiss a recommendation
 */
export async function dismissRecommendation(recommendationId: string): Promise<void> {
    await supabase
        .from('recommendations')
        .update({ status: 'dismissed' })
        .eq('id', recommendationId);
}
