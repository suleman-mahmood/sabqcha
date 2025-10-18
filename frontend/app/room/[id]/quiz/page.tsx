"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable } from "firebase/storage";
import type { Week, Quiz } from "../types";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
    const params = useParams();
    const router = useRouter();
    const rawId = params?.id;
    const { user, isInitializing } = useAuth();

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

    // page-level state
    const [loading, setLoading] = useState(true);
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [roomDisplayName, setRoomDisplayName] = useState<string>("");
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    // quiz-related state (inlined)
    const [quizzesLoading, setQuizzesLoading] = useState(false);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);

    const [quizTitle, setQuizTitle] = useState("");
    const [answerFile, setAnswerFile] = useState<File | null>(null);
    const [rubricFile, setRubricFile] = useState<File | null>(null);
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ answer?: number; rubric?: number }>({});

    const [solutionDialog, setSolutionDialog] = useState<{ open: boolean; quiz: Quiz | null }>({ open: false, quiz: null });
    const [solutionTitle, setSolutionTitle] = useState("");
    const [solutionFile, setSolutionFile] = useState<File | null>(null);
    const [solutionUpload, setSolutionUpload] = useState<number | null>(null);
    const [uploadingSolution, setUploadingSolution] = useState(false);

    const [gradingQuizId, setGradingQuizId] = useState<string | null>(null);

    const [attachmentDialog, setAttachmentDialog] = useState<{ open: boolean; quiz: Quiz | null; kind: "answer" | "rubric" | null }>({ open: false, quiz: null, kind: null });
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [attachmentUpload, setAttachmentUpload] = useState<number | null>(null);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    // helpers
    const normalizeMessage = (value: string | null) => {
        if (!value) return null;
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    };
    const showInfo = (message: string | null) => {
        const normalized = normalizeMessage(message);
        setInfoMessage(normalized);
        if (normalized) setError(null);
    };
    const showError = (message: string | null) => {
        const normalized = normalizeMessage(message);
        setError(normalized);
        if (normalized) setInfoMessage(null);
    };

    // fetch room metadata + weeks
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

                if (data?.room) {
                    setRoomDisplayName(typeof data.room.display_name === "string" ? data.room.display_name : "");
                    setInviteCode(typeof data.room.invite_code === "string" ? data.room.invite_code : null);
                } else {
                    setRoomDisplayName("");
                    setInviteCode(null);
                }

                const newWeeks: Week[] = [];
                if (data?.this_week && typeof data.this_week === "object") newWeeks.push(data.this_week as Week);
                if (Array.isArray(data?.past_weeks)) newWeeks.push(...(data.past_weeks as Week[]));
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


    // quizzes fetch
    const fetchQuizzes = useCallback(async () => {
        if (!roomId) return;
        setQuizzesLoading(true);
        try {
            const res = await fetch(`/api/quiz/room/${encodeURIComponent(roomId)}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to fetch quizzes");
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setQuizzes(data.map((q: any) => ({
                    id: q.id ?? q.public_id,
                    title: q.title,
                    answer_sheet_path: q.answer_sheet_path ?? null,
                    rubric_path: q.rubric_path ?? null,
                    created_at: q.created_at ?? q.created_at_utc,
                })));
            } else {
                setQuizzes([]);
            }
        } catch (err: any) {
            console.error("fetchQuizzes failed", err);
            showError(err?.message || "Failed to load quizzes");
        } finally {
            setQuizzesLoading(false);
        }
    }, [roomId]);
    useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);


    const uploadToStorage = (file: File, destPath: string, options?: { kind?: "answer" | "rubric"; onProgress?: (pct: number) => void }) => {
        return new Promise<string>((resolve, reject) => {
            const sRef = storageRef(storage, destPath);
            const task = uploadBytesResumable(sRef, file);
            task.on("state_changed", (snap) => {
                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                if (options?.kind === "answer") setUploadProgress((prev) => ({ ...prev, answer: pct }));
                if (options?.kind === "rubric") setUploadProgress((prev) => ({ ...prev, rubric: pct }));
                options?.onProgress?.(pct);
            }, (err) => reject(err), () => resolve(destPath));
        });
    };

    const resetCreateState = () => { setQuizTitle(""); setAnswerFile(null); setRubricFile(null); setUploadProgress({}); };
    const resetSolutionState = () => { setSolutionTitle(""); setSolutionFile(null); setSolutionUpload(null); setUploadingSolution(false); };
    const resetAttachmentState = () => { setAttachmentFile(null); setAttachmentUpload(null); setUploadingAttachment(false); };

    const handleCreateQuiz = async () => {
        showError(null); showInfo(null);
        const title = quizTitle.trim();
        if (!title) return showError("Title is required");

        setCreatingQuiz(true);
        try {
            let answerPath: string | null = null;
            let rubricPath: string | null = null;
            if (answerFile) answerPath = await uploadToStorage(answerFile, `quiz/${roomId}/answer_${Date.now()}_${answerFile.name}`, { kind: "answer" });
            if (rubricFile) rubricPath = await uploadToStorage(rubricFile, `quiz/${roomId}/rubric_${Date.now()}_${rubricFile.name}`, { kind: "rubric" });

            const body: Record<string, unknown> = { room_id: roomId, title };
            if (answerPath) body.answer_sheet_path = answerPath;
            if (rubricPath) body.rubric_path = rubricPath;

            const res = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error((await res.text()) || "Failed to create quiz");

            showInfo("Quiz created. Transcription scheduled.");
            setCreateOpen(false);
            resetCreateState();
            fetchQuizzes();
        } catch (err: any) {
            console.error("handleCreateQuiz failed", err);
            showError(err?.message || "Failed to create quiz");
        } finally {
            setCreatingQuiz(false);
        }
    };

    const openSolutionDialog = (quiz: Quiz) => { setSolutionDialog({ open: true, quiz }); resetSolutionState(); };
    const closeSolutionDialog = () => { setSolutionDialog({ open: false, quiz: null }); resetSolutionState(); };

    const handleUploadSolution = async () => {
        if (!solutionDialog.quiz) return;
        showError(null); showInfo(null);
        const title = solutionTitle.trim();
        if (!title) return showError("Solution title is required");
        if (!solutionFile) return showError("Select a solution file to upload");

        setUploadingSolution(true);
        try {
            const dest = `quiz/${solutionDialog.quiz.id}/solutions/${Date.now()}_${solutionFile.name}`;
            const storagePath = await uploadToStorage(solutionFile, dest, { onProgress: setSolutionUpload });
            const res = await fetch(`/api/quiz/${encodeURIComponent(solutionDialog.quiz.id)}/solutions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, solution_path: storagePath }) });
            if (!res.ok) throw new Error((await res.text()) || "Failed to upload solution");
            showInfo("Solution uploaded. Transcription scheduled.");
            closeSolutionDialog();
        } catch (err: any) {
            console.error(err);
            showError(err?.message || "Failed to upload solution");
        } finally { setUploadingSolution(false); }
    };

    const openAttachmentDialog = (quiz: Quiz, kind: "answer" | "rubric") => { setAttachmentDialog({ open: true, quiz, kind }); resetAttachmentState(); };
    const closeAttachmentDialog = () => { setAttachmentDialog({ open: false, quiz: null, kind: null }); resetAttachmentState(); };

    const handleUploadAttachment = async () => {
        if (!attachmentDialog.quiz || !attachmentDialog.kind) return;
        showError(null); showInfo(null);
        if (!attachmentFile) return showError("Select a file to upload");
        setUploadingAttachment(true);
        try {
            const dest = `quiz/${attachmentDialog.quiz.id}/${attachmentDialog.kind}_${Date.now()}_${attachmentFile.name}`;
            const storagePath = await uploadToStorage(attachmentFile, dest, { onProgress: setAttachmentUpload });
            const payload: Record<string, string | undefined> = {};
            if (attachmentDialog.kind === "answer") payload.answer_sheet_path = storagePath;
            if (attachmentDialog.kind === "rubric") payload.rubric_path = storagePath;
            const res = await fetch(`/api/quiz/${encodeURIComponent(attachmentDialog.quiz.id)}/attachments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.text()) || "Failed to upload attachment");
            showInfo("Attachment uploaded. Transcription scheduled.");
            closeAttachmentDialog();
            fetchQuizzes();
        } catch (err: any) {
            console.error(err);
            showError(err?.message || "Failed to upload attachment");
        } finally { setUploadingAttachment(false); }
    };

    const handleGradeQuiz = async (quizId: string) => {
        showError(null); showInfo(null);
        setGradingQuizId(quizId);
        try {
            const res = await fetch(`/api/quiz/${encodeURIComponent(quizId)}/grade`, { method: "POST" });
            if (!res.ok) throw new Error((await res.text()) || "Failed to start grading");
            showInfo("Grading triggered successfully.");
        } catch (err: any) {
            console.error(err);
            showError(err?.message || "Failed to grade quiz");
        } finally { setGradingQuizId(null); }
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
                        <p className="text-sm text-muted-foreground">Loading quizzes...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isInitializing) {
        return (
            <div className="min-h-screen p-6 bg-background">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col items-center py-10">
                        <Spinner className="h-8 w-8 mb-4" />
                        <p className="text-sm text-muted-foreground">Initializing...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (user && user.userRole !== "TEACHER") return <div>Only teachers are allowed here</div>

    return (
        <div className="min-h-screen p-6 bg-background">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="mb-4 text-2xl font-semibold">Quizzes for {roomDisplayName || "Room"}</h1>
                            <Button size="sm" onClick={() => setCreateOpen(true)}>Create Quiz</Button>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>Back</Button>
                        </div>
                    </div>
                </div>

                {error && <div className="mb-4 text-destructive">{error}</div>}
                {infoMessage && <div className="mb-4 text-muted-foreground">{infoMessage}</div>}

                {/* quizzes list + dialogs */}
                <div>
                    {quizzesLoading ? (
                        <div className="flex items-center gap-2">
                            <Spinner /> <span className="text-sm">Loading quizzes…</span>
                        </div>
                    ) : quizzes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No quizzes created yet.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {quizzes.map((quiz) => {
                                    const short = (s?: string | null) => {
                                        if (!s) return "";
                                        if (s.length <= 11) return s;
                                        return `...${s.slice(-10)}`;
                                    };

                                    return (
                                        <Card
                                            key={quiz.id}
                                            className="transition-all hover:shadow-lg"
                                        >
                                            <CardContent className="p-4 text-center">
                                                <div className="font-semibold text-foreground truncate">{quiz.title}</div>
                                                {quiz.created_at && (
                                                    <div className="text-xs text-muted-foreground">{new Date(quiz.created_at).toLocaleString()}</div>
                                                )}
                                                <div className="mt-2 space-y-2 my-4 text-xs text-muted-foreground">
                                                    {quiz.answer_sheet_path ? (
                                                        <div>Answer: {short(quiz.answer_sheet_path)}</div>
                                                    ) : (
                                                        <div className="flex items-center gap-2"><span>No answer sheet uploaded.</span>
                                                            <Button size="sm" variant="outline" onClick={() => openAttachmentDialog(quiz, "answer")}>Upload</Button>
                                                        </div>
                                                    )}
                                                    {quiz.rubric_path ? (
                                                        <div>Rubric: {short(quiz.rubric_path)}</div>
                                                    ) : (
                                                        <div className="flex items-center gap-2"><span>No rubric uploaded.</span>
                                                            <Button size="sm" variant="outline" onClick={() => openAttachmentDialog(quiz, "rubric")}>Upload</Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col items-stretch gap-2">
                                                    <Button className="w-full" size="sm" onClick={() => openSolutionDialog(quiz)} variant="secondary">Upload Solution</Button>
                                                    <Button className="w-full" size="sm" variant="outline" disabled={gradingQuizId === quiz.id} onClick={() => handleGradeQuiz(quiz.id)}>{gradingQuizId === quiz.id ? <Spinner className="h-4 w-4" /> : "Grade"}</Button>
                                                    <Button className="w-full" size="sm" variant="outline" onClick={() => router.push(`/room/${roomId}/quiz/${quiz.id}`)}>View Solutions</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Create dialog (controlled) */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Quiz</DialogTitle>
                            <DialogDescription>Select lectures and optionally upload reference files.</DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-3">
                            <label className="block">
                                <div className="text-sm font-medium">Title</div>
                                <input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Quiz title" />
                            </label>

                            <div>
                                <div className="text-sm font-medium">Answer sheet</div>
                                <input type="file" accept="image/*,application/pdf" onChange={(e) => setAnswerFile(e.target.files?.[0] ?? null)} />
                                {uploadProgress.answer != null && (<div className="mt-1 text-xs">Answer upload: {uploadProgress.answer}%</div>)}
                            </div>

                            <div>
                                <div className="text-sm font-medium">Rubric</div>
                                <input type="file" accept="image/*,application/pdf" onChange={(e) => setRubricFile(e.target.files?.[0] ?? null)} />
                                {uploadProgress.rubric != null && (<div className="mt-1 text-xs">Rubric upload: {uploadProgress.rubric}%</div>)}
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline" onClick={resetCreateState}>Cancel</Button></DialogClose>
                            <Button onClick={handleCreateQuiz} disabled={creatingQuiz}>{creatingQuiz ? <Spinner /> : "Create Quiz"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Solution dialog */}
                <Dialog open={solutionDialog.open} onOpenChange={(open) => (!open ? closeSolutionDialog() : null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Student Solution</DialogTitle>
                            <DialogDescription>Upload a student submission to trigger transcription and grading.</DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-3">
                            <label className="block"><div className="text-sm font-medium">Solution title</div>
                                <input value={solutionTitle} onChange={(e) => setSolutionTitle(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" placeholder="e.g. John Doe Attempt 1" />
                            </label>

                            <div>
                                <div className="text-sm font-medium">Solution file</div>
                                <input type="file" accept="image/*,application/pdf" onChange={(e) => setSolutionFile(e.target.files?.[0] ?? null)} />
                                {solutionUpload != null && (<div className="mt-1 text-xs">Upload: {solutionUpload}%</div>)}
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline" onClick={closeSolutionDialog} disabled={uploadingSolution}>Cancel</Button></DialogClose>
                            <Button onClick={handleUploadSolution} disabled={uploadingSolution}>{uploadingSolution ? <Spinner /> : "Upload"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Attachment dialog */}
                <Dialog open={attachmentDialog.open} onOpenChange={(open) => (!open ? closeAttachmentDialog() : null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload {attachmentDialog.kind === "rubric" ? "Rubric" : "Answer Sheet"}</DialogTitle>
                            <DialogDescription>Attach missing reference material so the quiz can be transcribed.</DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-3">
                            <div className="text-sm text-muted-foreground">Quiz: {attachmentDialog.quiz?.title ?? "-"}</div>
                            <div>
                                <div className="text-sm font-medium">File</div>
                                <input type="file" accept="image/*,application/pdf" onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)} />
                                {attachmentUpload != null && (<div className="mt-1 text-xs">Upload: {attachmentUpload}%</div>)}
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline" onClick={closeAttachmentDialog} disabled={uploadingAttachment}>Cancel</Button></DialogClose>
                            <Button onClick={handleUploadAttachment} disabled={uploadingAttachment}>{uploadingAttachment ? <Spinner /> : "Upload"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
