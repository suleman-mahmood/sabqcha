"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

export default function MCQPage() {
  const { id } = useParams();
  const router = useRouter();

  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [index: number]: string }>({});
  const [results, setResults] = useState<{ [index: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  // UI state for single-question flow
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState<{
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
    timeSpentSeconds?: number;
  } | null>(null);

  // Timer
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch MCQs
  useEffect(() => {
    const fetchMCQs = async () => {
      try {
        const res = await fetch(`/api/mcqs?transcription_id=${id}`);
        const data = await res.json();
        setTitle(data.title);
        if (data.mcqs) setMcqs(data.mcqs);
      } catch (err) {
        console.error("Failed to fetch MCQs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMCQs();
  }, [id]);

  // Start timer when quiz is ready
  useEffect(() => {
    if (mcqs.length > 0 && startTime === null) {
      setStartTime(Date.now());
      setElapsedSeconds(0);
    }
  }, [mcqs, startTime]);

  // Tick timer while quiz is running
  useEffect(() => {
    if (finished || startTime === null) return;
    const t = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - (startTime ?? Date.now())) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [finished, startTime]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Handle option selection for current question
  const handleSelectOption = (option: string) => {
    if (selectedAnswers[currentIndex]) return; // prevent changing after answering
    const isCorrect = mcqs[currentIndex].answer === option;

    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: option }));
    setResults((prev) => ({ ...prev, [currentIndex]: isCorrect }));
  };

  // Move to next question (only allowed if selected or via Skip)
  const handleNext = () => {
    if (!mcqs) return;
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else {
      finishQuiz();
    }
  };

  // Skip current question and move on
  const handleSkip = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else {
      finishQuiz();
    }
  };

  // Compute final stats
  const finishQuiz = () => {
    const attemptedKeys = Object.keys(selectedAnswers).map((k) => Number(k));
    const attempted = attemptedKeys.length;
    const correct = Object.values(results).filter(Boolean).length;
    const incorrect = attempted - correct;
    const skipped = mcqs.length - attempted;
    const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : elapsedSeconds;

    setStats({ attempted, correct, incorrect, skipped, timeSpentSeconds });
    setFinished(true);
  };

  if (loading) return <p className="text-center text-muted-foreground mt-10">Loading MCQs...</p>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">MCQs for {title}</h1>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>

        {mcqs.length === 0 ? (
          <p className="text-center text-muted-foreground">No MCQs found for this lecture.</p>
        ) : finished ? (
          // Final stats view
          <Card className="p-4 mt-6">
            <CardContent>
              <h2 className="text-2xl font-semibold mb-4 text-center">Quiz Results 🎉</h2>

              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Accuracy circle */}
                <div className="flex-shrink-0">
                  <div
                    className="w-36 h-36 rounded-full flex items-center justify-center text-card-foreground text-3xl font-bold"
                    style={{
                      background: `conic-gradient(var(--chart-1) ${((stats?.correct ?? 0) / mcqs.length) * 360}deg, var(--muted) 0deg)`,
                    }}
                  >
                    <div className="text-center">
                      <div>{Math.round(((stats?.correct ?? 0) / mcqs.length) * 100)}%</div>
                      <div className="text-sm font-normal">Accuracy</div>
                    </div>
                  </div>
                </div>

                {/* Stat grid */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card">
                    <div className="text-sm text-muted-foreground">Correct</div>
                    <div className="text-2xl font-bold text-primary">{stats?.correct}</div>
                  </div>

                  <div className="p-4 rounded-lg bg-card">
                    <div className="text-sm text-muted-foreground">Incorrect</div>
                    <div className="text-2xl font-bold text-destructive">{stats?.incorrect}</div>
                  </div>

                  <div className="p-4 rounded-lg bg-card">
                    <div className="text-sm text-muted-foreground">Skipped</div>
                    <div className="text-2xl font-bold text-muted-foreground">{stats?.skipped}</div>
                  </div>

                  <div className="p-4 rounded-lg bg-card">
                    <div className="text-sm text-muted-foreground">Attempted</div>
                    <div className="text-2xl font-bold text-secondary">{stats?.attempted}</div>
                  </div>

                  <div className="p-4 rounded-lg bg-card">
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div className="text-2xl font-bold text-accent">{formatTime(stats?.timeSpentSeconds ?? 0)}</div>
                  </div>

                  <div className="p-4 rounded-lg bg-card">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold text-gray-900">{mcqs.length}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <Button variant="default" onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset quiz to retry
                    setFinished(false);
                    setCurrentIndex(0);
                    setSelectedAnswers({});
                    setResults({});
                    setStats(null);
                    setStartTime(Date.now());
                    setElapsedSeconds(0);
                  }}
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Single-question flow
          <>
            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  Question {currentIndex + 1} / {mcqs.length}
                </p>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <span>Attempted: {Object.keys(selectedAnswers).length}</span>
                  <span>Time: {formatTime(elapsedSeconds)}</span>
                </div>
              </div>
              <div className="w-full h-2 bg-muted rounded">
                <div
                  className="h-2 bg-primary rounded"
                  style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
                />
              </div>
            </div>

            <Card className="mb-4">
              <CardContent className="p-4">
                <p className="font-medium mb-3">
                  {currentIndex + 1}. {mcqs[currentIndex].question}
                </p>

                <div className="space-y-2">
                  {mcqs[currentIndex].options.map((opt, idx) => {
                    const isSelected = selectedAnswers[currentIndex] === opt;
                    const isCorrect = mcqs[currentIndex].answer === opt;

                    let btnStyle = "outline";
                    if (isSelected) {
                      btnStyle = isCorrect ? "default" : "destructive";
                    }

                    return (
                      <Button
                        key={idx}
                        variant={btnStyle as any}
                        className="w-full justify-start text-left"
                        onClick={() => handleSelectOption(opt)}
                        disabled={!!selectedAnswers[currentIndex]}
                      >
                        {opt}
                      </Button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {selectedAnswers[currentIndex] && (
                  <p
                    className={`mt-3 text-sm ${
                      results[currentIndex] ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {results[currentIndex]
                      ? "✅ Correct!"
                      : `❌ Incorrect. Correct answer: ${mcqs[currentIndex].answer}`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="default"
                    onClick={handleNext}
                    disabled={!selectedAnswers[currentIndex] && currentIndex < mcqs.length}
                  >
                    {currentIndex === mcqs.length - 1 ? "Finish" : "Next"}
                  </Button>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
