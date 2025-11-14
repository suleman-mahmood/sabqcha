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
        <main className="min-h-screen bg-background text-foreground">
            {/* Hero Section */}
            <motion.section
                className="container mx-auto max-w-7xl px-6 pt-16 pb-24"
                initial="hidden"
                animate="visible"
                variants={container}
            >
                <div className="flex-1 text-center">
                    <motion.h1
                        className="text-5xl md:text-7xl font-extrabold leading-tight bg-gradient-to-r from-primary via-secondary to-chart-3 bg-clip-text text-transparent"
                        variants={fadeInUp}
                    >
                        After Class
                        <br />
                        Personalized AI Learning Experience
                    </motion.h1>

                    <motion.p
                        className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                        variants={fadeIn}
                    >
                        White-labeled platform providing gamified bite-sized learning.
                        <br />
                        Students get better grades.
                    </motion.p>

                    <motion.div
                        className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
                        variants={fadeIn}
                    >
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                            <Button
                                size="lg"
                                className="relative bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all px-10 py-7 text-lg font-semibold"
                                onClick={() => router.push('/dashboard')}
                            >
                                Get Started
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Impact Stats */}
            <motion.section
                className="py-20 bg-card border-y border-border"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="bg-primary/5 backdrop-blur-sm rounded-2xl px-6 py-10 border border-primary/20 h-full flex flex-col items-center justify-center hover:border-primary/40 transition-colors">
                                <div className="text-6xl md:text-7xl font-extrabold text-primary mb-3">
                                    +10%
                                </div>
                                <div className="text-xl md:text-2xl font-bold text-foreground mb-2">More Admissions</div>
                                <div className="text-sm text-muted-foreground">after full activation</div>
                                <div className="text-xs text-muted-foreground/80 mt-2">(10% more revenue)</div>
                            </div>
                        </motion.div>

                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="bg-secondary/5 backdrop-blur-sm rounded-2xl px-6 py-10 border border-secondary/20 h-full flex flex-col items-center justify-center hover:border-secondary/40 transition-colors">
                                <div className="text-6xl md:text-7xl font-extrabold text-secondary mb-3">
                                    B → A
                                </div>
                                <div className="text-xl md:text-2xl font-bold text-foreground mb-2">At Least 1+ Grade</div>
                                <div className="text-sm text-muted-foreground">improvement</div>
                            </div>
                        </motion.div>

                        <motion.div className="text-center" variants={scaleIn}>
                            <div className="bg-accent/5 backdrop-blur-sm rounded-2xl px-6 py-10 border border-accent/20 h-full flex flex-col items-center justify-center hover:border-accent/40 transition-colors">
                                <div className="text-6xl md:text-7xl font-extrabold text-accent mb-3">
                                    90%
                                </div>
                                <div className="text-xl md:text-2xl font-bold text-foreground mb-2">Savings</div>
                                <div className="text-sm text-muted-foreground">on tuition fees</div>
                                <div className="text-xs text-muted-foreground/80 mt-2">& learning resources</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Solution */}
            <motion.section
                className="py-24 bg-muted/30"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div className="text-center mb-16" variants={fadeInUp}>
                        <div className="inline-block px-5 py-2 bg-primary/10 backdrop-blur-sm rounded-full text-sm font-semibold mb-6 text-primary border border-primary/20">
                            The Complete Solution
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                            Your School's All-in-One Platform
                        </h2>
                        <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            White-labeled platform that supports asynchronous learning, protects your content, and boosts your school's reputation.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div variants={fadeIn}>
                            <div className="space-y-8">
                                <div className="flex gap-5 group">
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl border border-primary/20 group-hover:border-primary/40 transition-colors">
                                        🎯
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2 text-foreground">AI Micro-Learning</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Converts long lectures into bite-sized, gamified daily challenges. Personalized algorithms boost retention through spaced repetition.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-5 group">
                                    <div className="w-14 h-14 rounded-xl bg-secondary/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl border border-secondary/20 group-hover:border-secondary/40 transition-colors">
                                        ✍️
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2 text-foreground">AI Grader</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Gives instant, personalized feedback on real past paper questions. Students learn faster with immediate corrections.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-5 group">
                                    <div className="w-14 h-14 rounded-xl bg-chart-3/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl border border-chart-3/20 group-hover:border-chart-3/40 transition-colors">
                                        📊
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2 text-foreground">Actionable Insights</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Identify weak concepts, track teacher effectiveness, and get admin-level insights to improve school performance.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-5 group">
                                    <div className="w-14 h-14 rounded-xl bg-accent/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-2xl border border-accent/20 group-hover:border-accent/40 transition-colors">
                                        🔒
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2 text-foreground">DRM Protected Lectures</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Un-recordable in-class lectures protect your school's intellectual property and maintain content exclusivity.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative hidden md:block"
                            variants={scaleIn}
                        >
                            <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-8 border border-border shadow-lg">
                                <div className="space-y-5">
                                    <motion.div
                                        className="bg-card rounded-xl p-5 shadow-md border border-border hover:border-primary/40 transition-colors"
                                        initial={{ x: 50, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl border border-primary/20">
                                                ✓
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-foreground text-lg">Daily Streak: 12 days</div>
                                                <div className="text-sm text-muted-foreground">Keep going!</div>
                                            </div>
                                            <div className="text-3xl">🔥</div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-card rounded-xl p-5 shadow-md border border-border hover:border-secondary/40 transition-colors"
                                        initial={{ x: 50, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-xl border border-secondary/20">
                                                ⭐
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-foreground text-lg">Level Up!</div>
                                                <div className="text-sm text-muted-foreground">You're now Level 8</div>
                                            </div>
                                            <div className="text-lg font-bold text-secondary">+150 XP</div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-card rounded-xl p-5 shadow-md border border-border hover:border-accent/40 transition-colors"
                                        initial={{ x: 50, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-xl border border-accent/20">
                                                🏆
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-foreground text-lg">Class Rank #2</div>
                                                <div className="text-sm text-muted-foreground">50 XP to #1!</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Benefits for all stakeholders */}
            <motion.section
                className="py-24 bg-background"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <motion.div className="text-center mb-16" variants={fadeInUp}>
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                            Win-Win-Win for Everyone
                        </h2>
                        <p className="mt-6 text-lg text-muted-foreground">
                            Schools grow, students excel, parents save
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <motion.div variants={fadeIn} className="bg-card rounded-2xl p-8 shadow-lg border border-border hover:border-primary/40 transition-colors group">
                            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-3xl mb-6 border border-primary/20 group-hover:border-primary/40 transition-colors">
                                🏫
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-6">Schools</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">10% increase in admissions</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">Enhanced brand reputation</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">Competitive differentiation</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeIn} className="bg-card rounded-2xl p-8 shadow-lg border border-border hover:border-secondary/40 transition-colors group">
                            <div className="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center text-3xl mb-6 border border-secondary/20 group-hover:border-secondary/40 transition-colors">
                                🎓
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-6">Students</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">1+ grade improvement (B → A)</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">Learn at their own pace</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">Engaging gamified experience</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeIn} className="bg-card rounded-2xl p-8 shadow-lg border border-border hover:border-accent/40 transition-colors group">
                            <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-3xl mb-6 border border-accent/20 group-hover:border-accent/40 transition-colors">
                                👨‍👩‍👧
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-6">Parents</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">90% savings on tuition fees</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">No costly exam prep materials</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-card-foreground">Transparent progress tracking</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Final CTA */}
            <motion.section
                className="py-24 bg-muted/50 border-y border-border relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={container}
            >
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto max-w-4xl px-6 relative z-10">
                    <motion.div className="text-center" variants={fadeInUp}>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">
                            Transform Your School's Education Model
                        </h2>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                                <Button
                                    size="lg"
                                    className="relative bg-primary hover:bg-primary/90 text-white shadow-xl hover:shadow-2xl transition-all px-10 py-7 text-lg font-semibold"
                                    onClick={() => router.push('/dashboard')}
                                >
                                    Get Started
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Footer */}
            <motion.footer
                className="bg-card border-t border-border py-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
            >
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                                    S
                                </div>
                                <span className="text-foreground font-bold text-xl">Sool</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Helping you adopt personalized learning
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © 2025 Sool Edtech (Private) Limited.
                        </p>
                    </div>
                </div>
            </motion.footer>
        </main>
    );
}
