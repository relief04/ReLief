"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useUser } from "@clerk/nextjs";
import {
  BarChart, Map, TreeDeciduous, Award, Users, Camera,
  FileText, HelpCircle, Layout, Sparkles, Target,
  Search, Droplets, PieChart, Activity, Globe
} from "lucide-react";

export default function Home() {
  const { isSignedIn } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const features = [
    { icon: <PieChart size={24} />, title: "Carbon Calculator", desc: "Track emissions from travel, energy, and food.", link: "/dashboard" },
    { icon: <Camera size={24} />, title: "AI Bill Scanner", desc: "Extract carbon data from energy or grocery bills.", link: "/scanner" },
    { icon: <Map size={24} />, title: "Live AQI Tracking", desc: "Real-time air quality data for your location.", link: "/aqi" },
    { icon: <Award size={24} />, title: "Rewards & Points", desc: "Earn and spend points with sustainable partners.", link: "/marketplace" },
    { icon: <Users size={24} />, title: "Community Hub", desc: "Join local groups and participate in eco-events.", link: "/community" },
    { icon: <HelpCircle size={24} />, title: "Quizzes", desc: "Test your knowledge and earn unique certificates.", link: "/quiz" },
    { icon: <Layout size={24} />, title: "Track", desc: "Real-time logging of your daily carbon footprints.", link: "/dashboard" },
    { icon: <Target size={24} />, title: "Challenges", desc: "Complete eco-goals to level up your green status.", link: "/community" },
    { icon: <Activity size={24} />, title: "Visualization", desc: "Deep analytics on your environmental progress.", link: "/dashboard" }
  ];

  return (
    <div className={`${styles.container} ${isMounted ? styles.mounted : ''}`}>
      {/* Hero Section */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Heal the Planet, <br />
            <span className={styles.highlight}>One Habit at a Time.</span>
          </h1>
          <p className={styles.subtitle}>
            <span>Join the global movement to track your carbon footprint, and make real-world impact through community action.</span>
          </p>
          <div className={styles.ctaGroup}>
            <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>
              <Button size="lg" variant="primary">Start Your Journey</Button>
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.planetPulse}>
            🌍
            <div className={styles.pulseRing}></div>
          </div>
        </div>
      </section>

      {/* Split Crisis & Impact Section */}
      <div className={styles.splitGrid}>
        {/* Global Carbon Crisis Highlight */}
        <section
          id="crisis"
          className={`${styles.section} ${styles.crisisSection}`}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.pillLabel}>The Global Crisis</span>
            <h2 className={styles.crisisNumber}>
              36B Tonnes
            </h2>
            <p className={styles.crisisSubtitle}>of CO₂ annually</p>
            <p className={styles.subtitle}>Our planet is at a tipping point. Every metric tonne we offset is a victory.</p>
          </div>

          <div className={styles.infoCardContainer}>
            <Card className={styles.infoCard}>
              <div className={styles.infoStatItem}>
                <h4>1.2T</h4>
                <p>Trees needed naturally.</p>
              </div>
              <div className={styles.infoStatItem}>
                <h4>80%</h4>
                <p>From personal choices.</p>
              </div>
            </Card>
          </div>
        </section>

        {/* Personal Carbon Impact Breakdown */}
        <section
          id="impact"
          className={`${styles.section} ${styles.impactSection}`}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.pillLabel}>Your Individual Role</span>
            <div className={styles.impactValue}>
              4.7 Tonnes
            </div>
            <p className={styles.subtitle}>The average yearly footprint per person. Together, we can reach net zero.</p>
          </div>

          <div className={styles.progressBarGroup}>
            {[
              { icon: <Map size={18} />, label: "Transport", value: 38 },
              { icon: <Droplets size={18} />, label: "Energy", value: 24 },
              { icon: <Activity size={18} />, label: "Food", value: 21 },
              { icon: <Globe size={18} />, label: "Shopping", value: 17 }
            ].map((bar, i) => (
              <div key={i} className={styles.progressBarRow}>
                <div className={styles.progressLabel}>
                  <span>{bar.icon} {bar.label}</span>
                  <span>{bar.value}%</span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Solution + Features Grid */}
      <section
        id="solution"
        className={`${styles.section} ${styles.solutionSection}`}
      >
        <div className={styles.sectionHeader}>
          <span className={styles.pillLabel}>The Relief Ecosystem</span>
          <h2 className={styles.title} style={{ fontSize: ' clamp(3rem, 8vw, 5rem)' }}>Small steps. <br /><span className={styles.highlight}>Big impact.</span></h2>
          <p className={styles.subtitle}>Our comprehensive suite of AI-powered tools makes sustainability intuitive, measurable, and rewarding. Every feature is a step towards a cooler planet.</p>
        </div>

        <div className={styles.solutionGrid}>
          {features.map((feature, i) => (
            <Link key={i} href={feature.link} className={styles.solutionCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
