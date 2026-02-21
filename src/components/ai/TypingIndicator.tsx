"use client";

import React from 'react';
import styles from './TypingIndicator.module.css';

export const TypingIndicator: React.FC = () => {
    return (
        <div className={styles.typingIndicator}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
        </div>
    );
};
