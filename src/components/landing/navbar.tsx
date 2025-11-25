'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn } from 'lucide-react';

export function Navbar() {
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:px-12 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm supports-[backdrop-filter]:bg-white/60"
        >
            <div className="flex items-center gap-2 md:gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 ring-1 ring-white/50">
                    <span className="text-white font-bold text-lg md:text-xl font-heading">S</span>
                </div>
                <span className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 tracking-tight font-heading">
                    SwarnaVyapar
                </span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <Link href="#features" className="hover:text-gold-600 transition-colors hover:scale-105 transform duration-200">Features</Link>
                <Link href="#ai-features" className="hover:text-gold-600 transition-colors hover:scale-105 transform duration-200">AI Suite</Link>
                <Link href="#showcase" className="hover:text-gold-600 transition-colors hover:scale-105 transform duration-200">Showcase</Link>
                <Link href="#pricing" className="hover:text-gold-600 transition-colors hover:scale-105 transform duration-200">Pricing</Link>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <Link href="/login">
                    <Button variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-medium px-2 md:px-4 text-sm">
                        Login
                    </Button>
                </Link>
                <Link href="/signup">
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 rounded-full px-4 md:px-6 h-9 md:h-10 text-sm transition-all hover:scale-105 hover:shadow-xl">
                        <span className="hidden sm:inline">Signup Now</span>
                        <span className="sm:hidden">Signup</span>
                        <ArrowRight className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                </Link>
            </div>
        </motion.nav>
    );
}
