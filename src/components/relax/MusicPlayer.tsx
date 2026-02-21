"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './MusicPlayer.module.css';


const TRACKS = [
    { id: 'rain', name: 'Gentle Rain', emoji: '🌧️', src: '/music/rain.mp3' },
    { id: 'forest', name: 'Forest Birds', emoji: '🐦', src: '/music/forest.mp3' },
    { id: 'ocean', name: 'Ocean Waves', emoji: '🌊', src: '/music/ocean.mp3' },
    { id: 'wind', name: 'Mountain Wind', emoji: '🏔️', src: '/music/mountain-wind.mp4' },
];

export const MusicPlayer: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(TRACKS[0]);
    const [timer, setTimer] = useState(0); // in seconds
    const [timerActive, setTimerActive] = useState(false);

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Sync Audio Element with State
    useEffect(() => {
        if (audioRef.current) {
            // Reload audio source if track changed
            if (audioRef.current.src !== window.location.origin + currentTrack.src) {
                audioRef.current.src = currentTrack.src;
                audioRef.current.load();
            }

            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Playback failed likely due to autoplay policy:", error);
                        setIsPlaying(false);
                    });
                }
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrack]);

    const handlePlayError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        console.error("Audio playback error", e);
        setIsPlaying(false);
        // alert("Could not play audio. Check file paths.");
    };

    // Timer Logic
    useEffect(() => {
        if (timerActive && timer > 0) {
            intervalRef.current = setInterval(() => {
                setTimer((t) => {
                    if (t <= 1) {
                        setTimerActive(false);
                        setIsPlaying(false); // Stop music when timer ends
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [timerActive, timer]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const setFocusTimer = (minutes: number) => {
        setTimer(minutes * 60);
        setTimerActive(true);
        setIsPlaying(true);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleNext = () => {
        const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
        const next = TRACKS[(idx + 1) % TRACKS.length];
        setCurrentTrack(next);
        // Keep playing if already playing, or start playing if user clicks next (optional, but often desired)
        setIsPlaying(true);
    };

    const handlePrev = () => {
        const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
        const prev = TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length];
        setCurrentTrack(prev);
        setIsPlaying(true);
    };

    return (
        <Card className={styles.playerCard}>
            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                loop
                onError={handlePlayError}
                onEnded={() => setIsPlaying(false)}
            />

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
                {TRACKS.map(t => (
                    <button
                        key={t.id}
                        className={`${styles.trackBtn} ${currentTrack.id === t.id ? styles.active : ''}`}
                        onClick={() => { setCurrentTrack(t); setIsPlaying(true); }}
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
