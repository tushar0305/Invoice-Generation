'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Sparkles,
    Mic,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertCircle,
    Lightbulb,
    BarChart3,
    CheckCircle,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/supabase/client';

interface AIInsight {
    type: 'insight' | 'summary' | 'alert' | 'recommendation';
    title: string;
    summary: string;
    metrics?: { label: string; value: string; trend: 'up' | 'down' | 'neutral'; change: string }[];
    bullets?: string[];
    recommendations?: string[];
    confidence?: 'high' | 'medium' | 'low';
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    insight?: AIInsight;
    timestamp: Date;
}

interface AIChatProps {
    shopId: string;
}

const SUGGESTED_PROMPTS = [
    { icon: '💰', text: "What's today's revenue?" },
    { icon: '📦', text: "Which items are low on stock?" },
    { icon: '👥', text: "Who are my top customers?" },
    { icon: '📒', text: "What's my khata balance?" },
    { icon: '🏦', text: "How many active loans?" },
    { icon: '⭐', text: "Loyalty points summary" },
    { icon: '📈', text: "Compare this week vs last" },
    { icon: '🔮', text: "What should I restock?" },
];

export function AIChat({ shopId }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const askAI = async (question: string) => {
        if (!question.trim()) return;

        setError(null);
        setIsLoading(true);

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-insights`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question, shopId }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to get AI response');
            }

            const data = await response.json();

            // Add assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.insight?.summary || 'I processed your request.',
                insight: data.insight,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            console.error('AI Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        askAI(input);
    };

    const TrendIcon = ({ trend }: { trend: string }) => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-gray-400" />;
    };

    const InsightTypeIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'alert': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'recommendation': return <Lightbulb className="w-5 h-5 text-blue-500" />;
            case 'summary': return <BarChart3 className="w-5 h-5 text-purple-500" />;
            default: return <Sparkles className="w-5 h-5 text-primary" />;
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[600px] bg-background/50 rounded-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Swarna AI</h3>
                    <p className="text-xs text-muted-foreground">Your business intelligence assistant</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    // Welcome state with suggested prompts
                    <div className="space-y-4">
                        <div className="text-center py-6">
                            <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 mb-4">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h4 className="text-lg font-semibold mb-2">Ask me anything about your business</h4>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                I can analyze your sales, stock, customers, khata, loans, and loyalty data to give you insights.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {SUGGESTED_PROMPTS.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => askAI(prompt.text)}
                                    className="flex items-center gap-2 p-3 text-left text-sm rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all group"
                                >
                                    <span className="text-lg">{prompt.icon}</span>
                                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                        {prompt.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Messages
                    <AnimatePresence mode="popLayout">
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={cn(
                                    "flex",
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {message.role === 'user' ? (
                                    // User message
                                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-md bg-primary text-primary-foreground">
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                ) : (
                                    // AI response with insight card
                                    <div className="max-w-[90%] space-y-3">
                                        {message.insight && (
                                            <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
                                                <CardContent className="p-4 space-y-4">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <InsightTypeIcon type={message.insight.type} />
                                                            <h4 className="font-semibold text-foreground">{message.insight.title}</h4>
                                                        </div>
                                                        {message.insight.confidence && (
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] capitalize",
                                                                message.insight.confidence === 'high' && "border-emerald-500/50 text-emerald-600",
                                                                message.insight.confidence === 'medium' && "border-amber-500/50 text-amber-600",
                                                                message.insight.confidence === 'low' && "border-red-500/50 text-red-600",
                                                            )}>
                                                                {message.insight.confidence}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Summary */}
                                                    <p className="text-sm text-muted-foreground">{message.insight.summary}</p>

                                                    {/* Metrics */}
                                                    {message.insight.metrics && message.insight.metrics.length > 0 && (
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                            {message.insight.metrics.map((metric, i) => (
                                                                <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border/30">
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</p>
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-lg font-bold">{metric.value}</p>
                                                                        <div className="flex items-center gap-1">
                                                                            <TrendIcon trend={metric.trend} />
                                                                            <span className={cn(
                                                                                "text-xs font-medium",
                                                                                metric.trend === 'up' && "text-emerald-500",
                                                                                metric.trend === 'down' && "text-red-500",
                                                                            )}>
                                                                                {metric.change}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Bullets */}
                                                    {message.insight.bullets && message.insight.bullets.length > 0 && (
                                                        <ul className="space-y-1.5">
                                                            {message.insight.bullets.map((bullet, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                                    <span className="text-primary mt-1">•</span>
                                                                    <span className="text-muted-foreground">{bullet}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    {/* Recommendations */}
                                                    {message.insight.recommendations && message.insight.recommendations.length > 0 && (
                                                        <div className="pt-3 border-t border-border/30">
                                                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                                                <Lightbulb className="w-3 h-3" /> Recommendations
                                                            </p>
                                                            <ul className="space-y-1">
                                                                {message.insight.recommendations.map((rec, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                                        <span>{rec}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-muted-foreground"
                    >
                        <div className="p-2 rounded-lg bg-muted">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                        <span className="text-sm">Analyzing your data...</span>
                    </motion.div>
                )}

                {/* Error state */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Error</p>
                            <p className="text-xs opacity-80">{error}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError(null)}
                            className="shrink-0"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border/30 bg-background/80">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your business..."
                            disabled={isLoading}
                            className="pr-10 h-11 rounded-xl bg-muted/50 border-border/50 focus-visible:ring-primary"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="h-11 w-11 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
