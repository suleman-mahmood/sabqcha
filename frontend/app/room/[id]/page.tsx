"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type TaskSet = { id: string; day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" };
type Lecture = { id: string; title: string; task_sets: TaskSet[] };

export default function Page() {
    const params = useParams();
    const router = useRouter();
    const rawId = params?.id;

    // Enforce that `id` is a single string, never an array
    if (Array.isArray(rawId)) {
        return (
            <div className="min-h-screen p-6 bg-background">
                <div className="max-w-4xl mx-auto">
                    <div className="py-10 text-center text-destructive">Invalid room id.</div>
                </div>
            </div>
        );
    }

    const roomId: string = rawId ?? "";

    const [loading, setLoading] = useState(true);
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [roomDisplayName, setRoomDisplayName] = useState<string>("");
    const [inviteCode, setInviteCode] = useState<string | null>(null);

    useEffect(() => {
        if (!roomId) return;
        let mounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/lecture/room/${encodeURIComponent(roomId)}`);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to fetch lectures");
                }
                const data = await res.json();
                if (!mounted) return;

                // set room metadata if present
                setRoomDisplayName(typeof data.display_name === 'string' ? data.display_name : "");
                setInviteCode(typeof data.invite_code === 'string' ? data.invite_code : null);

                if (Array.isArray(data.lectures)) {
                    setLectures(data.lectures as Lecture[]);
                } else {
                    setLectures([]);
                }
            } catch (err: any) {
                console.error(err);
                if (mounted) setError(err?.message || "Failed to load");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchData();
        return () => { mounted = false; };
    }, [roomId]);

    const DAYS: { key: string; label: string }[] = [
        { key: "MONDAY", label: "M" },
        { key: "TUESDAY", label: "T" },
        { key: "WEDNESDAY", label: "W" },
        { key: "THURSDAY", label: "R" },
        { key: "FRIDAY", label: "F" },
    ];

    const handleTaskSetClick = (taskSetId: string) => {
        // navigate to task page (implementation TODO)
        router.push(`/task-set/${taskSetId}`);
    };

    if (!roomId) {
        return (
            <div className="min-h-screen p-6 bg-background">
                <div className="max-w-4xl mx-auto">
                    <div className="py-10 text-center text-muted-foreground">Room ID missing.</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen p-6 bg-background">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col items-center py-10">
                        <Spinner className="h-8 w-8 mb-4" />
                        <p className="text-sm text-muted-foreground">Loading room...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-background">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-2xl font-semibold">{roomDisplayName || "Room"}</h1>
                            {inviteCode && <p className="text-sm text-muted-foreground">Invite Code: {inviteCode}</p>}
                            <p className="text-sm text-muted-foreground">Manage lectures and task sets.</p>
                        </div>
                        <div className="ml-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>Back to dashboard</Button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 text-destructive">{error}</div>
                )}

                {lectures.length === 0 ? (
                    <Card className="p-6">
                        <CardContent>
                            <p className="text-sm text-muted-foreground">No lectures found for this room.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {lectures.map((lec) => (
                            lec.task_sets.map((ts) => (
                                <Card key={ts.id} className="p-4">
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{lec.title || 'Untitled Lecture'}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Task set: {ts.id}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {DAYS.map((d) => {
                                                    const isActive = d.key === ts.day;
                                                    return (
                                                        <Button
                                                            key={d.key}
                                                            size="sm"
                                                            variant={isActive ? "default" : "ghost"}
                                                            onClick={() => handleTaskSetClick(ts.id)}
                                                            aria-label={`Select ${d.key}`}
                                                        >
                                                            {d.label}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
