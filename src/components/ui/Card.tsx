import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    variant?: 'base' | 'stat' | 'action' | 'event' | 'leaderboard' | 'badge';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className,
    variant = 'base',
    padding = 'md',
    hoverEffect,
    ...props
}) => {
    const rootClassName = `
    ${styles.card} 
    ${styles[variant]} 
    ${styles[padding]} 
    ${hoverEffect ? styles.hoverEffect : ''}
    ${className || ''}
  `;

    return (
        <div className={rootClassName} {...props}>
            {children}
            {variant === 'action' && (
                <div className={styles.actionArrow} aria-hidden="true">
                    →
                </div>
            )}
        </div>
    );
};
