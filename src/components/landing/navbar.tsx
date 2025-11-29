'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import Image from 'next/image';

const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#ai-features', label: 'AI Suite' },
    { href: '#showcase', label: 'Showcase' },
    { href: '#pricing', label: 'Pricing' },
];

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Handle scroll for navbar background
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsMenuOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

    const closeMenu = useCallback(() => setIsMenuOpen(false), []);

    const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        closeMenu();
        const element = document.querySelector(href);
        if (element) {
            const navHeight = 80;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: elementPosition - navHeight, behavior: 'smooth' });
        }
    }, [closeMenu]);

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                role="navigation"
                aria-label="Main navigation"
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    isScrolled 
                        ? 'bg-white/95 shadow-md backdrop-blur-xl' 
                        : 'bg-white/80 backdrop-blur-xl'
                } border-b border-slate-100`}
            >
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo (image) */}
                        <Link
                            href="/"
                            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 rounded-lg"
                            aria-label="SwarnaVyapar Home"
                        >
                            <div className="relative h-12 w-[200px] md:h-14 md:w-[260px] -ml-10 md:-ml-15">
                                    <Image
                                    src="/logo/swarnavyapar.png"
                                    alt="SwarnaVyapar"
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    priority={true}
                                    />
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1" role="menubar">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={(e) => handleNavClick(e, link.href)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-gold-600 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                                    role="menuitem"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>

                        {/* Desktop CTA Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link href="/login">
                                <Button 
                                    variant="ghost" 
                                    className="min-h-[44px] min-w-[44px] px-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-medium text-sm focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                                >
                                    Login
                                </Button>
                            </Link>
                            <a href="#pricing" onClick={(e) => handleNavClick(e, '#pricing')}>
                                <Button className="min-h-[44px] bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 rounded-full px-6 text-sm font-semibold transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2">
                                    Get Started <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                                </Button>
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 transition-colors"
                            aria-expanded={isMenuOpen}
                            aria-controls="mobile-menu"
                            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                            onClick={closeMenu}
                            aria-hidden="true"
                        />
                        
                        {/* Mobile Menu Panel */}
                        <motion.div
                            id="mobile-menu"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="fixed top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-50 md:hidden"
                            role="menu"
                            aria-orientation="vertical"
                        >
                            <nav className="container mx-auto px-4 py-6">
                                <ul className="space-y-1">
                                    {navLinks.map((link) => (
                                        <li key={link.href}>
                                            <a
                                                href={link.href}
                                                onClick={(e) => handleNavClick(e, link.href)}
                                                className="block px-4 py-3 text-base font-medium text-slate-700 hover:text-gold-600 hover:bg-gold-50 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-inset"
                                                role="menuitem"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                                
                                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                                    <Link href="/login" onClick={closeMenu} className="block">
                                        <Button 
                                            variant="outline" 
                                            className="w-full min-h-[48px] text-base font-medium border-slate-200 focus-visible:ring-2 focus-visible:ring-gold-500"
                                        >
                                            Login
                                        </Button>
                                    </Link>
                                    <a href="#pricing" onClick={(e) => handleNavClick(e, '#pricing')} className="block">
                                        <Button className="w-full min-h-[48px] bg-slate-900 text-white hover:bg-slate-800 text-base font-semibold rounded-xl focus-visible:ring-2 focus-visible:ring-gold-500">
                                            Get Started Free <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                                        </Button>
                                    </a>
                                </div>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}