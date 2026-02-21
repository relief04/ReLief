"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import styles from './GroupChat.module.css';

interface ChatMessage {
    id: number;
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
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('posts') // Utilizing posts table as chat storage for now
                .select('*')
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });

            if (data && !error) {
                setMessages(data);
            }
        };

        fetchMessages();

        // Real-time subscription
        const channel = supabase
            .channel(`group_chat:${groupId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'posts',
                filter: `group_id=eq.${groupId}`
            }, (payload) => {
                const newMsg = payload.new as ChatMessage;
                setMessages(prev => [...prev, newMsg]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setSending(true);

        const safeAuthorName = user.fullName || user.username || 'Member';
        const avatarUrl = user.imageUrl || '👤';

        const { error } = await supabase
            .from('posts')
            .insert({
                content: newMessage.trim(),
                group_id: groupId,
                user_id: user.id,
                author_name: safeAuthorName,
                avatar_url: avatarUrl,
                // We mark these as 'chat' type if we had a type column, 
                // but for now relying on group_id is enough distinction from main feed
            });

        if (!error) {
            setNewMessage('');
        } else {
            console.error("Failed to send message:", error);
            toast("Failed to send message.", "error");
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
