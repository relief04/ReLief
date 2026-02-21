import React from 'react';
import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
    type?: 'post' | 'card' | 'list' | 'profile';
    count?: number;
}

export function SkeletonLoader({ type = 'card', count = 1 }: SkeletonLoaderProps) {
    const renderSkeleton = () => {
        switch (type) {
            case 'post':
                return (
                    <div className={styles.skeletonPost}>
                        <div className={styles.skeletonHeader}>
                            <div className={styles.skeletonAvatar} />
                            <div className={styles.skeletonInfo}>
                                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '40%' }} />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '80%' }} />
                        </div>
                        <div className={styles.skeletonActions}>
                            <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
                        </div>
                    </div>
                );

            case 'card':
                return (
                    <div className={styles.skeletonCard}>
                        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '90%' }} />
                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '70%' }} />
                    </div>
                );

            case 'list':
                return (
                    <div className={styles.skeletonListItem}>
                        <div className={styles.skeletonAvatar} />
                        <div className={styles.skeletonInfo}>
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '60%' }} />
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className={styles.skeletonProfile}>
                        <div className={styles.skeletonLargeAvatar} />
                        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: '50%', margin: '1rem auto' }} />
                        <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: '70%', margin: '0 auto' }} />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index}>
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
}
