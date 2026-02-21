// Social Sharing Utilities
import { supabase } from './supabaseClient';

export type SharePlatform = 'twitter' | 'linkedin' | 'download';
export type ShareType = 'badge' | 'milestone' | 'achievement' | 'tree_planting';

export interface ShareContent {
    title: string;
    description: string;
    image?: string;
    url?: string;
}

/**
 * Share achievement to social media platforms
 */
export async function shareAchievement(
    platform: SharePlatform,
    content: ShareContent,
    userId: string,
    shareType: ShareType
): Promise<void> {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = content.url || baseUrl;

    // Track the share
    await supabase.from('social_shares').insert({
        user_id: userId,
        share_type: shareType,
        platform,
        content_data: content
    });

    // Update user's share count
    await supabase.rpc('increment_shares_count', { p_user_id: userId });

    // Platform-specific sharing
    switch (platform) {
        case 'twitter':
            shareToTwitter(content, shareUrl);
            break;
        case 'linkedin':
            shareToLinkedIn(content, shareUrl);
            break;
        case 'download':
            // Handle download in component
            break;
    }
}

/**
 * Share to Twitter/X
 */
function shareToTwitter(content: ShareContent, url: string): void {
    const text = `${content.title}\n\n${content.description}\n\n#ReLief #ClimateAction #Sustainability`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}

/**
 * Share to LinkedIn
 */
function shareToLinkedIn(content: ShareContent, url: string): void {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
}

/**
 * Generate shareable achievement card text
 */
export function generateBadgeShareText(badgeName: string, description: string): ShareContent {
    return {
        title: `🏆 I just earned the "${badgeName}" badge on ReLief!`,
        description: description,
    };
}

export function generateMilestoneShareText(milestone: string, value: number): ShareContent {
    return {
        title: `🎯 New Milestone Achieved!`,
        description: `I've ${milestone} on my eco-journey! Join me in making a difference. 🌍`,
    };
}

export function generateTreePlantingShareText(treeCount: number, carbonSaved: number): ShareContent {
    return {
        title: `🌳 I've planted ${treeCount} real ${treeCount === 1 ? 'tree' : 'trees'}!`,
        description: `By saving ${carbonSaved.toFixed(1)} kg of CO₂ on ReLief, I've helped plant real trees. Together we can heal the planet! 🌍💚`,
    };
}

export function generateCarbonSavingsShareText(carbonSaved: number): ShareContent {
    return {
        title: `🌍 Carbon Impact Update!`,
        description: `I've saved ${carbonSaved.toFixed(1)} kg of CO₂ through sustainable actions on ReLief. Every action counts! #ClimateAction`,
    };
}
