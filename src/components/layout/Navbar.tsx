"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import Image from 'next/image';
import styles from './Navbar.module.css';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Logo } from '../ui/Logo';
import { Home, Users, LayoutDashboard, Camera, User, X } from 'lucide-react';
import { BillScanner } from '../bills/BillScanner';
import { BillScanResult } from '@/lib/billScanningAPI';

export const Navbar: React.FC = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useUser();
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Hide tabs on Landing, Login, Signup, and Onboarding pages
    const isHidden = pathname === '/' || pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/onboarding');

    return (
        <>
            <nav className={styles.navbar}>
                <div className={`container ${styles.navContainer}`}>
                    <Logo size="md" />

                    {/* Desktop Menu */}
                    <div className={styles.desktopMenu}>
                        {!isHidden ? (
                            <>
                                <Link href="/dashboard" className={`${styles.navLink} ${pathname === '/dashboard' ? styles.active : ''}`}>Dashboard</Link>
                                <Link href="/feed" className={`${styles.navLink} ${pathname === '/feed' ? styles.active : ''}`}>Community</Link>
                                <Link href="/leaderboard" className={`${styles.navLink} ${pathname === '/leaderboard' ? styles.active : ''}`}>Leaderboard</Link>
                                <Link href="/quiz" className={`${styles.navLink} ${pathname === '/quiz' ? styles.active : ''}`}>Eco-Quiz</Link>
                                <Link href="/aqi" className={`${styles.navLink} ${pathname === '/aqi' ? styles.active : ''}`}>AQI</Link>
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

                    {/* Mobile Header elements (Logo + ThemeToggle + Profile/Login) when bottom bar is active */}
                    <div className={styles.mobileHeaderActions}>
                        <ThemeToggle />
                        <SignedIn>
                            <Link href="/profile" className={styles.profileLinkMobile}>
                                {user?.imageUrl ? (
                                    <Image
                                        src={user.imageUrl}
                                        alt={user.fullName || 'Profile'}
                                        width={32}
                                        height={32}
                                        className={styles.profileImage}
                                    />
                                ) : (
                                    <div className={styles.profilePlaceholderSmall}>
                                        {user?.firstName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </Link>
                        </SignedIn>
                        <SignedOut>
                            <Link href="/sign-in">
                                <Button variant="primary" size="sm" style={{ padding: '0.4rem 0.8rem' }}>Login</Button>
                            </Link>
                        </SignedOut>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Tab Bar */}
            {!isHidden && (
                <div className={styles.bottomTabBar}>
                    <Link href="/" className={`${styles.tabItem} ${pathname === '/' ? styles.tabActive : ''}`}>
                        <Home size={22} className={pathname === '/' ? styles.fillIcon : ''} />
                        <span>Home</span>
                    </Link>
                    <Link href="/dashboard" className={`${styles.tabItem} ${pathname === '/dashboard' ? styles.tabActive : ''}`}>
                        <LayoutDashboard size={22} className={pathname === '/dashboard' ? styles.fillIcon : ''} />
                        <span>Track</span>
                    </Link>
                    
                    <button 
                        className={styles.scanTab}
                        onClick={() => setIsScannerOpen(true)}
                    >
                        <div className={styles.scanTabInner}>
                            <Camera size={24} color="#1a1a1a" />
                        </div>
                        <span>Scan</span>
                    </button>

                    <Link href="/feed" className={`${styles.tabItem} ${pathname === '/feed' ? styles.tabActive : ''}`}>
                        <Users size={22} className={pathname === '/feed' ? styles.fillIcon : ''} />
                        <span>Community</span>
                    </Link>
                    <Link href="/profile" className={`${styles.tabItem} ${pathname === '/profile' ? styles.tabActive : ''}`}>
                        <User size={22} className={pathname === '/profile' ? styles.fillIcon : ''} />
                        <span>Profile</span>
                    </Link>
                </div>
            )}

            {/* Mobile Full-Screen Scanner Modal */}
            {isScannerOpen && (
                <div className={styles.mobileScannerModal}>
                    <div className={styles.mobileScannerContent}>
                        <div className={styles.mobileScannerHeader}>
                            <h2>AI Bill Scanner</h2>
                            <button onClick={() => setIsScannerOpen(false)} className={styles.closeBtn}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.mobileScannerBody}>
                            <BillScanner onScanComplete={(data) => {
                                setIsScannerOpen(false);
                                // Optional: trigger toast or refresh data context
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
