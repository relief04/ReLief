"use client";

import React, { useEffect, useState } from 'react';
import styles from './LiveBackground.module.css';

export const LiveBackground: React.FC = () => {
    const [mounted, setMounted] = useState(false);
    const [leaves, setLeaves] = useState<Array<{ style: React.CSSProperties; variant: number }>>([]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);

        const newLeaves = [...Array(20)].map(() => {
            const scale = 0.5 + Math.random() * 1.2;
            return {
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 12}s`,
                    animationDuration: `${18 + Math.random() * 20}s`,
                    transform: `scale(${scale}) rotate(${Math.random() * 360}deg)`,
                },
                variant: Math.floor(Math.random() * 3),
            };
        });
        setLeaves(newLeaves);
    }, []);

    if (!mounted) return null;

    return (
        <div className={styles.backgroundContainer}>
            <div className={styles.gradientOverlay} />
            <div className={styles.particlesContainer}>
                {leaves.map((l, i) => (
                    <div
                        key={`leaf-${i}`}
                        className={`${styles.leaf} ${styles[`leafVariant${l.variant}`]}`}
                        style={l.style}
                    />
                ))}
            </div>
        </div>
    );
};
