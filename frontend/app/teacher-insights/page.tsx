"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Dummy data types
interface ConceptPerformance {
    concept: string;
    averageScore: number;
    totalAttempts: number;
    classId: string;
    className: string;
}

interface StudentAlert {
    studentId: string;
    studentName: string;
    concept: string;
    score: number;
    attempts: number;
    classId: string;
    className: string;
    severity: "high" | "medium" | "low";
}

interface ClassPerformance {
    classId: string;
    className: string;
    averageScore: number;
    totalStudents: number;
    activeStudents: number;
    completionRate: number;
    tasksCompleted: number;
    totalTasks: number;
}

interface OverviewStats {
    totalStudents: number;
    activeToday: number;
    averageScore: number;
    tasksCompletedToday: number;
    studentsNeedingAttention: number;
}

export default function TeacherDashboardPage() {
    const { user, isInitializing } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Dummy data
    const [overviewStats] = useState<OverviewStats>({
        totalStudents: 142,
        activeToday: 89,
        averageScore: 76.5,
        tasksCompletedToday: 234,
        studentsNeedingAttention: 18,
    });

    const [weakConcepts] = useState<ConceptPerformance[]>([
        {
            concept: "Photosynthesis Process",
            averageScore: 58.3,
            totalAttempts: 45,
            classId: "1",
            className: "Biology 101 - Section A",
        },
        {
            concept: "Quadratic Equations",
            averageScore: 62.1,
            totalAttempts: 38,
            classId: "2",
            className: "Math 201 - Section B",
        },
        {
            concept: "Newton's Third Law",
            averageScore: 64.5,
            totalAttempts: 52,
            classId: "3",
            className: "Physics 101",
        },
        {
            concept: "Cellular Respiration",
            averageScore: 67.2,
            totalAttempts: 41,
            classId: "1",
            className: "Biology 101 - Section A",
        },
        {
            concept: "Spanish Subjunctive Mood",
            averageScore: 69.8,
            totalAttempts: 29,
            classId: "4",
            className: "Spanish 102",
        },
    ]);

    const [studentsNeedingAttention] = useState<StudentAlert[]>([
        {
            studentId: "s1",
            studentName: "Ahmed Hassan",
            concept: "Photosynthesis Process",
            score: 42,
            attempts: 4,
            classId: "1",
            className: "Biology 101 - Section A",
            severity: "high",
        },
        {
            studentId: "s2",
            studentName: "Fatima Ali",
            concept: "Quadratic Equations",
            score: 38,
            attempts: 5,
            classId: "2",
            className: "Math 201 - Section B",
            severity: "high",
        },
        {
            studentId: "s3",
            studentName: "Omar Khan",
            concept: "Newton's Third Law",
            score: 51,
            attempts: 3,
            classId: "3",
            className: "Physics 101",
            severity: "high",
        },
        {
            studentId: "s4",
            studentName: "Aisha Malik",
            concept: "Cellular Respiration",
            score: 55,
            attempts: 3,
            classId: "1",
            className: "Biology 101 - Section A",
            severity: "medium",
        },
        {
            studentId: "s5",
            studentName: "Zain Abbas",
            concept: "Spanish Subjunctive Mood",
            score: 58,
            attempts: 2,
            classId: "4",
            className: "Spanish 102",
            severity: "medium",
        },
        {
            studentId: "s6",
            studentName: "Sara Ahmed",
            concept: "Photosynthesis Process",
            score: 47,
            attempts: 4,
            classId: "1",
            className: "Biology 101 - Section A",
            severity: "high",
        },
        {
            studentId: "s7",
            studentName: "Hassan Raza",
            concept: "Quadratic Equations",
            score: 61,
            attempts: 3,
            classId: "2",
            className: "Math 201 - Section B",
            severity: "medium",
        },
        {
            studentId: "s8",
            studentName: "Maryam Siddiqui",
            concept: "Newton's Third Law",
            score: 63,
            attempts: 2,
            classId: "3",
            className: "Physics 101",
            severity: "low",
        },
    ]);

    const [classPerformance] = useState<ClassPerformance[]>([
        {
            classId: "1",
            className: "Biology 101 - Section A",
            averageScore: 72.4,
            totalStudents: 34,
            activeStudents: 28,
            completionRate: 82.4,
            tasksCompleted: 156,
            totalTasks: 189,
        },
        {
            classId: "2",
            className: "Math 201 - Section B",
            averageScore: 78.9,
            totalStudents: 28,
            activeStudents: 24,
            completionRate: 85.7,
            tasksCompleted: 132,
            totalTasks: 154,
        },
        {
            classId: "3",
            className: "Physics 101",
            averageScore: 75.2,
            totalStudents: 42,
            activeStudents: 35,
            completionRate: 83.3,
            tasksCompleted: 210,
            totalTasks: 252,
        },
        {
            classId: "4",
            className: "Spanish 102",
            averageScore: 81.3,
            totalStudents: 22,
            activeStudents: 19,
            completionRate: 86.4,
            tasksCompleted: 95,
            totalTasks: 110,
        },
        {
            classId: "5",
            className: "Chemistry 201",
            averageScore: 69.7,
            totalStudents: 16,
            activeStudents: 13,
            completionRate: 81.3,
            tasksCompleted: 78,
            totalTasks: 96,
        },
    ]);

    useEffect(() => {
        if (!isInitializing) {
            setLoading(false);
        }
    }, [user, isInitializing, router]);

    if (isInitializing || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
        );
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "high":
                return "text-destructive";
            case "medium":
                return "text-orange-500";
            case "low":
                return "text-yellow-500";
            default:
                return "text-muted-foreground";
        }
    };

    const getSeverityBg = (severity: string) => {
        switch (severity) {
            case "high":
                return "bg-destructive/10";
            case "medium":
                return "bg-orange-500/10";
            case "low":
                return "bg-yellow-500/10";
            default:
                return "bg-muted";
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 70) return "text-blue-500";
        if (score >= 60) return "text-yellow-500";
        return "text-destructive";
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            Teacher Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor student performance and identify learning gaps
                        </p>
                    </div>
                    <Button onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Students</CardDescription>
                            <CardTitle className="text-3xl">{overviewStats.totalStudents}</CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Active Today</CardDescription>
                            <CardTitle className="text-3xl text-green-500">
                                {overviewStats.activeToday}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                {((overviewStats.activeToday / overviewStats.totalStudents) * 100).toFixed(1)}% of total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Average Score</CardDescription>
                            <CardTitle className="text-3xl text-blue-500">
                                {overviewStats.averageScore}%
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Tasks Completed Today</CardDescription>
                            <CardTitle className="text-3xl text-purple-500">
                                {overviewStats.tasksCompletedToday}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Need Attention</CardDescription>
                            <CardTitle className="text-3xl text-destructive">
                                {overviewStats.studentsNeedingAttention}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Weak Concepts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Weak Concepts Across Classes</CardTitle>
                            <CardDescription>
                                Concepts where students are struggling the most
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {weakConcepts.map((concept, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {concept.concept}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {concept.className}
                                                </p>
                                            </div>
                                            <span className={`text-lg font-bold ${getScoreColor(concept.averageScore)}`}>
                                                {concept.averageScore.toFixed(1)}%
                                            </span>
                                        </div>
                                        <Progress value={concept.averageScore} className="h-2" />
                                        <p className="text-xs text-muted-foreground">
                                            {concept.totalAttempts} student attempts
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Students Needing Attention */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Students Needing Attention</CardTitle>
                            <CardDescription>
                                Students struggling with specific concepts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {studentsNeedingAttention.map((student, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-4 rounded-lg border ${getSeverityBg(student.severity)}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {student.studentName}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {student.className}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-xs font-semibold uppercase px-2 py-1 rounded ${getSeverityColor(
                                                    student.severity
                                                )}`}
                                            >
                                                {student.severity}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-foreground">
                                                <span className="font-medium">Concept:</span>{" "}
                                                {student.concept}
                                            </p>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Score: <span className={getScoreColor(student.score)}>{student.score}%</span>
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {student.attempts} attempts
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Class Performance Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Class Performance Breakdown</CardTitle>
                        <CardDescription>
                            Overview of all your classes and their micro-learning progress
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {classPerformance.map((cls, idx) => (
                                <div key={idx} className="p-4 rounded-lg border bg-card">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg text-foreground">
                                                {cls.className}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {cls.activeStudents} of {cls.totalStudents} students active
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getScoreColor(cls.averageScore)}`}>
                                                {cls.averageScore.toFixed(1)}%
                                            </p>
                                            <p className="text-xs text-muted-foreground">avg score</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                Completion Rate
                                            </p>
                                            <Progress value={cls.completionRate} className="h-2 mb-1" />
                                            <p className="text-xs text-muted-foreground">
                                                {cls.completionRate.toFixed(1)}%
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                Tasks Completed
                                            </p>
                                            <Progress
                                                value={(cls.tasksCompleted / cls.totalTasks) * 100}
                                                className="h-2 mb-1"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {cls.tasksCompleted} of {cls.totalTasks} tasks
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
