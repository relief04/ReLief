import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({ 
    options, 
    value, 
    onChange, 
    placeholder = 'Select an option...', 
    disabled = false,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeOption = options.find(o => o.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        if (!disabled) setIsOpen(prev => !prev);
    };

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div 
            className={`${styles.container} ${disabled ? styles.disabled : ''} ${className || ''}`} 
            ref={containerRef}
            onClick={toggleOpen}
            tabIndex={disabled ? -1 : 0}
        >
            <div className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''}`}>
                <span className={!activeOption ? styles.placeholder : styles.selectedLabel}>
                    {activeOption ? activeOption.label : placeholder}
                </span>
                <ChevronDown className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} size={18} />
            </div>

            {isOpen && (
                <div className={styles.dropdownPanel}>
                    {options.map((option) => (
                        <div 
                            key={option.value}
                            className={`${styles.optionItem} ${value === option.value ? styles.optionActive : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(option.value);
                            }}
                        >
                            <span>{option.label}</span>
                            {value === option.value && (
                                <CheckCircle2 size={18} className={styles.checkIcon} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
