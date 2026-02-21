'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import styles from './Logo.module.css';

interface LogoProps {
    variant?: 'default' | 'icon' | 'footer' | 'watermark';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showText?: boolean;
    vertical?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    variant = 'default',
    size = 'md',
    className = '',
    showText = true,
    vertical = false
}) => {
    const { user } = useUser();
    const href = user ? '/dashboard' : '/';

    // Size mappings
    const iconSizes = {
        sm: { width: 36, height: 36, textSizeCls: 'text-2xl' },
        md: { width: 56, height: 56, textSizeCls: 'text-4xl' }, // Primary Navbar size
        lg: { width: 72, height: 72, textSizeCls: 'text-5xl' },
        xl: { width: 104, height: 104, textSizeCls: 'text-7xl' },
    };

    const { width, height, textSizeCls } = iconSizes[size];

    // Styles for variants
    const isFooter = variant === 'footer';
    const isWatermark = variant === 'watermark';

    if (isWatermark) {
        return (
            <div className={`relative opacity-5 grayscale pointer-events-none select-none ${className}`}>
                <Image
                    src="/logo.png"
                    alt="ReLief Watermark"
                    width={200}
                    height={200}
                    className="object-contain"
                />
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={`${styles.logoContainer} ${vertical ? 'flex-col' : ''} ${className}`}
            aria-label="ReLief Home"
        >
            <div className={styles.iconWrapper}>
                <Image
                    src="/logo.png"
                    alt="ReLief Logo"
                    width={width}
                    height={height}
                    className="object-contain drop-shadow-lg"
                    priority
                />
            </div>

            {showText && variant !== 'icon' ? (
                <div className="relative flex flex-col justify-center">
                    <span
                        className={`${styles.brandText} ${textSizeCls} ${isFooter ? '!text-gray-400 !bg-none !-webkit-text-fill-color-initial' : ''}`}
                    >
                        ReLief
                    </span>
                </div>
            ) : null}
        </Link>
    );
};
