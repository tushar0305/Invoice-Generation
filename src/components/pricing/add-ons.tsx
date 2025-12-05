'use client';

import { Check, MessageCircle, Zap, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AddOns() {
    return (
        <section className="py-16 bg-slate-50">
            <div className="container px-4 md:px-6 mx-auto">
                <header className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4 font-heading">
                        Powerful Add-Ons
                    </h2>
                    <p className="text-lg text-slate-600">
                        Customize your plan with extra power-ups as your business grows.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* WhatsApp Packs */}
                    <Card className="border-slate-200">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                                <MessageCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <CardTitle className="text-xl">WhatsApp Packs</CardTitle>
                            <CardDescription>Engage customers instantly</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                    <span className="text-sm font-medium">500 msgs</span>
                                    <span className="font-bold">₹99</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                    <span className="text-sm font-medium">1500 msgs</span>
                                    <span className="font-bold">₹249</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">5000 msgs</span>
                                    <span className="font-bold">₹499</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full">Add Plan</Button>
                        </CardContent>
                    </Card>

                    {/* AI Booster Packs */}
                    <Card className="border-slate-200">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                                <Zap className="h-6 w-6 text-purple-600" />
                            </div>
                            <CardTitle className="text-xl">AI Booster Packs</CardTitle>
                            <CardDescription>Extra queries for your assistant</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                    <span className="text-sm font-medium">100 queries</span>
                                    <span className="font-bold">₹49</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                    <span className="text-sm font-medium">300 queries</span>
                                    <span className="font-bold">₹99</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">750 queries</span>
                                    <span className="font-bold">₹199</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full">Add Plan</Button>
                        </CardContent>
                    </Card>

                    {/* Extra Branch */}
                    <Card className="border-slate-200">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                                <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <CardTitle className="text-xl">Extra Branch</CardTitle>
                            <CardDescription>Expand your empire</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col h-full justify-between gap-4">
                            <div>
                                <div className="text-3xl font-bold mb-1">₹199<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                <p className="text-sm text-slate-600">Per additional branch location</p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                    <li className="flex gap-2">
                                        <Check className="h-4 w-4 text-emerald-500" /> Unified Dashboard
                                    </li>
                                    <li className="flex gap-2">
                                        <Check className="h-4 w-4 text-emerald-500" /> Stock Transfer
                                    </li>
                                </ul>
                            </div>
                            <Button variant="outline" className="w-full mt-auto">Add Branch</Button>
                        </CardContent>
                    </Card>

                    {/* Extra Staff */}
                    <Card className="border-slate-200">
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                                <Users className="h-6 w-6 text-orange-600" />
                            </div>
                            <CardTitle className="text-xl">Extra Staff</CardTitle>
                            <CardDescription>For Starter/Pro plans</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col h-full justify-between gap-4">
                            <div>
                                <div className="text-3xl font-bold mb-1">₹49<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                <p className="text-sm text-slate-600">Per additional user license</p>
                                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                    <li className="flex gap-2">
                                        <Check className="h-4 w-4 text-emerald-500" /> Custom Permissions
                                    </li>
                                    <li className="flex gap-2">
                                        <Check className="h-4 w-4 text-emerald-500" /> Activity Logs
                                    </li>
                                </ul>
                            </div>
                            <Button variant="outline" className="w-full mt-auto">Add License</Button>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </section>
    );
}
