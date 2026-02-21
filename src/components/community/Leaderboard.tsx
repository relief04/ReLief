"use client";
import React from 'react';
import { Card } from '@/components/ui/Card';

// Mock data for leaderboard (real app would fetch this)
const TOP_USERS = [
    { id: 1, name: "Sarah J.", points: 1250, avatar: "👩‍🌾" },
    { id: 2, name: "Mike T.", points: 980, avatar: "🚴‍♂️" },
    { id: 3, name: "EcoWarrior99", points: 845, avatar: "🌍" },
    { id: 4, name: "GreenLife", points: 720, avatar: "🌱" },
    { id: 5, name: "Alex R.", points: 650, avatar: "♻️" }
];

export function Leaderboard() {
    return (
        <Card>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                🏆 Impact Leaders
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {TOP_USERS.map((user, index) => (
                    <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: index === 0 ? 'var(--color-accent)' : index === 1 ? '#e2e8f0' : index === 2 ? '#b45309' : 'transparent',
                            color: index < 3 ? 'white' : 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                        }}>
                            {index + 1}
                        </div>
                        <div style={{ fontSize: '1.5rem' }}>{user.avatar}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>{user.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{user.points} pts</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                <a href="#" style={{ color: 'var(--color-primary)' }}>View Full Rankings →</a>
            </div>
        </Card>
    );
}
