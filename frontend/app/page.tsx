'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function Page() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If token present, call /room and redirect to dashboard on success
    const checkRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        // const res = await fetch("/api/room", {headers: {"Authorization": `Bearer ${token}`}});
        const res = await fetch("/api/room");
        if (!res.ok) return;
        const data = await res.json();
        // persist user info returned by /room for dashboard to consume
        try {
          if (data.user_diplay_name) localStorage.setItem("display_name", data.user_diplay_name);
          if (data.user_role) localStorage.setItem("user_role", data.user_role);
        } catch (e) {
          // ignore storage errors
        }
        // Redirect to dashboard
        router.push("/dashboard");
      } catch (e) {
        // ignore errors
        // console.warn('room check failed', e)
      }
    };
    checkRoom();
  }, [router]);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/user/login-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 400) {
        setError("Invalid credentials, please try again.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data && typeof data.token === "string") {
        try {
          localStorage.setItem("token", data.token);
        } catch (e) {
          console.warn("failed to save token", e);
        }
        setLoading(false);
        setOpen(false);
        // After login, check /room and redirect
        try {
          const res2 = await fetch("/api/room");
          if (res2.ok) {
            const d2 = await res2.json();
            if (d2.user_diplay_name) localStorage.setItem("display_name", d2.user_diplay_name);
            if (d2.user_role) localStorage.setItem("user_role", d2.user_role);
            router.push("/dashboard");
          } else {
            router.push("/dashboard");
          }
        } catch (e) {
          router.push("/dashboard");
        }
      } else {
        setError("Login response missing token");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold mb-6">Welcome</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Teacher Login</CardTitle>
            <CardDescription>Sign in as a teacher to manage content.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Access teacher features and analytics.</p>
          </CardContent>
          <CardAction>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>Login</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Teacher Login</DialogTitle>
                  <DialogDescription>Enter your email and password.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogin} className="mt-4 grid gap-3">
                  <label className="text-sm">
                    Email
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                    />
                  </label>
                  <label className="text-sm">
                    Password
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      required
                    />
                  </label>

                  {error && <div className="text-sm text-destructive">{error}</div>}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={loading}>
                      {loading ? <Spinner /> : "Login"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardAction>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add invite code</CardTitle>
            <CardDescription>Enter an invite code to join a class.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Invite codes allow students to join groups.</p>
          </CardContent>
          <CardAction>
            <Button variant="outline">Add Code</Button>
          </CardAction>
        </Card>
      </div>
    </main>
  );
}
