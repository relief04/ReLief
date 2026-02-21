import React from 'react';
import { shareAchievement, ShareContent, SharePlatform, ShareType } from '@/lib/socialSharing';
import { Button } from '@/components/ui/Button';
import styles from './ShareButtons.module.css';

interface ShareButtonsProps {
    content: ShareContent;
    userId: string;
    shareType: ShareType;
    onShare?: (platform: SharePlatform) => void;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
    content,
    userId,
    shareType,
    onShare
}) => {
    const handleShare = async (platform: SharePlatform) => {
        await shareAchievement(platform, content, userId, shareType);
        onShare?.(platform);
    };

    return (
        <div className={styles.shareButtons}>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => handleShare('twitter')}
                className={styles.twitterButton}
            >
                𝕏 Share on Twitter
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => handleShare('linkedin')}
                className={styles.linkedinButton}
            >
                in Share on LinkedIn
            </Button>
        </div>
    );
};
