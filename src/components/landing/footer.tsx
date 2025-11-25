'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-white border-t border-slate-100 pt-16 pb-10">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16 max-w-7xl mx-auto text-left">
                    {/* Brand - Full width on mobile */}
                    <div className="col-span-2 md:col-span-1 space-y-6 flex flex-col items-start text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 ring-1 ring-white/50">
                                <span className="text-white font-bold text-xl">S</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900 tracking-tight font-heading">SwarnaVyapar</span>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                            India's most premium jewellery management suite. Designed for elegance, built for business growth.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <Link href="#" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-gold-600 hover:bg-gold-50 transition-all duration-300 hover:scale-110"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-gold-600 hover:bg-gold-50 transition-all duration-300 hover:scale-110"><Twitter className="h-5 w-5" /></Link>
                            <Link href="#" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-gold-600 hover:bg-gold-50 transition-all duration-300 hover:scale-110"><Instagram className="h-5 w-5" /></Link>
                            <Link href="#" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-gold-600 hover:bg-gold-50 transition-all duration-300 hover:scale-110"><Linkedin className="h-5 w-5" /></Link>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-6 font-heading text-lg">Product</h3>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li><Link href="#features" className="hover:text-gold-600 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" />Features</Link></li>
                            <li><Link href="#pricing" className="hover:text-gold-600 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" />Pricing</Link></li>
                            <li><Link href="#showcase" className="hover:text-gold-600 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" />Showcase</Link></li>
                            <li><Link href="#" className="hover:text-gold-600 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" />Updates</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-6 font-heading text-lg">Company</h3>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li><Link href="#" className="hover:text-gold-600 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" />About Us</Link></li>
                            <li><Link href="#" className="hover:text-gold-600 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" />Careers</Link></li>
                            <li><Link href="#" className="hover:text-gold-600 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" />Blog</Link></li>
                            <li><Link href="#" className="hover:text-gold-600 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-gold-500 transition-colors" />Contact</Link></li>
                        </ul>
                    </div>

                    {/* Contact - Full width on mobile or side-by-side if space allows, but usually better as full or separate */}
                    <div className="col-span-2 md:col-span-1">
                        <h3 className="font-bold text-slate-900 mb-6 font-heading text-lg">Contact</h3>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li className="flex items-center gap-3 group cursor-pointer justify-center md:justify-start">
                                <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-gold-600 group-hover:bg-gold-50 transition-colors">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <span className="group-hover:text-slate-900 transition-colors">hello@swarnavyapar.com</span>
                            </li>
                            <li className="flex items-center gap-3 group cursor-pointer justify-center md:justify-start">
                                <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-gold-600 group-hover:bg-gold-50 transition-colors">
                                    <Phone className="h-4 w-4" />
                                </div>
                                <span className="group-hover:text-slate-900 transition-colors">+91 98765 43210</span>
                            </li>
                            <li className="flex items-start gap-3 group cursor-pointer justify-center md:justify-start">
                                <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:text-gold-600 group-hover:bg-gold-50 transition-colors mt-0.5">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <span className="group-hover:text-slate-900 transition-colors text-left">123, Gold Souk, Zaveri Bazaar,<br />Mumbai, India 400002</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <div>© 2025 SwarnaVyapar. All rights reserved.</div>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
                        <Link href="#" className="hover:text-slate-900 transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
