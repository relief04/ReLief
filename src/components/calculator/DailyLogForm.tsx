"use client";

import React, { useState, useEffect } from 'react';
import styles from './DailyLogForm.module.css';
import { TripLogger } from './TripLogger';
import { UsageSelector } from './UsageSelector';
import { CounterInput } from './CounterInput';
import { DailyLogInput, Trip, UsageLevel, DietType, calculateDailyLogEmissions, CalculationResult } from '@/lib/calculator';
import { Button } from '@/components/ui/Button';

interface DailyLogFormProps {
    onCalculate: (result: CalculationResult) => void;
    baseDiet?: any;
    initialData?: any;
}

export const DailyLogForm: React.FC<DailyLogFormProps> = ({ onCalculate, baseDiet, initialData }) => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [electricity, setElectricity] = useState<UsageLevel>('typical');
    const [water, setWater] = useState<UsageLevel>('typical');
    const [meals, setMeals] = useState(3);
    const [mealType, setMealType] = useState<DietType>('omnivore');
    const [dietDifferent, setDietDifferent] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            if (initialData.food?.mealsPerDay) setMeals(initialData.food.mealsPerDay);

            if (initialData.food?.diet) {
                const dietMap: Record<string, DietType> = {
                    'vegan': 'vegan',
                    'vegetarian': 'vegetarian',
                    'pescatarian': 'vegetarian',
                    'meat_no_beef': 'omnivore',
                    'meat_high': 'meat',
                };
                setMealType(dietMap[initialData.food.diet] || 'omnivore');
            }

            if (initialData.transport?.mainMode && initialData.transport?.dailyDistanceKm) {
                const modeMap: Record<string, string> = {
                    'car': 'car', 'two_wheeler': 'motorbike', 'bus': 'bus',
                    'metro': 'train', 'train': 'train', 'bicycle': 'bicycle', 'walking': 'walking'
                };
                setTrips([{
                    id: Math.random().toString(36).substring(2, 9),
                    mode: (modeMap[initialData.transport.mainMode] || 'car') as any,
                    distance: initialData.transport.dailyDistanceKm
                }]);
            }

            if (initialData.household?.electricity?.kwh) {
                const kwh = initialData.household.electricity.kwh;
                if (kwh < 150) setElectricity('low');
                else if (kwh > 400) setElectricity('high');
            }
        }
    }, [initialData]);

    const handleAddTrip = () => {
        const newTrip: Trip = {
            id: Math.random().toString(36).substr(2, 9),
            mode: 'car',
            distance: 0
        };
        setTrips([...trips, newTrip]);
    };

    const handleRemoveTrip = (id: string) => {
        setTrips(trips.filter(t => t.id !== id));
    };

    const handleUpdateTrip = (id: string, updates: Partial<Trip>) => {
        setTrips(trips.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const toggleAppliance = (id: string) => {
        if (selectedAppliances.includes(id)) {
            setSelectedAppliances(selectedAppliances.filter(a => a !== id));
        } else {
            setSelectedAppliances([...selectedAppliances, id]);
        }
    };

    const handleCalculate = () => {
        const input: DailyLogInput = {
            trips,
            electricityUsage: electricity,
            waterUsage: water,
            meals,
            mealType,
            dietDifferent,
            appliances: selectedAppliances,
            flights: [], // Option for future expansion
            hotelStays: [] // Option for future expansion
        };

        const result = calculateDailyLogEmissions(input, baseDiet || 'omnivore');
        onCalculate(result);
    };

    return (
        <div className={styles.form}>
            <TripLogger
                trips={trips}
                onAddTrip={handleAddTrip}
                onRemoveTrip={handleRemoveTrip}
                onUpdateTrip={handleUpdateTrip}
            />

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.icon}>⚡</span>
                    <span className={styles.sectionTitle}>Home Electricity</span>
                </div>
                <p className={styles.description}>Overall usage today</p>
                <UsageSelector value={electricity} onChange={setElectricity} />

                <div
                    className={`${styles.addDetails} ${showDetails ? styles.detailsActive : ''}`}
                    onClick={() => setShowDetails(!showDetails)}
                >
                    <span>Add details (AC, appliances)</span>
                    <span className={`${styles.chevron} ${showDetails ? styles.chevronRotated : ''}`}>▼</span>
                </div>

                {showDetails && (
                    <div className={styles.applianceGrid}>
                        {[
                            { id: 'ac', label: 'Air Conditioner', icon: '❄️' },
                            { id: 'heater', label: 'Water Heater', icon: '🚿' },
                            { id: 'oven', label: 'Electric Oven', icon: '🍞' },
                            { id: 'ev_charge', label: 'EV Charging', icon: '⚡' }
                        ].map(app => (
                            <button
                                key={app.id}
                                type="button"
                                className={`${styles.applianceBtn} ${selectedAppliances.includes(app.id) ? styles.activeAppliance : ''}`}
                                onClick={() => toggleAppliance(app.id)}
                            >
                                <span className={styles.appIcon}>{app.icon}</span>
                                <span className={styles.appLabel}>{app.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <CounterInput
                    label="🍴 Meals"
                    value={meals}
                    onChange={setMeals}
                />

                <div className={styles.mealTypeGroup}>
                    <label className={styles.label}>Meal Type</label>
                    <div className={styles.mealTypeSelector}>
                        {(['meat', 'omnivore', 'vegetarian', 'vegan'] as DietType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                className={`${styles.mealTypeBtn} ${mealType === type ? styles.activeMealType : ''}`}
                                onClick={() => setMealType(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.checkboxGroup}>
                    <input
                        type="checkbox"
                        id="dietDifferent"
                        checked={dietDifferent}
                        onChange={(e) => setDietDifferent(e.target.checked)}
                    />
                    <label htmlFor="dietDifferent">Diet different from usual today?</label>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <span className={styles.icon}>💧</span>
                    <span className={styles.sectionTitle}>Water Usage</span>
                </div>
                <p className={styles.description}>Water usage today</p>
                <UsageSelector value={water} onChange={setWater} />
            </div>

            <div className={styles.actions}>
                <Button onClick={handleCalculate} variant="primary" size="lg" className={styles.submitBtn}>
                    <span className={styles.checkIcon}>✓</span> Submit Daily Log
                </Button>
            </div>
        </div>
    );
};
