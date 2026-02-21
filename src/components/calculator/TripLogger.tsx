"use client";

import React from 'react';
import styles from './TripLogger.module.css';
import { Trip, TravelMode } from '@/lib/calculator';
import { Card } from '@/components/ui/Card';

interface TripLoggerProps {
    trips: Trip[];
    onAddTrip: () => void;
    onRemoveTrip: (id: string) => void;
    onUpdateTrip: (id: string, updates: Partial<Trip>) => void;
}

export const TripLogger: React.FC<TripLoggerProps> = ({
    trips,
    onAddTrip,
    onRemoveTrip,
    onUpdateTrip
}) => {
    const modes: { id: TravelMode; label: string; icon: string }[] = [
        { id: 'car', label: 'Car', icon: '🚗' },
        { id: 'bus', label: 'Bus', icon: '🚌' },
        { id: 'train', label: 'Train', icon: '🚆' },
        { id: 'motorcycle', label: 'Bike', icon: '🏍️' },
        { id: 'ebike', label: 'E-bike', icon: '⚡🚲' },
        { id: 'bike', label: 'Bicycle', icon: '🚲' },
        { id: 'walk', label: 'Walk', icon: '🚶' },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <label className={styles.mainLabel}>Trips Today</label>
            </div>

            <div className={styles.tripsList}>
                {trips.map((trip, index) => (
                    <Card key={trip.id} className={styles.tripCard}>
                        <div className={styles.tripHeader}>
                            <span className={styles.tripTitle}>Trip {index + 1}</span>
                            <button
                                type="button"
                                className={styles.removeBtn}
                                onClick={() => onRemoveTrip(trip.id)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modeGrid}>
                            {modes.map((mode) => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    className={`${styles.modeButton} ${trip.mode === mode.id ? styles.activeMode : ''}`}
                                    onClick={() => onUpdateTrip(trip.id, { mode: mode.id })}
                                >
                                    <span className={styles.modeIcon}>{mode.icon}</span>
                                    <span className={styles.modeLabel}>{mode.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                placeholder="Distance (km)"
                                value={trip.distance || ''}
                                onChange={(e) => onUpdateTrip(trip.id, { distance: parseFloat(e.target.value) || 0 })}
                                className={styles.distanceInput}
                            />
                        </div>
                    </Card>
                ))}
            </div>

            <button type="button" className={styles.addBtn} onClick={onAddTrip}>
                <span className={styles.plus}>+</span> Add Trip
            </button>
        </div>
    );
};
