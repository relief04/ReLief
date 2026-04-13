import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { BillScanner } from '../bills/BillScanner';
import { BillScanResult } from '@/lib/billScanningAPI';
import styles from './FloatingAIScanner.module.css';

interface FloatingAIScannerProps {
    onScanComplete?: (data: BillScanResult) => void;
}

export const FloatingAIScanner: React.FC<FloatingAIScannerProps> = ({ onScanComplete }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleComplete = (data: BillScanResult) => {
        if (onScanComplete) onScanComplete(data);
        setTimeout(() => setIsOpen(false), 1500); // Close shortly after confirm
    };

    return (
        <>
            {/* The Floating Amber Trigger */}
            <div className={styles.triggerWrapper}>
                <div className={styles.glowRing} />
                <button 
                    className={styles.fab} 
                    onClick={() => setIsOpen(true)}
                    aria-label="Open AI Scanner"
                >
                    <Camera size={24} />
                </button>
            </div>

            {/* Glassmorphism Modal */}
            {isOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
                    <div 
                        className={styles.modalContent} 
                        onClick={(e) => e.stopPropagation()} // Prevent close on modal click
                    >
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                            <X size={24} />
                        </button>
                        
                        <div className={styles.modalHeader}>
                            <h2>Gemini AI Scanner</h2>
                            <p>Upload electricity, gas, or shopping bill</p>
                        </div>

                        <div className={styles.scannerBoundary}>
                            <BillScanner onScanComplete={handleComplete} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
