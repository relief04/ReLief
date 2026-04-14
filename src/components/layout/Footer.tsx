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
                <div className={styles.compactGrid}>
                    <div className={styles.brandSide}>
                        <Logo size="md" className={styles.logo} />
                        <p className={styles.description}>
                            Empowering communities to track their carbon footprint and make environmental impact through collective action.
                        </p>
                    </div>

                    <nav className={styles.horizontalNav}>
                        <Link href="/about">About Us</Link>
                        <Link href="/contact">Contact</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/terms">Terms</Link>
                    </nav>
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
