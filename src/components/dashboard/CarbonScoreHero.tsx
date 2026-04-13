import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from './CarbonScoreHero.module.css';

interface CarbonScoreHeroProps {
    score: number;
    budgetLimit: number;
    previousScore: number;
}

export const CarbonScoreHero: React.FC<CarbonScoreHeroProps> = ({ score, budgetLimit, previousScore }) => {
    const [displayScore, setDisplayScore] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.2 });

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Count Up Logic
    useEffect(() => {
        if (!isVisible) return;
        let startTimestamp: number | null = null;
        const duration = 1500;
        
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setDisplayScore(Math.floor(progress * score));
            if (progress < 1) window.requestAnimationFrame(step);
            else setDisplayScore(score);
        };
        window.requestAnimationFrame(step);
    }, [isVisible, score]);

    // Ring Calculations
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = Math.min(score / budgetLimit, 1);
    const dashoffset = isVisible ? circumference - (circumference * progressPercent) : circumference;

    // Color Logic
    const percentageUsed = (score / budgetLimit) * 100;
    let ringColorClass = styles.ringEmerald;
    if (percentageUsed > 100) ringColorClass = styles.ringRed;
    else if (percentageUsed > 80) ringColorClass = styles.ringAmber;

    // Delta Logic
    const delta = score - previousScore;
    const deltaPercent = previousScore === 0 ? 0 : Math.abs(delta / previousScore) * 100;
    const isIncrease = delta > 0;

    return (
        <div className={`bento-card col-span-4 ${styles.heroContainer}`} ref={containerRef}>
            <div className={styles.ringWrapper}>
                <svg width="220" height="220" viewBox="0 0 220 220">
                    <circle cx="110" cy="110" r={radius} className={styles.circleBg} strokeWidth="12" fill="transparent" />
                    <circle
                        cx="110"
                        cy="110"
                        r={radius}
                        className={`${styles.circleProgress} ${ringColorClass}`}
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className={styles.centerContent}>
                    <span className={styles.scoreValue}>{displayScore}</span>
                    <span className={styles.scoreLabel}>kg CO₂</span>
                </div>
            </div>

            <div className={styles.infoBox}>
                <h2 className={styles.subtitle}>Your Carbon Footprint</h2>
                <p className={styles.budgetLimitText}>Budget limit: {budgetLimit} kg / month</p>
                
                <div className={`${styles.deltaBadge} ${isIncrease ? styles.deltaBad : styles.deltaGood}`}>
                    {isIncrease ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    <span>{deltaPercent.toFixed(1)}% vs last week</span>
                </div>
            </div>
        </div>
    );
};
