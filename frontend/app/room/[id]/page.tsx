"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/AuthProvider";

type TaskSet = { id: string; day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" };
type Lecture = { id: string; title: string; created_at: string };
type Week = { lecture_group_id: string; week_name: string; lectures: Lecture[]; task_sets: TaskSet[] };

export default function Page() {
    const params = useParams();
    const router = useRouter();
    const rawId = params?.id;
    const { user } = useAuth();

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

    // Teacher view state
    const [loading, setLoading] = useState(true);
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [roomDisplayName, setRoomDisplayName] = useState<string>("");
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [generating, setGenerating] = useState<Record<string, boolean>>({});

    // Student view state
    type Attempt = { id: string; time_elapsed: number; correct_count: number; incorrect_count: number; skip_count: number; accuracy: number; created_at: string };
    const [studentLoading, setStudentLoading] = useState(false);
    const [attemptsData, setAttemptsData] = useState<{ room_id?: string; room_display_name?: string; score?: number; task_sets?: { id: string; day: string; attempts: Attempt[] }[] } | null>(null);

    useEffect(() => {
        if (!roomId) return;
        // If student, fetch attempts; otherwise fetch teacher data
        if (user && user.userRole !== "TEACHER") {
            let mounted = true;
            const fetchAttempts = async () => {
                setStudentLoading(true);
                try {
                    const res = await fetch(`/api/room/${encodeURIComponent(roomId)}/attempts`);
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(text || 'Failed to fetch attempts');
                    }
                    const data = await res.json();
                    if (!mounted) return;
                    setAttemptsData(data);
                    setRoomDisplayName(typeof data.room_display_name === 'string' ? data.room_display_name : '');
                } catch (err: any) {
                    console.error(err);
                    if (mounted) setError(err?.message || 'Failed to load attempts');
                } finally {
                    if (mounted) setStudentLoading(false);
                }
            };
            fetchAttempts();
            return () => { mounted = false; };
        }

        // Teacher fetch
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

    // Student view rendering
    if (user && user.userRole !== "TEACHER") {
        if (studentLoading) {
            return (
                <div className="min-h-screen p-6 bg-background">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col items-center py-10">
                            <Spinner className="h-8 w-8 mb-4" />
                            <p className="text-sm text-muted-foreground">Loading attempts...</p>
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
                                <p className="text-sm text-muted-foreground">Your attempts for this room.</p>
                            </div>
                            <div className="ml-4">
                                <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 text-destructive">{error}</div>
                    )}

                    {!attemptsData || !Array.isArray(attemptsData.task_sets) || attemptsData.task_sets.length === 0 ? (
                        <Card className="p-6">
                            <CardContent>
                                <p className="text-sm text-muted-foreground">No attempts here yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {attemptsData.task_sets.map((ts) => (
                                <Card key={ts.id} className="p-4">
                                    <CardContent>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="font-semibold">{ts.day || 'Task Set'}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Task set id: {ts.id}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" onClick={() => router.push(`/task-set/${ts.id}`)}>Retry</Button>
                                                <Button size="sm" variant="ghost" onClick={() => router.push(`/analysis/${ts.id}`)}>Analyse Mistakes</Button>
                                            </div>
                                        </div>

                                        {Array.isArray(ts.attempts) && ts.attempts.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm table-auto">
                                                    <thead>
                                                        <tr className="text-left text-xs text-muted-foreground">
                                                            <th className="px-2 py-1">Attempt</th>
                                                            <th className="px-2 py-1">Time</th>
                                                            <th className="px-2 py-1">Correct</th>
                                                            <th className="px-2 py-1">Incorrect</th>
                                                            <th className="px-2 py-1">Skips</th>
                                                            <th className="px-2 py-1">Accuracy</th>
                                                            <th className="px-2 py-1">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ts.attempts.map((a, i) => (
                                                            <tr key={a.id} className="border-t">
                                                                <td className="px-2 py-2">#{i + 1}</td>
                                                                <td className="px-2 py-2">{a.time_elapsed}s</td>
                                                                <td className="px-2 py-2">{a.correct_count}</td>
                                                                <td className="px-2 py-2">{a.incorrect_count}</td>
                                                                <td className="px-2 py-2">{a.skip_count}</td>
                                                                <td className="px-2 py-2">{a.accuracy}%</td>
                                                                <td className="px-2 py-2">{new Date(a.created_at).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No attempts for this task set.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Teacher view rendering (original)
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
