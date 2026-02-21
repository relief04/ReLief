"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './MusicPlayer.module.css';
import { useGlobalAudio, FOCUS_TRACKS } from '@/components/providers/GlobalAudioProvider';

export const MusicPlayer: React.FC = () => {
    const { isPlaying, currentTrack, togglePlay, setTrack } = useGlobalAudio();
    const [timer, setTimer] = useState(0); // in seconds
    const [timerActive, setTimerActive] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Timer Logic
    useEffect(() => {
        if (timerActive && timer > 0) {
            intervalRef.current = setInterval(() => {
                setTimer((t) => {
                    if (t <= 1) {
                        setTimerActive(false);
                        if (isPlaying) togglePlay(); // Stop music when timer ends
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [timerActive, timer, isPlaying, togglePlay]);

    const setFocusTimer = (minutes: number) => {
        setTimer(minutes * 60);
        setTimerActive(true);
        if (!isPlaying) togglePlay();
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleNext = () => {
        const idx = FOCUS_TRACKS.findIndex(t => t.id === currentTrack.id);
        const next = FOCUS_TRACKS[(idx + 1) % FOCUS_TRACKS.length];
        setTrack(next);
    };

    const handlePrev = () => {
        const idx = FOCUS_TRACKS.findIndex(t => t.id === currentTrack.id);
        const prev = FOCUS_TRACKS[(idx - 1 + FOCUS_TRACKS.length) % FOCUS_TRACKS.length];
        setTrack(prev);
    };

    return (
        <Card className={styles.playerCard}>
            <div className={styles.visualizer}>
                <div className={styles.icon}>{currentTrack.emoji}</div>
                {isPlaying && (
                    <div className={styles.waves}>
                        <div className={styles.wave} />
                        <div className={styles.wave} />
                        <div className={styles.wave} />
                    </div>
                )}
            </div>

            <div className={styles.trackInfo}>
                <h3>{currentTrack.name}</h3>
                <p>{isPlaying ? 'Playing Now' : 'Paused'}</p>
            </div>

            <div className={styles.controls}>
                <Button variant="outline" size="sm" onClick={handlePrev}>⏮</Button>

                <Button
                    variant="primary"
                    size="lg"
                    className={styles.playBtn}
                    onClick={togglePlay}
                >
                    {isPlaying ? '⏸' : '▶'}
                </Button>

                <Button variant="outline" size="sm" onClick={handleNext}>⏭</Button>
            </div>

            <div className={styles.trackList}>
                {FOCUS_TRACKS.map(t => (
                    <button
                        key={t.id}
                        className={`${styles.trackBtn} ${currentTrack.id === t.id ? styles.active : ''}`}
                        onClick={() => setTrack(t)}
                    >
                        {t.emoji}
                    </button>
                ))}
            </div>

            <div className={styles.timerSection}>
                <h4>Focus Timer</h4>
                {timer > 0 ? (
                    <div className={styles.timerDisplay}>
                        {formatTime(timer)}
                        <button onClick={() => setTimerActive(!timerActive)} className={styles.timerControl}>
                            {timerActive ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => { setTimer(0); setTimerActive(false); }} className={styles.timerControl}>⏹</button>
                    </div>
                ) : (
                    <div className={styles.timerOptions}>
                        <button onClick={() => setFocusTimer(15)}>15m</button>
                        <button onClick={() => setFocusTimer(25)}>25m</button>
                        <button onClick={() => setFocusTimer(45)}>45m</button>
                    </div>
                )}
            </div>
        </Card>
    );
};
