'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, Scale, TrendingDown, Bell, Check, MousePointer2, Calculator, FileText } from 'lucide-react';

export function FinancialControlPreview() {
    const [activeTab, setActiveTab] = useState<'khata' | 'loan'>('khata');
    const [reminderSent, setReminderSent] = useState(false);
    const cursorControls = useAnimation();

    useEffect(() => {
        const sequence = async () => {
            while (true) {
                // Reset State
                setReminderSent(false);
                setActiveTab('khata');

                // 1. Start: Cursor enters, moves to "Send Reminder"
                await cursorControls.start({ x: 0, y: 0, opacity: 0, transition: { duration: 0 } });
                await cursorControls.start({ opacity: 1, transition: { duration: 0.5 } });
                await cursorControls.start({ x: 400, y: 320, transition: { duration: 1.5, ease: "easeInOut" } });

                // 2. Click "Send Reminder"
                await cursorControls.start({ scale: 0.9, transition: { duration: 0.1 } });
                await cursorControls.start({ scale: 1, transition: { duration: 0.1 } });
                setReminderSent(true);
                await new Promise(r => setTimeout(r, 800));

                // 3. Move to "Gold Loans" tab
                await cursorControls.start({ x: 350, y: 60, transition: { duration: 1.2, ease: "easeInOut" } });

                // 4. Click "Gold Loans" tab
                await cursorControls.start({ scale: 0.9, transition: { duration: 0.1 } });
                await cursorControls.start({ scale: 1, transition: { duration: 0.1 } });
                setActiveTab('loan');
                await new Promise(r => setTimeout(r, 1500));

                // 5. Move out
                await cursorControls.start({ x: 600, y: 400, opacity: 0, transition: { duration: 1 } });
                await new Promise(r => setTimeout(r, 1000));
            }
        };

        sequence();
    }, [cursorControls]);

    return (
        <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-gold-400/20 to-blue-400/20 rounded-[2rem] blur-2xl opacity-50 pointer-events-none" />

            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden backdrop-blur-sm h-[500px] flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 shrink-0">
                    <button
                        className={cn(
                            "flex-1 p-5 font-semibold text-sm transition-all flex items-center justify-center gap-2",
                            activeTab === 'khata'
                                ? "bg-gradient-to-r from-gold-50 to-amber-50 text-gold-700 border-b-2 border-gold-500"
                                : "text-slate-500"
                        )}
                    >
                        <BookOpen className="w-4 h-4" /> Udhaar Khata
                    </button>
                    <button
                        className={cn(
                            "flex-1 p-5 font-semibold text-sm transition-all flex items-center justify-center gap-2",
                            activeTab === 'loan'
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-500"
                                : "text-slate-500"
                        )}
                    >
                        <Scale className="w-4 h-4" /> Gold Loans
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 md:p-8 flex-1 bg-gradient-to-br from-slate-50/50 to-white relative overflow-hidden">
                    {/* KHATA TAB */}
                    {activeTab === 'khata' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
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

                            {/* Customer List */}
                            <div className="space-y-3">
                                {/* Customer 1 - Target for animation */}
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">RK</div>
                                        <div>
                                            <p className="font-bold text-slate-900">Rahul Kumar</p>
                                            <p className="text-xs text-slate-500">2 days overdue</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600 text-lg">₹45,000</p>
                                        {reminderSent ? (
                                            <span className="flex items-center justify-end gap-1 text-xs text-green-600 font-semibold animate-in fade-in zoom-in">
                                                <Check className="w-3 h-3" /> Sent
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gold-600 font-semibold">Send Reminder</span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center opacity-70">
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
                    )}

                    {/* LOAN TAB */}
                    {activeTab === 'loan' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-5"
                        >
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
                                        <p className="font-bold text-slate-900">₹50k</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                                        <p className="text-xs text-slate-500">Interest</p>
                                        <p className="font-bold text-slate-900">1.5%</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl text-center">
                                        <p className="text-xs text-slate-500">Due</p>
                                        <p className="font-bold text-slate-900">₹47k</p>
                                    </div>
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "60%" }}
                                        transition={{ duration: 0.8 }}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 w-[60%] h-full rounded-full"
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-slate-500">
                                    <span>60% Collected</span>
                                    <span>Due: 15 Dec 2024</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <Calculator className="w-5 h-5 text-blue-600" />
                                    <div className="flex flex-col">
                                        <p className="text-xs text-blue-800 font-medium">Auto Interest</p>
                                        <p className="text-[10px] text-blue-600">Calculated Daily</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gold-50 rounded-xl border border-gold-100">
                                    <FileText className="w-5 h-5 text-gold-600" />
                                    <div className="flex flex-col">
                                        <p className="text-xs text-gold-800 font-medium">Legal Agreements</p>
                                        <p className="text-[10px] text-gold-600">Ready to Print</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Simulated Cursor */}
                <motion.div
                    animate={cursorControls}
                    className="absolute top-0 left-0 z-50 pointer-events-none drop-shadow-xl"
                >
                    <MousePointer2 className="h-6 w-6 text-black fill-white drop-shadow-md transform -rotate-12" />
                </motion.div>
            </div>
        </div>
    );
}
