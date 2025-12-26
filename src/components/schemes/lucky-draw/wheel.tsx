'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useSpring } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Sparkles, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Participant {
    id: string;
    name: string;
    ticketNumber: string;
    avatarColor?: string;
    enrollmentId?: string;
    [key: string]: any;
}

interface LuckyDrawWheelProps {
    participants: Participant[];
    onWinnerSelected: (winner: Participant) => void;
    isSpinning?: boolean;
}

export function LuckyDrawWheel({ participants, onWinnerSelected, isSpinning: externalIsSpinning }: LuckyDrawWheelProps) {
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState<Participant | null>(null);
    const controls = useAnimation();
    const wheelRef = useRef<HTMLDivElement>(null);

    // Colors for the wheel segments
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
    ];

    const spinWheel = async () => {
        if (spinning || participants.length < 2) return;

        setSpinning(true);
        setWinner(null);

        const segmentAngle = 360 / participants.length;
        const winningIndex = Math.floor(Math.random() * participants.length);
        
        // Calculate rotation to land the winning segment at the top (270 degrees or -90)
        // SVG starts at 3 o'clock (0 deg). We want the winner at 12 o'clock (270 deg).
        // If segment 0 is at 0-angle, segment i is at i*angle.
        // To bring segment i to 270, we rotate by 270 - (i * angle) - (angle/2).
        // (angle/2) centers the segment.
        
        const targetRotation = 360 * 10 + (270 - (winningIndex * segmentAngle) - (segmentAngle / 2));

        await controls.start({
            rotate: targetRotation,
            transition: {
                duration: 8,
                ease: [0.15, 0.85, 0.35, 1], // Custom ease for "heavy wheel" feel
            }
        });

        const selectedWinner = participants[winningIndex];
        setWinner(selectedWinner);
        setSpinning(false);
        onWinnerSelected(selectedWinner);

        // Confetti effect
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF4500'] // Gold and Orange
        });
    };

    const getSegmentPath = (index: number, total: number, radius: number) => {
        const startAngle = (index * 360) / total;
        const endAngle = ((index + 1) * 360) / total;
        
        // Convert polar to cartesian
        const start = polarToCartesian(radius, radius, radius, endAngle);
        const end = polarToCartesian(radius, radius, radius, startAngle);
        
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        
        return [
            "M", radius, radius, 
            "L", start.x, start.y, 
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            "L", radius, radius
        ].join(" ");
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 p-4">
            <div className="relative w-80 h-80 md:w-96 md:h-96">
                {/* Pointer */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-12 h-12 filter drop-shadow-lg">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="text-slate-800 dark:text-white w-full h-full">
                        <path d="M12 22L12 2M12 22L6 12M12 22L18 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 2L8 6H16L12 2Z" />
                    </svg>
                </div>

                {/* Wheel Container */}
                <div className="w-full h-full rounded-full border-8 border-slate-800 dark:border-slate-700 shadow-2xl overflow-hidden relative bg-white">
                    <motion.div
                        className="w-full h-full relative"
                        animate={controls}
                        initial={{ rotate: 0 }}
                        style={{ transformOrigin: "center" }}
                    >
                        <svg viewBox="0 0 100 100" className="w-full h-full transform rotate-90">
                            {participants.map((p, i) => {
                                const angle = 360 / participants.length;
                                const rotation = i * angle + (angle / 2); // Center text in segment
                                
                                return (
                                    <g key={p.id}>
                                        <path
                                            d={getSegmentPath(i, participants.length, 50)}
                                            fill={colors[i % colors.length]}
                                            stroke="white"
                                            strokeWidth="0.5"
                                        />
                                        {/* Text Label */}
                                        <g transform={`rotate(${rotation}, 50, 50) translate(0, -25)`}>
                                            <text
                                                x="50"
                                                y="50"
                                                fill="white"
                                                fontSize="4"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                transform="rotate(0, 50, 50)"
                                            >
                                                {p.name.split(' ')[0]}
                                            </text>
                                        </g>
                                    </g>
                                );
                            })}
                        </svg>
                    </motion.div>
                    
                    {/* Center Cap */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-inner flex items-center justify-center border-4 border-slate-200 dark:border-slate-600 z-10">
                        <Sparkles className="w-8 h-8 text-amber-500" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="text-center space-y-4">
                {winner ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 p-6 rounded-2xl border border-amber-200 dark:border-amber-700"
                    >
                        <p className="text-sm text-amber-800 dark:text-amber-300 uppercase tracking-wider font-semibold mb-1">Winner</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{winner.name}</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-mono">Ticket #{winner.ticketNumber}</p>
                    </motion.div>
                ) : (
                    <div className="h-24 flex items-center justify-center">
                        <p className="text-muted-foreground animate-pulse">
                            {spinning ? "Spinning..." : "Ready to spin!"}
                        </p>
                    </div>
                )}

                <Button 
                    size="lg" 
                    onClick={spinWheel} 
                    disabled={spinning || participants.length < 2}
                    className={cn(
                        "w-full md:w-auto min-w-[200px] text-lg h-14 rounded-full shadow-xl transition-all",
                        spinning ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95",
                        "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                    )}
                >
                    {spinning ? (
                        <span className="flex items-center gap-2">
                            <Shuffle className="w-5 h-5 animate-spin" />
                            Spinning...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Spin Lucky Draw
                        </span>
                    )}
                </Button>
                
                {participants.length < 2 && (
                    <p className="text-xs text-red-500">Need at least 2 participants to spin.</p>
                )}
            </div>
        </div>
    );
}
