import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    borderRadius,
    className,
    variant = 'text'
}) => {
    const computedStyle: React.CSSProperties = {
        width: width ?? (variant === 'text' ? '100%' : variant === 'circular' ? 40 : '100%'),
        height: height ?? (variant === 'text' ? 16 : variant === 'circular' ? 40 : 100),
        borderRadius: borderRadius ?? (variant === 'circular' ? '50%' : variant === 'text' ? '4px' : 'var(--radius-md)')
    };

    return (
        <div 
            className={`${styles.skeleton} ${className || ''}`}
            style={computedStyle}
            aria-busy="true"
            aria-hidden="true"
        />
    );
};
