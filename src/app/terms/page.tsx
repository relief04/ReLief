'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Scale, UserCheck, Gavel, ShieldCheck, MessageSquare, Leaf } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import styles from '../legal.module.css';

export default function TermsPage() {
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
                            <Scale size={12} /> Terms of Service
                        </div>
                        <h1 className={styles.title}>
                            User <span className={styles.highlight}>Agreement</span>
                        </h1>
                        <p className={styles.subtitle}>
                            Please read these terms carefully before using ReLief. <br className="hidden md:block" />By accessing the site, you agree to be bound by these terms.
                        </p>
                        <div className={styles.dateBadge}>
                            Last Updated: February 2026
                        </div>
                    </div>
                </ScrollReveal>

                <div className={styles.contentGrid} style={{ display: 'flex', flexDirection: 'column' }}>

                    <div className={styles.mainSections} style={{ maxWidth: '800px', margin: '0 auto' }}>

                        {/* Section 1: Acceptance & Eligibility */}
                        <ScrollReveal delay={100}>
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <UserCheck size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconEmerald}`}>
                                        <UserCheck size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>1. Acceptance & Eligibility</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>
                                        By accessing or using ReLief, you agree to these Terms of Use. If you do not agree, you must discontinue use immediately.
                                    </p>
                                    <p>
                                        <strong>Eligibility:</strong> You must be at least 13 years old, provide accurate registration information, and maintain account security. You are responsible for activity under your account.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 2: Platform Purpose & User Conduct */}
                        <ScrollReveal delay={200}>
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <Gavel size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                                        <Gavel size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>2. Platform Purpose & User Conduct</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>
                                        <strong>Platform Purpose:</strong> ReLief provides carbon tracking tools, AI utility bill processing, community features, leaderboards, and environmental education. ReLief does not guarantee specific environmental outcomes.
                                    </p>
                                    <p>
                                        <strong>User Conduct:</strong> You agree not to:
                                    </p>
                                    <div className={styles.ulList}>
                                        {[
                                            "Post harmful, abusive, or misleading content",
                                            "Upload fraudulent utility documents",
                                            "Attempt to hack or disrupt services",
                                            "Manipulate leaderboard systems",
                                            "Use automated bots without permission"
                                        ].map((item, i) => (
                                            <div key={i} className={styles.ulItem}>
                                                <AlertTriangle size={16} className={styles.bulletDot} style={{ background: 'none', color: 'var(--color-primary)' }} />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className={styles.callout}>Violation may result in account suspension or termination.</p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 3: Community Guidelines & Intellectual Property */}
                        <ScrollReveal delay={300}>
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <MessageSquare size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconIndigo}`}>
                                        <MessageSquare size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>3. Community & Intellectual Property</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>
                                        <strong>Community Guidelines:</strong> Users must maintain respectful communication, avoid misinformation, refrain from harassment or discrimination, and share only content they have rights to. We reserve the right to moderate and remove content.
                                    </p>
                                    <p>
                                        <strong>Intellectual Property:</strong> All platform content (branding, design system, algorithms, UI/UX, code) are owned by ReLief or licensed to us. Users retain ownership of content they post but grant ReLief a license to display it within the platform.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Section 4: AI Disclaimer & Limitation of Liability */}
                        <ScrollReveal delay={400}>
                            <div className={styles.sectionCard}>
                                <div className={styles.bgIconLarge}>
                                    <AlertTriangle size={120} />
                                </div>
                                <div className={styles.cardHeader}>
                                    <div className={`${styles.iconWrapper} ${styles.iconAmber}`}>
                                        <ShieldCheck size={22} />
                                    </div>
                                    <h2 className={styles.cardTitle}>4. Disclaimers & Limitations</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <div className={styles.innerBox}>
                                        <p style={{ marginBottom: '1rem', color: 'var(--color-text-200)' }}>
                                            <strong>AI Disclaimer:</strong> Carbon calculations are estimates based on available data and standard emission factors. Results are informational only and should not be used as certified environmental audits.
                                        </p>
                                        <p style={{ color: 'var(--color-text-200)' }}>
                                            <strong>Limitation of Liability:</strong> ReLief is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, we are not liable for data inaccuracies, service interruptions, community disputes, or environmental claims based on user actions.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>

                    </div>

                </div>

                {/* Section 5: Termination & Governing Law */}
                <ScrollReveal delay={500}>
                    <div className={styles.footerArea}>
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <p>
                                <strong>Termination:</strong> We may suspend or terminate accounts for terms violations, fraudulent activity, or security risks. Users may delete their account at any time.
                            </p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-300)', marginTop: '2rem', marginBottom: '0.5rem' }}>
                                Governing Law
                            </p>
                            <p style={{ fontSize: '0.9rem' }}>
                                These terms are governed by the laws of India.
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

            </main>
        </div>
    );
}
