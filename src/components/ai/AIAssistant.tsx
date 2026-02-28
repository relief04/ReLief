
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, Leaf } from 'lucide-react';
import styles from './AIAssistant.module.css';

interface Message {
    role: 'user' | 'model';
    content: string;
}

const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
        <p key={i} style={{ margin: '0 0 0.5rem 0' }}>
            {line.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__| _.*?_)/).map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={j}>{part.slice(1, -1)}</em>;
                }
                if (part.startsWith('__') && part.endsWith('__')) {
                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('_') && part.endsWith('_')) {
                    return <em key={j}>{part.slice(1, -1)}</em>;
                }
                return part;
            })}
        </p>
    ));
};

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: 'Hi! I am the **ReLief AI**. How can I help you with your sustainability journey today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickActions = [
        "Explain ReLief Features",
        "How to earn Karma?",
        "What is Eco Streak?",
        "Calculate my footprint"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, loading]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    previousMessages: messages.filter(m => !m.content.includes('Hi! I am the **ReLief AI**')).slice(-5)
                })
            });

            const data = await response.json();

            if (response.ok) {
                const botMsg: Message = { role: 'model', content: data.reply };
                setMessages(prev => [...prev, botMsg]);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'model', content: '_Sorry, I encountered an error. Please try again later._' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {isOpen ? (
                <div className={styles.window}>
                    <div className={styles.header}>
                        <div className={styles.title}>
                            <div className={styles.iconWrapper}>
                                <Sparkles size={16} className={styles.sparkleIcon} />
                            </div>
                            <div className={styles.headerText}>
                                <span className={styles.brandName}>ReLief AI</span>
                                <span className={styles.onlineStatus}>
                                    <span className={styles.pulseDot}></span>
                                    Online
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={styles.closeBtn}
                            aria-label="Close Assistant"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.messages}>
                        <div className={styles.welcomeInfo}>
                            <div className={styles.botAvatar}>
                                <Leaf size={24} />
                            </div>
                            <h3>Eco Assistant</h3>
                            <p>Powered by Gemini Pro & ReLief Knowledge</p>
                        </div>

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`${styles.messageWrapper} ${msg.role === 'user' ? styles.userRow : styles.botRow}`}
                            >
                                {msg.role === 'model' ? (
                                    <div className={styles.messageAvatar}>
                                        <Sparkles size={12} />
                                    </div>
                                ) : null}
                                <div className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.botMessage}`}>
                                    {msg.role === 'model' ? formatMessage(msg.content) : msg.content}
                                </div>
                            </div>
                        ))}
                        {loading ? (
                            <div className={styles.botRow}>
                                <div className={styles.messageAvatar}>
                                    <Sparkles size={12} />
                                </div>
                                <div className={styles.loadingBubble}>
                                    <span className={styles.typingDot}></span>
                                    <span className={styles.typingDot}></span>
                                    <span className={styles.typingDot}></span>
                                </div>
                            </div>
                        ) : null}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.quickActions}>
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    className={styles.chip}
                                    onClick={() => handleSend(action)}
                                    disabled={loading}
                                >
                                    {action}
                                </button>
                            ))}
                        </div>

                        <div className={styles.inputArea}>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask about your eco-impact..."
                                    className={styles.input}
                                    disabled={loading}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    className={styles.sendBtn}
                                    disabled={loading || !input.trim()}
                                    aria-label="Send message"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className={styles.launcher}
                    aria-label="Open ReLief AI Assistant"
                >
                    <Leaf size={32} />
                </button>
            )}
        </div>
    );
}
