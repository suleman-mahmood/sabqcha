"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Task {
    id: string;
    question: string;
    answer: string;
    options: string[];
}

interface TaskSet {
    id: string;
    day: number | string;
    lecture_name: string;
    tasks: Task[];
}

export default function TaskSetPage() {
    const { task_set_id } = useParams() as { task_set_id?: string };
    const router = useRouter();

    const [taskSet, setTaskSet] = useState<TaskSet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = task_set_id;
        if (!id) return;

        const fetchTasks = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/task/set/${encodeURIComponent(id)}`);
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const data = await res.json();
                setTaskSet(data as TaskSet);
            } catch (err: unknown) {
                console.error("Failed to fetch task set:", err);
                setError("Failed to load task set.");
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [task_set_id]);

    if (loading) return <p className="text-center text-muted-foreground mt-10">Loading task set...</p>;
    if (error) return <p className="text-center text-destructive mt-10">{error}</p>;
    if (!taskSet) return <p className="text-center text-muted-foreground mt-10">No task set found.</p>;

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Task set for {taskSet.lecture_name} and day {taskSet.day}</h1>
                    <Button variant="outline" onClick={() => router.back()}> ← Back to Room</Button>
                </div>

                {taskSet.tasks.length === 0 ? (
                    <p className="text-center text-muted-foreground">No tasks in this set.</p>
                ) : (
                    <div className="space-y-4">
                        {taskSet.tasks.map((t, idx) => (
                            <Card key={t.id} className="p-0">
                                <CardContent>
                                    <p className="font-medium mb-3">{idx + 1}. {t.question}</p>

                                    <div className="space-y-2 mb-3">
                                        {t.options.map((opt, i) => (
                                            <div key={i} className={`flex items-center gap-3 p-2 rounded ${opt === t.answer ? "bg-green-50 border border-green-100" : "bg-card"}`}>
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-semibold">{i + 1}</span>
                                                <div className="flex-1 text-left">{opt}</div>
                                            </div>
                                        ))}
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
