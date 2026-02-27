'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

// Define Tracks
export const FOCUS_TRACKS = [
    { id: 'rain', name: 'Gentle Rain', emoji: '🌧️', src: '/music/rain.mp3' },
    { id: 'forest', name: 'Forest Birds', emoji: '🐦', src: '/music/forest-birdsong.mp3' },
    { id: 'ocean', name: 'Ocean Waves', emoji: '🌊', src: '/music/ocean.mp3' },
    { id: 'wind', name: 'Mountain Wind', emoji: '🏔️', src: '/music/mountain-wind.mp3' },
];

type Track = typeof FOCUS_TRACKS[0];

type GlobalAudioContextType = {
    isPlaying: boolean;
    currentTrack: Track;
    togglePlay: () => void;
    setTrack: (track: Track) => void;
};

const GlobalAudioContext = createContext<GlobalAudioContextType>({
    isPlaying: false,
    currentTrack: FOCUS_TRACKS[0],
    togglePlay: () => { },
    setTrack: () => { },
});

export const useGlobalAudio = () => useContext(GlobalAudioContext);

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<Track>(FOCUS_TRACKS[0]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sync Audio Element
    useEffect(() => {
        if (!audioRef.current) return;

        const trackSrc = currentTrack.src;

        // Change source if needed
        if (audioRef.current.src !== trackSrc && !audioRef.current.src.endsWith(trackSrc)) {
            audioRef.current.src = trackSrc;
            audioRef.current.load();
        }

        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error("Autoplay/Playback failed:", e);
                    setIsPlaying(false);
                });
            }
        } else {
            audioRef.current.pause();
        }

    }, [isPlaying, currentTrack]);

    const togglePlay = () => setIsPlaying(!isPlaying);
    const setTrack = (track: Track) => {
        setCurrentTrack(track);
        setIsPlaying(true); // Auto-play on track switch
    };

    return (
        <GlobalAudioContext.Provider value={{ isPlaying, currentTrack, togglePlay, setTrack }}>
            {children}
            {/* Persistent Audio Element */}
            <audio ref={audioRef} loop />
        </GlobalAudioContext.Provider>
    );
}
