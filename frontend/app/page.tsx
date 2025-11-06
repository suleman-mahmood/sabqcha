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
                <div className="flex-1 text-center">
                    <motion.div
                        className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-violet-100 rounded-full text-sm font-medium text-indigo-700 mb-6"
                        variants={fadeIn}
                    >
                        Asynchronous Education Platform
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent"
                        variants={fadeInUp}
                    >
                        Empowering schools
                        <br />
                        Adopt out-of-classroom
                        <br />
                        Learning Experience
                    </motion.h1>

                    <motion.p
                        className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto"
                        variants={fadeIn}
                    >
                        White-labeled AI platform that transforms your school's lectures into gamified micro-learning. Students score higher while parents save on expensive tuitions, paper back exam-prep & learning resources.
                    </motion.p>

                    <motion.div
                        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
                        variants={fadeIn}
                    >
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
                            onClick={() => router.push('/dashboard')}
                        >
                            Get Started
                        </Button>
                    </motion.div>
                </div>
            </motion.section>

            {/* Impact Stats */}
            <motion.section
                className="py-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-8 border border-white/20 h-full flex flex-col items-center justify-center">
                                <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">
                                    +10%
                                </div>
                                <div className="text-xl md:text-2xl font-bold text-white mb-1">More Admissions</div>
                                <div className="text-sm text-indigo-100">after full activation</div>
                                <div className="text-xs text-indigo-200 mt-2">(10% more revenue)</div>
                            </div>
                        </motion.div>

                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-8 border border-white/20 h-full flex flex-col items-center justify-center">
                                <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">
                                    90%
                                </div>
                                <div className="text-xl md:text-2xl font-bold text-white mb-1">Savings</div>
                                <div className="text-sm text-indigo-100">on tuition fees</div>
                                <div className="text-xs text-indigo-200 mt-2">& learning resources</div>
                            </div>
                        </motion.div>

                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-8 border border-white/20 h-full flex flex-col items-center justify-center">
                                <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">
                                    B → A
                                </div>
                                <div className="text-xl md:text-2xl font-bold text-white mb-1">At Least 1+ Grade</div>
                                <div className="text-sm text-indigo-100">improvement</div>
                            </div>
                        </motion.div>
                    </div>
                    <motion.p
                        className="mt-8 text-lg text-white/90 max-w-3xl mx-auto text-center"
                        variants={fadeIn}
                    >
                        Schools grow admissions and revenue, parents save on costly tuitions, and students achieve higher grades with gamified AI-powered learning
                    </motion.p>
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
                            The Asynchronous Education Gap
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
                            Students prefer learning outside the classroom, but schools lack the tools and infrastructure to support this shift effectively.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                            variants={fadeIn}
                        >
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl mb-4">
                                📱
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No Async Tools</h3>
                            <p className="text-slate-600 text-sm">
                                Students prefer online lectures in their own time, but schools lack platforms to deliver effective outside-classroom learning.
                            </p>
                        </motion.div>

                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                            variants={fadeIn}
                        >
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl mb-4">
                                💸
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Expensive Tuitions</h3>
                            <p className="text-slate-600 text-sm">
                                Parents spend thousands on paper-based exam prep and tuitions, draining family budgets with minimal guaranteed results.
                            </p>
                        </motion.div>

                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                            variants={fadeIn}
                        >
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl mb-4">
                                🏫
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Admission Competition</h3>
                            <p className="text-slate-600 text-sm">
                                Schools need modern tools and branding to stand out in a competitive admissions landscape.
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
                            The Complete Solution
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold">
                            Your School's All-in-One Platform
                        </h2>
                        <p className="mt-4 text-lg text-indigo-100 max-w-3xl mx-auto">
                            White-labeled platform that supports asynchronous learning, protects your content, and boosts your school's reputation.
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
                                        <h3 className="text-xl font-bold mb-2">AI Micro-Learning</h3>
                                        <p className="text-indigo-100">
                                            Converts long lectures into bite-sized, gamified daily challenges. Personalized algorithms boost retention through spaced repetition.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl">
                                        ✍️
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">AI Grader</h3>
                                        <p className="text-indigo-100">
                                            Gives instant, personalized feedback on real past paper questions. Students learn faster with immediate corrections.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl">
                                        📊
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">Actionable Insights</h3>
                                        <p className="text-indigo-100">
                                            Identify weak concepts, track teacher effectiveness, and get admin-level insights to improve school performance.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl">
                                        🔒
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">DRM Protected Lectures</h3>
                                        <p className="text-indigo-100">
                                            Un-recordable in-class lectures protect your school's intellectual property and maintain content exclusivity.
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
                            Simple Implementation, Powerful Results
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                            Get your school up and running in days, not months
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
                                <div className="text-5xl mb-4">🏫</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">White-Label Setup</h3>
                                <p className="text-slate-600">
                                    Your school's branding, logo, and domain. Launch your custom learning platform within days.
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
                                <div className="text-5xl mb-4">📚</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Upload Content</h3>
                                <p className="text-slate-600">
                                    Teachers upload lectures. AI auto-generates personalized tasks, quizzes, and past papers in minutes.
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
                                <div className="text-5xl mb-4">📈</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Track & Optimize</h3>
                                <p className="text-slate-600">
                                    Monitor student performance, teacher effectiveness, and school-wide metrics from your admin dashboard.
                                </p>
                            </div>
                        </motion.div>
                    </div>
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
                            Key Features That Drive Results
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-indigo-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                🎨
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">White-Labeling</h3>
                            <p className="text-slate-600 text-sm">
                                Your school's brand front and center. Custom domain, logo, and colors.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-violet-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                🎮
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Gamification</h3>
                            <p className="text-slate-600 text-sm">
                                Streaks, leaderboards, and XP motivate daily engagement and completion.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-purple-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                📝
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Past Paper Practice</h3>
                            <p className="text-slate-600 text-sm">
                                Real exam questions with AI grading and instant feedback.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-green-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                🔍
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Weak Concept Detection</h3>
                            <p className="text-slate-600 text-sm">
                                AI identifies struggling students and weak topics for targeted intervention.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-orange-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                🔒
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Content Protection</h3>
                            <p className="text-slate-600 text-sm">
                                DRM-protected lectures prevent unauthorized recording and sharing.
                            </p>
                        </motion.div>

                        <motion.div
                            className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-slate-100 hover:border-blue-200"
                            variants={scaleIn}
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                📊
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Admin Dashboard</h3>
                            <p className="text-slate-600 text-sm">
                                School-wide insights on teachers, students, and performance metrics.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Benefits for all stakeholders */}
            <motion.section
                className="py-20 bg-gradient-to-br from-slate-50 to-indigo-50"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div className="text-center mb-12" variants={fadeInUp}>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                            Win-Win-Win for Everyone
                        </h2>
                        <p className="mt-4 text-lg text-slate-600">
                            Schools grow, students excel, parents save
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 shadow-lg">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-2xl mb-4">
                                🏫
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Schools</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">10% increase in admissions</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">Enhanced brand reputation</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">Competitive differentiation</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 shadow-lg">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-2xl mb-4">
                                🎓
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Students</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">1+ grade improvement (B → A)</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">Learn at their own pace</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">Engaging gamified experience</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 shadow-lg">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mb-4">
                                👨‍👩‍👧
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Parents</h3>
                            <div className="space-y-3">
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">90% savings on tuition fees</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">No costly exam prep materials</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-700 text-sm">Transparent progress tracking</p>
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
                            Transform Your School's Education Model
                        </h2>
                        <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                            Join leading institutions adopting asynchronous learning. Boost admissions, improve grades, and establish your school as an innovation leader.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <Button
                                size="lg"
                                className="bg-white text-indigo-600 hover:bg-slate-100 shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-lg font-semibold"
                                onClick={() => router.push('/dashboard')}
                            >
                                Get Started
                            </Button>
                        </div>

                        <p className="text-sm text-indigo-200">
                            White-label setup included
                        </p>
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
        </main >
    );
}
