"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient";
import {
    ArrowRight, ArrowLeft, Leaf, Zap, Droplets, Flame,
    Car, Plane, Utensils, Smartphone, Shirt, Hotel, CheckCircle,
    Plus, Minus, Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";
import { INITIAL_DATA, OnboardingData, FuelType, TravelMode, FlightHaul, FlightClass, DietType } from "./types";
import { calculateFootprint } from "./calculations";

const TOTAL_STEPS = 14;

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useUser();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to top on step change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }, [step]);

    const nextStep = () => {
        if (step < TOTAL_STEPS + 1) { // +1 for results
            setStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
        }
    };

    // --- Handlers ---
    const updateHousehold = (field: string, value: any) => {
        setData(prev => ({
            ...prev,
            household: { ...prev.household, [field]: value }
        }));
    };

    const updateNestedHousehold = (parent: 'electricity' | 'water' | 'fuels', field: string, value: any) => {
        setData(prev => ({
            ...prev,
            household: {
                ...prev.household,
                [parent]: { ...prev.household[parent as keyof typeof prev.household] as object, [field]: value }
            }
        }));
    };

    const updateTransport = (field: string, value: any) => {
        setData(prev => ({ ...prev, transport: { ...prev.transport, [field]: value } }));
    };

    const updateFlight = (haul: FlightHaul, cls: FlightClass, delta: number) => {
        setData(prev => ({
            ...prev,
            transport: {
                ...prev.transport,
                flights: {
                    ...prev.transport.flights,
                    [haul]: {
                        ...prev.transport.flights[haul],
                        [cls]: Math.max(0, prev.transport.flights[haul][cls] + delta)
                    }
                }
            }
        }));
    };

    const updateDevice = (dev: 'smartphone' | 'laptop' | 'tv', delta: number) => {
        setData(prev => ({
            ...prev,
            lifestyle: {
                ...prev.lifestyle,
                devices: {
                    ...prev.lifestyle.devices,
                    [dev]: Math.max(0, prev.lifestyle.devices[dev] + delta)
                }
            }
        }));
    };

    const updateClothing = (item: 'tshirts' | 'jeans' | 'shoes', delta: number) => {
        setData(prev => ({
            ...prev,
            lifestyle: {
                ...prev.lifestyle,
                clothing: {
                    ...prev.lifestyle.clothing,
                    [item]: Math.max(0, prev.lifestyle.clothing[item] + delta)
                }
            }
        }));
    };

    const saveProfile = async () => {
        if (!user) return;
        setIsSubmitting(true);

        const { dailyTotal } = calculateFootprint(data);
        const yearlyKg = dailyTotal * 365;

        // Target: Reduce by 10%
        const targetYearlyKg = yearlyKg * 0.9;
        const monthlyBudget = targetYearlyKg / 12;
        const dailyLimit = monthlyBudget / 30;

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: user.fullName || user.username || 'Eco Warrior',
                    email: user.primaryEmailAddress?.emailAddress,
                    avatar_url: user.imageUrl,
                    monthly_budget: Math.round(monthlyBudget),
                    daily_limit: Math.round(dailyLimit),
                    carbon_total: Math.round(yearlyKg), // storing annual baseline
                    onboarding_completed: true,
                }, { onConflict: 'id' });

            if (error) throw error;

            // Also update carbon_budgets table which is used by Dashboard
            const { error: budgetError } = await supabase
                .from('carbon_budgets')
                .upsert({
                    user_id: user.id,
                    monthly_limit: Math.round(monthlyBudget),
                    week_start_date: new Date().toISOString() // Reset week on new budget
                }, { onConflict: 'user_id' });

            if (budgetError) {
                console.error("Error setting budget:", JSON.stringify(budgetError, null, 2));
                // Don't block onboarding completion on this, but log it
            }
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            alert("Error saving profile. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Steps ---
    const renderStep = () => {
        switch (step) {
            // STEP 1 - Household Size
            case 1:
                return (
                    <div className={styles.cardContent}>
                        <h2>How many people live in your household?</h2>
                        <p>Including yourself.</p>
                        <div className={styles.counterLarge}>
                            <button onClick={() => updateHousehold('size', Math.max(1, data.household.size - 1))}><Minus /></button>
                            <div className={styles.bigNumber}>{data.household.size}</div>
                            <button onClick={() => updateHousehold('size', data.household.size + 1)}><Plus /></button>
                        </div>
                    </div>
                );

            // STEP 2 - Electricity
            case 2:
                return (
                    <div className={styles.cardContent}>
                        <h2>Monthly Electricity Consumption</h2>
                        <p>Average usage in kWh.</p>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                value={data.household.electricity.kwh}
                                onChange={(e) => updateNestedHousehold('electricity', 'kwh', parseInt(e.target.value) || 0)}
                                className={styles.mainInput}
                            />
                            <span>kWh</span>
                        </div>
                        <div className={styles.quickButtons}>
                            {[50, 100, 200, 500].map(val => (
                                <button key={val} onClick={() => updateNestedHousehold('electricity', 'kwh', val)}>{val}</button>
                            ))}
                        </div>
                    </div>
                );

            // STEP 3 - Water
            case 3:
                return (
                    <div className={styles.cardContent}>
                        <h2>Monthly Water Consumption</h2>
                        <p>Average household usage.</p>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                value={data.household.water.usage}
                                onChange={(e) => updateNestedHousehold('water', 'usage', parseInt(e.target.value) || 0)}
                                className={styles.mainInput}
                            />
                        </div>
                        <div className={styles.toggleGroup}>
                            {['m3', 'litres', 'gallons'].map((u) => (
                                <button
                                    key={u}
                                    className={data.household.water.unit === u ? styles.active : ''}
                                    onClick={() => updateNestedHousehold('water', 'unit', u)}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            // STEP 4 - Non-Electric Fuels
            case 4:
                return (
                    <div className={styles.cardContent}>
                        <h2>Do you use non-electric fuels?</h2>
                        <p>For heating, cooking, or hot water.</p>
                        <div className={styles.selectionList}>
                            <button
                                className={!data.household.fuels.useNonElectric ? styles.selectedRow : styles.row}
                                onClick={() => {
                                    updateNestedHousehold('fuels', 'useNonElectric', false);
                                    nextStep();
                                }}
                            >
                                <span className={styles.radio}>{!data.household.fuels.useNonElectric ? '◉' : '◯'}</span>
                                No, electricity only
                            </button>
                            <button
                                className={data.household.fuels.useNonElectric ? styles.selectedRow : styles.row}
                                onClick={() => updateNestedHousehold('fuels', 'useNonElectric', true)}
                            >
                                <span className={styles.radio}>{data.household.fuels.useNonElectric ? '◉' : '◯'}</span>
                                Yes, I use other fuels
                            </button>
                        </div>
                    </div>
                );

            // STEP 5 - Fuel Types (Only if Yes in Step 4, else skip logic needed)
            case 5:
                if (!data.household.fuels.useNonElectric) {
                    setStep(step + 1); // Skip if no fuels
                    return null;
                }
                return (
                    <div className={styles.cardContent}>
                        <h2>Which fuels do you use?</h2>
                        <p>Select all that apply.</p>
                        <div className={styles.multiSelectGrid}>
                            {['natural_gas', 'lpg', 'heating_oil', 'coal', 'wood', 'district'].map(f => (
                                <button
                                    key={f}
                                    className={data.household.fuels.types.includes(f as any) ? styles.activeTile : styles.tile}
                                    onClick={() => {
                                        const current = [...data.household.fuels.types];
                                        if (current.includes(f as any)) {
                                            updateNestedHousehold('fuels', 'types', current.filter(x => x !== f));
                                        } else {
                                            updateNestedHousehold('fuels', 'types', [...current, f]);
                                        }
                                    }}
                                >
                                    {f.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            // STEP 6 - Fuel Qty
            case 6:
                if (!data.household.fuels.useNonElectric) {
                    setStep(step + 1);
                    return null;
                }
                return (
                    <div className={styles.cardContent}>
                        <h2>Average Fuel Usage</h2>
                        <p>Enter amount for your main fuel.</p>
                        <div className={styles.inputGroup}>
                            <input
                                type="number"
                                value={data.household.fuels.lpgUsage.amount}
                                onChange={(e) => {
                                    setData(prev => ({
                                        ...prev,
                                        household: {
                                            ...prev.household,
                                            fuels: {
                                                ...prev.household.fuels,
                                                lpgUsage: { ...prev.household.fuels.lpgUsage, amount: parseInt(e.target.value) || 0 }
                                            }
                                        }
                                    }))
                                }}
                                className={styles.mainInput}
                            />
                        </div>
                        <div className={styles.toggleGroup}>
                            {['litres', 'kg', 'kwh'].map((u) => (
                                <button
                                    key={u}
                                    className={data.household.fuels.lpgUsage.unit === u ? styles.active : ''}
                                    onClick={() => {
                                        setData(prev => ({
                                            ...prev,
                                            household: {
                                                ...prev.household,
                                                fuels: {
                                                    ...prev.household.fuels,
                                                    lpgUsage: { ...prev.household.fuels.lpgUsage, unit: u as any }
                                                }
                                            }
                                        }))
                                    }}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            // STEP 7 - Main Travel Mode
            case 7:
                return (
                    <div className={styles.cardContent}>
                        <h2>How do you travel most days?</h2>
                        <div className={styles.selectionList}>
                            {['car', 'two_wheeler', 'bus', 'metro', 'bicycle', 'walking', 'wfh'].map(mode => (
                                <button
                                    key={mode}
                                    className={data.transport.mainMode === mode ? styles.selectedRow : styles.row}
                                    onClick={() => updateTransport('mainMode', mode)}
                                >
                                    <span>{mode.replace('_', ' ')}</span>
                                    {data.transport.mainMode === mode && <CheckCircle size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            // STEP 8 - Travel Distance
            case 8:
                return (
                    <div className={styles.cardContent}>
                        <h2>Daily Travel Distance</h2>
                        <p>Average km per day.</p>
                        <div className={styles.selectionList}>
                            {[5, 15, 30, 50].map(km => (
                                <button
                                    key={km}
                                    className={data.transport.dailyDistanceKm === km ? styles.selectedRow : styles.row}
                                    onClick={() => updateTransport('dailyDistanceKm', km)}
                                >
                                    {km === 5 ? '0-5 km' : km === 15 ? '6-15 km' : km === 30 ? '16-30 km' : '31-50 km'}
                                </button>
                            ))}
                            <div className={styles.inputGroup} style={{ marginBottom: 0, marginTop: '1rem' }}>
                                <input
                                    type="number"
                                    className={styles.mainInput}
                                    style={{ fontSize: '2rem', width: '120px' }}
                                    value={data.transport.dailyDistanceKm}
                                    onChange={(e) => updateTransport('dailyDistanceKm', parseInt(e.target.value) || 0)}
                                />
                                <span style={{ fontSize: '1.2rem' }}>km</span>
                            </div>
                        </div>
                    </div>
                );

            // STEP 9 - Flights
            case 9:
                return (
                    <div className={styles.cardContent}>
                        <h2>Annual Flights</h2>
                        <div className={styles.scrollArea}>
                            {['short', 'medium', 'long'].map(haul => (
                                <div key={haul} className={styles.flightGroup}>
                                    <h3>{haul.charAt(0).toUpperCase() + haul.slice(1)} Haul</h3>
                                    <div className={styles.flightClasses}>
                                        {['economy', 'premium', 'business', 'first'].map(cls => (
                                            <div key={cls} className={styles.counterRow}>
                                                <span>{cls}</span>
                                                <div className={styles.counterSmall}>
                                                    <button onClick={() => updateFlight(haul as FlightHaul, cls as FlightClass, -1)}>-</button>
                                                    <span>{data.transport.flights[haul as FlightHaul][cls as FlightClass]}</span>
                                                    <button onClick={() => updateFlight(haul as FlightHaul, cls as FlightClass, 1)}>+</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            // STEP 10 - Diet
            case 10:
                return (
                    <div className={styles.cardContent}>
                        <h2>Dietary Preference</h2>
                        <div className={styles.selectionList}>
                            {['vegan', 'vegetarian', 'pescatarian', 'meat_no_beef', 'meat_high'].map(diet => (
                                <button
                                    key={diet}
                                    className={data.food.diet === diet ? styles.selectedRow : styles.row}
                                    onClick={() => setData(prev => ({ ...prev, food: { ...prev.food, diet: diet as any } }))}
                                >
                                    <span>{diet.replace(/_/g, ' ')}</span>
                                    {data.food.diet === diet && <CheckCircle size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            // STEP 11 - Meals
            case 11:
                return (
                    <div className={styles.cardContent}>
                        <h2>Meals per day</h2>
                        <div className={styles.quickButtons}>
                            {[1, 2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    className={data.food.mealsPerDay === num ? styles.activeTile : styles.tile}
                                    style={{ width: '80px' }}
                                    onClick={() => setData(prev => ({ ...prev, food: { ...prev.food, mealsPerDay: num } }))}
                                >
                                    {num}{num === 4 ? '+' : ''}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            // STEP 12 - Devices
            case 12:
                return (
                    <div className={styles.cardContent}>
                        <h2>Personal Devices</h2>
                        <div className={styles.selectionList}>
                            {['smartphone', 'laptop', 'tv'].map(dev => (
                                <div key={dev} className={styles.counterRow} style={{ padding: '1rem', background: 'var(--color-bg-50)', borderRadius: '16px' }}>
                                    <span className="capitalize" style={{ fontSize: '1.2rem' }}>{dev}</span>
                                    <div className={styles.counterSmall}>
                                        <button onClick={() => updateDevice(dev as any, -1)}>-</button>
                                        <span>{data.lifestyle.devices[dev as keyof typeof data.lifestyle.devices]}</span>
                                        <button onClick={() => updateDevice(dev as any, 1)}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            // STEP 13 - Hotel
            case 13:
                return (
                    <div className={styles.cardContent}>
                        <h2>Annual Hotel Nights</h2>
                        <div className={styles.counterLarge}>
                            <button onClick={() => setData(p => ({ ...p, lifestyle: { ...p.lifestyle, hotelNights: Math.max(0, p.lifestyle.hotelNights - 1) } }))}><Minus /></button>
                            <div className={styles.bigNumber}>{data.lifestyle.hotelNights}</div>
                            <button onClick={() => setData(p => ({ ...p, lifestyle: { ...p.lifestyle, hotelNights: p.lifestyle.hotelNights + 1 } }))}><Plus /></button>
                        </div>
                    </div>
                );

            // STEP 14 - Clothing
            case 14:
                return (
                    <div className={styles.cardContent}>
                        <h2>New Clothing Purchases</h2>
                        <div className={styles.toggleGroup}>
                            <button
                                className={data.lifestyle.clothing.period === 'monthly' ? styles.active : ''}
                                onClick={() => setData(p => ({ ...p, lifestyle: { ...p.lifestyle, clothing: { ...p.lifestyle.clothing, period: 'monthly' } } }))}
                            >Monthly</button>
                            <button
                                className={data.lifestyle.clothing.period === 'yearly' ? styles.active : ''}
                                onClick={() => setData(p => ({ ...p, lifestyle: { ...p.lifestyle, clothing: { ...p.lifestyle.clothing, period: 'yearly' } } }))}
                            >Yearly</button>
                        </div>
                        <div className={styles.selectionList}>
                            {['tshirts', 'jeans', 'shoes'].map(item => (
                                <div key={item} className={styles.counterRow} style={{ padding: '1rem', background: 'var(--color-bg-50)', borderRadius: '16px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
                                    <div className={styles.counterSmall}>
                                        <button onClick={() => updateClothing(item as any, -1)}>-</button>
                                        <span>{data.lifestyle.clothing[item as keyof typeof data.lifestyle.clothing]}</span>
                                        <button onClick={() => updateClothing(item as any, 1)}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    // --- Final Results ---
    if (step > TOTAL_STEPS) {
        const { dailyTotal, breakdown } = calculateFootprint(data);
        // Thresholds: India ~6.6t/y ~18kg/d? No, India per capita is low, ~2.7t/y => ~7.4kg/d. Global avg ~4.7t/y => 12.8kg/d.
        // Let's use conservative targets. 
        const isBelowAvg = dailyTotal < 8;
        const isHigh = dailyTotal > 15;

        return (
            <div className={styles.resultsContainer}>
                <div className={styles.resultHeader}>
                    <h1>Your Carbon Profile</h1>
                    <p>Personalized Analysis</p>
                </div>

                <div className={styles.mainScore}>
                    <div className={styles.scoreCircle}>
                        <span className={styles.scoreVal}>{dailyTotal.toFixed(1)}</span>
                        <span className={styles.scoreUnit}>kg CO₂ / day</span>
                    </div>
                    <div className={styles.statusBadge}>
                        {isBelowAvg ? '🌱 Eco-Friendly' : isHigh ? '⚠️ High Impact' : '⚖️ Average'}
                    </div>
                </div>

                <div className={styles.breakdown}>
                    <h3>Impact Breakdown</h3>
                    {Object.entries(breakdown).map(([key, val]) => (
                        <div key={key} className={styles.barRow}>
                            <div className={styles.barLabel}>
                                <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span>{val.toFixed(1)}</span>
                            </div>
                            <div className={styles.barTrack}>
                                <div
                                    style={{
                                        width: `${Math.min(100, (val / dailyTotal) * 100)}%`
                                    }}
                                    className={styles.barFill}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.footerSticky}>
                    <Button variant="primary" size="lg" className="w-full shadow-lg" onClick={saveProfile} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving Profile...' : 'Continue to Dashboard'}
                    </Button>
                </div>
            </div>
        );
    }

    // --- Validation ---
    const isStepValid = () => {
        switch (step) {
            case 4: return data.household.fuels.useNonElectric !== null;
            case 5: return !data.household.fuels.useNonElectric || data.household.fuels.types.length > 0;
            case 7: return data.transport.mainMode !== null;
            case 10: return data.food.diet !== null;
            default: return true;
        }
    };

    // --- Wizard Wrapper ---
    return (
        <div className={styles.container}>
            {/* Background Animation Elements */}
            <div className={styles.bgLeaf1}><Leaf size={120} /></div>
            <div className={styles.bgLeaf2}><Leaf size={160} /></div>

            <div className={styles.progressContainer}>
                <div className={styles.topNav}>
                    <button onClick={prevStep} disabled={step === 1} className={styles.navBtn}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className={styles.stepIndicator}>Step {step} / {TOTAL_STEPS}</div>
                    <div className={styles.navBtnPlaceholder}></div>
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div>
                </div>
            </div>

            <div className={styles.wizardContent} ref={scrollRef as any}>
                <div className={styles.slideAnimation} key={step}>
                    {renderStep()}
                </div>
            </div>

            <div className={styles.footerSticky}>
                <Button
                    variant="primary"
                    size="lg"
                    className="w-full shadow-premium"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
