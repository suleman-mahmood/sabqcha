"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type TaskSet = { id: string; day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" };
type Lecture = { id: string; title: string; created_at: string };
type Week = { lecture_group_id: string; week_name: string; lectures: Lecture[]; task_sets: TaskSet[] };

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
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [roomDisplayName, setRoomDisplayName] = useState<string>("");
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [generating, setGenerating] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!roomId) return;
        let mounted = true;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/lecture/room/${encodeURIComponent(roomId)}`);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to fetch room");
                }
                const data = await res.json();
                if (!mounted) return;

                // room metadata
                if (data?.room) {
                    setRoomDisplayName(typeof data.room.display_name === 'string' ? data.room.display_name : "");
                    setInviteCode(typeof data.room.invite_code === 'string' ? data.room.invite_code : null);
                } else {
                    setRoomDisplayName("");
                    setInviteCode(null);
                }

                const newWeeks: Week[] = [];
                if (data?.this_week && typeof data.this_week === 'object') {
                    newWeeks.push(data.this_week as Week);
                }
                if (Array.isArray(data?.past_weeks)) {
                    newWeeks.push(...(data.past_weeks as Week[]));
                }

                setWeeks(newWeeks);
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
        router.push(`/task-set/${taskSetId}`);
    };

    const handleGenerateTasks = async (lectureGroupId: string) => {
        setError(null);
        setInfoMessage(null);
        setGenerating((s) => ({ ...s, [lectureGroupId]: true }));
        try {
            const res = await fetch(`/api/lecture/group/${encodeURIComponent(lectureGroupId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to generate tasks');
            }

            setInfoMessage("Tasks are being generated, it will take approximately 5 mins, thank you for your patience! Revisit this page in a while and it will appear here");
        } catch (err: any) {
            console.error(err);
            setError(err?.message || 'Failed to generate tasks');
        } finally {
            setGenerating((s) => ({ ...s, [lectureGroupId]: false }));
        }
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
                            <p className="text-sm text-muted-foreground">Manage lectures and weekly task sets.</p>
                        </div>
                        <div className="ml-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>Back to dashboard</Button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 text-destructive">{error}</div>
                )}

                {infoMessage && (
                    <div className="mb-4 text-muted-foreground">{infoMessage}</div>
                )}

                {weeks.length === 0 ? (
                    <Card className="p-6">
                        <CardContent>
                            <p className="text-sm text-muted-foreground">No weeks available for this room.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {weeks.map((week, idx) => (
                            <Card key={week.lecture_group_id || `${idx}`} className="p-4">
                                <CardContent>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="font-semibold">{week.week_name || 'Week'}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Lectures: {week.lectures?.length ?? 0}</p>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        {week.lectures && week.lectures.length > 0 ? (
                                            <ul className="space-y-2">
                                                {week.lectures.map((lec) => (
                                                    <li key={lec.id} className="text-sm">
                                                        <div className="font-medium">{lec.title || 'Untitled'}</div>
                                                        <div className="text-xs text-muted-foreground">{new Date(lec.created_at).toLocaleDateString()}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No lectures in this week.</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {Array.isArray(week.task_sets) && week.task_sets.length > 0 ? (
                                            DAYS.map((d) => {
                                                const ts = week.task_sets?.find((t) => t.day === d.key);
                                                const present = !!ts;
                                                return (
                                                    <Button
                                                        key={d.key}
                                                        size="sm"
                                                        variant={present ? "default" : "ghost"}
                                                        onClick={() => ts && handleTaskSetClick(ts.id)}
                                                        disabled={!present}
                                                        aria-label={`Select ${d.key}`}
                                                    >
                                                        {d.label}
                                                    </Button>
                                                );
                                            })
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleGenerateTasks(week.lecture_group_id)}
                                                disabled={!!generating[week.lecture_group_id] || !(week.lectures && week.lectures.length > 0)}
                                            >
                                                {generating[week.lecture_group_id] ? (
                                                    <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> Generating...</span>
                                                ) : (
                                                    'Generate Tasks'
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
