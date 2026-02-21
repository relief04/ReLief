"use client";

import React from 'react';
import styles from './AILauncher.module.css';

interface AILauncherProps {
    onClick: () => void;
    isOpen: boolean;
}

export const AILauncher: React.FC<AILauncherProps> = ({ onClick, isOpen }) => {
    return (
        <button
            className={`${styles.launcher} ${isOpen ? styles.open : ''}`}
            onClick={onClick}
            aria-label="Toggle AI Assistant"
            type="button"
        >
            {isOpen ? (
                <span className={styles.closeIcon}>✕</span>
            ) : (
                <span className={styles.leafIcon}>🌿</span>
            )}
            <div className={styles.glow}></div>
            <div className={styles.pulse}></div>
        </button>
    );
};
