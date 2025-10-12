"use client";

import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Upload, Copy } from "lucide-react";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

interface Room {
    id: string;
    display_name: string;
    invite_code?: string;
    daily_task_set_id?: string | null;
    score?: number | null;
}

function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("theme");
            if (stored) {
                if (stored === "dark") {
                    document.documentElement.classList.add("dark");
                    setIsDark(true);
                } else {
                    document.documentElement.classList.remove("dark");
                    setIsDark(false);
                }
            } else {
                document.documentElement.classList.remove("dark");
                setIsDark(false);
            }
        } catch (e) {
            // ignore
        }
    }, []);

    const toggle = () => {
        const root = document.documentElement;
        const next = !root.classList.contains("dark");
        if (next) {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setIsDark(true);
        } else {
            root.classList.remove("dark");
            localStorage.setItem("theme", "light");
            setIsDark(false);
        }
    };

    return (
        <Button variant="ghost" onClick={toggle}>
            {isDark ? "🌙 Dark" : "🌤️ Light"}
        </Button>
    );
}

export default function Dashboard() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user, setUser } = useUser();
    const [userRole, setUserRole] = useState<string | null>(null);

    // Dialog state for creating classroom
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [creating, setCreating] = useState(false);
    const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Lecture form state
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [lectureTitle, setLectureTitle] = useState("");

    // Header: login / invite / logout
    const [loginOpen, setLoginOpen] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;
        const initAuth = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    if (mounted) setIsLoggedIn(localStorage.getItem("auth_method") === "password");
                }
            } catch (e) {
                console.error(e);
            }
        };
        initAuth();
        return () => { mounted = false; };
    }, []);

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(""), 4000);
    };

    // 🔹 Fetch rooms from /room
    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/room");
            if (!res.ok) {
                setLoading(false);
                return;
            }
            const data = await res.json();
            // expected: { user_role, user_display_name, rooms: [ { id, display_name, invite_code } ] }
            if (data.user_display_name) {
                try {
                    localStorage.setItem("display_name", data.user_display_name);
                } catch (e) { }
                // update context user
                if (typeof setUser === "function") {
                    setUser({ displayName: data.user_display_name, userId: localStorage.getItem("user_id") || "" });
                }
            }
            if (data.user_role) {
                setUserRole(data.user_role);
                try {
                    localStorage.setItem("user_role", data.user_role);
                } catch (e) { }
            }
            if (Array.isArray(data.rooms)) {
                const mapped: Room[] = data.rooms.map((r: any) => ({
                    id: r.id || r.doc_id || "",
                    display_name: r.display_name || r.title || "Untitled",
                    invite_code: r.invite_code,
                    daily_task_set_id: r.daily_task_set_id ?? null,
                    score: typeof r.score === 'number' ? r.score : (r.score == null ? null : Number(r.score)),
                }));
                setRooms(mapped);
            }
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        if (rooms.length && !selectedRoomId) {
            setSelectedRoomId(rooms[0].id);
        }
    }, [rooms, selectedRoomId]);

    const handleUpload = async (file: File) => {
        const title = lectureTitle.trim();
        if (!title) {
            showError("Upload cancelled: title is required.");
            return;
        }
        if (!selectedRoomId) {
            showError("Please select a room.");
            return;
        }

        setUploading(true);
        const storageRef = ref(storage, `lecture/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(Math.round(percent));
            },
            (error) => {
                console.error("Upload failed:", error);
                setUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log("✅ File uploaded at:", downloadURL);

                try {
                    const res = await fetch(`/api/lecture`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ room_id: selectedRoomId, title, file_path: `lecture/${file.name}` }),
                    });
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(text || "Failed to create lecture");
                    }
                    const data = await res.json();
                    console.log("Lecture created:", data);
                    setLectureTitle("");
                } catch (err) {
                    console.error("Failed to create lecture:", err);
                    showError("Failed to submit lecture.");
                }

                setUploading(false);
            }
        );
    };

    // Login moved from root page
    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoginError(null);
        setLoginLoading(true);
        try {
            const res = await fetch("/api/user/login-teacher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });

            if (res.status === 400) {
                setLoginError("Invalid credentials, please try again.");
                setLoginLoading(false);
                return;
            }

            if (!res.ok) {
                setLoginError("Login failed. Please try again.");
                setLoginLoading(false);
                return;
            }

            const data = await res.json();
            if (data && typeof data.token === "string") {
                try {
                    localStorage.setItem("token", data.token);
                    try { localStorage.setItem("auth_method", "password"); } catch (e) { }
                } catch (e) {
                    console.warn("failed to save token", e);
                }
                setLoginLoading(false);
                setLoginOpen(false);
                setIsLoggedIn(true);
                // refresh rooms / user info
                try {
                    await fetchRooms();
                } catch (e) {
                    // ignore
                }
            } else {

                setLoginError("Login response missing token");
                setLoginLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoginError("Network error");
            setLoginLoading(false);
        }
    };

    const handleJoinInvite = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setInviteError(null);
        setInviteLoading(true);
        try {
            const res = await fetch("/api/room/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invite_code: inviteCode }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to join room");
            }
            setInviteOpen(false);
            setInviteCode("");
            await fetchRooms();
        } catch (err) {
            console.error("Join failed:", err);
            setInviteError("Failed to join with that code.");
        } finally {
            setInviteLoading(false);
        }
    };

    const logout = async () => {
        try {
            const authMethod = localStorage.getItem("auth_method");
            const deviceId = localStorage.getItem("device_id");
            // Remove current token / auth_method
            try {
                localStorage.removeItem("token");
                localStorage.removeItem("auth_method");
            } catch (e) { }

            // If user was logged in via password, re-establish device token (become anonymous)
            if (authMethod === "password" && deviceId) {
                try {
                    const res = await fetch(`/api/user/device/${encodeURIComponent(deviceId)}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data && typeof data.token === "string") {
                            try { localStorage.setItem("token", data.token); } catch (e) { }
                            try { localStorage.setItem("auth_method", "device"); } catch (e) { }
                        }
                    }
                } catch (e) {
                    console.warn("Failed to refresh device token after logout", e);
                }
            }

        } catch (e) {
            console.error("Logout error:", e);
        } finally {
            setIsLoggedIn(false);
            try {
                if (typeof setUser === "function") setUser(null as any);
            } catch (e) { }
            router.push("/");
        }

    };

    const createRoom = async () => {
        const title = newTitle.trim();
        if (!title) {
            showError("Title is required.");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/room", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ display_name: title }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to create room");
            }

            // refresh rooms list from API
            await fetchRooms();
            setDialogOpen(false);
            setNewTitle("");
        } catch (err) {
            console.error("Failed to create room:", err);
            showError("Failed to create classroom.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <span className="text-sm text-muted-foreground">Hi, {user?.displayName}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Invite code button in header */}
                        {userRole !== "TEACHER" && (
                            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost">Add Code</Button>
                                </DialogTrigger>

                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Enter Invite Code</DialogTitle>
                                        <DialogDescription>Provide an invite code to join a classroom.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleJoinInvite} className="mt-4 grid gap-3">
                                        <label className="text-sm">
                                            Invite Code
                                            <input className="mt-1 w-full rounded-md border px-3 py-2" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
                                        </label>

                                        {inviteError && <div className="text-sm text-destructive">{inviteError}</div>}

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <Button type="submit" disabled={inviteLoading}>{inviteLoading ? <Spinner /> : 'Join'}</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}

                        {/* Login button or Logout */}
                        {!isLoggedIn ? (
                            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">Login</Button>
                                </DialogTrigger>

                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Teacher Login</DialogTitle>
                                        <DialogDescription>Enter your email and password.</DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleLogin} className="mt-4 grid gap-3">
                                        <label className="text-sm">
                                            Email
                                            <input className="mt-1 w-full rounded-md border px-3 py-2" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" required />
                                        </label>
                                        <label className="text-sm">
                                            Password
                                            <input className="mt-1 w-full rounded-md border px-3 py-2" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" required />
                                        </label>

                                        {loginError && <div className="text-sm text-destructive">{loginError}</div>}

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <Button type="submit" disabled={loginLoading}>{loginLoading ? <Spinner /> : 'Login'}</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Button size="sm" variant="ghost" onClick={logout}>Logout</Button>
                        )}

                        <ThemeToggle />
                    </div>
                </div>
                {/* 🔹 Title */}
                <h1 className="text-3xl font-bold text-center mb-8">Dashboard</h1>

                {/* 🔸 Upload & Leaderboards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {userRole === "TEACHER" && (
                        /* Upload card */
                        <Card className="md:col-span-2 p-6">
                            <CardContent>
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="p-3 bg-accent rounded-lg self-center sm:self-start">
                                        <Upload />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-1">Add Lecture</h3>
                                        <p className="text-sm text-muted-foreground mb-4">Upload audio to add a lecture.</p>

                                        <div className="mb-4 space-y-3">
                                            <div className="flex flex-col sm:flex-row items-start gap-3">
                                                <Select value={selectedRoomId ?? ""} onValueChange={(v) => setSelectedRoomId(v)}>
                                                    <SelectTrigger size="sm">
                                                        <SelectValue placeholder="Select room" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {rooms.map((r) => (
                                                            <SelectItem key={r.id} value={r.id}>
                                                                {r.display_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <input
                                                    required
                                                    type="text"
                                                    value={lectureTitle}
                                                    onChange={(e) => setLectureTitle(e.target.value)}
                                                    placeholder="Lecture title*"
                                                    className="border border-input px-3 py-2 rounded-md w-full sm:w-80 text-sm"
                                                />
                                            </div>

                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            <Button disabled={uploading || !lectureTitle || !selectedRoomId}>
                                                <label className="cursor-pointer">
                                                    {uploading ? 'Uploading...' : 'Select Audio File'}
                                                    <input
                                                        type="file"
                                                        accept="audio/*"
                                                        hidden
                                                        onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
                                                    />
                                                </label>
                                            </Button>

                                            <p className="text-sm text-muted-foreground">Supported: mp3</p>
                                        </div>

                                        {uploading && (
                                            <div className="mt-4">
                                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">Uploading... {progress}%</p>
                                            </div>
                                        )}

                                        {errorMessage && (
                                            <Alert variant="destructive" className="mt-3">
                                                <AlertTitle>Error</AlertTitle>
                                                <AlertDescription>{errorMessage}</AlertDescription>
                                            </Alert>
                                        )}

                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {userRole !== "TEACHER" && (
                        <Card className="md:col-span-2 p-6">
                            <CardContent>
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-1">Demo Teacher Account</h3>
                                        <p className="text-sm text-muted-foreground mb-2">For demo users: you can login with the credentials below to try teacher features.</p>

                                        <div className="text-sm">
                                            <p className="font-medium">Email: <span className="font-normal">teacher@sabqcha.com</span></p>
                                            <p className="font-medium">Password: <span className="font-normal">nopass</span></p>
                                        </div>

                                        <p className="text-xs text-muted-foreground mt-2">Note: Logging in with these credentials will sign you in as a teacher.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* 🔸 Room List */}
                <Card className="p-6 mb-8">
                    <CardContent>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Rooms</h2>

                            {userRole === "TEACHER" && (
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">Create Classroom</Button>
                                    </DialogTrigger>

                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Classroom</DialogTitle>
                                            <DialogDescription>Enter a title for the new classroom.</DialogDescription>
                                        </DialogHeader>

                                        <div className="mt-2">
                                            <label className="text-sm block mb-1">Title</label>
                                            <input
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                className="w-full border border-input px-3 py-2 rounded-md"
                                                placeholder="Classroom title"
                                            />
                                        </div>

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <Button onClick={createRoom} disabled={creating}>
                                                {creating ? "Creating..." : "Create"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center">
                                <Spinner className="mb-2 h-6 w-6 text-muted-foreground" />
                                <p className="text-muted-foreground text-sm">Loading rooms...</p>
                            </div>
                        ) : rooms.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No rooms found yet.</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {rooms.map((room) => (
                                        <Card
                                            key={room.id}
                                            className="transition-all hover:shadow-lg cursor-pointer"
                                            onClick={() => userRole === "TEACHER" ? router.push(`/room/${room.id}`) : null}
                                        >
                                            <CardContent className="p-4 text-center">
                                                <p className="font-semibold text-foreground truncate">
                                                    {room.display_name || "Untitled Room"}
                                                </p>
                                                {userRole !== "TEACHER" && typeof room.score === "number" && (
                                                    <p className="text-sm text-muted-foreground mt-1">Score: {room.score}</p>
                                                )}
                                                <div className="text-xs text-muted-foreground truncate mt-1 flex items-center justify-center gap-2">
                                                    <span className="truncate">Invite Code: {room.invite_code ?? room.id}</span>
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); const text = room.invite_code ?? room.id; try { navigator.clipboard.writeText(text); setCopiedRoomId(room.id); setTimeout(() => setCopiedRoomId(null), 2000); } catch (err) { console.error('Copy failed', err); showError('Failed to copy invite code.'); } }} aria-label="Copy invite code">
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    {copiedRoomId === room.id && (
                                                        <span className="text-xs text-success">Copied</span>
                                                    )}
                                                </div>
                                                {userRole !== "TEACHER" && (
                                                    room.daily_task_set_id === null ? (
                                                        <Button className="mt-3 w-full" variant="outline" disabled>
                                                            Daily Task done!
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            className="mt-3 w-full"
                                                            variant="outline"
                                                            onClick={(e) => { e.stopPropagation(); if (room.daily_task_set_id) router.push(`/task-set/${room.daily_task_set_id}`); }}
                                                        >
                                                            Daily Task
                                                        </Button>
                                                    )
                                                )}

                                                <Button
                                                    className="mt-2 w-full"
                                                    variant="outline"
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/leaderboard/${room.id}`); }}
                                                >
                                                    Leaderboards
                                                </Button>

                                                {userRole !== "TEACHER" && (
                                                    <Button
                                                        className="mt-2 w-full"
                                                        variant="outline"
                                                        onClick={(e) => { e.stopPropagation(); router.push(`/room/${room.id}`); }}
                                                    >
                                                        View attempts
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
