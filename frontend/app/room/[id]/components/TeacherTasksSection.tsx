"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Week } from "../types";

type TeacherTasksSectionProps = {
  weeks: Week[];
  generating: Record<string, boolean>;
  onGenerateTasks: (lectureGroupId: string) => void | Promise<void>;
  onTaskSetClick: (taskSetId: string) => void | Promise<void>;
};

const DAYS: { key: Week["task_sets"][number]["day"]; label: string }[] = [
  { key: "MONDAY", label: "M" },
  { key: "TUESDAY", label: "T" },
  { key: "WEDNESDAY", label: "W" },
  { key: "THURSDAY", label: "R" },
  { key: "FRIDAY", label: "F" },
];

export function TeacherTasksSection({
  weeks,
  generating,
  onGenerateTasks,
  onTaskSetClick,
}: TeacherTasksSectionProps) {
  if (weeks.length === 0) {
    return (
      <Card className="p-6">
        <CardContent>
          <p className="text-sm text-muted-foreground">No weeks available for this room.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {weeks.map((week, idx) => (
        <Card key={week.lecture_group_id || `${idx}`} className="p-4">
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{week.week_name || "Week"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lectures: {week.lectures?.length ?? 0}
                </p>
              </div>
            </div>

            <div className="mb-3">
              {week.lectures && week.lectures.length > 0 ? (
                <ul className="space-y-2">
                  {week.lectures.map((lec) => (
                    <li key={lec.id} className="text-sm">
                      <div className="font-medium">{lec.title || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(lec.created_at).toLocaleDateString()}
                      </div>
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
                  const taskSet = week.task_sets?.find((t) => t.day === d.key);
                  const present = !!taskSet;
                  return (
                    <Button
                      key={d.key}
                      size="sm"
                      variant={present ? "default" : "ghost"}
                      onClick={() => taskSet && onTaskSetClick(taskSet.id)}
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
                  onClick={() => onGenerateTasks(week.lecture_group_id)}
                  disabled={
                    !!generating[week.lecture_group_id] ||
                    !(week.lectures && week.lectures.length > 0)
                  }
                >
                  {generating[week.lecture_group_id] ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" /> Generating...
                    </span>
                  ) : (
                    "Generate Tasks"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
