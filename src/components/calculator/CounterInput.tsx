"use client";

import React from 'react';
import styles from './CounterInput.module.css';

interface CounterInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    label?: string;
}

export const CounterInput: React.FC<CounterInputProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    label
}) => {
    const handleDecrement = () => {
        if (value > min) onChange(value - 1);
    };

    const handleIncrement = () => {
        if (value < max) onChange(value + 1);
    };

    return (
        <div className={styles.container}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={styles.counter}>
                <button
                    type="button"
                    className={styles.button}
                    onClick={handleDecrement}
                    disabled={value <= min}
                >
                    −
                </button>
                <div className={styles.value}>{value}</div>
                <button
                    type="button"
                    className={styles.button}
                    onClick={handleIncrement}
                    disabled={value >= max}
                >
                    +
                </button>
            </div>
        </div>
    );
};
