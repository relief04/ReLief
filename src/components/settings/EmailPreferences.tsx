"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';
import styles from './EmailPreferences.module.css';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';

// Mock types for our preferences based on the strategic plan
type EmailPrefs = {
    weeklySummary: boolean;
    communityActivity: boolean;
    eventReminders: boolean;
    leaderboardUpdates: boolean;
    aqiAlerts: boolean;
    educationalContent: boolean;
};

export const EmailPreferences = () => {
    const { user } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initial state
    const [prefs, setPrefs] = useState<EmailPrefs>({
        weeklySummary: true,
        communityActivity: true,
        eventReminders: true,
        leaderboardUpdates: true,
        aqiAlerts: false,
        educationalContent: true,
    });

    useEffect(() => {
        async function fetchPreferences() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('email_preferences')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching preferences:', error);
                    return;
                }

                if (data && data.email_preferences) {
                    setPrefs(prev => ({ ...prev, ...data.email_preferences }));
                }
            } catch (err) {
                console.error("Failed to load preferences", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPreferences();
    }, [user]);

    const handleToggle = (key: keyof EmailPrefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ email_preferences: prefs })
                .eq('id', user.id);

            if (error) throw error;
            toast.success("Preferences Saved", { duration: 2000 });
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error("Failed to save preferences", { duration: 3000 });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div style={{ padding: '2rem', color: 'var(--color-primary)' }}>Loading preferences...</div>;
    }

    return (
        <div className={styles.preferencesContainer}>
            <div className={styles.preferenceGroup}>
                <div className={styles.preferenceItem}>
                    <div className={styles.itemInfo}>
                        <h3 className={styles.itemTitle}>📊 Weekly Impact Summary</h3>
                        <p className={styles.itemDescription}>Your personalized carbon report, emitted trends, and eco-tips delivered every Sunday.</p>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={prefs.weeklySummary}
                            onChange={() => handleToggle('weeklySummary')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.preferenceItem}>
                    <div className={styles.itemInfo}>
                        <h3 className={styles.itemTitle}>👥 Community Activity</h3>
                        <p className={styles.itemDescription}>Get notified when someone interacts with your posts, replies to your comments, or invites you to groups.</p>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={prefs.communityActivity}
                            onChange={() => handleToggle('communityActivity')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.preferenceItem}>
                    <div className={styles.itemInfo}>
                        <h3 className={styles.itemTitle}>📅 Event Reminders</h3>
                        <p className={styles.itemDescription}>Stay updated on nearby eco-initiatives and get 24h reminders for events you RSVP'd to.</p>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={prefs.eventReminders}
                            onChange={() => handleToggle('eventReminders')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.preferenceItem}>
                    <div className={styles.itemInfo}>
                        <h3 className={styles.itemTitle}>🏆 Leaderboard Updates</h3>
                        <p className={styles.itemDescription}>Celebrate milestones and know when you move up (or down) the local rankings.</p>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={prefs.leaderboardUpdates}
                            onChange={() => handleToggle('leaderboardUpdates')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.preferenceItem}>
                    <div className={styles.itemInfo}>
                        <h3 className={styles.itemTitle}>🌬️ Severe AQI Alerts</h3>
                        <p className={styles.itemDescription}>Receive crucial and timely warnings when the air quality in your registered location becomes hazardous.</p>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={prefs.aqiAlerts}
                            onChange={() => handleToggle('aqiAlerts')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.preferenceItem}>
                    <div className={styles.itemInfo}>
                        <h3 className={styles.itemTitle}>🧠 Eco Education & News</h3>
                        <p className={styles.itemDescription}>Receive updates on new quizzes, badges, and important environmental policy changes.</p>
                    </div>
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            checked={prefs.educationalContent}
                            onChange={() => handleToggle('educationalContent')}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>

            <div className={styles.saveActions}>
                <Button
                    variant="primary"
                    size="md"
                    onClick={handleSave}
                    disabled={isSaving}
                    isLoading={isSaving}
                >
                    {isSaving ? 'Saving Preferences...' : 'Save Preferences'}
                </Button>
            </div>
        </div>
    );
};
