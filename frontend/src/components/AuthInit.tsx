"use client";

import { useEffect } from "react";

let authPatchApplied = false;
let currentAuthToken: string | null = null;

function patchFetchOnce() {
  if (authPatchApplied || typeof window === "undefined") return;
  const originalFetch = window.fetch.bind(window);

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

      if (isSameOrigin) {
        const headerToken = localStorage.getItem("token") || currentAuthToken;
        if (headerToken) {
          const mergedHeaders = new Headers();
          if (input instanceof Request) {
            input.headers.forEach((v, k) => mergedHeaders.set(k, v));
          }
          if (init && init.headers) {
            if (init.headers instanceof Headers) init.headers.forEach((v, k) => mergedHeaders.set(k, v));
            else if (Array.isArray(init.headers)) (init.headers as Array<[string, string]>).forEach(([k, v]) => mergedHeaders.set(k, v));
            else Object.entries(init.headers as Record<string, string>).forEach(([k, v]) => mergedHeaders.set(k, v));
          }
          mergedHeaders.set("Authorization", `Bearer ${headerToken}`);

          if (input instanceof Request) {
            const newReq = new Request(input, { headers: mergedHeaders });
            const finalInit: RequestInit = { ...init };
            return originalFetch(newReq, finalInit);
          }

          const finalInit = { ...(init || {}), headers: mergedHeaders } as RequestInit;
          return originalFetch(input as string, finalInit);
        }
      }
    } catch (e) {
      // swallow
    }
    return originalFetch(input, init);
  };

  authPatchApplied = true;
}

function setAuthToken(token: string) {
  currentAuthToken = token;
  try {
    patchFetchOnce();
  } catch (e) {
    // ignore
  }
}

function generateUUID4() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") return (crypto as any).randomUUID();
  } catch (e) {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function ensureTokenForDeviceFlow() {
  try {
    let token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      // don't override auth_method if already set; otherwise leave it for login handler
      return;
    }

    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      const newId = generateUUID4();
      try { localStorage.setItem("device_id", newId); } catch (e) {}
      deviceId = newId;
    }

    try {
      const did = String(deviceId);
      const res = await fetch(`/api/user/device/${encodeURIComponent(did)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.token === "string") {
          const newToken = data.token;
          try { localStorage.setItem("token", newToken); } catch (e) {}
          try { localStorage.setItem("auth_method", "device"); } catch (e) {}
          setAuthToken(newToken);
        }
      }
    } catch (e) {
      console.warn("device token request failed", e);
    }
  } catch (e) {
    console.warn("ensureTokenForDeviceFlow error", e);
  }
}

export default function AuthInit() {
  useEffect(() => {
    patchFetchOnce();
    ensureTokenForDeviceFlow();
  }, []);

  return null;
}

export { ensureTokenForDeviceFlow };
