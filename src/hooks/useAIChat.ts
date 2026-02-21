"use client";

import { useState, useCallback, useEffect } from 'react';
import { Message, ChatResponse } from '@/types/ai-types';

export function useAIChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Load chat history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('relief-ai-chat-history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map((m: Record<string, any>) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                })));
            } catch (e) {
                console.error('Failed to load chat history:', e);
            }
        }
    }, []);

    // Save chat history to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('relief-ai-chat-history', JSON.stringify(messages));
        }
    }, [messages]);

    const sendMessage = useCallback(async (content: string, userId?: string) => {
        if (!content.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: content,
                    userId,
                    context: messages.slice(-5) // Last 5 messages for context
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data: ChatResponse = await response.json();

            // Add AI response
            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: data.message,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);

            // Add error message to chat
            const errorMsg: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    const clearChat = useCallback(() => {
        setMessages([]);
        localStorage.removeItem('relief-ai-chat-history');
    }, []);

    const toggleChat = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    return {
        messages,
        isLoading,
        error,
        isOpen,
        sendMessage,
        clearChat,
        toggleChat,
        setIsOpen
    };
}
