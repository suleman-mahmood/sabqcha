"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { StudentSolution } from "../../types";

export default function RoomQuizSolutionsPage() {
  const params = useParams();
  const router = useRouter();

  const rawRoomId = params?.id;
  const rawQuizId = params?.quiz_id;

  if (Array.isArray(rawRoomId) || Array.isArray(rawQuizId)) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-10 text-center text-destructive">
              Invalid parameters supplied.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const roomId = rawRoomId ?? "";
  const quizId = rawQuizId ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<StudentSolution[]>([]);

  useEffect(() => {
    if (!quizId) return;

    let mounted = true;
    const fetchSolutions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/quiz/${encodeURIComponent(quizId)}/solutions`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch solutions");
        }
        const data = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) {
          setSolutions(
            data.map((s: any) => ({
              id: s.id ?? s.public_id,
              title: s.title,
              solution_path: s.solution_path,
              solution_content: s.solution_content,
              created_at_utc: s.created_at ?? s.created_at_utc,
            })),
          );
        } else {
          setSolutions([]);
        }
      } catch (err: any) {
        console.error("fetchSolutions failed", err);
        if (mounted) setError(err?.message || "Failed to load solutions");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSolutions();
    return () => {
      mounted = false;
    };
  }, [quizId]);

  if (!quizId || !roomId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Missing quiz context.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Quiz Solutions</h1>
            <p className="text-sm text-muted-foreground">
              Review uploaded student submissions for this quiz.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/room/${roomId}`)}>
              Back to room
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-10">
              <Spinner /> <span className="text-sm text-muted-foreground">Loading solutions…</span>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : solutions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No solutions uploaded yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2">Title</th>
                    <th className="pb-2">Storage Path</th>
                    <th className="pb-2">Uploaded At</th>
                    <th className="pb-2">Extracted Text</th>
                  </tr>
                </thead>
                <tbody>
                  {solutions.map((solution) => (
                    <tr key={solution.id} className="border-t">
                      <td className="py-3 pr-4 font-medium">{solution.title}</td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {solution.solution_path || "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {solution.created_at_utc
                          ? new Date(solution.created_at_utc).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {solution.solution_content
                          ? solution.solution_content.slice(0, 160) +
                            (solution.solution_content.length > 160 ? "…" : "")
                          : "Processing…"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
