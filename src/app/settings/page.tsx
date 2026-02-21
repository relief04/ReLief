"use client";

import React from 'react';
import { EmailPreferences } from '@/components/settings/EmailPreferences';
import styles from './page.module.css';

export default function SettingsPage() {
    return (
        <div className={styles.settingsContainer}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Settings</h1>
                <p className={styles.pageDescription}>Manage your account preferences and notifications.</p>
            </div>

            <div className={styles.content}>
                <aside className={styles.sidebar}>
                    <nav className={styles.nav}>
                        {/* We could add more tabs here later like 'Account', 'Privacy', etc. */}
                        <button className={`${styles.navItem} ${styles.active}`}>Notifications</button>
                    </nav>
                </aside>

                <main className={styles.mainContent}>
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Email Preferences</h2>
                            <p>Control what updates you receive in your inbox. We respect your time and only want to send what's valuable.</p>
                        </div>
                        <EmailPreferences />
                    </section>
                </main>
            </div>
        </div>
    );
}
