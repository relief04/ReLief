import React from 'react';
import styles from '@/app/auth.module.css';
import { Logo } from '@/components/ui/Logo';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className={styles.pageContainer}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <Logo size="xl" vertical />
                    </div>
                    <h1>{title}</h1>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                {children}
            </div>
        </div>
    );
};
