"use client";

import React, { useState, useRef } from 'react';
import { scanBill, BillScanResult } from '@/lib/billScanningAPI';
import { Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

export function BillScanner({ onScanComplete, billType: propBillType, disabled = false, disabledTypes = [] }: BillScannerProps) {
    const [selectedBillType, setSelectedBillType] = useState<BillType | undefined>(
        propBillType && !disabledTypes.includes(propBillType) ? propBillType : undefined
    );
    
    // UI State Management strictly correlating to specification
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [scanData, setScanData] = useState<BillScanResult | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
            toast('Invalid file. Must be standard image/PDF under 10MB.', 'error');
            return;
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFileUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        }

        setStatus('processing');
        try {
            const result = await scanBill(file, selectedBillType);
            if (result.success) {
                setScanData(result);
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (err) {
            setStatus('error');
        }
    };

    const handleConfirm = () => {
        if (scanData) {
            onScanComplete(scanData);
            handleReset();
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setScanData(null);
        setFileUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={`${styles.scannerWrapper} ${disabled ? styles.disabled : ''}`}>
            {status === 'idle' && (
                <div className={styles.typeSelector}>
                    {BILL_TYPES.map(bt => {
                        const isDisabled = disabledTypes.includes(bt.value);
                        return (
                            <button
                                key={bt.value}
                                className={`${styles.typeBtn} ${selectedBillType === bt.value ? styles.typeBtnActive : ''} ${isDisabled ? styles.disabledBtn : ''}`}
                                onClick={() => !isDisabled && setSelectedBillType(bt.value)}
                                disabled={isDisabled || disabled}
                            >
                                <span>{bt.icon}</span> {bt.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div 
                className={`${styles.stateContainer} ${styles[status]} ${!selectedBillType && status === 'idle' ? styles.dropDisabled : ''}`}
                onClick={() => status === 'idle' && selectedBillType && !disabled ? fileInputRef.current?.click() : null}
            >
                {/* IDLE STATE */}
                {status === 'idle' && (
                    <>
                        <svg className={`${styles.dashedBorderSvg} motion-scanner-idle`}>
                            <rect width="100%" height="100%" rx="16" />
                        </svg>
                        <Camera className={styles.cameraIcon} size={48} />
                        <p className={styles.uploadText}>Drop your bill here or tap to upload</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileSelect}
                            className={styles.hiddenInput}
                        />
                    </>
                )}

                {/* PROCESSING STATE */}
                {status === 'processing' && (
                    <div className={styles.processingContent}>
                        <div className={styles.bouncingDots}>
                            <div className={`${styles.dot} motion-dot-1`}></div>
                            <div className={`${styles.dot} motion-dot-2`}></div>
                            <div className={`${styles.dot} motion-dot-3`}></div>
                        </div>
                        <h4 className={styles.processingHeadline}>Gemini AI is analyzing your bill...</h4>
                        <p className={styles.processingSubtext}>Auto-switching models if needed</p>
                    </div>
                )}

                {/* SUCCESS STATE */}
                {status === 'success' && scanData && (
                    <div className={styles.successContent}>
                        <div className={styles.successHeader}>
                            <CheckCircle2 color="var(--color-primary)" size={48} />
                            <h3>Scan Complete</h3>
                        </div>
                        <div className={styles.slideInSequence}>
                            <div className={styles.metricRow}>
                                <span>Total Emissions:</span>
                                <div>
                                    <CheckCircle2 size={16} className={styles.checkIcon} />
                                    <mark className={styles.emeraldHighlight}>{scanData.carbon_emissions} kg CO₂</mark>
                                </div>
                            </div>
                            <div className={styles.metricRow}>
                                <span>Confidence:</span>
                                <div>
                                    <CheckCircle2 size={16} className={styles.checkIcon} />
                                    <mark className={styles.emeraldHighlight}>{Math.round(scanData.confidence * 100)}%</mark>
                                </div>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.secondaryBtn} onClick={handleReset}>Retake</button>
                            <button className={styles.primaryBtn} onClick={handleConfirm}>Confirm & Save</button>
                        </div>
                    </div>
                )}

                {/* ERROR STATE */}
                {status === 'error' && (
                    <div className={`${styles.errorContent} motion-error-shake`}>
                        <div className={styles.warningCircle}>
                            <AlertTriangle size={36} color="var(--color-accent)" />
                        </div>
                        <h4 className={styles.errorHeadline}>AI is busy — retried with backup model</h4>
                        <p className={styles.errorSubtext}>We could not extract the data automatically.</p>
                        <button className={styles.amberRetryBtn} onClick={handleReset}>Try Again</button>
                    </div>
                )}
            </div>
        </div>
    );
}
