import React from 'react';
import styles from './Toggle.module.css';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
    className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false, label, className }) => {
    return (
        <label className={`${styles.wrapper} ${disabled ? styles.disabled : ''} ${className || ''}`}>
            {label && <span className={styles.label}>{label}</span>}
            <div 
                className={`${styles.toggle} ${checked ? styles.checked : ''}`}
                onClick={() => !disabled && onChange(!checked)}
                role="switch"
                aria-checked={checked}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!disabled) onChange(!checked);
                    }
                }}
            >
                <div className={styles.knob} />
            </div>
        </label>
    );
};
