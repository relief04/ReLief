"use client";

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import styles from './Globe3D.module.css';

const GlobeMesh = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Load textures
    // Using standard Three.js example textures
    const [colorMap, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
        'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
    ]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.1; // Counter-clockwise rotation (East to West? No, standard is CCW)

            // Add slight elliptical movement to the mesh itself for "life"
            const t = state.clock.getElapsedTime();
            meshRef.current.position.y = Math.sin(t / 2) * 0.1;
        }
    });

    return (
        <>
            <ambientLight intensity={1} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <mesh ref={meshRef} scale={2.5}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshPhongMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    shininess={5}
                />
            </mesh>
            {/* Atmosphere Glow Effect (Simplified) */}
            <mesh scale={2.55}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshBasicMaterial
                    color="#4db5ff"
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                />
            </mesh>
        </>
    );
};

const Marker = ({ position, label }: { position: [number, number, number], label: string }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <mesh position={position}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color={hovered ? "yellow" : "red"} />
            {hovered && (
                <Html distanceFactor={10}>
                    <div className={styles.tooltip}>{label}</div>
                </Html>
            )}
        </mesh>
    );
};

export const Globe3D: React.FC = () => {
    return (
        <div className={styles.canvasContainer}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <Stars radius={300} depth={60} count={5000} factor={7} saturation={0} fade speed={1} />
                <GlobeMesh />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} enablePan={false} />

                {/* Functional Markers */}
                <Marker position={[1.5, 0.5, 1.5]} label="Eco Project: Amazon" />
                <Marker position={[-1.5, -0.5, 1]} label="Reforestation: Europe" />
            </Canvas>
        </div>
    );
};
