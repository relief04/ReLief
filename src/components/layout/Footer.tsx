'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail } from 'lucide-react';
import { Logo } from '../ui/Logo';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    // Hide Footer on Onboarding
    if (pathname?.startsWith('/onboarding')) return null;

    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.grid}>
                    {/* Column 1: Brand & Socials */}
                    <div className={styles.column}>
                        <Logo size="md" className={styles.logo} />
                        <p className={styles.description}>
                            Empowering communities to track their carbon footprint and make real-world environmental impact through collective action.
                        </p>
                    </div>

                    {/* Column 2: Core Platform */}
                    <div className={styles.column}>
                        <h4 className={styles.title}>Core Platform</h4>
                        <nav className={styles.nav}>
                            <Link href="/dashboard">Dashboard</Link>
                            <Link href="/dashboard">Emission Insights</Link>
                            <Link href="/feed">Community Hub</Link>
                            <Link href="/leaderboard">Leaderboard</Link>
                        </nav>
                    </div>

                    {/* Column 3: Features & Support */}
                    <div className={styles.column}>
                        <h4 className={styles.title}>Features & Support</h4>
                        <div className={styles.dualNav}>
                            <nav className={styles.nav}>
                                <Link href="/calculator">Calculator</Link>
                                <Link href="/scanner">AI Scanner</Link>
                                <Link href="/quiz">Eco-Quiz</Link>
                            </nav>
                            <nav className={styles.nav}>
                                <Link href="/about">About Us</Link>
                                <Link href="/contact">Contact</Link>
                                <Link href="/privacy">Privacy</Link>
                                <Link href="/terms">Terms</Link>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    <div className={styles.bottomContent}>
                        <p>&copy; {currentYear} Relieƒ. All rights reserved.</p>
                        <div className={styles.contactEmail}>
                            <a href="mailto:reliefearth0@gmail.com">
                                <Mail size={14} />
                                reliefearth0@gmail.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
