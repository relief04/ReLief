import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className,
    padding = 'md',
    hoverEffect = false,
    ...props
}) => {
    const rootClassName = `
    ${styles.card} 
    ${styles[padding]} 
    ${hoverEffect ? styles.hover : ''} 
    ${className || ''}
  `;

    return (
        <div className={rootClassName} {...props}>
            {children}
        </div>
    );
};
