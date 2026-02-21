"use client";

import React from 'react';
import styles from './QuickActions.module.css';

interface QuickActionsProps {
    onActionClick: (prompt: string) => void;
}

const QUICK_ACTIONS = [
    { icon: '📊', label: 'Calculate carbon', prompt: 'How do I use the carbon calculator?' },
    { icon: '🌫️', label: 'Check AQI', prompt: 'Tell me about the AQI monitor' },
    { icon: '🔥', label: 'Grow streak', prompt: 'How does the streak forest work?' },
    { icon: '💎', label: 'Earn rewards', prompt: 'How can I earn more Points?' },
    { icon: '📄', label: 'Generate report', prompt: 'How do I generate a carbon report?' }
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
    return (
        <div className={styles.quickActions}>
            {QUICK_ACTIONS.map((action, index) => (
                <button
                    key={index}
                    className={styles.actionChip}
                    onClick={() => onActionClick(action.prompt)}
                    type="button"
                >
                    <span className={styles.actionIcon}>{action.icon}</span>
                    <span className={styles.actionLabel}>{action.label}</span>
                </button>
            ))}
        </div>
    );
};
