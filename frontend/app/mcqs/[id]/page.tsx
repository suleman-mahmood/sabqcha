"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/components/UserProvider";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 160, damping: 20 } },
  exit: { opacity: 0, scale: 0.98, y: -6, transition: { duration: 0.12 } },
};

const optionVariants: Variants = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
  exit: { opacity: 0, x: 6, transition: { duration: 0.12 } },
};

export default function MCQPage() {
  const { id } = useParams();
  const router = useRouter();

  const introAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const transAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const finishAudioRef = React.useRef<HTMLAudioElement | null>(null);

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
  const { user } = useUser();

  useEffect(() => {
    const fetchMCQs = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/mcqs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcription_id: id, user_id: user.userId }) });
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
  }, [id, user]);

  // Initialize audio effects
  useEffect(() => {
    introAudioRef.current = new Audio('/mcq_intro.wav');
    introAudioRef.current.preload = 'auto';
    introAudioRef.current.volume = 0.8;

    transAudioRef.current = new Audio('/mcq_transition.wav');
    transAudioRef.current.preload = 'auto';
    transAudioRef.current.volume = 0.8;

    finishAudioRef.current = new Audio('/mcq_finish.wav');
    finishAudioRef.current.preload = 'auto';
    finishAudioRef.current.volume = 0.8;
  }, []);

  // Play intro when MCQs load
  useEffect(() => {
      introAudioRef.current?.play().catch(() => {});
  }, [loading]);

  // Play transition sound when question changes
  useEffect(() => {
    if (loading) return;
    transAudioRef.current?.play().catch(() => {});
  }, [currentIndex]);

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

  // Skip current question and move on (disabled after selecting an option)
  const handleSkip = () => {
    // Do not allow skipping if the user has already selected an answer for this question
    if (selectedAnswers[currentIndex]) return;

    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else {
      finishQuiz();
    }
  };

  // Compute final stats and submit results to backend (fire-and-forget, no UI feedback)
  const finishQuiz = () => {
   finishAudioRef.current?.play().catch(() => {});

    const attemptedKeys = Object.keys(selectedAnswers).map((k) => Number(k));
    const attempted = attemptedKeys.length;
    const correct = Object.values(results).filter(Boolean).length;
    const incorrect = attempted - correct;
    const skipped = mcqs.length - attempted;
    const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : elapsedSeconds;

    // prepare mcq payload: each item has answer (string) and did_skip (bool)
    const mcqResponses = mcqs.map((_, idx) => {
      const answer = selectedAnswers[idx] ?? "";
      const did_skip = !(idx in selectedAnswers);
      return { answer, did_skip };
    });

    // fire-and-forget submit to server endpoint; do not block UI
    if (id && user) {
      fetch(`/api/mcqs/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription_id: id,
          user_id: user.userId,
          display_name: user.displayName,
          mcqs: mcqResponses,
        }),
      }).catch((err) => {
        console.error("Failed to submit MCQs to backend:", err);
      });
    }

    setStats({ attempted, correct, incorrect, skipped, timeSpentSeconds });
    setFinished(true);
  };

  const progressPct = useMemo(() => {
    return ((currentIndex + 1) / Math.max(1, mcqs.length)) * 100;
  }, [currentIndex, mcqs.length]);

  if (loading) return <p className="text-center text-muted-foreground mt-10">Loading MCQs...</p>;

  return (
    <motion.div className="min-h-screen bg-background p-6" variants={pageVariants} initial="hidden" animate="enter" exit="exit">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">MCQs for {title}</h1>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>

        {mcqs.length === 0 ? (
          <p className="text-center text-muted-foreground">No MCQs found for this lecture.</p>
        ) : (
          <AnimatePresence initial={false} mode="wait">
            {finished ? (
              <motion.div key="results" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
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
              </motion.div>
            ) : (
              <motion.div key={`q-${currentIndex}`} variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                {/* Single-question flow */}
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
                    <motion.div
                      className="h-2 bg-primary rounded"
                      style={{ width: `${progressPct}%` }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ type: "spring", stiffness: 170, damping: 26 }}
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

                        const MotionButton = motion(Button as any);

                        return (
                          <motion.div key={idx} variants={optionVariants} initial="initial" animate="animate" exit="exit">
                            <div className="flex items-start gap-3">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-semibold mt-1">
                                {idx + 1}
                              </span>
                              <MotionButton
                                variant={btnStyle as any}
                                className="flex-1 justify-start text-left"
                                onClick={() => handleSelectOption(opt)}
                                disabled={!!selectedAnswers[currentIndex]}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                animate={isSelected ? { y: -4 } : { y: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                              >
                                {opt}
                              </MotionButton>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Feedback */}
                    <AnimatePresence>
                      {selectedAnswers[currentIndex] && (
                        <motion.p
                          className={`mt-3 text-sm ${results[currentIndex] ? "text-primary" : "text-destructive"}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                        >
                          {results[currentIndex]
                            ? "✅ Correct!"
                            : `❌ Incorrect. Correct answer: ${mcqs[currentIndex].answer}`}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>

                {/* Controls */}
                <div className="flex items-center justify-between gap-4">
                  <Button variant="ghost" onClick={handleSkip} disabled={!!selectedAnswers[currentIndex]}>
                    Skip
                  </Button>

                  <div className="flex items-center gap-3">
                      <Button
                        variant="default"
                        onClick={handleNext}
                        disabled={!selectedAnswers[currentIndex]}
                      >
                      {currentIndex === mcqs.length - 1 ? "Finish" : "Next"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
