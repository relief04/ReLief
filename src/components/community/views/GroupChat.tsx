"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { useRefresh } from '@/context/RefreshContext';
import styles from './GroupChat.module.css';

interface ChatMessage {
    id: number;
    group_id: string;
    content: string;
    author_name: string;
    avatar_url: string;
    created_at: string;
    user_id: string;
}

interface GroupChatProps {
    groupId: string;
}

export function GroupChat({ groupId }: GroupChatProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const { triggerRefresh } = useRefresh();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevMessageCount = useRef(0);

    const scrollToBottom = () => {
        // block:'nearest' keeps scroll inside the chat container, not the whole page
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    useEffect(() => {
        // Only auto-scroll when a new message is added, not on re-fetches of same messages
        if (messages.length > prevMessageCount.current) {
            scrollToBottom();
        }
        prevMessageCount.current = messages.length;
    }, [messages]);

    // Re-focus the input after every send, once React has re-enabled it
    useEffect(() => {
        if (!sending) {
            inputRef.current?.focus();
        }
    }, [sending]);

    // Track the highest real DB id seen so polling only fetches truly new rows
    const latestIdRef = useRef<number>(0);

    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('group_messages')
                .select('*')
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });

            if (data && !error) {
                setMessages(data);
                // Track the highest real id we have
                const maxId = data.reduce((m: number, r: ChatMessage) => Math.max(m, r.id), 0);
                if (maxId > latestIdRef.current) latestIdRef.current = maxId;
            }
        };

        fetchMessages();

        // ── Polling fallback (works even without Supabase Realtime publication) ──
        // Fetches only rows newer than the last known id every 3 s and merges them.
        const poll = setInterval(async () => {
            const { data } = await supabase
                .from('group_messages')
                .select('*')
                .eq('group_id', groupId)
                .gt('id', latestIdRef.current)          // only new rows
                .order('created_at', { ascending: true });

            if (data && data.length > 0) {
                setMessages(prev => {
                    const existingIds = new Set(prev.map((m: ChatMessage) => m.id));
                    const fresh = data.filter((m: ChatMessage) => !existingIds.has(m.id));
                    if (fresh.length === 0) return prev;
                    const maxId = fresh.reduce((m: number, r: ChatMessage) => Math.max(m, r.id), latestIdRef.current);
                    latestIdRef.current = maxId;
                    return [...prev, ...fresh];
                });
            }
        }, 3000);

        // ── Supabase Realtime subscription (instant when publication is enabled) ──
        const channel = supabase
            .channel(`group_chat:${groupId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${groupId}`
            }, (payload: { new: ChatMessage }) => {
                const newMsg = payload.new as ChatMessage;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    if (newMsg.id > latestIdRef.current) latestIdRef.current = newMsg.id;
                    return [...prev, newMsg];
                });
            })
            .subscribe();

        return () => {
            clearInterval(poll);
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setSending(true);

        const safeAuthorName = user.fullName || user.username || 'Member';
        const avatarUrl = user.imageUrl || '👤';
        const optimisticMsg: ChatMessage = {
            id: Date.now(), // temporary id, will be replaced by real row
            content: newMessage.trim(),
            group_id: groupId,
            user_id: user.id,
            author_name: safeAuthorName,
            avatar_url: avatarUrl,
            created_at: new Date().toISOString(),
        };

        // Show message immediately (optimistic update)
        setMessages(prev => [...prev, optimisticMsg]);
        const sentContent = newMessage.trim();
        setNewMessage('');

        const { data: inserted, error } = await supabase
            .from('group_messages')
            .insert({
                content: sentContent,
                group_id: groupId,
                user_id: user.id,
                author_name: safeAuthorName,
                avatar_url: avatarUrl,
            })
            .select()
            .single();

        if (error) {
            // Roll back the optimistic update on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setNewMessage(sentContent);
            console.error("Failed to send message:", error?.message, error?.code, error?.details);
            toast(`Failed to send message: ${error?.message || 'Permission denied'}`, "error");
        } else if (inserted) {
            // Advance the high-water mark so the poll won't re-fetch this row
            if (inserted.id > latestIdRef.current) latestIdRef.current = inserted.id;
            // Replace temp optimistic id with the real database row
            setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? inserted : m));
        }

        setSending(false);
    };

    return (
        <div className={styles.chatContainer}>
            {/* Premium Chat Header */}
            <div className={styles.chatHeader}>
                <div className={styles.chatHeaderIcon}>💬</div>
                <div>
                    <div className={styles.chatHeaderTitle}>Group Chat</div>
                    <div className={styles.chatHeaderSub}>Live · {messages.length} messages</div>
                </div>
                <div className={styles.onlineDot} title="Live updates on" />
            </div>

            <div className={styles.messageList}>
                {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span>💬</span>
                        <p>No messages yet — say hello!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.user_id === user?.id;
                        return (
                            <div key={msg.id} className={`${styles.messageRow} ${isMe ? styles.myMessageRow : ''}`}>
                                {!isMe && (
                                    <div className={styles.avatar}>
                                        {msg.avatar_url?.startsWith('http') ? (
                                            <img src={msg.avatar_url} alt={msg.author_name} />
                                        ) : (
                                            <span>{msg.author_name.charAt(0)}</span>
                                        )}
                                    </div>
                                )}
                                <div className={`${styles.bubble} ${isMe ? styles.myBubble : styles.theirBubble}`}>
                                    {!isMe && <div className={styles.senderName}>{msg.author_name}</div>}
                                    <div className={styles.messageContent}>{msg.content}</div>
                                    <div className={styles.timestamp}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className={styles.inputArea}>
                <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className={styles.input}
                    disabled={sending}
                />
                <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim() || sending} aria-label="Send">
                    {sending ? '⏳' : '➤'}
                </button>
            </form>
        </div>
    );
}
