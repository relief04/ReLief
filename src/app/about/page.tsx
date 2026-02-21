'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Eye, Globe, Leaf, Zap, Users, ShieldCheck, Sparkles, Activity, ScanLine, Trees, Wind, BarChart3, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import styles from './about.module.css';

export default function AboutPage() {
    return (
        <div className={styles.container} style={{ opacity: 1, paddingTop: 'calc(var(--nav-height) + 2rem)' }}>
            {/* Navigation */}
            <nav className={styles.navContainer}>
                <Link href="/" className={styles.backLink}>
                    <ArrowLeft size={16} className={styles.backIcon} />
                    Back to Home
                </Link>
            </nav>

            <main className={styles.mainContent}>
                {/* 1️⃣ TOP HEADER BLOCK */}
                <section className={styles.headerSection}>
                    <div className={styles.pillLabel}>About ReLief</div>
                    <h1 className={styles.title}>
                        Building a Greener Future Through <br className="hidden md:block" />
                        <span className={styles.highlight}>Measurable Climate Action</span>
                    </h1>
                    <p className={styles.subtitle}>
                        ReLief empowers individuals and communities to track, understand, and reduce their carbon footprint using intelligent sustainability tools.
                    </p>
                </section>

                <div className="space-y-24">
                    {/* 2️⃣ WHO WE ARE – HIGHLIGHT STORY CARD */}
                    <ScrollReveal delay={100}>
                        <div className={styles.highlightCard}>
                            <div className={styles.highlightIconWrapper}>
                                <Globe size={48} />
                            </div>
                            <div className={styles.highlightContent}>
                                <h2>About ReLief</h2>
                                <p>
                                    ReLief was built on a simple belief: <strong>Climate action becomes powerful when it becomes personal.</strong>
                                    <br /><br />
                                    Most climate platforms focus on data or activism — rarely both. ReLief bridges that gap. We combine science-backed carbon tracking, AI-powered automation, gamified habit-building, social accountability, and community-driven local action.
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* 3️⃣ MISSION & VISION – DUAL CARD LAYOUT */}
                    <div className={styles.dualCards}>
                        {/* MISSION CARD (Green) */}
                        <ScrollReveal delay={200}>
                            <div className={styles.missionCard}>
                                <Target size={120} className={styles.bgIcon} />
                                <div className={styles.cardLabel}>Our Mission</div>
                                <p className={styles.cardText}>
                                    To transform sustainability from an abstract concept into a measurable, daily practice.
                                </p>
                            </div>
                        </ScrollReveal>

                        {/* VISION CARD (Neutral) */}
                        <ScrollReveal delay={300}>
                            <div className={styles.visionCard}>
                                <Eye size={120} className={styles.bgIcon} />
                                <div className={styles.cardLabel}>Our Vision</div>
                                <p className={styles.cardText}>
                                    A world where carbon literacy is universal, sustainable habits are normalized, climate action is visible and social, and progress is measurable in real time.
                                </p>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* 3.5️⃣ OUR PHILOSOPHY */}
                    <section className={styles.section}>
                        <ScrollReveal>
                            <div className={styles.sectionHeader}>
                                <h2>Our Philosophy</h2>
                                <p className={styles.subtitle}>We believe technology should not only measure progress — it should inspire it.</p>
                            </div>
                        </ScrollReveal>
                        <div className={styles.valuesGrid}>
                            {[
                                {
                                    icon: <ShieldCheck size={28} />,
                                    title: "Transparency Builds Trust",
                                    desc: "We ensure our calculations and methodologies are clear so you know exactly where your impact stands."
                                },
                                {
                                    icon: <Sparkles size={28} />,
                                    title: "Data Empowers Change",
                                    desc: "You can't manage what you don't measure. Quality data forms the bedrock of meaningful action."
                                },
                                {
                                    icon: <Users size={28} />,
                                    title: "Community Sustains Motivation",
                                    desc: "Small actions compound. Connecting individuals into a community creates accountability and unbreakable momentum."
                                }
                            ].map((value, i) => (
                                <ScrollReveal key={i} delay={100 * i}>
                                    <div className={styles.valueCard}>
                                        <div className={styles.valueIcon}>{value.icon}</div>
                                        <h3>{value.title}</h3>
                                        <p>{value.desc}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>

                    {/* 4️⃣ WHY WE BUILT RELIEF */}
                    <ScrollReveal delay={100}>
                        <div className={styles.storySection}>
                            <div className={styles.storyGradient} />
                            <div className={styles.storyContent}>
                                <h2>Why We Built ReLief</h2>
                                <p>
                                    Climate change feels overwhelming. Individual actions feel insignificant.
                                    <br /><br />
                                    <strong>ReLief exists to prove otherwise.</strong>
                                    <br /><br />
                                    By turning everyday behaviors into visible impact — and connecting individuals into communities — we create awareness, accountability, momentum, and collective action. ReLief is not just a tracking tool. It is infrastructure for planetary responsibility.
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* 5️⃣ WHAT MAKES RELIEF DIFFERENT */}
                    <section className={styles.section}>
                        <ScrollReveal>
                            <div className={styles.sectionHeader}>
                                <h2>What Makes ReLief Different</h2>
                                <p className={styles.subtitle}>Innovative technology meeting environmental commitment.</p>
                            </div>
                        </ScrollReveal>

                        <div className={styles.featuresGrid}>
                            {[
                                {
                                    icon: <Activity size={24} />,
                                    title: "Real-Time Tracking",
                                    desc: "Track emissions across travel, energy, food, and lifestyle instantly."
                                },
                                {
                                    icon: <ScanLine size={24} />,
                                    title: "AI Bill Scanner",
                                    desc: "Upload bills and automatically convert usage into CO₂ values."
                                },
                                {
                                    icon: <Users size={24} />,
                                    title: "Community Challenges",
                                    desc: "Collaborate with eco-conscious groups and earn green rewards."
                                },
                                {
                                    icon: <Wind size={24} />,
                                    title: "Live AQI Monitoring",
                                    desc: "Stay aware of environmental conditions in real time."
                                },
                                {
                                    icon: <BarChart3 size={24} />,
                                    title: "Eco-Data Insights",
                                    desc: "Deep-dive into your consumption patterns with AI-driven reports."
                                }
                            ].map((feature, i) => (
                                <ScrollReveal key={i} delay={i * 100}>
                                    <div className={styles.featureCard}>
                                        <div className={styles.featureCardIcon}>{feature.icon}</div>
                                        <div>
                                            <h3>{feature.title}</h3>
                                            <p>{feature.desc}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>

                    {/* CLOSING CTA SECTION */}
                    <ScrollReveal delay={200}>
                        <div className={styles.ctaBox}>
                            <h2 className={styles.ctaTitle}>Ready to Track Your Impact?</h2>
                            <p className={styles.ctaText}>Join ReLief and start building a measurable sustainable future today.</p>
                            <Link href="/">
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-primary)', color: 'white', padding: '16px 32px', borderRadius: '12px', fontWeight: 'bold' }}>
                                    Get Started <ArrowRight size={20} />
                                </div>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </main>
        </div>
    );
}
