import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
    // We enforce placeholder=" " if floating label is needed, as it triggers :not(:placeholder-shown) logic
    const placeholderValue = props.placeholder || (label ? ' ' : undefined);

    return (
        <div className={`${styles.container} ${className || ''} ${error ? styles.containerError : ''}`}>
            <input
                className={`${styles.input} ${error ? styles.error : ''}`}
                placeholder={placeholderValue}
                {...props}
            />
            {label && <label className={styles.label}>{label}</label>}
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};
