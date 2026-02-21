"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import styles from "../../auth.module.css";
import { Logo } from "@/components/ui/Logo";
import { useEffect, useState } from "react";

export default function SignUpPage() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const initialTheme = savedTheme || systemTheme;
        setIsDark(initialTheme === 'dark');

        // Listen for theme changes from ThemeToggle
        const observer = new MutationObserver(() => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setIsDark(currentTheme === 'dark');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <Logo size="xl" vertical />
                    </div>
                </div>
                <div className={styles.centerContent}>
                    <SignUp
                        redirectUrl="/dashboard"
                        forceRedirectUrl="/dashboard"
                        appearance={{
                            baseTheme: isDark ? dark : undefined,
                            layout: {
                                socialButtonsPlacement: 'top',
                                socialButtonsVariant: 'blockButton'
                            },
                            variables: {
                                colorPrimary: isDark ? '#34d399' : '#059669',
                                colorText: isDark ? '#f3f4f6' : '#111827',
                                colorBackground: isDark ? '#1e293b' : '#ffffff',
                                colorInputBackground: isDark ? '#334155' : '#f3f4f6',
                                colorInputText: isDark ? '#f3f4f6' : '#111827',
                                borderRadius: '0.75rem',
                            },
                            elements: {
                                rootBox: "width: 100%;",
                                card: "box-shadow: none; padding: 0;",
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
