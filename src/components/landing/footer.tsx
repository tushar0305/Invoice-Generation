'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import Image from 'next/image';

const socialLinks = [
    { href: 'https://facebook.com', label: 'Facebook' },
    { href: 'https://twitter.com', label: 'Twitter' },
    { href: 'https://instagram.com', label: 'Instagram' },
    { href: 'https://linkedin.com', label: 'LinkedIn' },
];

const footerLinks = [
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#showcase', label: 'Showcase' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
];

export function Footer() {
    return (
        <footer 
            className="bg-white border-t border-slate-100 py-8 md:py-12"
            role="contentinfo"
            aria-label="Site footer"
        >
            <div className="container px-4 md:px-6 mx-auto max-w-7xl">
                {/* Main Footer Content */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 rounded-lg w-fit"
                        aria-label="SwarnaVyapar Home"
                    >
                        <div className="relative h-10 w-[180px] md:h-12 md:w-[220px] -ml-8 md:-ml-10">
                            <Image
                                src="/logo/swarnavyapar_light.png"
                                alt="SwarnaVyapar"
                                fill
                                style={{ objectFit: 'contain' }}
                                sizes="(max-width: 768px) 180px, 220px"
                            />
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2">
                        {footerLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm text-slate-600 hover:text-gold-600 transition-colors focus:outline-none focus-visible:text-gold-600 focus-visible:underline"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Social Links */}
                    <nav aria-label="Social media links" className="flex gap-4">
                        {socialLinks.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-slate-600 hover:text-gold-600 transition-colors focus:outline-none focus-visible:text-gold-600 focus-visible:underline"
                                aria-label={social.label}
                            >
                                {social.label}
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <span>© {new Date().getFullYear()}</span>
                        <span>·</span>
                        <span>Crafted with</span>
                        <Heart className="h-3 w-3 text-red-500 fill-red-500" aria-hidden="true" />
                        <span>in India</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                        <span>All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}