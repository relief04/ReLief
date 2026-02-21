"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Simple challenges list
const CHALLENGES = [
    "Use a reusable water bottle all day",
    "Eat a strictly plant-based meal",
    "Turn off lights when leaving a room",
    "Take a 5-minute shorter shower",
    "Bring your own bag to the store",
    "Unplug electronics not in use",
    "Pick up 3 pieces of litter outside"
];

export function DailyChallenge() {
    const [challenge, setChallenge] = useState("");
    const [completed, setCompleted] = useState(false);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        // Deterministic challenge based on date
        const today = new Date();
        const dayIndex = (today.getDate() + today.getMonth() * 30) % CHALLENGES.length;
        setChallenge(CHALLENGES[dayIndex]);

        // Check local storage
        const lastCompleted = localStorage.getItem('daily_challenge_date');
        const currentStreak = parseInt(localStorage.getItem('daily_challenge_streak') || "0");

        setStreak(currentStreak);

        if (lastCompleted === today.toDateString()) {
            setCompleted(true);
        }
    }, []);

    const handleComplete = () => {
        if (completed) return;

        const today = new Date().toDateString();
        const newStreak = streak + 1;

        setCompleted(true);
        setStreak(newStreak);

        localStorage.setItem('daily_challenge_date', today);
        localStorage.setItem('daily_challenge_streak', newStreak.toString());

        // Trigger generic confetti or animation here if we had a library
    };

    return (
        <Card style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(8, 145, 178, 0.1))', border: '1px solid var(--color-primary)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📅 Daily Eco-Challenge
                    </h3>
                    <span style={{ background: 'var(--streak-fire)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        🔥 {streak} Day Streak
                    </span>
                </div>

                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--color-text-100)' }}>
                    "{challenge}"
                </p>

                <Button
                    onClick={handleComplete}
                    disabled={completed}
                    variant={completed ? 'ghost' : 'primary'}
                    style={{ width: '100%' }}
                >
                    {completed ? '✅ Challenge Completed!' : 'Mark as Complete'}
                </Button>
            </div>
        </Card>
    );
}
