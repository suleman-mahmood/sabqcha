"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Award, BookOpen, TrendingDown, TrendingUp, Users, AlertTriangle, Target, Clock, CheckCircle2, XCircle, BarChart3, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/AuthProvider";

interface TeacherPerformance {
    id: string;
    name: string;
    subject: string;
    totalStudents: number;
    activeStudents: number;
    avgCompletionRate: number;
    avgScore: number;
    tasksCreated: number;
    strugglingStudents: number;
    trend: "up" | "down" | "stable";
}

interface StrugglingStudent {
    id: string;
    name: string;
    subject: string;
    teacher: string;
    completionRate: number;
    avgScore: number;
    missedTasks: number;
    lastActive: string;
}

interface PlatformStats {
    totalStudents: number;
    totalTeachers: number;
    totalTaskSets: number;
    totalCompletions: number;
    avgPlatformScore: number;
    avgCompletionRate: number;
    activeToday: number;
    improvementRate: number;
}

export default function AdminInsightsPage() {
    const router = useRouter();
    const { user, isInitializing } = useAuth();
    const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
    const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformance[]>([]);
    const [strugglingStudents, setStrugglingStudents] = useState<StrugglingStudent[]>([]);

    useEffect(() => {
        // if (!isInitializing && !user) {
        //     return;
        // }

        // TODO: Replace with actual API calls
        // Dummy data for demonstration
        setPlatformStats({
            totalStudents: 1247,
            totalTeachers: 42,
            totalTaskSets: 856,
            totalCompletions: 18943,
            avgPlatformScore: 78.5,
            avgCompletionRate: 85.2,
            activeToday: 892,
            improvementRate: 12.3,
        });

        setTeacherPerformance([
            {
                id: "1",
                name: "Dr. Sarah Ahmed",
                subject: "Mathematics",
                totalStudents: 85,
                activeStudents: 78,
                avgCompletionRate: 92.5,
                avgScore: 84.2,
                tasksCreated: 45,
                strugglingStudents: 7,
                trend: "up",
            },
            {
                id: "2",
                name: "Prof. Ali Khan",
                subject: "Physics",
                totalStudents: 72,
                activeStudents: 68,
                avgCompletionRate: 88.3,
                avgScore: 79.8,
                tasksCreated: 38,
                strugglingStudents: 4,
                trend: "up",
            },
            {
                id: "3",
                name: "Ms. Fatima Noor",
                subject: "Chemistry",
                totalStudents: 68,
                activeStudents: 59,
                avgCompletionRate: 76.4,
                avgScore: 72.5,
                tasksCreated: 32,
                strugglingStudents: 9,
                trend: "down",
            },
            {
                id: "4",
                name: "Mr. Hassan Raza",
                subject: "Biology",
                totalStudents: 91,
                activeStudents: 85,
                avgCompletionRate: 89.7,
                avgScore: 81.3,
                tasksCreated: 52,
                strugglingStudents: 6,
                trend: "stable",
            },
            {
                id: "5",
                name: "Dr. Ayesha Malik",
                subject: "English",
                totalStudents: 103,
                activeStudents: 94,
                avgCompletionRate: 91.2,
                avgScore: 86.7,
                tasksCreated: 48,
                strugglingStudents: 9,
                trend: "up",
            },
        ]);

        setStrugglingStudents([
            {
                id: "1",
                name: "Ahmed Hassan",
                subject: "Chemistry",
                teacher: "Ms. Fatima Noor",
                completionRate: 45.2,
                avgScore: 52.3,
                missedTasks: 12,
                lastActive: "3 days ago",
            },
            {
                id: "2",
                name: "Zara Khalid",
                subject: "Mathematics",
                teacher: "Dr. Sarah Ahmed",
                completionRate: 58.7,
                avgScore: 61.5,
                missedTasks: 8,
                lastActive: "1 day ago",
            },
            {
                id: "3",
                name: "Bilal Ahmad",
                subject: "Physics",
                teacher: "Prof. Ali Khan",
                completionRate: 52.1,
                avgScore: 55.8,
                missedTasks: 10,
                lastActive: "5 days ago",
            },
            {
                id: "4",
                name: "Sana Imran",
                subject: "Biology",
                teacher: "Mr. Hassan Raza",
                completionRate: 48.9,
                avgScore: 58.2,
                missedTasks: 11,
                lastActive: "2 days ago",
            },
            {
                id: "5",
                name: "Usman Ali",
                subject: "Chemistry",
                teacher: "Ms. Fatima Noor",
                completionRate: 41.3,
                avgScore: 49.7,
                missedTasks: 15,
                lastActive: "1 week ago",
            },
        ]);
    }, [user, isInitializing, router]);

    if (isInitializing) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const getTrendIcon = (trend: "up" | "down" | "stable") => {
        if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
        return <div className="h-4 w-4" />;
    };

    const getPerformanceColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <div className="container mx-auto p-6 space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Admin Insights Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor teacher performance and student engagement across the platform
                    </p>
                </motion.div>

                {/* Platform Statistics */}
                {platformStats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 className="h-6 w-6 text-primary" />
                            Platform Overview
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                                <CardHeader className="pb-3">
                                    <CardDescription className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Total Students
                                    </CardDescription>
                                    <CardTitle className="text-3xl">
                                        {platformStats.totalStudents.toLocaleString()}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="text-muted-foreground">
                                            {platformStats.activeToday} active today
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
                                <CardHeader className="pb-3">
                                    <CardDescription className="flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        Total Teachers
                                    </CardDescription>
                                    <CardTitle className="text-3xl">
                                        {platformStats.totalTeachers}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        <span className="text-muted-foreground">
                                            {platformStats.totalTaskSets} task sets created
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
                                <CardHeader className="pb-3">
                                    <CardDescription className="flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Avg Completion Rate
                                    </CardDescription>
                                    <CardTitle className="text-3xl">
                                        {platformStats.avgCompletionRate}%
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Progress value={platformStats.avgCompletionRate} className="h-2" />
                                </CardContent>
                            </Card>

                            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                                <CardHeader className="pb-3">
                                    <CardDescription className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4" />
                                        Avg Platform Score
                                    </CardDescription>
                                    <CardTitle className="text-3xl">
                                        {platformStats.avgPlatformScore}%
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <span className="text-green-600 font-medium">
                                            +{platformStats.improvementRate}% this month
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}

                {/* Teacher Performance Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <Award className="h-6 w-6 text-primary" />
                        Teacher Performance
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {teacherPerformance.map((teacher, index) => (
                            <motion.div
                                key={teacher.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow duration-300 border-primary/10">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{teacher.name}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {teacher.subject}
                                                </CardDescription>
                                            </div>
                                            {getTrendIcon(teacher.trend)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Student Metrics */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Students
                                                </span>
                                                <span className="font-medium">
                                                    {teacher.activeStudents}/{teacher.totalStudents}
                                                </span>
                                            </div>
                                            <Progress
                                                value={(teacher.activeStudents / teacher.totalStudents) * 100}
                                                className="h-2"
                                            />
                                        </div>

                                        {/* Completion Rate */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Completion Rate
                                                </span>
                                                <span className={`font-medium ${getPerformanceColor(teacher.avgCompletionRate)}`}>
                                                    {teacher.avgCompletionRate}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={teacher.avgCompletionRate}
                                                className="h-2"
                                            />
                                        </div>

                                        {/* Average Score */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-2">
                                                    <Trophy className="h-4 w-4" />
                                                    Avg Score
                                                </span>
                                                <span className={`font-medium ${getPerformanceColor(teacher.avgScore)}`}>
                                                    {teacher.avgScore}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={teacher.avgScore}
                                                className="h-2"
                                            />
                                        </div>

                                        {/* Additional Stats */}
                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                                            <div className="text-center p-2 bg-primary/5 rounded-lg">
                                                <p className="text-2xl font-bold text-primary">
                                                    {teacher.tasksCreated}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Tasks Created</p>
                                            </div>
                                            <div className="text-center p-2 bg-destructive/5 rounded-lg">
                                                <p className="text-2xl font-bold text-destructive">
                                                    {teacher.strugglingStudents}
                                                </p>
                                                <p className="text-xs text-muted-foreground">At Risk</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Struggling Students Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                >
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        Students Needing Attention
                    </h2>
                    <Card className="border-destructive/20">
                        <CardHeader>
                            <CardDescription>
                                Students with low completion rates or scores requiring intervention
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {strugglingStudents.map((student, index) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + index * 0.05 }}
                                        className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    {student.name}
                                                    {student.missedTasks >= 10 && (
                                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                                    )}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {student.subject} • {student.teacher}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Last active: {student.lastActive}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 sm:gap-6">
                                                <div className="text-center">
                                                    <p className={`text-lg font-bold ${getPerformanceColor(student.completionRate)}`}>
                                                        {student.completionRate}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Completion</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className={`text-lg font-bold ${getPerformanceColor(student.avgScore)}`}>
                                                        {student.avgScore}%
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Avg Score</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-destructive">
                                                        {student.missedTasks}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Missed</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
