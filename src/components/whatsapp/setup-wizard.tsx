'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Check,
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Phone,
    Key,
    Building2,
    Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SetupWizardProps {
    shopId: string;
    onComplete: () => void;
}

const steps = [
    { id: 1, title: 'Introduction', icon: MessageSquare },
    { id: 2, title: 'Prerequisites', icon: Check },
    { id: 3, title: 'Get Credentials', icon: Key },
    { id: 4, title: 'Connect', icon: Phone },
    { id: 5, title: 'Success', icon: Rocket },
];

export function WhatsAppSetupWizard({ shopId, onComplete }: SetupWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionTested, setConnectionTested] = useState(false);
    const [skipValidation, setSkipValidation] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const { toast } = useToast();

    // Form fields
    const [formData, setFormData] = useState({
        phone_number: '',
        waba_id: '',
        phone_number_id: '',
        access_token: '',
    });

    const handleTestConnection = async () => {
        if (!formData.phone_number_id || !formData.access_token) {
            toast({
                title: 'Missing fields',
                description: 'Please enter Phone Number ID and Access Token',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/whatsapp/config/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number_id: formData.phone_number_id,
                    access_token: formData.access_token,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setConnectionTested(true);
                setDisplayName(data.display_name || '');
                toast({
                    title: '✅ Connection successful!',
                    description: `Connected to ${data.display_name || 'WhatsApp Business'}`,
                });
            } else {
                toast({
                    title: 'Connection failed',
                    description: data.error || 'Please check your credentials',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to test connection',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndConnect = async () => {
        // Allow bypass for testing
        if (!connectionTested && !skipValidation) {
            toast({
                title: 'Test required',
                description: 'Please test the connection first or skip validation',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/whatsapp/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId,
                    ...formData,
                    display_name: displayName || 'Test Mode',
                    skip_validation: skipValidation,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setCurrentStep(5);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to save configuration',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save configuration',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="text-center space-y-6">
                        <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                            <MessageSquare className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                WhatsApp Business API
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Connect your WhatsApp Business account to send marketing messages
                            </p>
                        </div>
                        <div className="space-y-3 text-left bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            {[
                                'Send bulk promotional messages',
                                'Share invoices instantly',
                                'Festival greetings & offers',
                                'Payment reminders',
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-start gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <span>Meta charges ~₹0.50-1.00 per conversation. You pay Meta directly.</span>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Prerequisites
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Make sure you have the following before continuing:
                        </p>
                        <div className="space-y-3">
                            {[
                                { text: 'Facebook Business account', done: true },
                                { text: 'Business verified on Meta', done: true },
                                { text: 'Dedicated WhatsApp number (not personal)', done: true },
                                { text: 'Access to Meta Developer Console', done: true },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                        <Check className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="text-sm">{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <a
                            href="https://business.facebook.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                            Go to Facebook Business <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Generate API Credentials
                        </h2>
                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-semibold text-xs">1</div>
                                <span>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a></span>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-semibold text-xs">2</div>
                                <span>Create App → Select "Business" → Add WhatsApp product</span>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-semibold text-xs">3</div>
                                <span>Go to WhatsApp → API Setup</span>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-semibold text-xs">4</div>
                                <div>
                                    <span>Copy these values:</span>
                                    <ul className="mt-1 ml-4 list-disc text-gray-600 dark:text-gray-400">
                                        <li>Phone Number ID</li>
                                        <li>WhatsApp Business Account ID</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-semibold text-xs">5</div>
                                <span>Generate a Permanent Access Token (System User)</span>
                            </div>
                        </div>
                        <a
                            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100"
                        >
                            📺 View Official Guide <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-5">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Enter Your Credentials
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="phone_number">WhatsApp Phone Number</Label>
                                <Input
                                    id="phone_number"
                                    placeholder="+91 98765 43210"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                />
                            </div>

                            <div>
                                <Label htmlFor="waba_id">WhatsApp Business Account ID</Label>
                                <Input
                                    id="waba_id"
                                    placeholder="123456789012345"
                                    value={formData.waba_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, waba_id: e.target.value }))}
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone_number_id">Phone Number ID</Label>
                                <Input
                                    id="phone_number_id"
                                    placeholder="109876543210123"
                                    value={formData.phone_number_id}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, phone_number_id: e.target.value }));
                                        setConnectionTested(false);
                                    }}
                                />
                            </div>

                            <div>
                                <Label htmlFor="access_token">Access Token</Label>
                                <Input
                                    id="access_token"
                                    type="password"
                                    placeholder="Your permanent access token"
                                    value={formData.access_token}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, access_token: e.target.value }));
                                        setConnectionTested(false);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleTestConnection}
                                disabled={isLoading}
                                className={`flex-1 ${connectionTested ? 'border-green-500 text-green-600' : ''}`}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : connectionTested ? (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                ) : null}
                                {connectionTested ? 'Verified!' : 'Test Connection'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSkipValidation(true);
                                    setConnectionTested(true);
                                    setDisplayName('Test Mode');
                                    toast({ title: 'Validation skipped', description: 'You can now save without testing' });
                                }}
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                                Skip
                            </Button>
                        </div>

                        {connectionTested && displayName && (
                            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${skipValidation ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20'}`}>
                                <Building2 className="h-4 w-4" />
                                <span>{skipValidation ? 'Validation skipped - Test Mode' : `Connected to: `}<strong>{!skipValidation && displayName}</strong></span>
                            </div>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="text-center space-y-6">
                        <div className="h-20 w-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                WhatsApp Connected!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Your WhatsApp Business account is now linked to SwarnaVyapar
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <span>{formData.phone_number}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-gray-400" />
                                <span>{displayName || 'WhatsApp Business'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-green-600">Verified & Connected</span>
                            </div>
                        </div>
                        <Button onClick={onComplete} className="w-full bg-green-600 hover:bg-green-700">
                            Go to Marketing Dashboard
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Card className="max-w-lg mx-auto border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
            <CardContent className="p-6">
                {/* Progress indicator */}
                <div className="flex items-center justify-between mb-8">
                    {steps.map((step, i) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${currentStep >= step.id
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                    }`}
                            >
                                {currentStep > step.id ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    step.id
                                )}
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-8 h-0.5 mx-1 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {currentStep < 5 && (
                    <div className="flex justify-between mt-8">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                            disabled={currentStep === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>

                        {currentStep < 4 ? (
                            <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                                Continue
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSaveAndConnect}
                                disabled={(!connectionTested && !skipValidation) || isLoading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : null}
                                Save & Connect
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
