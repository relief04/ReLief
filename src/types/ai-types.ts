// TypeScript types for AI Assistant system

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface KnowledgeEntry {
    id: string;
    category: string;
    title: string;
    content: string;
    keywords: string[];
}

export interface ChatRequest {
    message: string;
    userId?: string;
    context?: Message[];
}

export interface ChatResponse {
    message: string;
    sources?: string[];
    error?: string;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    isOpen: boolean;
}
