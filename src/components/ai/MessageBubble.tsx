"use client";

import React from 'react';
import styles from './MessageBubble.module.css';
import { Message } from '@/types/ai-types';

interface MessageBubbleProps {
    message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`${styles.messageWrapper} ${isUser ? styles.userWrapper : styles.aiWrapper}`}>
            {!isUser && (
                <div className={styles.avatar}>
                    <span className={styles.avatarIcon}>🌱</span>
                </div>
            )}
            <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.aiBubble}`}>
                <div className={styles.content}>{message.content}</div>
                <div className={styles.timestamp}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};
