"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';
import styles from './InteractiveGlobe.module.css';

const Earth = () => {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();
        if (earthRef.current) {
            earthRef.current.rotation.y = elapsedTime / 6; // Earth rotation
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = elapsedTime / 5; // Clouds slightly faster
        }
    });

    return (
        <group>
            {/* Earth Sphere */}
            <Sphere ref={earthRef} args={[2.8, 64, 64]}>
                <meshStandardMaterial
                    color="#2ecc71" // Base Green for "Relief" / Eco theme
                    roughness={0.7}
                    metalness={0.1}
                />
            </Sphere>

            {/* Atmosphere/Glow Halo (Simulated with another sphere) */}
            <Sphere args={[2.8, 64, 64]}>
                <meshStandardMaterial
                    color="#3498db"
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                />
            </Sphere>

            {/* Simple Clouds (Wireframe or noise for style) */}
            <Sphere ref={cloudsRef} args={[2.85, 64, 64]}>
                <meshStandardMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.3}
                    wireframe
                />
            </Sphere>
        </group>
    );
};

export const InteractiveGlobe: React.FC = () => {
    return (
        <div className={styles.globeWrapper}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#fcfcff" />
                <Stars radius={300} depth={60} count={10000} factor={7} saturation={0} fade speed={1} />
                <Earth />
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />
            </Canvas>
        </div>
    );
};
