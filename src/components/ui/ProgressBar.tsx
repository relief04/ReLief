import React, { useEffect, useState } from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    progress: number; // 0 to 100
    milestone?: number; // 0 to 100
    milestoneLabel?: string;
    height?: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    milestone,
    milestoneLabel,
    height = 12,
    className
}) => {
    const [width, setWidth] = useState(0);

    // Animated fill on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setWidth(Math.min(Math.max(progress, 0), 100));
        }, 100);
        return () => clearTimeout(timer);
    }, [progress]);

    return (
        <div className={`${styles.wrapper} ${className || ''}`}>
            <div className={styles.track} style={{ height: `${height}px` }}>
                <div 
                    className={styles.fill} 
                    style={{ width: `${width}%` }}
                />
                
                {milestone !== undefined && (
                    <div 
                        className={styles.milestoneMarker}
                        style={{ left: `${Math.min(Math.max(milestone, 0), 100)}%` }}
                    >
                        <div className={styles.milestoneLine} />
                        {milestoneLabel && (
                            <div className={styles.milestoneTooltip}>
                                {milestoneLabel}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
