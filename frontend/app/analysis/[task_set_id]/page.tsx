"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type WeakConcept = { weak_concept: string; explanation: string };

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.task_set_id;

  // enforce single string
  if (Array.isArray(rawId)) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="py-10 text-center text-destructive">Invalid task set id.</div>
        </div>
      </div>
    );
  }
  const taskSetId = rawId ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weakConcepts, setWeakConcepts] = useState<WeakConcept[]>([]);

  useEffect(() => {
    if (!taskSetId) return;
    let mounted = true;
    const doAnalyze = async () => {
      setLoading(true);
      setError(null);
        try {
        const res = await fetch(`/api/task/set/${encodeURIComponent(taskSetId)}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to analyze task set");
        }
        const data = await res.json();
        if (!mounted) return;
        if (Array.isArray(data?.weak_concepts)) {
          setWeakConcepts(data.weak_concepts as WeakConcept[]);
        } else {
          setWeakConcepts([]);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err?.message || "Failed to analyze");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    doAnalyze();
    return () => { mounted = false; };
  }, [taskSetId]);

  if (!taskSetId) {
    return (
      <div className="min-h-screen p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="py-10 text-center text-muted-foreground">Task set id missing.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Analysis</h1>
            <p className="text-sm text-muted-foreground">Review weak concepts for this task set.</p>
          </div>
          <div className="ml-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-10">
            <Spinner className="h-8 w-8 mb-4" />
            <p className="text-sm text-muted-foreground">Analyzing mistakes...</p>
          </div>
        ) : error ? (
          <div className="mb-4 text-destructive">{error}</div>
        ) : (
          <div className="space-y-4">
            {weakConcepts.length === 0 ? (
              <Card className="p-4">
                <CardContent>
                  <p className="text-sm text-muted-foreground">No weak concepts found for this task set.</p>
                </CardContent>
              </Card>
            ) : (
              weakConcepts.map((wc, idx) => (
                <Card key={idx} className="p-4">
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{wc.weak_concept || 'Concept'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{wc.explanation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
