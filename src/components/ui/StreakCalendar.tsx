'use client';

import React, { useEffect, useState } from 'react';
import { getMonthLoginDates } from '@/lib/streakUtils';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import styles from './StreakCalendar.module.css';

interface StreakCalendarProps {
    userId: string;
    currentStreak: number;
    longestStreak: number;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
    userId,
    currentStreak,
    longestStreak
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loginDates, setLoginDates] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        loadLoginDates();
    }, [userId, year, month]);

    const loadLoginDates = async () => {
        setLoading(true);
        const dates = await getMonthLoginDates(userId, year, month);
        setLoginDates(dates);
        setLoading(false);
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const previousMonth = React.useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const nextMonth = React.useCallback(() => {
        const today = new Date();
        if (year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth())) {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        }
    }, [year, month]);

    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

    const days = React.useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const output = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            output.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === today.getDate();
            const hasLogin = loginDates.has(day);
            const isFuture = year > today.getFullYear() ||
                (year === today.getFullYear() && month > today.getMonth()) ||
                (isCurrentMonth && day > today.getDate());

            output.push(
                <div
                    key={day}
                    className={`
                        ${styles.day}
                        ${hasLogin ? styles.loginDay : ''}
                        ${isToday ? styles.today : ''}
                        ${isFuture ? styles.futureDay : ''}
                    `}
                >
                    {day}
                    {hasLogin && <div className={styles.loginDot}></div>}
                </div>
            );
        }
        return output;
    }, [year, month, loginDates]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.streakInfo}>
                    <div className={styles.streakBadge}>
                        <Flame className={styles.flameIcon} size={24} />
                        <div>
                            <div className={styles.streakLabel}>Current Streak</div>
                            <div className={styles.streakValue}>{currentStreak} days</div>
                        </div>
                    </div>
                    <div className={styles.longestStreak}>
                        <div className={styles.streakLabel}>Longest Streak</div>
                        <div className={styles.streakValue}>{longestStreak} days</div>
                    </div>
                </div>
            </div>

            <div className={styles.calendarHeader}>
                <button
                    onClick={previousMonth}
                    className={styles.navButton}
                    aria-label="Previous month"
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 className={styles.monthYear}>
                    {monthNames[month]} {year}
                </h3>
                <button
                    onClick={nextMonth}
                    className={styles.navButton}
                    disabled={isCurrentMonth}
                    aria-label="Next month"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className={styles.calendar}>
                {dayNames.map(day => (
                    <div key={day} className={styles.dayName}>
                        {day}
                    </div>
                ))}
                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : (
                    days
                )}
            </div>

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.loginDot}`}></div>
                    <span>Logged in</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.todayDot}`}></div>
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
};
