import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'action' | 'ai' | 'danger' | 'icon';
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
            <span className={styles.content}>
                {children}
            </span>
            {isLoading && (
                <span className={styles.spinnerContainer}>
                    <span className={styles.spinner} />
                </span>
            )}
        </button>
    );
};
