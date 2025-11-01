'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';


const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 20 } },
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

export default function Page(): React.ReactElement {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 text-slate-900">
            {/* Hero Section */}
            <motion.section
                className="container mx-auto max-w-7xl px-6 pt-8 pb-16"
                initial="hidden"
                animate="visible"
                variants={container}
            >
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1 text-center lg:text-left">
                        <motion.div
                            className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-violet-100 rounded-full text-sm font-medium text-indigo-700 mb-6"
                            variants={fadeIn}
                        >
                            Classroom-Embedded Micro-Learning
                        </motion.div>

                        <motion.h1
                            className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent"
                            variants={fadeInUp}
                        >
                            Turn Lectures Into
                            <br />
                            Daily Wins
                        </motion.h1>

                        <motion.p
                            className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0"
                            variants={fadeIn}
                        >
                            Sool transforms long lectures into gamified daily challenges that boost student grades,
                            improve retention, and make classrooms more effective.
                        </motion.p>

                        <motion.div
                            className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                            variants={fadeIn}
                        >
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
                                onClick={() => router.push('/dashboard')}
                            >
                                Get Started
                            </Button>
                            {/*
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 px-8 py-6 text-lg"
                            >
                                See How It Works
                            </Button>
                            */}
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div
                            className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500"
                            variants={fadeIn}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 border-2 border-white" />
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-400 border-2 border-white" />
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white" />
                                </div>
                                <span className="font-medium text-slate-700">100+ students learning</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Interactive mockup */}
                    <motion.div
                        className="w-full lg:w-[480px] flex-shrink-0 relative"
                        variants={scaleIn}
                    >
                        <div className="relative">
                            {/* Floating elements */}
                            <motion.div
                                className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2 z-10"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            >
                                <div className="text-2xl">🔥</div>
                                <div>
                                    <div className="text-xs text-slate-500">Streak</div>
                                    <div className="font-bold text-indigo-600">12 Days</div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2 z-10"
                                animate={{ y: [0, 10, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1.5 }}
                            >
                                <div className="text-2xl">⭐</div>
                                <div>
                                    <div className="text-xs text-slate-500">XP Today</div>
                                    <div className="font-bold text-violet-600">+245</div>
                                </div>
                            </motion.div>

                            {/* Main phone mockup */}
                            <div className="rounded-3xl bg-white p-6 shadow-2xl">
                                <div className="h-[480px] rounded-2xl bg-gradient-to-b from-indigo-100 via-violet-50 to-purple-50 flex flex-col relative overflow-hidden">
                                    {/* Header */}
                                    <div className="p-5 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                                                S
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">Sool</div>
                                                <div className="text-xs text-slate-500">Today's Tasks</div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-medium text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                                            Mon, Jan 1
                                        </div>
                                    </div>

                                    {/* Task cards */}
                                    <div className="flex-1 p-5 space-y-3 overflow-hidden">
                                        <motion.div
                                            className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-400"
                                            initial={{ x: -50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">
                                                        ✓
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-slate-800">Photosynthesis Quiz</div>
                                                        <div className="text-xs text-slate-500">5 min • +50 XP</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="bg-white rounded-xl shadow-md p-4 border-l-4 border-indigo-400"
                                            initial={{ x: -50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">
                                                        📝
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-slate-800">Past Tense Practice</div>
                                                        <div className="text-xs text-slate-500">8 min • +65 XP</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="bg-white rounded-xl shadow-md p-4 border-l-4 border-violet-400"
                                            initial={{ x: -50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.7 }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-lg">
                                                        🎯
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-slate-800">Algebra Challenge</div>
                                                        <div className="text-xs text-slate-500">10 min • +80 XP</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="p-5 bg-white/70 backdrop-blur-sm border-t border-indigo-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-slate-600">Daily Progress</span>
                                            <span className="text-xs font-bold text-indigo-600">1/3 complete</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: '33%' }}
                                                transition={{ delay: 1, duration: 1 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Impact Stats */}
            <motion.section
                className="py-16 bg-white/50 backdrop-blur-sm border-y border-slate-200"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                85%
                            </div>
                            <div className="mt-2 text-sm md:text-base text-slate-600 font-medium">Better retention</div>
                        </motion.div>

                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                                3x
                            </div>
                            <div className="mt-2 text-sm md:text-base text-slate-600 font-medium">More engagement</div>
                        </motion.div>

                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                92%
                            </div>
                            <div className="mt-2 text-sm md:text-base text-slate-600 font-medium">Student satisfaction</div>
                        </motion.div>

                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                                2+
                            </div>
                            <div className="mt-2 text-sm md:text-base text-slate-600 font-medium">Grade improvement</div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Problem */}
            <motion.section
                className="py-20"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-5xl px-6">
                    <motion.div className="text-center mb-12" variants={fadeInUp}>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            The Traditional Classroom Challenge
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
                            Long lectures, passive learning, and last-minute cramming create a cycle of stress and forgotten knowledge.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                            variants={fadeIn}
                        >
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl mb-4">
                                😴
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Information Overload</h3>
                            <p className="text-slate-600 text-sm">
                                Students struggle to retain information from hour-long lectures. Within days, most content is forgotten.
                            </p>
                        </motion.div>

                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                            variants={fadeIn}
                        >
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl mb-4">
                                😰
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Procrastination Cycle</h3>
                            <p className="text-slate-600 text-sm">
                                Without daily accountability, students postpone studying until the night before exams, leading to poor performance.
                            </p>
                        </motion.div>

                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                            variants={fadeIn}
                        >
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl mb-4">
                                📚
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Teacher Time Crunch</h3>
                            <p className="text-slate-600 text-sm">
                                Creating engaging daily practice materials manually is time-consuming and often gets deprioritized.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Solution */}
            <motion.section
                className="py-20 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div className="text-center mb-16" variants={fadeInUp}>
                        <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                            The Sool Solution
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold">
                            Micro-Learning That Actually Sticks
                        </h2>
                        <p className="mt-4 text-lg text-indigo-100 max-w-3xl mx-auto">
                            AI-powered gamification transforms passive lectures into active daily challenges that students love and remember.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <motion.div variants={fadeIn}>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl">
                                        🎯
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">Bite-Sized Daily Challenges</h3>
                                        <p className="text-indigo-100">
                                            5-15 minute challenges keep students engaged without overwhelming them. Spaced repetition ensures long-term retention.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl">
                                        🤖
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">AI-Powered Content Creation</h3>
                                        <p className="text-indigo-100">
                                            Teachers upload lectures once, and AI automatically generates a week of personalized challenges in minutes.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl">
                                        🎮
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">Game-Like Experience</h3>
                                        <p className="text-indigo-100">
                                            Streaks, XP, badges, and leaderboards turn studying into an addictive habit students actually enjoy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative"
                            variants={scaleIn}
                        >
                            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                                <div className="space-y-4">
                                    <motion.div
                                        className="bg-white rounded-xl p-4 shadow-lg"
                                        initial={{ x: 50, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                                                ✓
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-900">Daily Streak: 12 days</div>
                                                <div className="text-sm text-slate-500">Keep going!</div>
                                            </div>
                                            <div className="text-2xl">🔥</div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-white rounded-xl p-4 shadow-lg"
                                        initial={{ x: 50, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
                                                ⭐
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-900">Level Up!</div>
                                                <div className="text-sm text-slate-500">You're now Level 8</div>
                                            </div>
                                            <div className="text-lg font-bold text-indigo-600">+150 XP</div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-white rounded-xl p-4 shadow-lg"
                                        initial={{ x: 50, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl">
                                                🏆
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-900">Class Rank #2</div>
                                                <div className="text-sm text-slate-500">50 XP to #1!</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* How it works */}
            <motion.section
                className="py-20 bg-slate-50"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div className="text-center mb-16" variants={fadeInUp}>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            From Lecture to Mastery in 3 Steps
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                            Seamlessly integrated into your classroom workflow
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div
                            className="relative bg-white rounded-2xl p-8 shadow-lg border border-slate-100"
                            variants={scaleIn}
                        >
                            <div className="absolute -top-6 left-8">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    1
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="text-5xl mb-4">📹</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Lecture</h3>
                                <p className="text-slate-600">
                                    Record or upload your lecture content. Supports video, audio, and text formats. One upload covers an entire week.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative bg-white rounded-2xl p-8 shadow-lg border border-slate-100"
                            variants={scaleIn}
                        >
                            <div className="absolute -top-6 left-8">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    2
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="text-5xl mb-4">🤖</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Generates Tasks</h3>
                                <p className="text-slate-600">
                                    Our AI analyzes your content and creates personalized daily challenges for the entire week. Takes just minutes.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative bg-white rounded-2xl p-8 shadow-lg border border-slate-100"
                            variants={scaleIn}
                        >
                            <div className="absolute -top-6 left-8">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    3
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="text-5xl mb-4">🎮</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Students Learn Daily</h3>
                                <p className="text-slate-600">
                                    Students complete 5-15 minute challenges each day, earning XP and building streaks. Knowledge retention soars.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Timeline visualization */}
                    <motion.div
                        className="mt-16 relative"
                        variants={fadeIn}
                    >
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 -translate-y-1/2 hidden md:block" />
                        <div className="grid md:grid-cols-3 gap-8 relative">
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                viewport={{ once: true }}
                            >
                                <div className="inline-block bg-white px-4 py-2 rounded-full text-sm font-medium text-indigo-600 border-2 border-indigo-200">
                                    Weekend: Upload
                                </div>
                            </motion.div>
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                viewport={{ once: true }}
                            >
                                <div className="inline-block bg-white px-4 py-2 rounded-full text-sm font-medium text-violet-600 border-2 border-violet-200">
                                    Mon-Fri: Daily Tasks
                                </div>
                            </motion.div>
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                viewport={{ once: true }}
                            >
                                <div className="inline-block bg-white px-4 py-2 rounded-full text-sm font-medium text-purple-600 border-2 border-purple-200">
                                    Repeat: Mastery Achieved
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Core Features */}
            <motion.section
                className="py-20"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div className="text-center mb-16" variants={fadeInUp}>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Everything You Need in One Platform
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-indigo-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                📹
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Lecture Recording</h3>
                            <p className="text-slate-600 text-sm">
                                Record live classes or upload existing materials. Multiple format support.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-violet-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                🤖
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">AI Task Generation</h3>
                            <p className="text-slate-600 text-sm">
                                Automatically creates engaging challenges tailored to your content and students' needs.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-purple-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                📅
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Weekly Task Sets</h3>
                            <p className="text-slate-600 text-sm">
                                Monday to Friday scheduling with 5 tasks per day. Perfect for building habits.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-green-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                🔥
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Streaks & XP</h3>
                            <p className="text-slate-600 text-sm">
                                Gamification that motivates. Daily streaks and experience points keep students engaged.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-orange-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                🏆
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Class Leaderboards</h3>
                            <p className="text-slate-600 text-sm">
                                Friendly competition motivates students to stay consistent and help each other.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-blue-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                📊
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Progress Analytics</h3>
                            <p className="text-slate-600 text-sm">
                                Track student performance, completion rates, and identify areas needing attention.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Benefits for Students and Teachers */}
            <motion.section
                className="py-20 bg-gradient-to-br from-slate-50 to-indigo-50"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <motion.div variants={fadeIn}>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-3xl mb-6">
                                🎓
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">For Students</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">Better Grades, Less Stress</div>
                                        <p className="text-slate-600 text-sm">Consistent practice leads to higher test scores without last-minute cramming.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">Long-Term Retention</div>
                                        <p className="text-slate-600 text-sm">Spaced repetition and active recall ensure knowledge sticks beyond the exam.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">Build Consistent Habits</div>
                                        <p className="text-slate-600 text-sm">Streaks and daily goals transform studying from a chore into an enjoyable routine.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeIn}>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-3xl mb-6">
                                👩‍🏫
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">For Teachers</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">Save Hours Every Week</div>
                                        <p className="text-slate-600 text-sm">AI generates all practice materials automatically. No more manual quiz creation.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">Boost Class Performance</div>
                                        <p className="text-slate-600 text-sm">Track engagement and identify struggling students early with detailed analytics.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-1">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">Increase Student Engagement</div>
                                        <p className="text-slate-600 text-sm">Gamification makes students excited about learning and completing assignments.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Final CTA */}
            <motion.section
                className="py-20 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto max-w-4xl px-6 relative z-10">
                    <motion.div className="text-center" variants={fadeInUp}>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Ready to Transform Your Classroom?
                        </h2>
                        <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                            Join hundreds of teachers making learning fun, effective, and engaging.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <Button
                                size="lg"
                                className="bg-white text-indigo-600 hover:bg-slate-100 shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-lg font-semibold"
                                onClick={() => router.push('/dashboard')}
                            >
                                Get Started
                            </Button>
                            {/*
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold"
                            >
                                Schedule a Demo
                            </Button>
                            */}
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Footer */}
            <motion.footer
                className="bg-slate-900 text-slate-300 py-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                                    S
                                </div>
                                <span className="text-white font-bold text-xl">Sool</span>
                            </div>
                            <p className="text-sm text-slate-400">
                                Transforming classrooms with AI-powered gamified micro-learning.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-400">
                            © 2025 Sool. All rights reserved.
                        </p>
                    </div>
                </div>
            </motion.footer>
        </main>
    );
}
