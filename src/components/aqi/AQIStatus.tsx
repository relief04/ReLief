import React from 'react';
import styles from './AQIStatus.module.css';

interface AQIStatusProps {
    aqi: number;
    city: string;
    variant?: 'pill' | 'card';
}

export const AQIStatus: React.FC<AQIStatusProps> = ({ aqi, city, variant = 'pill' }) => {
    
    const getAQIDetails = (value: number) => {
        if (value <= 50) return { category: 'Good', colorClass: styles.green, recommendation: 'Air quality is considered satisfactory, and air pollution poses little or no risk.' };
        if (value <= 100) return { category: 'Moderate', colorClass: styles.yellow, recommendation: 'Air quality is acceptable; however, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.' };
        if (value <= 150) return { category: 'Unhealthy for Sensitive', colorClass: styles.orange, recommendation: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.' };
        return { category: 'Hazardous', colorClass: styles.red, recommendation: 'Health alert: The risk of health effects is increased for everyone.' };
    };

    const details = getAQIDetails(aqi);
    const requiresPulse = aqi > 100;

    if (variant === 'pill') {
        return (
            <div className={`${styles.pillContainer} ${styles.glassmorphism}`}>
                <div className={`${styles.dot} ${details.colorClass} ${requiresPulse ? styles.pulse : ''}`} />
                <span className={styles.pillAqi}>{aqi} AQI</span>
                <span className={styles.pillCity} title={city}>
                    • {city}
                </span>
            </div>
        );
    }

    return (
        <div className={`${styles.cardContainer} bento-card col-span-4`}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Local Air Quality</h3>
                <span className={styles.cardCity}>{city}</span>
            </div>
            
            <div className={styles.cardBody}>
                <div className={styles.aqiReadout}>
                    <div className={`${styles.largeDot} ${details.colorClass} ${requiresPulse ? styles.pulse : ''}`} />
                    <span className={styles.largeAqiValue}>{aqi}</span>
                </div>
                
                <div className={styles.cardInfo}>
                    <span className={`${styles.categoryLabel} ${details.colorClass}`}>{details.category}</span>
                    <p className={styles.recommendation}>{details.recommendation}</p>
                </div>
            </div>

            <div className={styles.attribution}>
                Powered by OpenWeather + AQICN
            </div>
        </div>
    );
};
