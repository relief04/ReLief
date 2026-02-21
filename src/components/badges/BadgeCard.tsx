import React from 'react';
import { Badge, RARITY_COLORS } from '@/lib/badges';
import styles from './BadgeCard.module.css';

interface BadgeCardProps {
    badge: Badge;
    isEarned?: boolean;
    progress?: number; // 0-100
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
    badge,
    isEarned = false,
    progress = 0,
    onClick,
    size = 'md'
}) => {
    const rarityStyle = RARITY_COLORS[badge.rarity];

    return (
        <div
            className={`${styles.badgeCard} ${styles[size]} ${isEarned ? styles.earned : styles.locked}`}
            onClick={onClick}
            style={{
                background: isEarned ? rarityStyle.bg : 'var(--color-bg-200)',
                borderColor: isEarned ? rarityStyle.border : 'var(--color-bg-300)',
                boxShadow: isEarned ? `0 4px 12px ${rarityStyle.glow}` : 'none'
            }}
        >
            {/* Badge Icon */}
            <div className={styles.iconContainer}>
                <div
                    className={styles.icon}
                    style={{
                        fontSize: size === 'lg' ? '3rem' : size === 'md' ? '2rem' : '1.5rem',
                        opacity: isEarned ? 1 : 0.4,
                        filter: isEarned ? 'none' : 'grayscale(100%)'
                    }}
                >
                    {badge.icon}
                </div>

                {/* Rarity Indicator */}
                {isEarned && (
                    <div
                        className={styles.rarityBadge}
                        style={{
                            background: rarityStyle.border,
                            color: 'white'
                        }}
                    >
                        {badge.rarity.toUpperCase()}
                    </div>
                )}
            </div>

            {/* Badge Info */}
            <div className={styles.info}>
                <h3
                    className={styles.name}
                    style={{ color: isEarned ? rarityStyle.text : 'var(--color-text-200)' }}
                >
                    {badge.name}
                </h3>
                <p
                    className={styles.description}
                    style={{ color: isEarned ? rarityStyle.text : 'var(--color-text-200)', opacity: isEarned ? 0.9 : 1 }}
                >
                    {badge.description}
                </p>

                {/* Progress Bar (if not earned) */}
                {!isEarned && progress > 0 && (
                    <div className={styles.progressContainer}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: `${progress}%`,
                                    background: 'var(--color-primary)'
                                }}
                            />
                        </div>
                        <span className={styles.progressText}>{Math.round(progress)}%</span>
                    </div>
                )}

                {/* Karma Reward */}
                {badge.karma_reward > 0 && (
                    <div className={styles.reward}>
                        <span className={styles.rewardIcon}>💎</span>
                        <span className={styles.rewardText}>+{badge.karma_reward} KP</span>
                    </div>
                )}
            </div>

            {/* Locked Overlay */}
            {!isEarned && (
                <div className={styles.lockedOverlay}>
                    <span className={styles.lockIcon}>🔒</span>
                </div>
            )}
        </div>
    );
};
