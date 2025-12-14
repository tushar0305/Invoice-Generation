'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Send,
    Mic,
    MicOff,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertCircle,
    Lightbulb,
    CheckCircle,
    Copy,
    Check,
    Bot,
    Loader2,
    Package,
    Users,
    BookOpen,
    Banknote,
    Star,
    BarChart3,
    RefreshCw,
    ChevronRight,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/supabase/client';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TYPES
// ============================================================================
interface AIInsight {
    type: 'insight' | 'summary' | 'alert' | 'recommendation';
    title: string;
    summary: string;
    metrics?: { label: string; value: string; trend: 'up' | 'down' | 'neutral'; change: string }[];
    bullets?: string[];
    recommendations?: string[];
    confidence?: 'high' | 'medium' | 'low';
}

interface RateLimitInfo {
    remaining: number;
    limit: number;
    resetAt: number;
}

interface SmartAIInsightsProps {
    className?: string;
    shopId: string;
    onAskQuestion?: (question: string) => void;
}

// ============================================================================
// SUGGESTED PROMPTS
// ============================================================================
const SUGGESTED_PROMPTS = [
    { id: 1, text: "Today's revenue summary", icon: TrendingUp, category: 'sales' },
    { id: 2, text: "Which products are running low?", icon: Package, category: 'stock' },
    { id: 3, text: "Who are my top customers?", icon: Users, category: 'customers' },
    { id: 4, text: "What's my khata balance?", icon: BookOpen, category: 'khata' },
    { id: 5, text: "Active loans overview", icon: Banknote, category: 'loans' },
    { id: 6, text: "Loyalty points summary", icon: Star, category: 'loyalty' },
    { id: 7, text: "Compare this week vs last", icon: BarChart3, category: 'sales' },
    { id: 8, text: "Business health check", icon: Zap, category: 'summary' },
];

// ============================================================================
// ANIMATIONS
// ============================================================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const pulseKeyframes = {
    scale: [1, 1.02, 1],
    opacity: [0.7, 1, 0.7],
};

// ============================================================================
// COMPONENT
// ============================================================================
export function SmartAIInsights({ className, shopId, onAskQuestion }: SmartAIInsightsProps) {
    const [query, setQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [aiResponse, setAiResponse] = useState<AIInsight | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
    const [tokensUsed, setTokensUsed] = useState<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load rate limit from local storage on mount
    useEffect(() => {
        const savedLimit = localStorage.getItem(`ai_rate_limit_${shopId}`);
        if (savedLimit) {
            try {
                const parsed = JSON.parse(savedLimit);
                // Check if resetAt has passed
                if (parsed.resetAt && Date.now() > parsed.resetAt) {
                    // Reset locally if time passed (backend will confirm later)
                    setRateLimit({ ...parsed, remaining: parsed.limit });
                } else {
                    setRateLimit(parsed);
                }
            } catch (e) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('Failed to parse saved rate limit', e);
                }
            }
        }
    }, [shopId]);

    // Save rate limit to local storage when it changes
    useEffect(() => {
        if (rateLimit) {
            localStorage.setItem(`ai_rate_limit_${shopId}`, JSON.stringify(rateLimit));
        }
    }, [rateLimit, shopId]);

    // Voice input handler
    const handleVoiceInput = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Voice input not supported in your browser. Try Chrome or Edge.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            inputRef.current?.focus();
        };

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }, [isListening]);

    // Submit handler
    const handleSubmit = useCallback(async () => {
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setAiResponse(null);

        // Optimistic update for rate limit
        if (rateLimit && rateLimit.remaining > 0) {
            setRateLimit(prev => prev ? { ...prev, remaining: prev.remaining - 1 } : null);
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Please login to use AI Insights');
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-insights`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question: query, shopId }),
                }
            );

            // Handle rate limiting
            if (response.status === 429) {
                const data = await response.json();
                setError(data.message || 'Rate limit exceeded. Please wait before trying again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to get AI response');
            }

            const data = await response.json();
            setAiResponse(data.insight);
            setTokensUsed(data.tokensUsed || 0);

            if (data.rateLimit) {
                setRateLimit(data.rateLimit);
            }

            onAskQuestion?.(query);

        } catch (err: any) {
            if (process.env.NODE_ENV === 'development') {
                console.error('AI Error:', err);
            }
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [query, isLoading, shopId, onAskQuestion]);

    // Chip click handler
    const handleChipClick = useCallback((prompt: string) => {
        setQuery(prompt);
        inputRef.current?.focus();
    }, []);

    // Key press handler
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    // Copy handler
    const handleCopy = useCallback(() => {
        if (aiResponse?.summary) {
            const textToCopy = `${aiResponse.title}\n\n${aiResponse.summary}${aiResponse.bullets?.length ? '\n\n• ' + aiResponse.bullets.join('\n• ') : ''}${aiResponse.recommendations?.length ? '\n\nRecommendations:\n• ' + aiResponse.recommendations.join('\n• ') : ''}`;
            navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [aiResponse]);

    // Reset handler
    const handleReset = useCallback(() => {
        setQuery('');
        setAiResponse(null);
        setError(null);
        inputRef.current?.focus();
    }, []);

    // Trend icon component
    const TrendIcon = ({ trend }: { trend: string }) => {
        if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" />;
        if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" />;
        return <Minus className="w-3.5 h-3.5" />;
    };

    // Type icon component
    const TypeIcon = ({ type }: { type: string }) => {
        switch (type) {
            case 'alert': return <AlertCircle className="w-5 h-5" />;
            case 'recommendation': return <Lightbulb className="w-5 h-5" />;
            case 'summary': return <BarChart3 className="w-5 h-5" />;
            default: return <Sparkles className="w-5 h-5" />;
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={cn(
                "relative overflow-hidden",
                // Premium gradient background
                "bg-gradient-to-br from-slate-50 via-white to-amber-50/30",
                "dark:from-background dark:via-card dark:to-amber-950/20",
                // Border
                "border border-slate-200/80 dark:border-border",
                // Shadow
                "shadow-xl shadow-slate-200/50 dark:shadow-black/20",
                // Rounded
                "rounded-xl lg:rounded-3xl",
                // Padding - Reduced for mobile
                "p-3 md:p-6 lg:p-8",
                className
            )}
        >
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl lg:rounded-3xl">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-amber-400/20 to-orange-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-amber-200/10 to-transparent rounded-full" />
            </div>

            <div className="relative z-10 space-y-4 md:space-y-6">
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 md:gap-4">
                        <div className="relative">
                            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
                                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            {/* Animated glow */}
                            <motion.div
                                className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 blur-xl opacity-40"
                                animate={pulseKeyframes}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Swarna AI
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 text-amber-700 dark:text-amber-300 border-0">
                                    BETA
                                </Badge>
                            </h2>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-muted-foreground mt-0.5 md:mt-1">
                                Your intelligent business analyst.
                            </p>
                        </div>
                    </div>

                    {/* Rate limit indicator */}
                    {rateLimit && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-muted text-xs text-slate-600 dark:text-muted-foreground">
                            <Zap className="w-3 h-3" />
                            {rateLimit.remaining}/{rateLimit.limit} queries left
                        </div>
                    )}
                </motion.div>

                {/* Input Section */}
                <motion.div variants={itemVariants} className="space-y-3 md:space-y-4">
                    {/* Input bar */}
                    <div
                        className={cn(
                            "relative flex items-center gap-2",
                            "bg-white dark:bg-card",
                            "border transition-all duration-300",
                            isFocused
                                ? "border-amber-400 dark:border-amber-500 shadow-lg shadow-amber-500/10"
                                : "border-slate-200 dark:border-border",
                            "rounded-xl md:rounded-2xl",
                            "p-1.5 md:p-2"
                        )}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask about sales, stock..."
                            className={cn(
                                "flex-1 min-w-0",
                                "bg-transparent",
                                "text-slate-900 dark:text-foreground",
                                "placeholder:text-slate-400 dark:placeholder:text-muted-foreground",
                                "text-sm md:text-base",
                                "px-3 py-2 md:px-4 md:py-3",
                                "focus:outline-none"
                            )}
                            disabled={isLoading}
                        />

                        {/* Voice button */}
                        <button
                            onClick={handleVoiceInput}
                            disabled={isLoading}
                            className={cn(
                                "relative flex items-center justify-center",
                                "w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl",
                                "transition-all duration-200",
                                isListening
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-500"
                                    : "bg-slate-100 dark:bg-muted text-slate-500 hover:bg-slate-200 dark:hover:bg-muted/80 hover:text-slate-700 dark:hover:text-foreground",
                                "disabled:opacity-50"
                            )}
                        >
                            {isListening ? (
                                <>
                                    <motion.div
                                        className="absolute inset-0 rounded-lg md:rounded-xl bg-red-400/30"
                                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                    <MicOff className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
                                </>
                            ) : (
                                <Mic className="w-4 h-4 md:w-5 md:h-5" />
                            )}
                        </button>

                        {/* Send button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!query.trim() || isLoading}
                            className={cn(
                                "flex items-center justify-center",
                                "w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl",
                                "transition-all duration-200",
                                query.trim()
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
                                    : "bg-slate-100 dark:bg-muted text-slate-400",
                                "disabled:opacity-50 disabled:hover:scale-100"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 md:w-5 md:h-5" />
                            )}
                        </button>
                    </div>

                    {/* Suggested prompts */}
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_PROMPTS.slice(0, 6).map((prompt) => (
                            <motion.button
                                key={prompt.id}
                                onClick={() => handleChipClick(prompt.text)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 md:gap-2",
                                    "px-3 py-1.5 md:px-4 md:py-2",
                                    "text-xs md:text-sm font-medium",
                                    "bg-white dark:bg-card",
                                    "text-slate-600 dark:text-foreground",
                                    "border border-slate-200 dark:border-border",
                                    "rounded-full",
                                    "transition-all duration-200",
                                    "hover:border-amber-300 dark:hover:border-amber-600",
                                    "hover:bg-amber-50 dark:hover:bg-amber-900/20",
                                    "hover:text-amber-700 dark:hover:text-amber-300",
                                    "hover:shadow-md",
                                    "whitespace-nowrap"
                                )}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <prompt.icon className="w-3 h-3 md:w-4 md:h-4 text-amber-500" />
                                {prompt.text}
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Response Section */}
                <AnimatePresence mode="wait">
                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Loading card */}
                            <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <Bot className="w-5 h-5 text-white" />
                                    </motion.div>
                                    <div className="flex-1 space-y-2">
                                        <motion.div
                                            className="flex items-center gap-2"
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                                Analyzing your business data...
                                            </span>
                                        </motion.div>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="h-3 rounded-full bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 dark:from-amber-900/50 dark:via-amber-800/30 dark:to-amber-900/50"
                                                    style={{ width: `${100 - i * 20}%` }}
                                                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {error && !isLoading && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-4 md:p-5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-red-700 dark:text-red-300">Something went wrong</p>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {aiResponse && !isLoading && (
                        <motion.div
                            key="response"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Main response card */}
                            <div className={cn(
                                "p-4 md:p-6 rounded-2xl border",
                                "bg-white dark:bg-card",
                                "border-slate-200 dark:border-border",
                                "shadow-lg shadow-slate-200/50 dark:shadow-black/20"
                            )}>
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2.5 rounded-xl",
                                            aiResponse.type === 'alert' ? "bg-red-100 dark:bg-red-900/30 text-red-500" :
                                                aiResponse.type === 'recommendation' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500" :
                                                    "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                                        )}>
                                            <TypeIcon type={aiResponse.type} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                {aiResponse.title}
                                            </h3>
                                            {aiResponse.confidence && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] px-2 mt-1 capitalize",
                                                        aiResponse.confidence === 'high' && "border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
                                                        aiResponse.confidence === 'medium' && "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/50",
                                                        aiResponse.confidence === 'low' && "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/50"
                                                    )}
                                                >
                                                    {aiResponse.confidence} confidence
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                "text-slate-400 hover:text-slate-600 dark:hover:text-foreground",
                                                "hover:bg-slate-100 dark:hover:bg-muted"
                                            )}
                                        >
                                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={handleReset}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                "text-slate-400 hover:text-slate-600 dark:hover:text-foreground",
                                                "hover:bg-slate-100 dark:hover:bg-muted"
                                            )}
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Summary */}
                                <p className="text-slate-600 dark:text-muted-foreground leading-relaxed mb-5">
                                    {aiResponse.summary}
                                </p>

                                {/* Metrics */}
                                {aiResponse.metrics && aiResponse.metrics.length > 0 && (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                                        {aiResponse.metrics.map((metric, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                                className={cn(
                                                    "p-4 rounded-xl",
                                                    "bg-slate-50 dark:bg-muted/50",
                                                    "border border-slate-100 dark:border-border/50"
                                                )}
                                            >
                                                <p className="text-xs text-slate-500 dark:text-muted-foreground uppercase tracking-wider font-medium mb-1">
                                                    {metric.label}
                                                </p>
                                                <div className="flex items-end justify-between gap-2">
                                                    <p className="text-xl font-bold text-slate-900 dark:text-foreground">
                                                        {metric.value}
                                                    </p>
                                                    <div className={cn(
                                                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                                                        metric.trend === 'up' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
                                                        metric.trend === 'down' && "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
                                                        metric.trend === 'neutral' && "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                                    )}>
                                                        <TrendIcon trend={metric.trend} />
                                                        {metric.change}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Bullets */}
                                {aiResponse.bullets && aiResponse.bullets.length > 0 && (
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-muted/50 mb-5">
                                        <p className="text-xs text-slate-500 dark:text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                                            Key Insights
                                        </p>
                                        <ul className="space-y-2">
                                            {aiResponse.bullets.map((bullet, i) => (
                                                <motion.li
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="flex items-start gap-3"
                                                >
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-slate-700 dark:text-muted-foreground text-sm leading-relaxed pt-0.5">
                                                        {bullet}
                                                    </span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {aiResponse.recommendations && aiResponse.recommendations.length > 0 && (
                                    <div className="border-t border-slate-200 dark:border-border pt-5">
                                        <p className="text-xs text-slate-500 dark:text-muted-foreground uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-emerald-500" />
                                            Recommendations
                                        </p>
                                        <div className="space-y-2">
                                            {aiResponse.recommendations.map((rec, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.15 }}
                                                    className={cn(
                                                        "flex items-start gap-3 p-3 rounded-xl",
                                                        "bg-emerald-50 dark:bg-emerald-950/30",
                                                        "border border-emerald-200/50 dark:border-emerald-800/30"
                                                    )}
                                                >
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm text-slate-700 dark:text-foreground">{rec}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer with token info */}
                            {tokensUsed > 0 && (
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>Tokens used: {tokensUsed}</span>
                                    {rateLimit && (
                                        <span>{rateLimit.remaining} queries remaining</span>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Empty state - Replaced with Quick Actions Grid */}
                    {!isLoading && !error && !aiResponse && (
                        <motion.div
                            key="empty"
                            variants={itemVariants}
                            className="py-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-muted/20 border border-slate-100 dark:border-border">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="group-hover:scale-110 transition-transform p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-semibold text-sm">Revenue Analysis</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">Get detailed breakdown of your daily, weekly, or monthly earnings.</p>
                                    <button
                                        onClick={() => handleChipClick("Analyze my revenue trends for this month")}
                                        className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        Analyze Revenue <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-muted/20 border border-slate-100 dark:border-border">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-semibold text-sm">Inventory Health</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">Identify low stock items and best performing products.</p>
                                    <button
                                        onClick={() => handleChipClick("Which items are low in stock?")}
                                        className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1"
                                    >
                                        Check Inventory <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
