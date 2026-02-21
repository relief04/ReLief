"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { BillScanner } from '@/components/bills/BillScanner';
import { BillScanResult } from '@/lib/billScanningAPI';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';
import Link from 'next/link';

export default function ScannerPage() {
    const { user } = useUser();
    const [lastScan, setLastScan] = useState<BillScanResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleScanComplete = async (result: BillScanResult) => {
        if (!user) {
            setLastScan(result);
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('bills')
                .insert({
                    user_id: user.id,
                    bill_type: result.bill_type,
                    extracted_data: result.extracted_data,
                    carbon_emissions: result.carbon_emissions,
                    confidence: result.confidence,
                    status: 'confirmed'
                });

            if (error) throw error;

            // Success!
            setLastScan(result);
            setSaveSuccess(true);

            // Add points for scanning
            await supabase.rpc('add_karma_points', {
                p_user_id: user.id,
                p_points: 10
            });

        } catch (err) {
            console.error('Error saving bill:', err);
            setLastScan(result); // Show result anyway but maybe with an error
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Smart Carbon Scanner</h1>
                <p className={styles.subtitle}>AI-powered footprint extraction for a greener lifestyle.</p>
            </header>

            <div className={styles.content}>
                {!saveSuccess ? (
                    <div className={styles.scannerInspiration}>
                        <Card className={styles.scanCard}>
                            <BillScanner onScanComplete={handleScanComplete} />
                        </Card>

                        <div className={styles.tips}>
                            <h3>How it works</h3>
                            <div className={styles.tipItem}>
                                <span className={styles.tipIcon}>📸</span>
                                <div>
                                    <h4>Snap & Upload</h4>
                                    <p>Upload a photo of your Electricity, LPG, or Shopping bill.</p>
                                </div>
                            </div>
                            <div className={styles.tipItem}>
                                <span className={styles.tipIcon}>🤖</span>
                                <div>
                                    <h4>AI Analysis</h4>
                                    <p>Our neural networks extract keys and calculate CO₂ impact.</p>
                                </div>
                            </div>
                            <div className={styles.tipItem}>
                                <span className={styles.tipIcon}>📈</span>
                                <div>
                                    <h4>Track & Reduce</h4>
                                    <p>See your footprint history and get personalized reduction tips.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.successView}>
                        <Card className={styles.successCard}>
                            <div className={styles.successHeader}>
                                <div className={styles.confirmedIcon}>🌟</div>
                                <h2>Bill Tracked Successfully!</h2>
                                <p>You've earned <strong>10 Points</strong> for tracking your footprint.</p>
                            </div>

                            {lastScan && (
                                <div className={styles.impactBreakdown}>
                                    <div className={styles.mainImpact}>
                                        <span className={styles.impactVal}>{lastScan.carbon_emissions}</span>
                                        <span className={styles.impactUnit}>kg CO₂</span>
                                    </div>

                                    <p className={styles.aiMessage}>"{lastScan.message}"</p>

                                    <div className={styles.comparisons}>
                                        {lastScan.comparisons && (
                                            <>
                                                <div className={styles.compItem}>
                                                    <span className={styles.compLabel}>Driving Equivalent</span>
                                                    <span className={styles.compVal}>{lastScan.comparisons.driving_km} km</span>
                                                </div>
                                                <div className={styles.compItem}>
                                                    <span className={styles.compLabel}>Tree Absorption</span>
                                                    <span className={styles.compVal}>{lastScan.comparisons.trees_monthly} trees/mo</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={styles.successActions}>
                                <button onClick={() => setSaveSuccess(false)} className={styles.scanAnother}>
                                    Scan Another Bill
                                </button>
                                <Link href="/dashboard" className={styles.viewDashboard}>
                                    View Dashboard
                                </Link>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                <Link href="/accuracy">How do we calculate this? View Methodology</Link>
            </footer>
        </div>
    );
}
