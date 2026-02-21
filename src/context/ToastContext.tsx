"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
    const idRef = useRef(0);

    const toast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setConfirmState({ ...options, resolve });
        });
    }, []);

    const handleConfirm = (result: boolean) => {
        confirmState?.resolve(result);
        setConfirmState(null);
    };

    const icons: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    const colors: Record<ToastType, string> = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
    };

    return (
        <ToastContext.Provider value={{ toast, confirm }}>
            {children}

            {/* Toast Container */}
            <div style={{
                position: 'fixed', bottom: '1.5rem', right: '1.5rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                zIndex: 99999, pointerEvents: 'none',
            }}>
                {toasts.map(t => (
                    <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: '#1a2332', color: '#fff',
                        padding: '0.875rem 1.25rem',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${colors[t.type]}`,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        fontSize: '0.95rem', fontFamily: 'inherit',
                        minWidth: '280px', maxWidth: '420px',
                        animation: 'toastIn 0.3s cubic-bezier(0.16,1,0.3,1)',
                        pointerEvents: 'auto',
                    }}>
                        <span style={{
                            width: '24px', height: '24px', borderRadius: '50%',
                            background: colors[t.type], color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                        }}>{icons[t.type]}</span>
                        <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
                    </div>
                ))}
            </div>

            {/* Confirm Dialog */}
            {confirmState && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 99999,
                }}>
                    <div style={{
                        background: '#1a2332', borderRadius: '16px',
                        padding: '2rem', width: '100%', maxWidth: '400px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                        animation: 'toastIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                        fontFamily: 'inherit',
                    }}>
                        {confirmState.title && (
                            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                                {confirmState.title}
                            </h3>
                        )}
                        <p style={{ margin: '0 0 1.75rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            {confirmState.message}
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleConfirm(false)} style={{
                                padding: '0.6rem 1.25rem', borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.15)',
                                background: 'transparent', color: 'rgba(255,255,255,0.7)',
                                cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit', fontWeight: 500,
                            }}>
                                {confirmState.cancelLabel ?? 'Cancel'}
                            </button>
                            <button onClick={() => handleConfirm(true)} style={{
                                padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none',
                                background: confirmState.danger ? '#ef4444' : '#10b981',
                                color: '#fff', cursor: 'pointer', fontWeight: 700,
                                fontSize: '0.9rem', fontFamily: 'inherit',
                                boxShadow: confirmState.danger
                                    ? '0 4px 12px rgba(239,68,68,0.35)'
                                    : '0 4px 12px rgba(16,185,129,0.35)',
                            }}>
                                {confirmState.confirmLabel ?? 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes toastIn {
                    from { opacity:0; transform:translateY(12px) scale(0.97); }
                    to   { opacity:1; transform:translateY(0) scale(1); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
