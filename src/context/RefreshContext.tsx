"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface RefreshContextValue {
    /** Increments on every refresh — add to useEffect deps to auto re-fetch */
    refreshKey: number;
    /** Call this after any user action that mutates data */
    triggerRefresh: (scope?: string) => void;
    /** The scope of the last refresh (optional, e.g. 'activity', 'post', 'profile') */
    lastScope: string | null;
}

const RefreshContext = createContext<RefreshContextValue>({
    refreshKey: 0,
    triggerRefresh: () => { },
    lastScope: null,
});

export function RefreshProvider({ children }: { children: React.ReactNode }) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [lastScope, setLastScope] = useState<string | null>(null);

    const triggerRefresh = useCallback((scope?: string) => {
        setLastScope(scope ?? null);
        setRefreshKey(prev => prev + 1);
    }, []);

    return (
        <RefreshContext.Provider value={{ refreshKey, triggerRefresh, lastScope }}>
            {children}
        </RefreshContext.Provider>
    );
}

/** Use this hook to subscribe to or trigger a global data refresh */
export function useRefresh() {
    return useContext(RefreshContext);
}
