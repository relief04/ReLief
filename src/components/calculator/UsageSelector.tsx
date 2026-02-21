"use client";

import React from 'react';
import styles from './UsageSelector.module.css';
import { UsageLevel } from '@/lib/calculator';

interface UsageSelectorProps {
    value: UsageLevel;
    onChange: (value: UsageLevel) => void;
    label?: string;
}

export const UsageSelector: React.FC<UsageSelectorProps> = ({ value, onChange, label }) => {
    const levels: { id: UsageLevel; label: string; icon: string }[] = [
        { id: 'low', label: 'Low', icon: '↓' },
        { id: 'typical', label: 'Typical', icon: '—' },
        { id: 'high', label: 'High', icon: '↑' },
    ];

    return (
        <div className={styles.container}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.selector}>
                {levels.map((level) => (
                    <button
                        key={level.id}
                        type="button"
                        className={`${styles.button} ${value === level.id ? styles.active : ''}`}
                        onClick={() => onChange(level.id)}
                    >
                        <span className={styles.icon}>{level.icon}</span>
                        <span className={styles.levelLabel}>{level.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
