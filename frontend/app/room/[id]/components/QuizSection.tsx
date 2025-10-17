"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytesResumable } from "firebase/storage";
import type { Quiz, Week } from "../types";

type QuizSectionProps = {
  roomId: string;
  weeks: Week[];
  onInfoMessage?: (message: string | null) => void;
  onErrorMessage?: (message: string | null) => void;
};

type UploadProgressState = {
  answer?: number;
  rubric?: number;
};

type SolutionDialogState = {
  open: boolean;
  quiz: Quiz | null;
};

export function QuizSection({
  roomId,
  weeks,
  onInfoMessage,
  onErrorMessage,
}: QuizSectionProps) {
  const router = useRouter();
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [selectedLectureIds, setSelectedLectureIds] = useState<Record<string, boolean>>({});
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({});

  const [solutionDialog, setSolutionDialog] = useState<SolutionDialogState>({
    open: false,
    quiz: null,
  });
  const [solutionTitle, setSolutionTitle] = useState("");
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [solutionUpload, setSolutionUpload] = useState<number | null>(null);
  const [uploadingSolution, setUploadingSolution] = useState(false);
  const [gradingQuizId, setGradingQuizId] = useState<string | null>(null);
  const [attachmentDialog, setAttachmentDialog] = useState<{
    open: boolean;
    quiz: Quiz | null;
    kind: "answer" | "rubric" | null;
  }>({ open: false, quiz: null, kind: null });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUpload, setAttachmentUpload] = useState<number | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const allLectures = useMemo(
    () => weeks.flatMap((w) => w.lectures ?? []),
    [weeks],
  );

  const notifyInfo = useCallback(
    (message: string | null) => {
      onInfoMessage?.(message ?? null);
    },
    [onInfoMessage],
  );

  const notifyError = useCallback(
    (message: string | null) => {
      onErrorMessage?.(message ?? null);
    },
    [onErrorMessage],
  );

  const resetCreateState = () => {
    setQuizTitle("");
    setSelectedLectureIds({});
    setAnswerFile(null);
    setRubricFile(null);
    setUploadProgress({});
  };

  const resetSolutionState = () => {
    setSolutionTitle("");
    setSolutionFile(null);
    setSolutionUpload(null);
    setUploadingSolution(false);
  };

  const resetAttachmentState = () => {
    setAttachmentFile(null);
    setAttachmentUpload(null);
    setUploadingAttachment(false);
  };

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
        setQuizzes(
          data.map((q: any) => ({
            id: q.id ?? q.public_id,
            title: q.title,
            answer_sheet_path: q.answer_sheet_path ?? null,
            rubric_path: q.rubric_path ?? null,
            created_at: q.created_at ?? q.created_at_utc,
          })),
        );
      } else {
        setQuizzes([]);
      }
    } catch (error: any) {
      console.error("fetchQuizzes failed", error);
      notifyError(error?.message || "Failed to load quizzes");
    } finally {
      setQuizzesLoading(false);
    }
  }, [notifyError, roomId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const toggleLecture = (lectureId: string) => {
    setSelectedLectureIds((prev) => ({ ...prev, [lectureId]: !prev[lectureId] }));
  };

  const uploadToStorage = (
    file: File,
    destPath: string,
    options?: { kind?: "answer" | "rubric"; onProgress?: (pct: number) => void },
  ) => {
    return new Promise<string>((resolve, reject) => {
      const sRef = storageRef(storage, destPath);
      const task = uploadBytesResumable(sRef, file);
      task.on(
        "state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          if (options?.kind === "answer") {
            setUploadProgress((prev) => ({ ...prev, answer: pct }));
          }
          if (options?.kind === "rubric") {
            setUploadProgress((prev) => ({ ...prev, rubric: pct }));
          }
          options?.onProgress?.(pct);
        },
        (err) => reject(err),
        () => resolve(destPath),
      );
    });
  };

  const handleCreateQuiz = async () => {
    notifyError(null);
    notifyInfo(null);

    const title = quizTitle.trim();
    if (!title) {
      notifyError("Title is required");
      return;
    }
    const lectureIds = Object.keys(selectedLectureIds).filter((id) => selectedLectureIds[id]);
    if (lectureIds.length === 0) {
      notifyError("Select at least one lecture");
      return;
    }

    setCreatingQuiz(true);
    try {
      let answerPath: string | null = null;
      let rubricPath: string | null = null;

      if (answerFile) {
        const dest = `quiz/${roomId}/answer_${Date.now()}_${answerFile.name}`;
        answerPath = await uploadToStorage(answerFile, dest, { kind: "answer" });
      }
      if (rubricFile) {
        const dest = `quiz/${roomId}/rubric_${Date.now()}_${rubricFile.name}`;
        rubricPath = await uploadToStorage(rubricFile, dest, { kind: "rubric" });
      }

      const body: Record<string, unknown> = {
        room_id: roomId,
        title,
        lecture_ids: lectureIds,
      };
      if (answerPath) body.answer_sheet_path = answerPath;
      if (rubricPath) body.rubric_path = rubricPath;

      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create quiz");
      }

      notifyInfo("Quiz created. Transcription scheduled.");
      setCreateOpen(false);
      resetCreateState();
      fetchQuizzes();
    } catch (error: any) {
      console.error("handleCreateQuiz failed", error);
      notifyError(error?.message || "Failed to create quiz");
    } finally {
      setCreatingQuiz(false);
    }
  };

  const openSolutionDialog = (quiz: Quiz) => {
    setSolutionDialog({ open: true, quiz });
    resetSolutionState();
  };

  const closeSolutionDialog = () => {
    setSolutionDialog({ open: false, quiz: null });
    resetSolutionState();
  };

  const handleUploadSolution = async () => {
    if (!solutionDialog.quiz) return;
    notifyError(null);
    notifyInfo(null);

    const title = solutionTitle.trim();
    if (!title) {
      notifyError("Solution title is required");
      return;
    }
    if (!solutionFile) {
      notifyError("Select a solution file to upload");
      return;
    }

    setUploadingSolution(true);
    try {
      const dest = `quiz/${solutionDialog.quiz.id}/solutions/${Date.now()}_${solutionFile.name}`;
      const storagePath = await uploadToStorage(solutionFile, dest, {
        onProgress: setSolutionUpload,
      });

      const res = await fetch(
        `/api/quiz/${encodeURIComponent(solutionDialog.quiz.id)}/solutions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            solution_path: storagePath,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to upload solution");
      }

      notifyInfo("Solution uploaded. Transcription scheduled.");
      closeSolutionDialog();
    } catch (error: any) {
      console.error("handleUploadSolution failed", error);
      notifyError(error?.message || "Failed to upload solution");
    } finally {
      setUploadingSolution(false);
    }
  };

  const openAttachmentDialog = (quiz: Quiz, kind: "answer" | "rubric") => {
    setAttachmentDialog({ open: true, quiz, kind });
    resetAttachmentState();
  };

  const closeAttachmentDialog = () => {
    setAttachmentDialog({ open: false, quiz: null, kind: null });
    resetAttachmentState();
  };

  const handleUploadAttachment = async () => {
    if (!attachmentDialog.quiz || !attachmentDialog.kind) return;
    notifyError(null);
    notifyInfo(null);

    if (!attachmentFile) {
      notifyError("Select a file to upload");
      return;
    }

    setUploadingAttachment(true);
    try {
      const dest = `quiz/${attachmentDialog.quiz.id}/${attachmentDialog.kind}_${Date.now()}_${attachmentFile.name}`;
      const storagePath = await uploadToStorage(attachmentFile, dest, {
        onProgress: setAttachmentUpload,
      });

      const payload: Record<string, string | undefined> = {};
      if (attachmentDialog.kind === "answer") {
        payload.answer_sheet_path = storagePath;
      }
      if (attachmentDialog.kind === "rubric") {
        payload.rubric_path = storagePath;
      }

      const res = await fetch(
        `/api/quiz/${encodeURIComponent(attachmentDialog.quiz.id)}/attachments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to upload attachment");
      }

      notifyInfo("Attachment uploaded. Transcription scheduled.");
      closeAttachmentDialog();
      fetchQuizzes();
    } catch (error: any) {
      console.error("handleUploadAttachment failed", error);
      notifyError(error?.message || "Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleGradeQuiz = async (quizId: string) => {
    notifyError(null);
    notifyInfo(null);
    setGradingQuizId(quizId);
    try {
      const res = await fetch(`/api/quiz/${encodeURIComponent(quizId)}/grade`, {
        method: "POST",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to start grading");
      }
      notifyInfo("Grading triggered successfully.");
    } catch (error: any) {
      console.error("handleGradeQuiz failed", error);
      notifyError(error?.message || "Failed to grade quiz");
    } finally {
      setGradingQuizId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quizzes</h2>
        <div className="flex items-center gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Quiz</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Quiz</DialogTitle>
                <DialogDescription>
                  Select lectures and optionally upload reference files.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <div className="text-sm font-medium">Title</div>
                  <input
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    placeholder="Quiz title"
                  />
                </label>

                <div>
                  <div className="text-sm font-medium mb-2">Select Lectures</div>
                  <div className="max-h-40 overflow-auto rounded border p-2">
                    {allLectures.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No lectures to select</div>
                    ) : (
                      allLectures.map((lec) => (
                        <label key={lec.id} className="flex items-center gap-2 py-1 text-sm">
                          <input
                            type="checkbox"
                            checked={!!selectedLectureIds[lec.id]}
                            onChange={() => toggleLecture(lec.id)}
                          />
                          <span>{lec.title || "Untitled"}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Answer sheet</div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setAnswerFile(e.target.files?.[0] ?? null)}
                  />
                  {uploadProgress.answer != null && (
                    <div className="mt-1 text-xs">Answer upload: {uploadProgress.answer}%</div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium">Rubric</div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setRubricFile(e.target.files?.[0] ?? null)}
                  />
                  {uploadProgress.rubric != null && (
                    <div className="mt-1 text-xs">Rubric upload: {uploadProgress.rubric}%</div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={resetCreateState}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button onClick={handleCreateQuiz} disabled={creatingQuiz}>
                  {creatingQuiz ? <Spinner /> : "Create Quiz"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant="ghost" onClick={fetchQuizzes}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          {quizzesLoading ? (
            <div className="flex items-center gap-2">
              <Spinner /> <span className="text-sm">Loading quizzes…</span>
            </div>
          ) : quizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quizzes created yet.</p>
          ) : (
            <ul className="space-y-3">
              {quizzes.map((quiz) => (
                <li key={quiz.id} className="rounded border p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="font-medium">{quiz.title}</div>
                      {quiz.created_at && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(quiz.created_at).toLocaleString()}
                        </div>
                      )}
                      <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                        {quiz.answer_sheet_path ? (
                          <div>Answer: {quiz.answer_sheet_path}</div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>No answer sheet uploaded.</span>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => openAttachmentDialog(quiz, "answer")}
                            >
                              Upload
                            </Button>
                          </div>
                        )}
                        {quiz.rubric_path ? (
                          <div>Rubric: {quiz.rubric_path}</div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>No rubric uploaded.</span>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => openAttachmentDialog(quiz, "rubric")}
                            >
                              Upload
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-right sm:text-left">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/room/${roomId}/quiz/${quiz.id}`)}
                      >
                        View Solutions
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openSolutionDialog(quiz)}
                        variant="secondary"
                      >
                        Upload Solution
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={gradingQuizId === quiz.id}
                        onClick={() => handleGradeQuiz(quiz.id)}
                      >
                        {gradingQuizId === quiz.id ? <Spinner className="h-4 w-4" /> : "Grade"}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={solutionDialog.open} onOpenChange={(open) => (!open ? closeSolutionDialog() : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Student Solution</DialogTitle>
            <DialogDescription>
              Upload a student submission to trigger transcription and grading.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <label className="block">
              <div className="text-sm font-medium">Solution title</div>
              <input
                value={solutionTitle}
                onChange={(e) => setSolutionTitle(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="e.g. John Doe Attempt 1"
              />
            </label>

            <div>
              <div className="text-sm font-medium">Solution file</div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setSolutionFile(e.target.files?.[0] ?? null)}
              />
              {solutionUpload != null && (
                <div className="mt-1 text-xs">Upload: {solutionUpload}%</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={closeSolutionDialog} disabled={uploadingSolution}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleUploadSolution} disabled={uploadingSolution}>
              {uploadingSolution ? <Spinner /> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={attachmentDialog.open}
        onOpenChange={(open) => (!open ? closeAttachmentDialog() : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Upload {attachmentDialog.kind === "rubric" ? "Rubric" : "Answer Sheet"}
            </DialogTitle>
            <DialogDescription>
              Attach missing reference material so the quiz can be transcribed.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              Quiz: {attachmentDialog.quiz?.title ?? "-"}
            </div>
            <div>
              <div className="text-sm font-medium">File</div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
              />
              {attachmentUpload != null && (
                <div className="mt-1 text-xs">Upload: {attachmentUpload}%</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={closeAttachmentDialog}
                disabled={uploadingAttachment}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleUploadAttachment} disabled={uploadingAttachment}>
              {uploadingAttachment ? <Spinner /> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
