'use client';

import { motion } from 'framer-motion';
import { BookOpen, Scale, ArrowRight, History, Calculator, Bell, FileText, TrendingDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function KhataLoanSection() {
    const [activeTab, setActiveTab] = useState<'khata' | 'loan'>('khata');

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
                        {/* Glow Effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-gold-400/20 to-blue-400/20 rounded-[2rem] blur-2xl opacity-50" />

                        <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden backdrop-blur-sm">
                            {/* Tabs */}
                            <div className="flex border-b border-slate-100">
                                <button
                                    onClick={() => setActiveTab('khata')}
                                    className={cn(
                                        "flex-1 p-5 font-semibold text-sm transition-all flex items-center justify-center gap-2",
                                        activeTab === 'khata'
                                            ? "bg-gradient-to-r from-gold-50 to-amber-50 text-gold-700 border-b-2 border-gold-500"
                                            : "text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    <BookOpen className="w-4 h-4" /> Udhaar Khata
                                </button>
                                <button
                                    onClick={() => setActiveTab('loan')}
                                    className={cn(
                                        "flex-1 p-5 font-semibold text-sm transition-all flex items-center justify-center gap-2",
                                        activeTab === 'loan'
                                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-500"
                                            : "text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    <Scale className="w-4 h-4" /> Gold Loans
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-8 min-h-[420px] bg-gradient-to-br from-slate-50/50 to-white">
                                {activeTab === 'khata' ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key="khata"
                                        className="space-y-4"
                                    >
                                        {/* Stats Row */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                                <TrendingDown className="w-5 h-5 text-red-500 mb-2" />
                                                <p className="text-2xl font-bold text-red-600">₹1,25,000</p>
                                                <p className="text-xs text-red-500">Total Receivable</p>
                                            </div>
                                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                                <Bell className="w-5 h-5 text-green-500 mb-2" />
                                                <p className="text-2xl font-bold text-green-600">3</p>
                                                <p className="text-xs text-green-500">Reminders Sent Today</p>
                                            </div>
                                        </div>

                                        {/* Customer Cards */}
                                        <div className="space-y-3">
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">RK</div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Rahul Kumar</p>
                                                        <p className="text-xs text-slate-500">2 days overdue</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-red-600 text-lg">₹45,000</p>
                                                    <button className="text-xs text-gold-600 font-semibold hover:underline">Send Reminder</button>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">AS</div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Anita Singh</p>
                                                        <p className="text-xs text-green-600">Paid just now</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600 text-lg">+₹12,000</p>
                                                    <p className="text-xs text-slate-400">Settled</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key="loan"
                                        className="space-y-5"
                                    >
                                        {/* Loan Card */}
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-5">
                                                <div>
                                                    <p className="text-xs text-slate-500 font-mono">Loan #GL-2024-001</p>
                                                    <h4 className="font-bold text-xl text-slate-900 mt-1">Gold Bangle Set (22k)</h4>
                                                </div>
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 mb-5">
                                                <div className="p-3 bg-slate-50 rounded-xl text-center">
                                                    <p className="text-xs text-slate-500">Principal</p>
                                                    <p className="font-bold text-slate-900">₹50,000</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-xl text-center">
                                                    <p className="text-xs text-slate-500">Interest</p>
                                                    <p className="font-bold text-slate-900">1.5%</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-xl text-center">
                                                    <p className="text-xs text-slate-500">Due</p>
                                                    <p className="font-bold text-slate-900">₹47,000</p>
                                                </div>
                                            </div>

                                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-[60%] h-full rounded-full" />
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                <span>60% Collected</span>
                                                <span>Due: 15 Dec 2024</span>
                                            </div>
                                        </div>

                                        {/* Info Cards */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                <Calculator className="w-5 h-5 text-blue-600" />
                                                <p className="text-xs text-blue-800 font-medium">Auto Interest Calc</p>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-gold-50 rounded-xl border border-gold-100">
                                                <FileText className="w-5 h-5 text-gold-600" />
                                                <p className="text-xs text-gold-800 font-medium">Print Agreement</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
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
