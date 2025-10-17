"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/AuthProvider";

// ===== Types from ORIGINAL =====
type TaskSet = { id: string; day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" };
type Lecture = { id: string; title: string; created_at: string };
type Week = { lecture_group_id: string; week_name: string; lectures: Lecture[]; task_sets: TaskSet[] };

// ===== New Quiz type =====
type Quiz = { id: string; title: string; answer_sheet_path?: string | null; rubric_path?: string | null; created_at?: string };

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

    // ===== ORIGINAL: Teacher view state =====
    const [loading, setLoading] = useState(true);
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [roomDisplayName, setRoomDisplayName] = useState<string>("");
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [generating, setGenerating] = useState<Record<string, boolean>>({});

    // ===== ORIGINAL: Student view types/state =====
    type Attempt = { id: string; time_elapsed: number; correct_count: number; incorrect_count: number; skip_count: number; accuracy: number; created_at: string };
    const [studentLoading, setStudentLoading] = useState(false);
    const [attemptsData, setAttemptsData] = useState<{ room_id?: string; room_display_name?: string; score?: number; task_sets?: { id: string; day: string; attempts: Attempt[] }[] } | null>(null);

    // ===== New: Quizzes state =====
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quizzesLoading, setQuizzesLoading] = useState(false);

    // ===== New: Create Quiz dialog state =====
    const [createOpen, setCreateOpen] = useState(false);
    const [quizTitle, setQuizTitle] = useState("");
    const [selectedLectureIds, setSelectedLectureIds] = useState<Record<string, boolean>>({});
    const [answerFile, setAnswerFile] = useState<File | null>(null);
    const [rubricFile, setRubricFile] = useState<File | null>(null);
    const [answerContent, setAnswerContent] = useState("");
    const [rubricContent, setRubricContent] = useState("");
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ answer?: number; rubric?: number }>({});

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

        // Teacher fetch (original) + Quizzes fetch (new)
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

        const fetchQuizzes = async () => {
            setQuizzesLoading(true);
            try {
                const res = await fetch(`/api/quiz/room/${encodeURIComponent(roomId)}`);
                if (!res.ok) throw new Error(await res.text() || "Failed to fetch quizzes");
                const data = await res.json();
                setQuizzes(Array.isArray(data) ? data.map((q: any) => ({ id: q.id ?? q.public_id, title: q.title, answer_sheet_path: q.answer_sheet_path || null, rubric_path: q.rubric_path || null, created_at: q.created_at })) : []);
            } catch (err) {
                console.error(err);
            } finally {
                setQuizzesLoading(false);
            }
        };

        fetchData();
        fetchQuizzes();
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
            const data = await res.json();

            setInfoMessage(data.message || "Tasks are being generated, it will take approximately 5 mins, thank you for your patience! Revisit this page in a while and it will appear here");
        } catch (err: any) {
            console.error(err);
            setError(err?.message || 'Failed to generate tasks');
        } finally {
            setGenerating((s) => ({ ...s, [lectureGroupId]: false }));
        }
    };

    // ===== New: helpers for Quiz creation =====
    const toggleLecture = (id: string) => setSelectedLectureIds(s => ({ ...s, [id]: !s[id] }));

    const uploadToStorage = (file: File, destPath: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const sRef = storageRef(storage, destPath);
            const task = uploadBytesResumable(sRef, file);
            task.on(
                "state_changed",
                (snap: any) => {
                    const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                    if (destPath.includes("/answer_")) setUploadProgress(p => ({ ...p, answer: pct }));
                    if (destPath.includes("/rubric_")) setUploadProgress(p => ({ ...p, rubric: pct }));
                },
                (err) => reject(err),
                async () => { resolve(destPath); }
            );
        });
    };

    const refreshQuizzes = async () => {
        setQuizzesLoading(true);
        try {
            const res = await fetch(`/api/quiz/room/${encodeURIComponent(roomId)}`);
            if (!res.ok) throw new Error(await res.text() || "Failed to fetch quizzes");
            const data = await res.json();
            setQuizzes(Array.isArray(data) ? data.map((q: any) => ({ id: q.id ?? q.public_id, title: q.title, answer_sheet_path: q.answer_sheet_path || null, rubric_path: q.rubric_path || null, created_at: q.created_at })) : []);
        } catch (err) {
            console.error(err);
        } finally {
            setQuizzesLoading(false);
        }
    };

    const createQuiz = async () => {
        setError(null);
        if (!quizTitle.trim()) { setError("Title required"); return; }
        const lectureIds = Object.keys(selectedLectureIds).filter(k => selectedLectureIds[k]);
        if (lectureIds.length === 0) { setError("Select at least one lecture"); return; }

        setCreatingQuiz(true);
        try {
            let answer_path: string | null = null;
            let rubric_path: string | null = null;

            if (answerFile) {
                const dest = `quiz/${roomId}/answer_${Date.now()}_${answerFile.name}`;
                await uploadToStorage(answerFile, dest);
                answer_path = dest;
            }
            if (rubricFile) {
                const dest = `quiz/${roomId}/rubric_${Date.now()}_${rubricFile.name}`;
                await uploadToStorage(rubricFile, dest);
                rubric_path = dest;
            }

            const body: any = { room_id: roomId, title: quizTitle, lecture_ids: lectureIds };
            if (answer_path) body.answer_sheet_path = answer_path;
            if (rubric_path) body.rubric_path = rubric_path;
            if (!answer_path && answerContent) body.answer_sheet_content = answerContent;
            if (!rubric_path && rubricContent) body.rubric_content = rubricContent;

            const res = await fetch(`/api/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error(await res.text() || "Failed to create quiz");
            await refreshQuizzes();
            setCreateOpen(false);
            setQuizTitle(""); setSelectedLectureIds({}); setAnswerFile(null); setRubricFile(null); setAnswerContent(""); setRubricContent(""); setUploadProgress({});
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to create quiz");
        } finally {
            setCreatingQuiz(false);
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

    // ===== ORIGINAL: Teacher view rendering (kept intact) with QUIZZES section added =====
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
            <div className="max-w-6xl mx-auto">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Weeks / Task sets (original content) */}
                    <div className="lg:col-span-2">
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

                    {/* Quizzes (new) */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold">Quizzes</h2>
                            <div className="flex items-center gap-2">
                                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                    <DialogTrigger asChild><Button size="sm">Create Quiz</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Quiz</DialogTitle>
                                            <DialogDescription>Select lectures and optionally upload answer sheet / rubric or paste content.</DialogDescription>
                                        </DialogHeader>

                                        <div className="mt-4 space-y-3">
                                            <label className="block">
                                                <div className="text-sm font-medium">Title</div>
                                                <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Quiz title" />
                                            </label>

                                            <div>
                                                <div className="text-sm font-medium mb-2">Select Lectures</div>
                                                <div className="max-h-40 overflow-auto border rounded p-2">
                                                    {weeks.flatMap(w => w.lectures).length === 0 ? (
                                                        <div className="text-sm text-muted-foreground">No lectures to select</div>
                                                    ) : (
                                                        weeks.flatMap(w => w.lectures).map((lec) => (
                                                            <label key={lec.id} className="flex items-center gap-2 text-sm py-1">
                                                                <input type="checkbox" checked={!!selectedLectureIds[lec.id]} onChange={() => toggleLecture(lec.id)} />
                                                                <span>{lec.title || "Untitled"}</span>
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-sm font-medium">Answer sheet (optional file)</div>
                                                <input type="file" accept="image/*,application/pdf" onChange={(e) => setAnswerFile(e.target.files?.[0] ?? null)} />
                                                <div className="text-xs text-muted-foreground mt-1">Or paste extracted text below instead of uploading.</div>
                                                <textarea className="w-full border rounded mt-2 p-2" rows={4} placeholder="Paste answer sheet text (optional)" value={answerContent} onChange={(e) => setAnswerContent(e.target.value)} />
                                                {uploadProgress.answer != null && <div className="text-xs mt-1">Answer upload: {uploadProgress.answer}%</div>}
                                            </div>

                                            <div>
                                                <div className="text-sm font-medium">Rubric (optional file)</div>
                                                <input type="file" accept="image/*,application/pdf" onChange={(e) => setRubricFile(e.target.files?.[0] ?? null)} />
                                                <div className="text-xs text-muted-foreground mt-1">Or paste rubric text below instead of uploading.</div>
                                                <textarea className="w-full border rounded mt-2 p-2" rows={4} placeholder="Paste rubric text (optional)" value={rubricContent} onChange={(e) => setRubricContent(e.target.value)} />
                                                {uploadProgress.rubric != null && <div className="text-xs mt-1">Rubric upload: {uploadProgress.rubric}%</div>}
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                            <Button onClick={createQuiz} disabled={creatingQuiz}>{creatingQuiz ? <Spinner /> : "Create Quiz"}</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button size="sm" variant="ghost" onClick={refreshQuizzes}>Refresh</Button>
                            </div>
                        </div>

                        <Card>
                            <CardContent>
                                {quizzesLoading ? (
                                    <div className="flex items-center gap-2"><Spinner /> <span className="text-sm">Loading quizzes…</span></div>
                                ) : quizzes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No quizzes created yet.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {quizzes.map(q => (
                                            <li key={q.id} className="border rounded p-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{q.title}</div>
                                                        {q.created_at && <div className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString()}</div>}
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        {q.answer_sheet_path ? <div className="text-xs text-muted-foreground">Answer: {q.answer_sheet_path}</div> : null}
                                                        {q.rubric_path ? <div className="text-xs text-muted-foreground">Rubric: {q.rubric_path}</div> : null}
                                                        <div className="mt-1"><Button size="sm" variant="ghost" onClick={() => router.push(`/quiz/${q.id}`)}>Open</Button></div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
