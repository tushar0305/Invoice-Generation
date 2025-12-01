'use client';

import { useState, useRef } from 'react';
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    Mic, 
    MicOff, 
    Send, 
    ChevronRight,
    TrendingUp,
    Package,
    Users,
    CalendarDays,
    Loader2,
    Bot,
    MessageSquare,
    Copy,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Suggested prompt chips data
const SUGGESTED_PROMPTS = [
    { id: 1, text: "Today's revenue?", icon: TrendingUp },
    { id: 2, text: "Top selling product?", icon: Package },
    { id: 3, text: "This month vs last month?", icon: CalendarDays },
    { id: 4, text: "Best customer this year?", icon: Users },
    { id: 5, text: "Low stock items?", icon: Package },
    { id: 6, text: "Revenue trend this week?", icon: TrendingUp },
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut" as const,
            staggerChildren: 0.08
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" as const }
    }
};

const chipVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.3 }
    },
    hover: { 
        scale: 1.03,
        y: -3,
        transition: { duration: 0.2 }
    },
    tap: { scale: 0.97 }
};

// Enhanced mic wave animation
const micWaveVariants = {
    initial: { scale: 1, opacity: 0 },
    animate: {
        scale: [1, 2.5],
        opacity: [0.6, 0],
        transition: {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeOut" as const
        }
    }
};

const micWaveVariants2 = {
    initial: { scale: 1, opacity: 0 },
    animate: {
        scale: [1, 2],
        opacity: [0.4, 0],
        transition: {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeOut" as const,
            delay: 0.3
        }
    }
};

const micGlowVariants = {
    initial: { opacity: 0.5 },
    animate: {
        opacity: [0.5, 1, 0.5],
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut" as const
        }
    }
};

// Shimmer animation for placeholder
const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
        x: '100%',
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "linear" as const
        }
    }
};

interface SmartAIInsightsProps {
    className?: string;
    onAskQuestion?: (question: string) => void;
}

export function SmartAIInsights({ className, onAskQuestion }: SmartAIInsightsProps) {
    const [query, setQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Handle voice input (Web Speech API)
    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser. Try Chrome or Edge.');
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
    };

    // Handle submit
    const handleSubmit = () => {
        if (!query.trim()) return;
        
        setIsLoading(true);
        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            setAiResponse(`Based on your query "${query}", here's a simulated insight. Connect this to your actual AI backend for real responses.`);
            setIsLoading(false);
            onAskQuestion?.(query);
        }, 1500);
    };

    // Handle chip click
    const handleChipClick = (prompt: string) => {
        setQuery(prompt);
        inputRef.current?.focus();
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Handle copy
    const handleCopy = () => {
        if (aiResponse) {
            navigator.clipboard.writeText(aiResponse);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                    // Base glassmorphism styles
                    "relative overflow-hidden",
                    // Enhanced glass effect with subtle gold tint
                    "bg-gradient-to-b from-white/90 via-white/70 to-amber-50/50",
                    "dark:from-black/40 dark:via-gray-900/50 dark:to-amber-950/30",
                    // Backdrop blur
                    "backdrop-blur-2xl",
                    // Border with gold accent
                    "border border-amber-200/60 dark:border-amber-500/25",
                    // Enhanced shadow with depth
                    "shadow-[0_8px_40px_rgba(139,97,38,0.12),0_2px_12px_rgba(139,97,38,0.08),inset_0_1px_0_rgba(255,255,255,0.5)]",
                    "dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_2px_12px_rgba(212,175,55,0.08),inset_0_1px_0_rgba(255,255,255,0.05)]",
                    // Rounded corners - responsive
                    "rounded-[18px] md:rounded-[22px] lg:rounded-[24px]",
                    // Enhanced padding - more breathing room on desktop
                    "p-5 sm:p-6 md:p-7 lg:px-12 lg:py-10",
                    className
                )}
            >
                {/* Background gold gradient tint (3%) */}
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{ 
                        background: 'linear-gradient(180deg, transparent 0%, rgba(255,241,220,0.06) 50%, rgba(255,215,140,0.04) 100%)'
                    }} 
                />
                
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/[0.03] via-transparent to-amber-600/[0.04] pointer-events-none" />
                
                {/* Subtle gold shimmer orbs */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-radial from-amber-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-radial from-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 space-y-5 md:space-y-6 lg:space-y-7">
                    {/* Header - enhanced spacing */}
                    <m.div variants={itemVariants} className="flex items-start gap-3 md:gap-4">
                        <div className="flex-shrink-0 p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-600/15 border border-amber-400/40 dark:border-amber-500/25 shadow-sm">
                            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                Smart AI Insights
                                {/* Refined BETA badge - smaller, pill-shaped, thin border */}
                                <span className="inline-flex items-center px-1.5 py-px text-[9px] font-semibold tracking-wide rounded-full bg-amber-50/80 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300/50 dark:border-amber-500/30 uppercase">
                                    Beta
                                </span>
                            </h2>
                            {/* More spacing under subtitle */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 md:mt-2">
                                Ask anything about your sales in your own language.
                            </p>
                        </div>
                    </m.div>

                    {/* Input Bar - enhanced with inner shadow and glass gradient */}
                    <m.div 
                        variants={itemVariants}
                        className={cn(
                            "relative flex items-center",
                            // Enhanced glass input container with inner shadow
                            "bg-gradient-to-b from-white/80 to-gray-50/60",
                            "dark:from-white/[0.08] dark:to-white/[0.03]",
                            // Inner shadow for depth
                            "shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_1px_3px_rgba(139,97,38,0.08)]",
                            "dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_3px_rgba(212,175,55,0.05)]",
                            "border transition-all duration-300",
                            isFocused 
                                ? "border-amber-400/70 dark:border-amber-500/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),0_0_0_3px_rgba(212,175,55,0.1),0_4px_16px_rgba(212,175,55,0.12)]" 
                                : "border-gray-200/90 dark:border-white/15",
                            "rounded-xl md:rounded-2xl",
                            "p-1 md:p-1.5",
                            // Focus scale effect
                            isFocused && "scale-[1.01]"
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
                            placeholder="Ask your question…"
                            className={cn(
                                "flex-1 min-w-0",
                                "bg-transparent",
                                "text-gray-900 dark:text-white",
                                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                "text-sm md:text-base",
                                "px-3.5 py-3 md:py-3.5",
                                "focus:outline-none",
                                "rounded-lg"
                            )}
                            disabled={isLoading}
                        />
                        
                        {/* Action buttons - tighter spacing */}
                        <div className="flex items-center gap-1 md:gap-1.5 pr-0.5 md:pr-1">
                            {/* Voice input button with enhanced wave animation */}
                            <button
                                onClick={handleVoiceInput}
                                disabled={isLoading}
                                className={cn(
                                    "relative flex items-center justify-center",
                                    "w-10 h-10 md:w-11 md:h-11",
                                    "rounded-xl",
                                    "transition-all duration-300",
                                    isListening
                                        ? "bg-red-500/15 text-red-500 dark:text-red-400"
                                        : "bg-gray-100/90 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-amber-100/90 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                aria-label={isListening ? "Stop listening" : "Start voice input"}
                            >
                                {/* Multi-layer wave animation when listening */}
                                {isListening && (
                                    <>
                                        <m.div
                                            variants={micWaveVariants}
                                            initial="initial"
                                            animate="animate"
                                            className="absolute inset-0 rounded-xl bg-red-500/40"
                                        />
                                        <m.div
                                            variants={micWaveVariants2}
                                            initial="initial"
                                            animate="animate"
                                            className="absolute inset-0 rounded-xl bg-red-500/30"
                                        />
                                        <m.div
                                            variants={micGlowVariants}
                                            initial="initial"
                                            animate="animate"
                                            className="absolute inset-0 rounded-xl bg-red-500/20"
                                        />
                                    </>
                                )}
                                {isListening ? (
                                    <MicOff className="h-5 w-5 relative z-10" />
                                ) : (
                                    <Mic className="h-5 w-5" />
                                )}
                            </button>
                            
                            {/* Send button */}
                            <button
                                onClick={handleSubmit}
                                disabled={!query.trim() || isLoading}
                                className={cn(
                                    "flex items-center justify-center",
                                    "w-10 h-10 md:w-11 md:h-11",
                                    "rounded-xl",
                                    "transition-all duration-300",
                                    query.trim()
                                        ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105"
                                        : "bg-gray-100/90 dark:bg-white/10 text-gray-400 dark:text-gray-500",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                )}
                                aria-label="Send question"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </m.div>

                    {/* Suggested Prompt Chips */}
                    <m.div variants={itemVariants} className="space-y-2.5 md:space-y-3">
                        <p className="text-[11px] md:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Try asking
                        </p>
                        
                        {/* Mobile: Horizontal scroll */}
                        <div 
                            ref={scrollContainerRef}
                            className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            {SUGGESTED_PROMPTS.map((prompt) => (
                                <m.button
                                    key={prompt.id}
                                    variants={chipVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => handleChipClick(prompt.text)}
                                    className={cn(
                                        "flex-shrink-0 snap-start",
                                        "flex items-center gap-2",
                                        "px-3.5 py-2.5",
                                        "text-sm font-medium",
                                        "bg-white/80 dark:bg-white/[0.06]",
                                        "text-gray-700 dark:text-gray-300",
                                        "border border-amber-200/70 dark:border-amber-500/25",
                                        "rounded-full",
                                        "whitespace-nowrap",
                                        "shadow-sm",
                                        "transition-all duration-200",
                                        "hover:bg-amber-50/90 dark:hover:bg-amber-500/15",
                                        "hover:border-amber-400/70 dark:hover:border-amber-500/40",
                                        "hover:text-amber-700 dark:hover:text-amber-300",
                                        "active:scale-95"
                                    )}
                                >
                                    <prompt.icon className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                                    {prompt.text}
                                </m.button>
                            ))}
                        </div>
                        
                        {/* Desktop: Multi-row grid layout */}
                        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-3">
                            {SUGGESTED_PROMPTS.map((prompt) => (
                                <m.button
                                    key={prompt.id}
                                    variants={chipVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => handleChipClick(prompt.text)}
                                    className={cn(
                                        "flex items-center gap-2.5",
                                        "px-4 py-3",
                                        "text-sm font-medium",
                                        "bg-white/80 dark:bg-white/[0.06]",
                                        "text-gray-700 dark:text-gray-300",
                                        "border border-amber-200/70 dark:border-amber-500/25",
                                        "rounded-xl",
                                        "shadow-sm",
                                        "transition-all duration-200",
                                        "hover:bg-amber-50/90 dark:hover:bg-amber-500/15",
                                        "hover:border-amber-400/70 dark:hover:border-amber-500/40",
                                        "hover:text-amber-700 dark:hover:text-amber-300",
                                        "hover:shadow-md hover:shadow-amber-500/10",
                                        "group"
                                    )}
                                >
                                    <prompt.icon className="h-4 w-4 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                                    <span className="flex-1 text-left">{prompt.text}</span>
                                    <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </m.button>
                            ))}
                        </div>
                    </m.div>

                    {/* AI Response Preview Box */}
                    <AnimatePresence mode="wait">
                        {(aiResponse || isLoading) ? (
                            <m.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" as const }}
                                className={cn(
                                    "relative overflow-hidden",
                                    "bg-gradient-to-br from-amber-50/90 to-white/70",
                                    "dark:from-amber-950/40 dark:to-gray-900/50",
                                    "border border-amber-200/60 dark:border-amber-500/25",
                                    "rounded-xl md:rounded-2xl",
                                    "p-4 md:p-5"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-amber-400/25 to-amber-600/15 border border-amber-400/30 dark:border-amber-500/20">
                                        <Bot className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {isLoading ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Analyzing your data...</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {aiResponse}
                                                </p>
                                                {/* Copy button */}
                                                <button
                                                    onClick={handleCopy}
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-1.5",
                                                        "text-xs font-medium",
                                                        "text-gray-500 dark:text-gray-400",
                                                        "hover:text-amber-600 dark:hover:text-amber-400",
                                                        "bg-white/60 dark:bg-white/5",
                                                        "border border-gray-200/60 dark:border-white/10",
                                                        "rounded-lg",
                                                        "transition-all duration-200",
                                                        "hover:bg-amber-50/60 dark:hover:bg-amber-500/10",
                                                        "hover:border-amber-300/60 dark:hover:border-amber-500/30"
                                                    )}
                                                >
                                                    {copied ? (
                                                        <>
                                                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3.5 w-3.5" />
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </m.div>
                        ) : (
                            // Enhanced placeholder with shimmer effect and centered icon
                            <m.div
                                variants={itemVariants}
                                className={cn(
                                    "relative overflow-hidden",
                                    "flex flex-col items-center justify-center gap-2.5",
                                    "py-6 md:py-8",
                                    "text-xs md:text-sm text-gray-400 dark:text-gray-500",
                                    // Dotted border
                                    "border-2 border-dashed border-gray-200/70 dark:border-white/10",
                                    "rounded-xl md:rounded-2xl",
                                    "bg-gray-50/40 dark:bg-white/[0.02]"
                                )}
                            >
                                {/* Shimmer effect */}
                                <m.div
                                    variants={shimmerVariants}
                                    initial="initial"
                                    animate="animate"
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/30 dark:via-amber-500/5 to-transparent"
                                    style={{ width: '50%' }}
                                />
                                
                                {/* Centered icon */}
                                <div className="relative p-3 rounded-full bg-gray-100/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
                                    <MessageSquare className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                </div>
                                <span className="relative font-medium">Your AI answers will appear here</span>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>
            </m.div>
        </LazyMotion>
    );
}

export default SmartAIInsights;
