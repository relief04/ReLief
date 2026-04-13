import React, { useEffect, useState, useRef } from 'react';
import { Flame } from 'lucide-react';
import styles from './KarmaDisplay.module.css';

interface KarmaDisplayProps {
    points: number;
    streakCount?: number;
    maxPoints?: number;
}

export const KarmaDisplay: React.FC<KarmaDisplayProps> = ({ 
    points, 
    streakCount = 0,
    maxPoints = 1000 
}) => {
    const [displayPoints, setDisplayPoints] = useState(0);
    const [increment, setIncrement] = useState<number | null>(null);
    const prevPointsRef = useRef(points);

    // Initial load count-up
    useEffect(() => {
        let startTimestamp: number | null = null;
        const duration = 1500; // ms
        
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setDisplayPoints(Math.floor(progress * points));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                setDisplayPoints(points);
            }
        };
        window.requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only count up on pure initial mount

    // Handle point increments (+X floating text)
    useEffect(() => {
        if (points > prevPointsRef.current && displayPoints > 0) {
            const diff = points - prevPointsRef.current;
            setIncrement(diff);
            setDisplayPoints(points); // Snap directly to new points
            
            const timer = setTimeout(() => {
                setIncrement(null);
            }, 1000); // Wait for float animation to complete
            
            prevPointsRef.current = points;
            return () => clearTimeout(timer);
        } else if (points < prevPointsRef.current) {
             setDisplayPoints(points);
             prevPointsRef.current = points;
        }
    }, [points, displayPoints]);

    // SVG Ring Math
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    // cap progress to 100% physically
    const progressPercent = Math.min(points / maxPoints, 1);
    const dashoffset = circumference - (circumference * progressPercent);

    return (
        <div className={styles.container}>
            <div className={styles.ringWrapper}>
                {/* Background Ring */}
                <svg className={styles.svgRing} width="120" height="120" viewBox="0 0 120 120">
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        className={styles.circleBg}
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Active Progress Ring */}
                    <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        className={styles.circleProgress}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)" /* Start from top */
                    />
                </svg>

                <div className={styles.centerContent}>
                    <span className={styles.pointsValue}>{displayPoints}</span>
                    <span className={styles.pointsLabel}>IP</span>
                </div>

                {increment !== null && (
                    <div className={`${styles.incrementFloat} motion-karma-earn`}>
                        +{increment}
                    </div>
                )}
            </div>

            {streakCount > 0 && (
                <div className={styles.streakContainer}>
                    <Flame className={`${styles.flameIcon} motion-flame-streak`} size={20} />
                    <span className={styles.streakValue}>{streakCount} Day Streak</span>
                </div>
            )}
        </div>
    );
};
