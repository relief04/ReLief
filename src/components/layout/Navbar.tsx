"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import Image from 'next/image';
import styles from './Navbar.module.css';
import { Button } from '../ui/Button';
// import { useAuth } from '@/hooks/useAuth';

import { ThemeToggle } from '../ui/ThemeToggle';

import { Logo } from '../ui/Logo';

export const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useUser();
    // const { user } = useAuth(); // No auth required, just check state

    // Hide tabs on Landing, Login, Signup, and Onboarding pages
    const isHidden = pathname === '/' || pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/onboarding');

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.navContainer}`}>
                <Logo size="md" />

                {/* Desktop Menu */}
                <div className={styles.desktopMenu}>
                    {!isHidden ? (
                        <>
                            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
                            <Link href="/feed" className={styles.navLink}>Community</Link>
                            <Link href="/leaderboard" className={styles.navLink}>Leaderboard</Link>
                            <Link href="/aqi" className={styles.navLink}>AQI</Link>
                            <Link href="/quiz" className={styles.navLink}>Quiz</Link>
                        </>
                    ) : null}

                    <ThemeToggle />

                    <SignedIn>
                        <Link href="/profile" className={styles.profileLink}>
                            {user?.imageUrl ? (
                                <Image
                                    src={user.imageUrl}
                                    alt={user.fullName || 'Profile'}
                                    width={36}
                                    height={36}
                                    className={styles.profileImage}
                                />
                            ) : (
                                <div className={styles.profilePlaceholder}>
                                    {user?.firstName?.charAt(0) || 'U'}
                                </div>
                            )}
                        </Link>
                    </SignedIn>
                    <SignedOut>
                        <Link href="/sign-in">
                            <Button variant="primary" size="sm">Sign In</Button>
                        </Link>
                    </SignedOut>
                </div>

                {/* Mobile Toggle */}
                <button
                    className={styles.mobileToggle}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span className={styles.hamburger} />
                </button>

                <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
                    {!isHidden ? (
                        <>
                            <Link href="/dashboard" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                            <Link href="/feed" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Community</Link>
                            <Link href="/leaderboard" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Leaderboard</Link>
                            <Link href="/aqi" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>AQI</Link>
                            <Link href="/quiz" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>Quiz</Link>
                        </>
                    ) : null}
                    <div className={styles.mobileActions}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                            <span>Theme</span>
                            <ThemeToggle />
                        </div>
                        {/* Mobile Auth */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <SignedIn>
                                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className={styles.profileLink}>
                                    {user?.imageUrl ? (
                                        <Image
                                            src={user.imageUrl}
                                            alt={user.fullName || 'Profile'}
                                            width={40}
                                            height={40}
                                            className={styles.profileImage}
                                        />
                                    ) : (
                                        <div className={styles.profilePlaceholder}>
                                            {user?.firstName?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </Link>
                            </SignedIn>
                            <SignedOut>
                                <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                                    <Button size="md">Sign In</Button>
                                </Link>
                            </SignedOut>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
