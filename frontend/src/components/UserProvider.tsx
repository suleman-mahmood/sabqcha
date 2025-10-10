"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  userId: string;
  displayName: string;
};

type UserContextValue = {
  user: User | null;
  setUser: (u: User) => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

const CUTE_NAMES = [
  "Pip",
  "Mochi",
  "Nibbles",
  "Bean",
  "Sunny",
  "Bubbles",
  "Pebble",
  "Miso",
  "Clover",
  "Waffles",
];

function generateId() {
  try {
    // prefer crypto if available
    // @ts-ignore
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch (e) {
    // fallthrough
  }
  return Math.random().toString(36).slice(2, 10);
}

// UUID v4 fallback
function generateUUID4() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      // @ts-ignore
      return crypto.randomUUID();
    }
  } catch (e) {
    // fallthrough
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let authPatchApplied = false;
let currentAuthToken: string | null = null;

function setAuthToken(token: string) {
  currentAuthToken = token;

  if (authPatchApplied) return;

  // Patch window.fetch to inject Authorization header for /api calls
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const originalFetch = window.fetch.bind(window);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.fetch = (input: RequestInfo, init?: RequestInit) => {
    try {
      let url = "";
      if (typeof input === "string") url = input;
      else if (input instanceof Request) url = input.url;

      const isApiCall = url.startsWith("/api") || url.includes(window.location.origin + "/api");
      if (isApiCall && currentAuthToken) {
        init = init ? { ...init } : {};
        // normalize headers to plain object
        const headers: Record<string, string> = {};
        if (init.headers instanceof Headers) {
          init.headers.forEach((v: string, k: string) => (headers[k] = v));
        } else if (init.headers) {
          Object.assign(headers, init.headers as Record<string, string>);
        }
        headers["Authorization"] = `Bearer ${currentAuthToken}`;
        init.headers = headers;
      }
    } catch (e) {
      // swallow so we don't break app fetches
      // console.warn("fetch auth wrapper error", e);
    }
    return originalFetch(input, init);
  };

  authPatchApplied = true;
}

async function ensureTokenForDeviceFlow() {
  try {
    let token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      return;
    }

    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = generateUUID4();
      try {
        localStorage.setItem("device_id", String(deviceId));
      } catch (e) {
        console.warn("failed to set device_id in localStorage", e);
      }
    }

    // Request a token for the device
    try {
      const res = await fetch(`/api/user/device/${encodeURIComponent(String(deviceId))}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.token === "string") {
          token = data.token;
          try {
            localStorage.setItem("token", token);
          } catch (e) {
            console.warn("failed to save token in localStorage", e);
          }
          setAuthToken(token);
          return;
        } else {
          console.warn("/api/user/device did not return token");
        }
      } else {
        console.warn("/api/user/device request failed", res.status);
      }
    } catch (e) {
      console.warn("failed to fetch token for device", e);
    }
  } catch (e) {
    console.warn("ensureTokenForDeviceFlow error", e);
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    // Initialize auth/device/token flow on client mount
    ensureTokenForDeviceFlow();

    try {
      const storedName = localStorage.getItem("display_name");
      const storedId = localStorage.getItem("user_id");

      if (storedName && storedId) {
        setUserState({ displayName: storedName, userId: storedId });
      } else {
        const name = CUTE_NAMES[Math.floor(Math.random() * CUTE_NAMES.length)];
        const id = generateId();
        localStorage.setItem("display_name", name);
        localStorage.setItem("user_id", id);
        setUserState({ displayName: name, userId: id });
      }


    } catch (e) {
      // ignore localStorage errors
      console.warn("UserProvider init failed:", e);
    }
  }, []);

  const setUser = (u: User) => {
    try {
      localStorage.setItem("display_name", u.displayName);
      localStorage.setItem("user_id", u.userId);
    } catch (e) {
      // ignore
    }
    setUserState(u);
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
