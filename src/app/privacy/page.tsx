'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, CheckCircle, Cookie, FileText, ScanLine } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import styles from '../legal.module.css';

export default function PrivacyPage() {
    return (
        <div className={styles.container} style={{ opacity: 1, paddingTop: 'calc(var(--nav-height) + 2rem)' }}>
            <div className={styles.bgDecorationTop} />
            <div className={styles.bgDecorationLeft} />
            <div className={styles.bgDecorationRight} />

            <nav className={styles.navContainer}>
                <Link href="/" className={styles.backLink}>
                    <ArrowLeft size={16} className={styles.backIcon} />
                    Back to Home
                </Link>
            </nav>

            <main className={styles.mainContent}>

                <ScrollReveal>
                    <div className={styles.headerSection}>
                        <div className={styles.pillLabel}>
                            <Shield size={12} /> Legal & Security
                        </div>
                        <h1 className={styles.title}>
                            Privacy <span className={styles.highlight}>Policy</span>
                        </h1>
                        <p className={styles.subtitle}>
                            ReLief is committed to protecting your personal data.<br className="hidden md:block" /> We value transparency and your trust above all else.
                        </p>
                        <div className={styles.dateBadge}>
                            Last Updated: February 2026
                        </div>
                    </div>
                </ScrollReveal>

                <div className={styles.contentGrid}>

                    {/* Sticky Table of Contents (Desktop) */}
                    <div className={styles.sidebar}>
                        <p className={styles.sidebarTitle}>Contents</p>
                        {[
                            { id: "collection", label: "1. Information We Collect", icon: <Database size={14} /> },
                            { id: "usage", label: "2. How We Use Information", icon: <Eye size={14} /> },
                            { id: "ai-processing", label: "3. AI Processing Disclosure", icon: <ScanLine size={14} /> },
                            { id: "cookies", label: "4. Cookies & Tracking", icon: <Cookie size={14} /> },
                            { id: "sharing", label: "5. Data Sharing", icon: <CheckCircle size={14} /> },
                            { id: "security", label: "6. Security & Retention", icon: <Lock size={14} /> },
                            { id: "rights", label: "7. Your Rights", icon: <Shield size={14} /> },
                        ].map((item, i) => (
                            <a key={i} href={`#${item.id}`} className={styles.sidebarLink}>
                                <span className={styles.sidebarIcon}>{item.icon}</span>
                                {item.label}
                            </a>
                        ))}
                    </div>

                    {/* Content */}
                    <div className={styles.mainSections}>

                        {/* Section 1: Collection */}
                        <ScrollReveal delay={100} id="collection">
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <Database size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                                        <Database size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>1. Information We Collect</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>We collect the following categories of information to operate ReLief:</p>
                                    <div className={styles.gridList}>
                                        {[
                                            { title: "Account Information", desc: "Name, email, profile photo, username, and authentication data via Clerk." },
                                            { title: "Sustainability Data", desc: "Transportation, energy, food, shopping logs, eco-streaks, quiz responses, and Karma points." },
                                            { title: "Utility Bill Data (AI)", desc: "Images of utility bills, extracted metrics (kWh/therms), and carbon calculations." },
                                            { title: "Community Content", desc: "Posts, comments, group participation, event RSVPs, and shared achievements." },
                                            { title: "Location Data", desc: "Approximate location for AQI, local events, and leaderboards. (No precise GPS unless authorized)." },
                                            { title: "Technical Data", desc: "IP address, browser/device type, pages visited, and cookies analytics." },
                                        ].map((item, i) => (
                                            <div key={i} className={styles.gridItem}>
                                                <CheckCircle size={20} className={styles.bulletDot} style={{ background: 'none', color: 'var(--color-primary)' }} />
                                                <div>
                                                    <span className={styles.gridItemTitle}>{item.title}</span>
                                                    <span className={styles.gridItemDesc}>{item.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 2: Usage */}
                        <ScrollReveal delay={200} id="usage">
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <Eye size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconEmerald}`}>
                                        <Eye size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>2. How We Use Your Information</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>We use your data to:</p>
                                    <div className={styles.ulList}>
                                        {[
                                            "Provide and personalize your dashboard.",
                                            "Calculate your carbon footprint and process utility bills via AI.",
                                            "Display AQI relevant to your region.",
                                            "Operate leaderboards and gamification.",
                                            "Enable community interaction and improve platform functionality.",
                                            "Prevent fraud, abuse, and comply with legal obligations."
                                        ].map((item, i) => (
                                            <div key={i} className={styles.ulItem}>
                                                <div className={styles.bulletDot} />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className={styles.callout}>We do not sell your personal data.</p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 3: AI Processing Disclosure */}
                        <ScrollReveal delay={300} id="ai-processing">
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <ScanLine size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconIndigo}`}>
                                        <ScanLine size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>3. AI Processing Disclosure</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>
                                        ReLief uses AI-powered OCR to extract consumption data from uploaded utility bills. Images are processed securely and data is used strictly for carbon footprint calculations.
                                    </p>
                                    <p>
                                        <strong>We do not use your uploaded documents to train AI models unless explicitly stated and consented to.</strong>
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 4: Cookies */}
                        <ScrollReveal delay={400} id="cookies">
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <Cookie size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                                        <Cookie size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>4. Cookies & Tracking Technologies</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>
                                        We use cookies for authentication, session management, performance analytics, and user preferences (like dark/light mode). You may disable cookies in your browser settings, but certain features may not function properly.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 5: Data Sharing */}
                        <ScrollReveal delay={500} id="sharing">
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <CheckCircle size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                                        <CheckCircle size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>5. Data Sharing</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>
                                        We may share data with our authentication provider (Clerk), cloud hosting services, analytics providers, and legal authorities when required by law.
                                    </p>
                                    <p className={`${styles.callout} ${styles.calloutBlue}`}>
                                        We do not sell or rent personal data to third parties.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 6: Security and Retention */}
                        <ScrollReveal delay={600} id="security">
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <Lock size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconAmber}`}>
                                        <Lock size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>6. Security & Data Retention</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>
                                        We implement encrypted HTTPS connections, secure authentication systems, role-based access controls, and regular security audits. However, no online system can be guaranteed 100% secure.
                                    </p>
                                    <div className={styles.innerBox}>
                                        <h4>Retention Policy</h4>
                                        <p>
                                            We retain personal data as long as your account is active, as required by law, or until you request deletion. You may request account deletion at any time.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 7: Your Rights */}
                        <ScrollReveal delay={700} id="rights">
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <Shield size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconTeal}`}>
                                        <Shield size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>7. Your Rights & Additional Info</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>
                                        Depending on your jurisdiction, you may have the right to access your personal data, correct inaccurate data, request deletion, withdraw consent, request data portability, or object to processing. To exercise these rights, contact us via the Contact Page.
                                    </p>
                                    <p>
                                        <strong>Children's Privacy:</strong> ReLief is not intended for users under 13 (or 16 in certain regions). We do not knowingly collect data from minors.
                                    </p>
                                    <p>
                                        <strong>International Users:</strong> If accessing ReLief from outside our primary operating country, you consent to data transfer and processing in jurisdictions where our servers operate.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                    </div>
                </div>

                <ScrollReveal>
                    <div className={styles.footerArea}>
                        <p>Questions about this policy?</p>
                        <Link href="/contact" className={styles.contactBtn}>
                            Contact Privacy Team <ArrowLeft size={16} className={styles.contactBtnIcon} />
                        </Link>
                    </div>
                </ScrollReveal>

            </main>
        </div>
    );
}
