"use client";

import React from 'react';
import styles from './CarbonSavingsCard.module.css';

interface CarbonSavingsCardProps {
    totalSavings: number;
    weeklyTrend: number; // Percentage change
    comparedToBaseline: number; // Percentage compared to average user
}

export const CarbonSavingsCard: React.FC<CarbonSavingsCardProps> = ({
    totalSavings,
    weeklyTrend,
    comparedToBaseline
}) => {
    const trendIsPositive = weeklyTrend >= 0;
    const betterThanAverage = comparedToBaseline > 0;

    // Convert kg to trees equivalent (1 tree absorbs ~21kg CO2/year)
    const treesEquivalent = (totalSavings / 21 * 52).toFixed(1); // Annual equivalent

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.icon}>🌱</div>
                <div className={styles.headerText}>
                    <h3>Carbon Savings</h3>
                    <p>Your environmental impact</p>
                </div>
            </div>

            <div className={styles.mainStat}>
                <div className={styles.savingsValue}>
                    {totalSavings.toFixed(1)}
                    <span className={styles.unit}>kg CO₂</span>
                </div>
                <div className={styles.savingsLabel}>Saved this week</div>
            </div>

            <div className={styles.equivalence}>
                <span className={styles.equivalenceIcon}>🌳</span>
                <span className={styles.equivalenceText}>
                    Equivalent to {treesEquivalent} trees planted annually
                </span>
            </div>

            <div className={styles.stats}>
                <div className={styles.statItem}>
                    <div className={styles.statLabel}>Weekly Trend</div>
                    <div className={`${styles.statValue} ${trendIsPositive ? styles.positive : styles.negative}`}>
                        {trendIsPositive ? '↑' : '↓'} {Math.abs(weeklyTrend).toFixed(1)}%
                    </div>
                </div>

                <div className={styles.statDivider}></div>

                <div className={styles.statItem}>
                    <div className={styles.statLabel}>vs. Average User</div>
                    <div className={`${styles.statValue} ${betterThanAverage ? styles.positive : styles.negative}`}>
                        {betterThanAverage ? '↓' : '↑'} {Math.abs(comparedToBaseline).toFixed(1)}%
                    </div>
                </div>
            </div>

            <div className={styles.progressBar}>
                <div className={styles.progressLabel}>
                    <span>Progress to Net Zero</span>
                    <span>{Math.min(100, (totalSavings / 100 * 100)).toFixed(0)}%</span>
                </div>
                <div className={styles.progressTrack}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(100, (totalSavings / 100 * 100))}%` }}
                    ></div>
                </div>
            </div>

            <div className={styles.footer}>
                <button className={styles.detailsButton}>
                    View Detailed Breakdown →
                </button>
            </div>
        </div>
    );
};
