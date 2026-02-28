"use client";

import React, { useState, useRef } from 'react';
import { scanBill, BillScanResult } from '@/lib/billScanningAPI';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import styles from './BillScanner.module.css';

type BillType = 'electricity' | 'lpg' | 'shopping';

interface BillScannerProps {
    onScanComplete: (result: BillScanResult) => void;
    billType?: BillType;
    disabled?: boolean;
    disabledTypes?: BillType[];
}

const BILL_TYPES: { value: BillType; label: string; icon: string; color: string }[] = [
    { value: 'electricity', label: 'Electricity', icon: '⚡', color: '#f59e0b' },
    { value: 'lpg', label: 'LPG / Gas', icon: '🔥', color: '#ef4444' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
];

/** Returns the primary display value and its unit label for a scan result */
function getPrimaryMetric(result: BillScanResult): { value: string; unit: string; label: string } {
    const type = result.bill_type?.toLowerCase();
    const d = result.extracted_data;

    if (type === 'electricity') {
        if (d.units_consumed != null && d.units_consumed > 0) {
            return { value: d.units_consumed.toString(), unit: 'kWh', label: 'Units Consumed' };
        }
        if (d.amount != null) {
            return { value: `₹${d.amount}`, unit: '(estimated from amount)', label: 'Bill Amount' };
        }
    }
    if (type === 'lpg') {
        const weight = d.cylinder_weight ?? 14.2;
        return { value: `${weight}`, unit: 'kg', label: 'Cylinder Weight' };
    }
    if (type === 'shopping') {
        if (d.total_amount != null) {
            return { value: `₹${d.total_amount}`, unit: '', label: 'Total Amount' };
        }
    }
    // Fallback
    if (d.total_amount != null) return { value: `₹${d.total_amount}`, unit: '', label: 'Total Amount' };
    if (d.amount != null) return { value: `₹${d.amount}`, unit: '', label: 'Amount' };
    return { value: '—', unit: '', label: 'Value' };
}

export function BillScanner({ onScanComplete, billType: propBillType, disabled = false, disabledTypes = [] }: BillScannerProps) {
    const [selectedBillType, setSelectedBillType] = useState<BillType | undefined>(
        propBillType && !disabledTypes.includes(propBillType) ? propBillType : undefined
    );
    const [uploading, setUploading] = useState(false);
    const [progressStep, setProgressStep] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [verificationData, setVerificationData] = useState<BillScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const progressInterval = useRef<NodeJS.Timeout | null>(null);

    const STEPS = [
        "Uploading Bill...",
        "AI Analyzing Image (Gemini)...",
        "Extracting Usage Data...",
        "Calculating Carbon Footprint...",
        "Finalizing...",
    ];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a JPG, PNG, or PDF file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setError(null);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }

        await processBill(file);
    };

    const startProgressSimulation = () => {
        setProgressStep(0);
        if (progressInterval.current) clearInterval(progressInterval.current);
        progressInterval.current = setInterval(() => {
            setProgressStep(prev => {
                if (prev >= STEPS.length - 1) {
                    if (progressInterval.current) clearInterval(progressInterval.current);
                    return prev;
                }
                return prev + 1;
            });
        }, 1500);
    };

    const { toast } = useToast();

    const processBill = async (file: File) => {
        setUploading(true);
        setError(null);
        setVerificationData(null);
        startProgressSimulation();

        try {
            const result = await scanBill(file, selectedBillType);
            if (result.success) {
                setVerificationData(result);
            } else {
                const errorMsg = result.message || 'Failed to process bill';
                setError(errorMsg);
                toast(errorMsg, 'error');
            }
        } catch (err) {
            console.error('Bill scanning error:', err);
            const errorMsg = err instanceof Error ? err.message : 'Failed to scan bill. Please try again.';
            setError(errorMsg);
            toast(errorMsg, 'error');
        } finally {
            if (progressInterval.current) clearInterval(progressInterval.current);
            setUploading(false);
            setProgressStep(0);
        }
    };

    const handleConfirm = () => {
        if (verificationData) {
            onScanComplete(verificationData);
            setVerificationData(null);
            setPreview(null);
        }
    };

    const handleCancel = () => {
        setVerificationData(null);
        setPreview(null);
        setError(null);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const detectedType = verificationData
        ? BILL_TYPES.find(t => t.value === verificationData.bill_type?.toLowerCase())
        : null;

    const primaryMetric = verificationData ? getPrimaryMetric(verificationData) : null;

    return (
        <div className={`${styles.container} ${preview ? styles.hasPreview : ''} ${disabled ? styles.disabled : ''}`}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
            />

            {/* ── Bill Type Selector ── */}
            {!uploading && !verificationData && (
                <div className={styles.typeSelector}>
                    <p className={styles.typeSelectorLabel}>Select bill type <span style={{ color: 'var(--color-danger, #ef4444)', fontWeight: 600 }}>*</span> <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(required)</span></p>
                    <div className={styles.typeButtons}>
                        {BILL_TYPES.map(bt => {
                            const isDisabled = disabledTypes.includes(bt.value);
                            return (
                                <button
                                    key={bt.value}
                                    className={`${styles.typeBtn} ${selectedBillType === bt.value ? styles.typeBtnActive : ''} ${isDisabled ? styles.typeBtnDisabled : ''}`}
                                    style={selectedBillType === bt.value && !isDisabled ? { '--btn-color': bt.color } as React.CSSProperties : {}}
                                    onClick={() => !isDisabled && setSelectedBillType(bt.value)}
                                    type="button"
                                    disabled={isDisabled}
                                    title={isDisabled ? 'Already uploaded this month' : ''}
                                >
                                    <span className={styles.typeBtnIcon}>{bt.icon}</span>
                                    <span>{bt.label}</span>
                                    {isDisabled && (
                                        <span style={{
                                            display: 'block',
                                            fontSize: '0.65rem',
                                            color: '#22c55e',
                                            fontWeight: 600,
                                            marginTop: '2px'
                                        }}>✓ Done this month</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Drop Zone ── */}
            {!preview && !uploading && !verificationData && (
                !selectedBillType ? (
                    <div className={styles.dropzone} style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
                        <div className={styles.icon}>📄</div>
                        <p style={{ color: 'var(--color-danger, #ef4444)', fontWeight: 600 }}>Please select a bill type above first</p>
                        <span className={styles.browseBtn} style={{ opacity: 0.4 }}>Browse Files</span>
                    </div>
                ) : (
                    <div
                        className={`${styles.dropzone} ${disabled ? styles.dropzoneDisabled : ''}`}
                        onClick={disabled ? undefined : triggerFileInput}
                    >
                        <div className={styles.icon}>📄</div>
                        <p>Click or drag bill here</p>
                        <span className={styles.browseBtn}>Browse Files</span>
                    </div>
                )
            )}

            {/* ── Image Preview ── */}
            {preview && !verificationData && !uploading && (
                <div className={styles.previewContainer}>
                    <img src={preview} alt="Bill preview" className={styles.previewImage} />
                    <div className={styles.previewOverlay}>
                        <button onClick={triggerFileInput} className={styles.changeBtn}>Change File</button>
                    </div>
                </div>
            )}

            {/* ── Loading / Progress ── */}
            {uploading && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p className={styles.progressText}>{STEPS[progressStep]}</p>
                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressBar}
                            style={{ width: `${((progressStep + 1) / STEPS.length) * 100}%` }}
                        />
                    </div>
                    {progressStep >= 3 && (
                        <p className={styles.slowMessage}>Taking a bit longer? Gemini AI is doing its magic...</p>
                    )}
                </div>
            )}

            {/* ── Verification / Result ── */}
            {verificationData && (
                <div className={styles.verification}>
                    <div className={styles.successIcon}>✅</div>
                    <h3>Scan Complete!</h3>

                    {/* Detected bill type badge */}
                    {detectedType && (
                        <div className={styles.detectedBadge} style={{ '--badge-color': detectedType.color } as React.CSSProperties}>
                            <span>{detectedType.icon}</span>
                            <span>{detectedType.label} Bill</span>
                        </div>
                    )}

                    {/* Emissions highlight */}
                    <div className={styles.emissionsHighlight}>
                        <span className={styles.emissionsVal}>{verificationData.carbon_emissions}</span>
                        <span className={styles.emissionsUnit}>kg CO₂</span>
                    </div>

                    <div className={styles.dataGrid}>
                        {/* Primary metric with correct unit */}
                        {primaryMetric && (
                            <div className={styles.dataItem}>
                                <label>{primaryMetric.label}</label>
                                <span>{primaryMetric.value} <small>{primaryMetric.unit}</small></span>
                            </div>
                        )}

                        {/* Emission factor */}
                        <div className={styles.dataItem}>
                            <label>Emission Factor</label>
                            <span>
                                {verificationData.emission_factor}
                                {' '}
                                <small>
                                    {verificationData.bill_type === 'electricity' && 'kg CO₂/kWh'}
                                    {verificationData.bill_type === 'lpg' && 'kg CO₂/kg'}
                                    {verificationData.bill_type === 'shopping' && 'kg CO₂/₹'}
                                </small>
                            </span>
                        </div>

                        {/* Bill date / refill date / purchase date */}
                        {verificationData.extracted_data.bill_date && (
                            <div className={styles.dataItem}>
                                <label>Bill Date</label>
                                <span>{verificationData.extracted_data.bill_date}</span>
                            </div>
                        )}
                        {verificationData.extracted_data.refill_date && (
                            <div className={styles.dataItem}>
                                <label>Refill Date</label>
                                <span>{verificationData.extracted_data.refill_date}</span>
                            </div>
                        )}
                        {verificationData.extracted_data.purchase_date && (
                            <div className={styles.dataItem}>
                                <label>Purchase Date</label>
                                <span>{verificationData.extracted_data.purchase_date}</span>
                            </div>
                        )}

                        {/* Provider */}
                        {verificationData.extracted_data.provider && (
                            <div className={styles.dataItem}>
                                <label>Provider</label>
                                <span>{verificationData.extracted_data.provider}</span>
                            </div>
                        )}

                        {/* Confidence */}
                        <div className={styles.dataItem}>
                            <label>AI Confidence</label>
                            <span>{Math.round(verificationData.confidence * 100)}%</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button onClick={handleCancel} className={styles.cancelBtn}>Discard & Scan Another</button>
                        <button onClick={handleConfirm} className={styles.confirmBtn}>Confirm &amp; Save</button>
                    </div>
                </div>
            )}

            {/* ── Error ── */}
            {error && (
                <div className={styles.error}>
                    <p>⚠️ Couldn't scan the bill. Please try again with a clearer image.</p>
                    <button onClick={handleCancel} className={styles.retryButton}>Try Again</button>
                </div>
            )}
        </div>
    );
}
