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
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  // 🔹 Fetch MCQs for the selected transcription ID
  useEffect(() => {
    const fetchMCQs = async () => {
      try {
        const res = await fetch(`/api/mcqs?transcription_id=${id}`);
        const data = await res.json();
        setTitle(data.title)
        if (data.mcqs) setMcqs(data.mcqs);
      } catch (err) {
        console.error("Failed to fetch MCQs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMCQs();
  }, [id]);

  // 🔹 Handle answer selection
  const handleSelectOption = (qIndex: number, option: string) => {
    if (selectedAnswers[qIndex]) return; // prevent changing after answering
    const isCorrect = mcqs[qIndex].answer === option;

    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: option }));
    setResults((prev) => ({ ...prev, [qIndex]: isCorrect }));
  };

  // 🔹 Calculate final score once all questions are answered
  useEffect(() => {
    if (Object.keys(results).length === mcqs.length && mcqs.length > 0) {
      const correctCount = Object.values(results).filter((v) => v).length;
      setScore(correctCount);
    }
  }, [results, mcqs]);

  if (loading) return <p className="text-center text-gray-600 mt-10">Loading MCQs...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">MCQs for {title}</h1>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>

        {mcqs.length === 0 ? (
          <p className="text-center text-gray-500">No MCQs found for this lecture.</p>
        ) : (
          <>
            {mcqs.map((q, i) => (
              <Card key={i} className="mb-6">
                <CardContent className="p-4">
                  <p className="font-medium mb-3">
                    {i + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, idx) => {
                      const isSelected = selectedAnswers[i] === opt;
                      const isCorrect = q.answer === opt;

                      let btnStyle = "outline";
                      if (isSelected) {
                        btnStyle = isCorrect ? "default" : "destructive";
                      }

                      return (
                        <Button
                          key={idx}
                          variant={btnStyle as any}
                          className="w-full justify-start text-left"
                          onClick={() => handleSelectOption(i, opt)}
                          disabled={!!selectedAnswers[i]}
                        >
                          {opt}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Feedback after selection */}
                  {selectedAnswers[i] && (
                    <p
                      className={`mt-3 text-sm ${
                        results[i] ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {results[i]
                        ? "✅ Correct!"
                        : `❌ Incorrect. Correct answer: ${q.answer}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Final score */}
            {score !== null && (
              <Card className="p-4 mt-6 border-green-500 border">
                <CardContent className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Quiz Completed 🎉</h2>
                  <p className="text-lg">
                    You scored <span className="font-bold">{score}</span> out of{" "}
                    {mcqs.length}
                  </p>
                  <Button
                    variant="default"
                    className="mt-4"
                    onClick={() => router.push("/dashboard")}
                  >
                    Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
