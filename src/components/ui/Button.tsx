import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className,
    disabled,
    ...props
}) => {
    const rootClassName = `
    ${styles.button} 
    ${styles[variant]} 
    ${styles[size]} 
    ${isLoading ? styles.loading : ''} 
    ${className || ''}
  `;

    return (
        <button
            className={rootClassName}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <span className={styles.spinner} /> : children}
        </button>
    );
};
