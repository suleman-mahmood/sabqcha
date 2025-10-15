"use client";

import React, { createContext, useContext, useEffect, useState } from "react";


type User = {
    displayName: string;
    userRole: string;
};

type AuthContextValue = {
    user: User | null;
    setUser: (u: User) => void;
    token: string | null;
    setToken: (t: string | null) => void;
    login: (t: string) => void;
    logout: () => void;
    isInitializing: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let __originalFetch: typeof window.fetch | null = null;
let __currentAuthToken: string | null = null;
let __fetchPatched = false;

function patchFetch(token: String | null) {
    if (typeof window === "undefined") return;

    // always update current token so the single wrapper uses latest value
    __currentAuthToken = token ? String(token) : null;

    // patch only once to avoid wrapping multiple times
    if (__fetchPatched) return;

    __originalFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        try {
            let url = "";
            if (typeof input === "string") url = input;
            else if (input instanceof Request) url = input.url;
            else if (input instanceof URL) url = input.toString();

            let isSameOrigin = false;
            if (url.startsWith("/")) {
                isSameOrigin = true;
            } else {
                try {
                    const parsed = new URL(url);
                    isSameOrigin = parsed.origin === window.location.origin;
                } catch (e) {
                    isSameOrigin = false;
                }
            }

            if (isSameOrigin && __currentAuthToken) {
                const mergedHeaders = new Headers();
                if (input instanceof Request) {
                    input.headers.forEach((v, k) => mergedHeaders.set(k, v));
                }
                if (init && init.headers) {
                    if (init.headers instanceof Headers) init.headers.forEach((v, k) => mergedHeaders.set(k, v));
                    else if (Array.isArray(init.headers)) (init.headers as Array<[string, string]>).forEach(([k, v]) => mergedHeaders.set(k, v));
                    else Object.entries(init.headers as Record<string, string>).forEach(([k, v]) => mergedHeaders.set(k, v));
                }
                mergedHeaders.set("Authorization", `Bearer ${__currentAuthToken}`);

                if (input instanceof Request) {
                    const newReq = new Request(input, { headers: mergedHeaders });
                    const finalInit: RequestInit = { ...init };
                    return __originalFetch!(newReq, finalInit);
                }

                const finalInit = { ...(init || {}), headers: mergedHeaders } as RequestInit;
                return __originalFetch!(input as string, finalInit);
            }
        } catch (e) {
            // swallow
        }
        return __originalFetch!(input, init);
    };

    __fetchPatched = true;
}


function generateUUID4(): string {
    try {
        // @ts-ignore
        if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") return (crypto as any).randomUUID();
    } catch (e) { }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

async function ensureTokenForDeviceFlow(): Promise<string> {
    try {
        let deviceId = localStorage.getItem("device_id");
        if (!deviceId) {
            deviceId = generateUUID4();
            try { localStorage.setItem("device_id", deviceId); } catch (e) { }
        }

        try {
            const res = await fetch(`/api/user/device/${encodeURIComponent(deviceId)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                const data = await res.json();
                if (data && typeof data.token === "string") {
                    return data.token;
                }
            }
            throw new Error("API returned non 200 or didn't contain token");
        } catch (e) {
            console.warn("device token request failed", e);
            throw new Error("API request failed");
        }
    } catch (e) {
        console.warn("ensureTokenForDeviceFlow error", e);
        throw new Error("Ensure Token flow failed");
    }
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);
    const [token, setTokenState] = useState<string | null>(null);
    const [isInitializing, setInitializing] = useState(true);

    useEffect(() => {
        try {
            // token init
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
                setToken(storedToken);
                setInitializing(false);
            } else {
                // ensure device flow will try to obtain a token but won't block UI
                ensureTokenForDeviceFlow().then((newToken) => {
                    try { localStorage.setItem("auth_method", "device"); } catch (e) { }
                    setToken(newToken);
                    setInitializing(false);
                });
            }
        } catch (e) {
            console.warn("AuthProvider init failed:", e);
            setInitializing(false);
        }
    }, []);


    const setToken = (t: string | null) => {
        try {
            if (t) {
                localStorage.setItem("token", t);
            }
            else {
                localStorage.removeItem("token");
                localStorage.removeItem("auth_method");
            }
        } catch (e) {
            // ignore
        }
        setTokenState(t);
        patchFetch(t);
    };

    const logout = () => {
        setToken(null);
        setUserState(null);

        // keep device_id and user identity for anonymous UX
        ensureTokenForDeviceFlow().then((newToken) => {
            try { localStorage.setItem("auth_method", "device"); } catch (e) { }
            setToken(newToken);
        });
    };

    const login = (token: string) => {
        try { localStorage.setItem("auth_method", "password"); } catch (e) { }
        setToken(token);
    }

    return (
        <AuthContext.Provider value={{ user, setUser: setUserState, token, setToken, login, logout, isInitializing }}>
            {isInitializing ? "Loading..." : children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
