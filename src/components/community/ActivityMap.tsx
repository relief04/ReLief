"use client";
import React from 'react';
import { Card } from '@/components/ui/Card';
import styles from './ActivityMap.module.css';

export function ActivityMap() {
    return (
        <Card className={styles.mapCard}>
            <div className={styles.header}>
                <h3>🌍 Community Activity Map</h3>
                <p>See where eco-actions are happening around you</p>
            </div>

            <div className={styles.mapContainer}>
                <div className={styles.mapPlaceholder}>
                    <span className={styles.mapIcon}>🗺️</span>
                    <p>Interactive Map Integration</p>
                    <span className={styles.subtext}>
                        Map view will display user activities, events, and groups near you.
                        (Requires Map Provider Integration)
                    </span>
                </div>

                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: '#2ecc71' }}></span>
                        <span>Cleanups</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: '#3498db' }}></span>
                        <span>Events</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.dot} style={{ background: '#e74c3c' }}></span>
                        <span>Groups</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
