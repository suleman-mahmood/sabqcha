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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedName = localStorage.getItem("display_name");
      const storedId = localStorage.getItem("user_id");

      if (storedName && storedId) {
        setUserState({ displayName: storedName, userId: storedId });
      } else {
        const name = CUTE_NAMES[Math.floor(Math.random() * CUTE_NAMES.length)];
        const id = generateId();
        try {
          localStorage.setItem("display_name", name);
          localStorage.setItem("user_id", id);
        } catch (e) {
          // ignore storage errors
        }
        setUserState({ displayName: name, userId: id });
      }

    } catch (e) {
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
