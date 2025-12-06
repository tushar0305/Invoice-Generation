'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Send,
    Users,
    FileText,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { WhatsAppTemplate } from '@/types/whatsapp';

interface Customer {
    id: string;
    name: string;
    phone: string;
    total_purchases: number;
}

interface Props {
    shopId: string;
    templates: WhatsAppTemplate[];
    customers: Customer[];
}

type Segment = 'ALL' | 'HIGH_VALUE' | 'SINGLE';

export function SendCampaignClient({ shopId, templates, customers }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(0);
    const [failed, setFailed] = useState(0);
    const [isSending, setIsSending] = useState(false);

    // Form state
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [segment, setSegment] = useState<Segment>('ALL');
    const [singlePhone, setSinglePhone] = useState('');
    const [variables, setVariables] = useState<string[]>([]);

    // Calculate audience
    const getAudience = (): Customer[] => {
        switch (segment) {
            case 'HIGH_VALUE':
                const threshold = customers.length / 5; // Top 20%
                return customers.slice(0, Math.max(1, Math.floor(threshold)));
            case 'SINGLE':
                return [];
            default:
                return customers;
        }
    };

    const audience = getAudience();
    const template = templates.find(t => t.id === selectedTemplate);

    // Extract variable placeholders from template body
    const getVariablePlaceholders = (body: string): number => {
        const matches = body.match(/\{\{\d+\}\}/g);
        return matches ? matches.length : 0;
    };

    const variableCount = template ? getVariablePlaceholders(template.body) : 0;

    // Handle template selection
    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        const t = templates.find(t => t.id === templateId);
        if (t) {
            const count = getVariablePlaceholders(t.body);
            setVariables(new Array(count).fill(''));
        }
    };

    // Send to single recipient
    const sendSingle = async () => {
        if (!selectedTemplate || !singlePhone) {
            toast({ title: 'Missing fields', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId,
                    templateName: template?.name,
                    phoneNumber: singlePhone,
                    variables: variables.filter(v => v),
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast({ title: '✅ Message sent successfully!' });
                setSent(1);
            } else {
                toast({ title: 'Failed', description: data.error, variant: 'destructive' });
                setFailed(1);
            }
        } catch (error) {
            toast({ title: 'Error sending message', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    // Send to segment
    const sendBulk = async () => {
        if (!selectedTemplate || audience.length === 0) {
            toast({ title: 'Select template and audience', variant: 'destructive' });
            return;
        }

        setIsSending(true);
        setSent(0);
        setFailed(0);

        for (const customer of audience) {
            try {
                // Replace variables with customer data
                const customerVars = variables.map((v, i) => {
                    if (v === '{{name}}') return customer.name;
                    return v;
                });

                const res = await fetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shopId,
                        templateName: template?.name,
                        phoneNumber: customer.phone,
                        variables: customerVars.filter(v => v),
                        customerId: customer.id,
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    setSent(prev => prev + 1);
                } else {
                    setFailed(prev => prev + 1);
                }
            } catch {
                setFailed(prev => prev + 1);
            }

            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 100));
        }

        setIsSending(false);
        toast({
            title: 'Campaign Complete',
            description: `Sent: ${sent}, Failed: ${failed}`,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/shop/${shopId}/marketing`}>
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Send Campaign
                        </h1>
                        <p className="text-sm text-gray-500">
                            Send WhatsApp messages to your customers
                        </p>
                    </div>
                </div>

                {/* No templates warning */}
                {templates.length === 0 && (
                    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <div>
                                <p className="font-medium text-amber-800 dark:text-amber-200">
                                    No approved templates
                                </p>
                                <p className="text-sm text-amber-600">
                                    Create templates in Meta Business Suite first
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Template Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Select Template
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {templates.map((t) => (
                            <label
                                key={t.id}
                                className={`block p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === t.id
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="template"
                                    value={t.id}
                                    checked={selectedTemplate === t.id}
                                    onChange={() => handleTemplateChange(t.id)}
                                    className="sr-only"
                                />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{t.name}</p>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{t.body}</p>
                                    </div>
                                    {selectedTemplate === t.id && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                            </label>
                        ))}
                    </CardContent>
                </Card>

                {/* Variables */}
                {variableCount > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Template Variables</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {Array.from({ length: variableCount }).map((_, i) => (
                                <div key={i}>
                                    <Label>Variable {`{{${i + 1}}}`}</Label>
                                    <Input
                                        placeholder={i === 0 ? 'e.g., {{name}} or custom text' : 'Enter value'}
                                        value={variables[i] || ''}
                                        onChange={(e) => {
                                            const newVars = [...variables];
                                            newVars[i] = e.target.value;
                                            setVariables(newVars);
                                        }}
                                    />
                                </div>
                            ))}
                            <p className="text-xs text-gray-500">
                                Use <code className="bg-gray-100 px-1 rounded">{`{{name}}`}</code> to auto-fill customer name
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Audience Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Target Audience
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={segment} onValueChange={(v) => setSegment(v as Segment)}>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <RadioGroupItem value="ALL" />
                                    <div className="flex-1">
                                        <p className="font-medium">All Customers</p>
                                        <p className="text-sm text-gray-500">{customers.length} customers</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <RadioGroupItem value="HIGH_VALUE" />
                                    <div className="flex-1">
                                        <p className="font-medium">High-Value (Top 20%)</p>
                                        <p className="text-sm text-gray-500">
                                            {Math.floor(customers.length / 5)} customers
                                        </p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <RadioGroupItem value="SINGLE" />
                                    <div className="flex-1">
                                        <p className="font-medium">Single Recipient</p>
                                        <p className="text-sm text-gray-500">Send to one phone number</p>
                                    </div>
                                </label>
                            </div>
                        </RadioGroup>

                        {segment === 'SINGLE' && (
                            <div className="mt-4">
                                <Label>Phone Number</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="+91 98765 43210"
                                        value={singlePhone}
                                        onChange={(e) => setSinglePhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Summary & Send */}
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="font-semibold text-green-800 dark:text-green-200">
                                    Ready to Send
                                </p>
                                <p className="text-sm text-green-600">
                                    {segment === 'SINGLE'
                                        ? singlePhone || 'Enter phone number'
                                        : `${audience.length} recipients`}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-green-600">Est. Cost</p>
                                <p className="font-bold text-green-800 dark:text-green-200">
                                    ₹{((segment === 'SINGLE' ? 1 : audience.length) * 0.5).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {isSending && (
                            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span>Progress</span>
                                    <span>{sent + failed} / {audience.length}</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all"
                                        style={{ width: `${((sent + failed) / audience.length) * 100}%` }}
                                    />
                                </div>
                                <div className="flex gap-4 mt-2 text-sm">
                                    <span className="text-green-600">✓ Sent: {sent}</span>
                                    <span className="text-red-600">✗ Failed: {failed}</span>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={segment === 'SINGLE' ? sendSingle : sendBulk}
                            disabled={
                                isLoading ||
                                isSending ||
                                !selectedTemplate ||
                                (segment === 'SINGLE' && !singlePhone) ||
                                (segment !== 'SINGLE' && audience.length === 0)
                            }
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {isLoading || isSending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            {isSending ? 'Sending...' : 'Send Campaign'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
