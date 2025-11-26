'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const socialLinks = [
    { href: '#', label: 'Follow us on Facebook', icon: Facebook },
    { href: '#', label: 'Follow us on Twitter', icon: Twitter },
    { href: '#', label: 'Follow us on Instagram', icon: Instagram },
    { href: '#', label: 'Follow us on LinkedIn', icon: Linkedin },
];

const productLinks = [
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#showcase', label: 'Showcase' },
    { href: '#', label: 'Updates' },
];

const companyLinks = [
    { href: '#', label: 'About Us' },
    { href: '#', label: 'Careers' },
    { href: '#', label: 'Blog' },
    { href: '#', label: 'Contact' },
];

const legalLinks = [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
];

export function Footer() {
    return (
        <footer 
            className="bg-white border-t border-slate-100 pt-12 md:pt-16 pb-8 md:pb-10"
            role="contentinfo"
            aria-label="Site footer"
        >
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16 max-w-7xl mx-auto">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1 space-y-4 md:space-y-6">
                        <Link 
                            href="/" 
                            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 rounded-lg w-fit"
                            aria-label="SwarnaVyapar Home"
                        >
                            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 ring-1 ring-white/50">
                                <span className="text-white font-bold text-lg md:text-xl" aria-hidden="true">S</span>
                            </div>
                            <span className="text-lg md:text-xl font-bold text-slate-900 tracking-tight font-heading">
                                SwarnaVyapar
                            </span>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                            India's most premium jewellery management suite. Designed for elegance, built for business growth.
                        </p>
                        <nav aria-label="Social media links">
                            <ul className="flex gap-3 pt-2">
                                {socialLinks.map((social) => (
                                    <li key={social.label}>
                                        <a 
                                            href={social.href} 
                                            className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-slate-50 text-slate-400 hover:text-gold-600 hover:bg-gold-50 transition-all duration-300 hover:scale-110 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2" 
                                            aria-label={social.label}
                                        >
                                            <social.icon className="h-5 w-5" aria-hidden="true" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    {/* Product */}
                    <nav aria-label="Product links">
                        <h3 className="font-bold text-slate-900 mb-4 md:mb-6 font-heading text-base md:text-lg">Product</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm text-slate-500">
                            {productLinks.map((link) => (
                                <li key={link.label}>
                                    <Link 
                                        href={link.href} 
                                        className="hover:text-gold-600 transition-colors flex items-center gap-2 group py-1 focus:outline-none focus-visible:text-gold-600"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" aria-hidden="true" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Company */}
                    <nav aria-label="Company links">
                        <h3 className="font-bold text-slate-900 mb-4 md:mb-6 font-heading text-base md:text-lg">Company</h3>
                        <ul className="space-y-3 md:space-y-4 text-sm text-slate-500">
                            {companyLinks.map((link) => (
                                <li key={link.label}>
                                    <Link 
                                        href={link.href} 
                                        className="hover:text-gold-600 transition-colors flex items-center gap-2 group py-1 focus:outline-none focus-visible:text-gold-600"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" aria-hidden="true" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Contact */}
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="font-bold text-slate-900 mb-4 md:mb-6 font-heading text-base md:text-lg">Contact</h3>
                        <address className="not-italic">
                            <ul className="space-y-3 md:space-y-4 text-sm text-slate-500">
                                <li>
                                    <a 
                                        href="mailto:hello@swarnavyapar.com" 
                                        className="flex items-center gap-3 group py-1 focus:outline-none focus-visible:text-gold-600"
                                    >
                                        <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-gold-600 group-hover:bg-gold-50 transition-colors" aria-hidden="true">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <span className="group-hover:text-slate-900 transition-colors">hello@swarnavyapar.com</span>
                                    </a>
                                </li>
                                <li>
                                    <a 
                                        href="tel:+919876543210" 
                                        className="flex items-center gap-3 group py-1 focus:outline-none focus-visible:text-gold-600"
                                    >
                                        <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-gold-600 group-hover:bg-gold-50 transition-colors" aria-hidden="true">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <span className="group-hover:text-slate-900 transition-colors">+91 98765 43210</span>
                                    </a>
                                </li>
                                <li className="flex items-start gap-3 group">
                                    <div className="p-2 rounded-lg bg-slate-50 text-slate-400 mt-0.5" aria-hidden="true">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <span className="text-left leading-relaxed">
                                        123, Gold Souk, Zaveri Bazaar,<br />Mumbai, India 400002
                                    </span>
                                </li>
                            </ul>
                        </address>
                    </div>
                </div>

                <div className="pt-6 md:pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <p>© {new Date().getFullYear()} SwarnaVyapar. All rights reserved.</p>
                    <nav aria-label="Legal links">
                        <ul className="flex flex-wrap justify-center gap-4 md:gap-8">
                            {legalLinks.map((link) => (
                                <li key={link.label}>
                                    <Link 
                                        href={link.href} 
                                        className="hover:text-slate-900 transition-colors py-1 focus:outline-none focus-visible:text-gold-600 focus-visible:underline"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
