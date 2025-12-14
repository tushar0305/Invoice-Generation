'use client';

import { motion } from 'framer-motion';
import { BookOpen, Scale, ArrowRight, History, Calculator, Bell, FileText, TrendingDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FinancialControlPreview } from '@/components/landing/financial-control-preview';

export function KhataLoanSection() {

    return (
        <section className="py-32 relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-gold-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-100 to-amber-100 border border-gold-200 text-gold-700 text-sm font-semibold mb-6">
                        <Sparkles className="h-4 w-4" />
                        <span>Financial Management</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold font-heading text-slate-900 mb-6">
                        Complete Financial <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-amber-500">Control</span>
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Manage your <span className="font-semibold text-gold-600">Udhaar Khata</span> and <span className="font-semibold text-blue-600">Gold Loans</span> with precision and ease.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
                    {/* Interactive Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <FinancialControlPreview />
                    </motion.div>

                    {/* Features Text */}
                    <div className="space-y-10">
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            viewport={{ once: true }}
                            className="flex gap-5"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-gold-500/30">
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Digital Udhaar Khata</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Replace paper ledgers with a secure digital record. Send WhatsApp payment reminders with one tap. Track partial payments and settle accounts instantly.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            viewport={{ once: true }}
                            className="flex gap-5"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
                                <Scale className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Gold Loan Management</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Manage Girvi/Loans professionally. Auto-calculate interest (Simple/Compound), print loan agreements, and track due dates without the headache.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:from-slate-800 hover:to-slate-600 rounded-full shadow-xl">
                                Start Managing Finances <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
