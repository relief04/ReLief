"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useRefresh } from '@/context/RefreshContext';
import { Input } from '@/components/ui/Input';
import { calculateEmissions, CalculationResult, DietType, getAverageBaseline } from '@/lib/calculator';
import { BillScanner } from '@/components/bills/BillScanner';
import { BillScanResult } from '@/lib/billScanningAPI';
import styles from './page.module.css';
import { DailyLogForm } from '@/components/calculator/DailyLogForm';
import { Sparkles } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { updateUserStats } from '@/lib/userUtils';
import { recordLogin } from '@/lib/streakUtils';
import { checkAndAwardBadges } from '@/lib/badges';

type InputMode = 'manual' | 'scan';

export default function CalculatorPage() {
    const { toast } = useToast();
    const [mode, setMode] = useState<InputMode>('manual');
    const [inputs, setInputs] = useState({
        travelKm: '',
        electricityKwh: '',
        dietType: 'omnivore' as DietType
    });
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [saving, setSaving] = useState(false);
    const [scannedData, setScannedData] = useState<BillScanResult | null>(null);
    const [limits, setLimits] = useState({
        dailyLogged: false,
        electricityScanned: false,
        lpgScanned: false,
        loading: true,
        todayLogData: null as any | null
    });
    const { user } = useUser();
    const { triggerRefresh } = useRefresh();

    const checkLimits = React.useCallback(async () => {
        if (!user) return;

        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Fetch all relevant activities for the month in one go
            const { data: activities, error: fetchError } = await supabase
                .from('activities')
                .select('type, description, created_at, impact, metadata')
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth);

            if (fetchError) throw fetchError;

            const todayLog = activities?.find((a: { type: string; created_at: string; description: string }) =>
                a.type === 'calculator' && a.created_at >= startOfDay
            );

            setLimits({
                dailyLogged: !!todayLog,
                electricityScanned: activities?.some((a: { type: string; description: string }) =>
                    a.type === 'bill_upload' && a.description.toLowerCase().includes('electricity')
                ) || false,
                lpgScanned: activities?.some((a: { type: string; description: string }) =>
                    a.type === 'bill_upload' && a.description.toLowerCase().includes('lpg')
                ) || false,
                loading: false,
                todayLogData: todayLog || null
            });
        } catch (err) {
            console.error("Error checking limits:", err);
            // Don't show toast for initial fetch failure unless it's critical,
            // but log it clearly. If it's a TypeError: Failed to fetch, 
            // it usually means Supabase is unreachable.
            setLimits(prev => ({ ...prev, loading: false }));
        }
    }, [user]);

    React.useEffect(() => {
        if (user) {
            checkLimits();
        }
    }, [user, checkLimits]);

    const handleCalculate = () => {
        const res = calculateEmissions(inputs);
        setResult(res);
    };

    const handleBillScanComplete = (scanResult: BillScanResult) => {
        setScannedData(scanResult);

        // Create a synthetic result from the AI scan
        // Ensure we prioritize the AI's calculated emissions if available, otherwise 0
        const totalEmissions = parseFloat(scanResult.carbon_emissions.toFixed(2));

        // Map bill type to breakdown category
        const breakdown = {
            travel: 0,
            electricity: 0,
            food: 0,
            waste: 0,
            water: 0
        };

        if (scanResult.bill_type === 'electricity' || scanResult.bill_type === 'lpg') {
            breakdown.electricity = totalEmissions;
        } else if (scanResult.bill_type === 'shopping') {
            breakdown.food = totalEmissions;
        } else {
            // Fallback for unknown types
            breakdown.waste = totalEmissions;
        }

        const aiResult: CalculationResult = {
            total: totalEmissions,
            breakdown: breakdown,
            unit: 'kg CO2'
        };

        setResult(aiResult);

        // Auto-populate fields based on bill type for manual editing if needed
        if (scanResult.bill_type === 'electricity' && scanResult.extracted_data.units_consumed) {
            setInputs(prev => ({
                ...prev,
                electricityKwh: scanResult.extracted_data.units_consumed!.toString()
            }));
        }

        // Switch to manual mode removed - staying in scan mode
    };

    const handleSave = async () => {
        if (!user || !result) return;
        setSaving(true);

        try {
            // --- Usage Limits Check ---
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            if (scannedData) {
                // Bill Scanning Limit: 1 per month for Electricity and LPG
                if (scannedData.bill_type === 'electricity' || scannedData.bill_type === 'lpg') {
                    // Check if a bill of this type has already been scanned this month
                    const { count, error: limitError } = await supabase
                        .from('activities')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .eq('type', 'bill_upload')
                        .ilike('description', `%${scannedData.bill_type}%`) // Matches "electricity bill..." or "lpg bill..."
                        .gte('created_at', startOfMonth);

                    if (limitError) throw limitError;

                    if (count && count > 0) {
                        toast(`Monthly Limit Reached: You have already scanned an ${scannedData.bill_type} bill this month.`, "error");
                        setSaving(false);
                        return;
                    }
                }
            } else {
                // Manual Entry Limit: 1 per day
                const { count, error: limitError } = await supabase
                    .from('activities')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('type', 'calculator')
                    .gte('created_at', startOfDay);

                if (limitError) throw limitError;

                if (count && count > 0) {
                    toast("Daily Limit Reached: You have already logged your manual activity for today. Please come back tomorrow!", "error");
                    setSaving(false);
                    return;
                }
            }

            const { error: activityError } = await supabase
                .from('activities')
                .insert([{
                    user_id: user.id,
                    type: scannedData ? 'bill_upload' : 'calculator',
                    description: scannedData
                        ? `${scannedData.bill_type} bill scanned: ${result.total} kg CO₂`
                        : `Daily Footprint calculated: ${result.total} ${result.unit}`,
                    impact: result.total,
                    metadata: result
                }]);

            if (activityError) throw activityError;

            const earnedKarma = scannedData ? 30 : 20; // Extra karma for scanning bills!

            // Calculate savings against baseline
            // If it's a weekly calculation (manual or shopping bill), we compare against weekly baseline
            // If it's a monthly bill (electricity), we might need to adjust, but for simplicity let's compare against standard baseline
            const baseline = getAverageBaseline();
            const savings = Math.max(0, baseline - result.total);

            await updateUserStats(user.id, result.total, earnedKarma, savings);

            const streakData = await recordLogin(user.id);
            const newStreak = streakData?.current_streak || 0;

            // Check for new badges
            const badgeResult = await checkAndAwardBadges(user.id);
            let badgeMessage = "";
            if (badgeResult.success && badgeResult.newBadges && badgeResult.newBadges.length > 0) {
                const names = badgeResult.newBadges.map(b => b.name).join(", ");
                badgeMessage = `\n\n🏆 New Badges Earned: ${names}! (+${badgeResult.totalKarma} KP)`;
            }

            toast(`Saved! You earned ${earnedKarma} KP! ${scannedData ? '🎉 Bonus for scanning bill!' : ''} ${newStreak ? `Streak: ${newStreak} days!` : ''}${badgeMessage}`, "success");

            // Trigger global refresh so dashboard/profile update without reloading
            triggerRefresh('activity');

            // BACKGROUND TASK: Trigger Email Notification for manual logs
            if (!scannedData) {
                fetch('/api/actions/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        actionType: 'daily_log',
                        metadata: {
                            activityName: 'Daily Footprint & Commute',
                            impact: `${result.total} ${result.unit}`
                        }
                    })
                }).catch(err => console.error("Failed to trigger activity logged email:", err));
            }

            // Refresh limits status
            checkLimits();

            // Reset
            setScannedData(null);
            setResult(null);
        } catch (error) {
            console.error("Error saving result:", error);
            const message = error instanceof Error ? error.message : "Unknown error";
            toast(`Failed to save: ${message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Carbon Tracking & AI Scanner</h1>
                <p>Log activities manually or scan your bills for instant AI-powered carbon extraction</p>
            </header>



            {/* Mode Selector */}
            <div className={styles.modeSelector}>
                <button
                    className={`${styles.modeButton} ${mode === 'manual' ? styles.modeActive : ''}`}
                    onClick={() => setMode('manual')}
                >
                    Daily log
                </button>
                <button
                    className={`${styles.modeButton} ${mode === 'scan' ? styles.modeActive : ''}`}
                    onClick={() => setMode('scan')}
                >
                    📷 Smart Carbon Scanner
                </button>
            </div>

            <div className={styles.grid}>
                {mode === 'manual' ? (
                    <>
                        <div className={styles.column}>
                            <Card className={styles.formCard}>
                                <h2>Daily log</h2>
                                {limits.dailyLogged ? (
                                    <div className={styles.todayResultWrapper}>
                                        <div className={styles.limitBanner}>
                                            <div className={styles.limitIcon}>📅</div>
                                            <div>
                                                <p className={styles.limitTitle}>Daily Log Complete</p>
                                                <p className={styles.limitText}>You've already logged your footprint for today.</p>
                                            </div>
                                        </div>

                                    </div>
                                ) : (
                                    <DailyLogForm
                                        onCalculate={(res) => setResult(res)}
                                        baseDiet={inputs.dietType}
                                    />
                                )}
                            </Card>
                        </div>

                        <div className={styles.column}>
                            {result && !scannedData && (
                                <Card className={`${styles.resultCard} ${styles.aiResultCard}`}>
                                    <div className={styles.aiHeader}>
                                        <span className={styles.successIcon}>📊</span>
                                        <div>
                                            <h3>Log Successful</h3>
                                            <span className={styles.billTypeBadge}>DAILY FOOTPRINT</span>
                                        </div>
                                    </div>

                                    <div className={styles.aiScoreSection}>
                                        <div className={styles.aiLabel}>Calculated Impact</div>
                                        <div className={styles.aiValue}>
                                            {result.total.toFixed(2)}
                                            <span className={styles.aiUnit}>{result.unit}</span>
                                        </div>
                                    </div>

                                    <div className={styles.aiDetails}>
                                        <div className={styles.detailRow}>
                                            <span>🚗 Travel</span>
                                            <strong>{result.breakdown.travel} kg</strong>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span>⚡ Electricity</span>
                                            <strong>{result.breakdown.electricity} kg</strong>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span>🍔 Food</span>
                                            <strong>{result.breakdown.food} kg</strong>
                                        </div>
                                        <div className={styles.infoText}>
                                            ℹ️ Based on daily activity coefficients.
                                        </div>
                                    </div>

                                    <div className={styles.aiActions}>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            style={{ width: '100%', background: 'var(--color-success)', fontSize: '1.1rem', padding: '1rem' }}
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save to Dashboard'}
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {limits.dailyLogged && limits.todayLogData && (
                                <Card className={`${styles.resultCard} ${styles.aiResultCard} ${styles.staticResult}`}>
                                    <div className={styles.resultHeader}>
                                        <div className={styles.successBadge}>
                                            <Sparkles size={14} /> Logged Result
                                        </div>
                                        <span className={styles.resultDate}>
                                            {new Date(limits.todayLogData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className={styles.scoreSection}>
                                        <div className={styles.totalScore}>
                                            <span className={styles.scoreNum}>{limits.todayLogData.metadata?.total || limits.todayLogData.impact?.toFixed(2) || '0.00'}</span>
                                            <span className={styles.scoreUnit}>kg CO₂</span>
                                        </div>
                                        <p className={styles.scoreLevel}>Daily Footprint</p>
                                    </div>

                                    {limits.todayLogData.metadata?.breakdown && (
                                        <div className={styles.breakdownList}>
                                            <div className={styles.breakdownItem}>
                                                <div className={styles.itemInfo}>
                                                    <div className={`${styles.itemIcon} ${styles.travelIcon}`}>🚗</div>
                                                    <span>Travel</span>
                                                </div>
                                                <span className={styles.itemVal}>{limits.todayLogData.metadata.breakdown.travel.toFixed(2)} kg</span>
                                            </div>
                                            <div className={styles.breakdownItem}>
                                                <div className={styles.itemInfo}>
                                                    <div className={`${styles.itemIcon} ${styles.elecIcon}`}>⚡</div>
                                                    <span>Electricity</span>
                                                </div>
                                                <span className={styles.itemVal}>{limits.todayLogData.metadata.breakdown.electricity.toFixed(2)} kg</span>
                                            </div>
                                            <div className={styles.breakdownItem}>
                                                <div className={styles.itemInfo}>
                                                    <div className={`${styles.itemIcon} ${styles.foodIcon}`}>🍎</div>
                                                    <span>Food & Diet</span>
                                                </div>
                                                <span className={styles.itemVal}>{limits.todayLogData.metadata.breakdown.food.toFixed(2)} kg</span>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.column}>
                            <Card className={styles.scanCard}>
                                <h2>📷 Smart Carbon Scanner</h2>
                                <p className={styles.scanDescription}>
                                    Upload electricity, LPG, or shopping bills. AI will automatically extract and calculate CO₂ emissions using India-specific factors.
                                </p>

                                <div className={styles.limitIndicatorRow}>
                                    <div className={`${styles.limitBadge} ${limits.electricityScanned ? styles.limitReached : ''}`}>
                                        ⚡ Elec: {limits.electricityScanned ? '1/1' : '0/1'}
                                    </div>
                                    <div className={`${styles.limitBadge} ${limits.lpgScanned ? styles.limitReached : ''}`}>
                                        🔥 LPG: {limits.lpgScanned ? '1/1' : '0/1'}
                                    </div>
                                </div>

                                <BillScanner
                                    onScanComplete={handleBillScanComplete}
                                    disabled={limits.loading}
                                    disabledTypes={[
                                        ...(limits.electricityScanned ? ['electricity' as const] : []),
                                        ...(limits.lpgScanned ? ['lpg' as const] : []),
                                    ]}
                                />
                                <div className={styles.scanHint}>
                                    💡 Tip: Use clear, well-lit images for best results.
                                    <br />Supported: JPG, PNG, PDF.
                                </div>
                            </Card>
                        </div>

                        <div className={styles.column}>
                            {scannedData && (
                                <Card className={`${styles.resultCard} ${styles.aiResultCard}`}>
                                    <div className={styles.aiHeader}>
                                        <span className={styles.successIcon}>✅</span>
                                        <div>
                                            <h3>Scan Successful</h3>
                                            <span className={styles.billTypeBadge}>{scannedData.bill_type.toUpperCase()} BILL</span>
                                        </div>
                                    </div>

                                    <div className={styles.aiScoreSection}>
                                        <div className={styles.aiLabel}>Calculated Emissions</div>
                                        <div className={styles.aiValue}>
                                            {scannedData.carbon_emissions.toFixed(2)}
                                            <span className={styles.aiUnit}>kg CO₂</span>
                                        </div>
                                        {scannedData.carbon_emissions === 0 && (
                                            <div className={styles.validationError}>
                                                ⚠️ Unable to calculate. Please verify extracted units.
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.aiDetails}>
                                        <div className={styles.detailRow}>
                                            <span>Extracted Units</span>
                                            <strong>
                                                {(() => {
                                                    const d = scannedData.extracted_data;
                                                    const type = scannedData.bill_type;
                                                    if (type === 'electricity') {
                                                        if (d.units_consumed != null && d.units_consumed > 0)
                                                            return `${d.units_consumed} kWh`;
                                                        if (d.amount != null)
                                                            return `₹${d.amount} (est.)`;
                                                        return '— kWh';
                                                    }
                                                    if (type === 'lpg') {
                                                        const weight = d.cylinder_weight ?? 14.2;
                                                        return `${weight} kg`;
                                                    }
                                                    if (type === 'shopping') {
                                                        return d.total_amount != null ? `₹${d.total_amount}` : '—';
                                                    }
                                                    return d.units_consumed ?? d.total_amount ?? d.amount ?? 0;
                                                })()}
                                            </strong>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span>Emission Factor</span>
                                            <strong>{scannedData.emission_factor || 'N/A'}</strong>
                                        </div>
                                        <div className={styles.infoText}>
                                            ℹ️ Based on {scannedData.bill_type === 'electricity' ? 'India Grid Average' : 'Standard Fuel Factors'}.
                                        </div>
                                    </div>

                                    <div className={styles.aiActions}>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            style={{ width: '100%', background: 'var(--color-success)', fontSize: '1.1rem', padding: '1rem' }}
                                            onClick={handleSave}
                                            disabled={saving || scannedData.carbon_emissions === 0}
                                        >
                                            {saving ? 'Saving...' : 'Confirm & Save Activity'}
                                        </Button>
                                        <button
                                            className={styles.cancelLink}
                                            onClick={() => {
                                                setScannedData(null);
                                                setResult(null);
                                            }}
                                        >
                                            Discard & Scan Another
                                        </button>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
