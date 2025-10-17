'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';


const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};

const fadeIn: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
};

export default function Page(): React.ReactElement {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50 text-slate-900">
            {/* Hero + Proof */}
            <motion.section className="container mx-auto max-w-6xl px-6 py-20" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={container}>
                <div className="flex flex-col-reverse md:flex-row items-center gap-10">
                    <div className="flex-1">
                        <motion.h1 className="text-5xl font-extrabold leading-tight text-left" variants={fadeIn}>
                            Learn Fast. Win Daily. 🎮
                        </motion.h1>
                        <motion.p className="mt-4 text-lg text-slate-600 max-w-xl" variants={fadeIn}>
                            AI converts lectures into bite-sized gamified challenges so students can stay consistent and ace exams
                        </motion.p>

                        <motion.div className="mt-6 flex items-center gap-4" variants={fadeIn}>
                            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white" onClick={() => router.push('/dashboard')}>
                                Get Started
                            </Button>
                        </motion.div>
                    </div>

                    {/* Right: phone mockup / illustration */}
                    <motion.div className="w-full md:w-96 flex-shrink-0 relative" variants={fadeIn}>
                        <div className="rounded-3xl bg-white p-4 shadow-lg">
                            <div className="h-80 rounded-lg bg-gradient-to-b from-indigo-100 to-violet-50 flex flex-col relative overflow-hidden">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="text-sm font-medium text-indigo-700">Sool • Tasks</div>
                                    <div className="text-xs text-slate-400">Today</div>
                                </div>
                                <div className="flex-1 p-4 space-y-3 overflow-hidden">
                                    <div className="h-12 rounded-md bg-white shadow-sm flex items-center px-4">• 5m • Recall: Photosynthesis</div>
                                    <div className="h-12 rounded-md bg-white shadow-sm flex items-center px-4">• 10m • Practice: Past Tense</div>
                                    <div className="h-12 rounded-md bg-white shadow-sm flex items-center px-4">• 7m • Quick MCQ</div>
                                </div>
                                <div className="p-3 border-t border-indigo-50 text-center text-sm text-indigo-700">Streak: 7 🔥 • XP +120</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Problem */}
            <motion.section className="border-t border-slate-100 py-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <div className="container mx-auto max-w-4xl px-6">
                    <h3 className="text-xl font-semibold">Why current study habits fail</h3>
                    <p className="mt-3 text-slate-600">Long lectures, procrastination, and last-minute cramming make learning stressful and short-lived.</p>
                    <ul className="mt-4 list-disc list-inside text-slate-600 space-y-2">
                        <li>Students forget concepts over time.</li>
                        <li>Exam prep becomes panic, not practice.</li>
                        <li>Teachers lack an easy way to turn lessons into daily practice.</li>
                    </ul>
                </div>
            </motion.section>

            {/* Solution */}
            <motion.section className="py-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <div className="container mx-auto max-w-4xl px-6">
                    <h3 className="text-xl font-semibold">Micro-learning that actually sticks</h3>
                    <p className="mt-3 text-slate-600">We transform lectures into daily bite-sized challenges, powered by AI and wrapped in fun gamification.</p>
                </div>
            </motion.section>

            {/* How it works */}
            <motion.section className="border-t border-slate-100 py-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container}>
                <div className="container mx-auto max-w-4xl px-6">
                    <h3 className="text-xl font-semibold">From lecture → challenge → mastery</h3>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <motion.div className="p-4 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="text-2xl font-bold">1</div>
                            <div className="mt-2 font-medium">Record</div>
                            <div className="mt-1 text-sm text-slate-500">Upload or record lectures in-app.</div>
                        </motion.div>
                        <motion.div className="p-4 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="text-2xl font-bold">2</div>
                            <div className="mt-2 font-medium">Auto-create</div>
                            <div className="mt-1 text-sm text-slate-500">Weekly AI crafts 5 tasks/day (Mon–Fri).</div>
                        </motion.div>
                        <motion.div className="p-4 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="text-2xl font-bold">3</div>
                            <div className="mt-2 font-medium">Play & Improve</div>
                            <div className="mt-1 text-sm text-slate-500">Students complete tasks, earn XP, keep streaks.</div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Core Features */}
            <motion.section className="py-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container}>
                <div className="container mx-auto max-w-5xl px-6">
                    <h3 className="text-xl font-semibold">Core features</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <motion.div className="p-3 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="font-medium">Record lectures</div>
                            <div className="text-sm text-slate-500 mt-1">Capture live classes or upload videos.</div>
                        </motion.div>
                        <motion.div className="p-3 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="font-medium">AI weekly digest</div>
                            <div className="text-sm text-slate-500 mt-1">Auto-generated 5× short tasks for next week.</div>
                        </motion.div>
                        <motion.div className="p-3 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="font-medium">Daily task queue</div>
                            <div className="text-sm text-slate-500 mt-1">Play pending tasks in one flow.</div>
                        </motion.div>
                        <motion.div className="p-3 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="font-medium">Streaks & XP</div>
                            <div className="text-sm text-slate-500 mt-1">Habit-forming rewards and progress.</div>
                        </motion.div>
                        <motion.div className="p-3 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="font-medium">Leaderboard</div>
                            <div className="text-sm text-slate-500 mt-1">Friendly competition with classmates.</div>
                        </motion.div>
                        <motion.div className="p-3 bg-white rounded-lg shadow-sm" variants={fadeIn}>
                            <div className="font-medium">Progress reports</div>
                            <div className="text-sm text-slate-500 mt-1">Simple analytics for students & teachers.</div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Benefits */}
            <motion.section className="border-t border-slate-100 py-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <div className="container mx-auto max-w-5xl px-6">
                    <h3 className="text-xl font-semibold">Benefits</h3>
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                        <div>
                            <div className="font-medium">Students</div>
                            <ul className="mt-2 text-slate-600 list-disc list-inside space-y-2 text-sm">
                                <li>Better retention with short reviews</li>
                                <li>Less procrastination, more habit</li>
                                <li>Score above your average</li>
                            </ul>
                        </div>
                        <div>
                            <div className="font-medium">Teachers</div>
                            <ul className="mt-2 text-slate-600 list-disc list-inside space-y-2 text-sm">
                                <li>Automate weekly practice materials</li>
                                <li>Track class engagement and outcomes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Gamification highlight */}
            <motion.section className="py-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={container}>
                <div className="container mx-auto max-w-5xl px-6">
                    <h3 className="text-xl font-semibold">Make practice addictive — in a good way</h3>
                    <p className="mt-3 text-slate-600">Daily streaks, XP, badges, and class leaderboards create a positive loop: practice → progress → pride.</p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 items-start">
                        <div className="p-4 bg-white rounded-lg shadow-sm">
                            <div className="font-medium">Sample Badges</div>
                            <div className="mt-3 flex gap-3">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">🏅</div>
                                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">🔥</div>
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">💡</div>
                            </div>
                        </div>

                        <div className="p-4 bg-white rounded-lg shadow-sm">
                            <div className="font-medium">Leaderboard</div>
                            <div className="mt-3 text-sm text-slate-600">
                                1. Alex — 12,400 XP
                                <br />2. Priya — 11,900 XP
                                <br />3. Sam — 10,800 XP
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Footer CTA + Links */}
            <motion.footer className="border-t border-slate-100 py-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <div className="text-lg font-semibold">Ready to turn lectures into daily wins?</div>
                            <div className="text-sm text-slate-600 mt-1">Get Started or reach out to learn about classroom plans.</div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white" onClick={() => router.push('/dashboard')}>Get Started</Button>
                        </div>
                    </div>
                </div>
            </motion.footer>
        </main>
    );
}
