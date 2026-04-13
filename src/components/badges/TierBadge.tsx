import React, { useRef, useState } from 'react';
import { Leaf, Sprout, Star, Lock } from 'lucide-react';
import styles from './TierBadge.module.css';

export type TierLevel = 'starter' | 'seedling' | 'guardian' | 'champion';

interface TierBadgeProps {
    tier: TierLevel;
    isLocked?: boolean;
    tierName?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, isLocked = false, tierName }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('');

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || isLocked) return;
        
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate tilt (max 8 degrees)
        const rotateX = -((y - centerY) / centerY) * 8;
        const rotateY = ((x - centerX) / centerX) * 8;

        setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`);
    };

    const handleMouseLeave = () => {
        if (isLocked) return;
        setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)');
    };

    const getIcon = () => {
        switch (tier) {
            case 'starter': return <Leaf size={28} className={styles.iconStarter} />;
            case 'seedling': return <Sprout size={28} className={styles.iconSeedling} />;
            case 'guardian': return <Leaf size={28} strokeWidth={2.5} className={styles.iconGuardian} />;
            case 'champion': return <Star size={28} fill="currentColor" className={styles.iconChampion} />;
        }
    };

    return (
        <div className={styles.container}>
            <div 
                className={`${styles.badgeWrapper} ${styles[tier]} ${isLocked ? styles.locked : 'motion-badge-unlock'} ${tier === 'champion' && !isLocked ? styles.championShimmer : ''}`}
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ transform }}
            >
                <div className={styles.iconContainer}>
                    {getIcon()}
                </div>
                
                {isLocked && (
                    <div className={styles.lockOverlay}>
                        <Lock size={20} className={styles.lockIcon} />
                    </div>
                )}
            </div>
            
            {(tierName || tier) && (
                <span className={`${styles.tierLabel} ${isLocked ? styles.labelLocked : ''}`}>
                    {tierName || tier.charAt(0).toUpperCase() + tier.slice(1)}
                </span>
            )}
        </div>
    );
};
