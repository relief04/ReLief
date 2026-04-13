import React from 'react';
import { PackageOpen } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    action,
    className
}) => {
    return (
        <div className={`${styles.container} ${className || ''}`}>
            <div className={styles.iconWrapper}>
                {icon || <PackageOpen size={64} className={styles.defaultIcon} />}
            </div>
            <h3 className={styles.title}>{title}</h3>
            {description && <p className={styles.description}>{description}</p>}
            {action && <div className={styles.actionWrapper}>{action}</div>}
        </div>
    );
};
