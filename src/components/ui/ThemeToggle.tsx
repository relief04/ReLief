"use client";

import React, { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        // Filter out legacy 'ghost' if present
        const initialTheme = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : systemTheme;

        if (initialTheme !== theme) {
            setTheme(initialTheme);
        }
        document.documentElement.setAttribute('data-theme', initialTheme);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <button
            className={styles.toggle}
            onClick={toggleTheme}
            aria-label={`Current theme: ${theme}`}
        >
            <div className={`${styles.icon} ${theme === 'dark' ? styles.show : ''}`}>
                🌙
            </div>
            <div className={`${styles.icon} ${theme === 'light' ? styles.show : ''}`}>
                ☀️
            </div>
        </button>
    );
};
