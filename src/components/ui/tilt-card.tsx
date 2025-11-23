"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    gradientColor?: string;
}

export function TiltCard({ children, className, gradientColor = "#22d3ee" }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left);
        y.set(clientY - top);
    }

    const maskImage = useMotionTemplate`radial-gradient(240px at ${mouseX}px ${mouseY}px, white, transparent)`;
    const style = { maskImage, WebkitMaskImage: maskImage };

    return (
        <div
            onMouseMove={onMouseMove}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-white/10 bg-gray-900/40 hover:bg-gray-900/60 transition-colors duration-500",
                className
            )}
        >
            <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100">
                <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent opacity-20 group-hover:from-white/10 group-hover:to-white/5"
                    style={{
                        maskImage: `radial-gradient(240px at ${mouseX}px ${mouseY}px, white, transparent)`,
                        WebkitMaskImage: `radial-gradient(240px at ${mouseX}px ${mouseY}px, white, transparent)`,
                    }}
                />
                <motion.div
                    className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition duration-500"
                    style={style}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 mix-blend-overlay" />
                </motion.div>
            </div>

            <div className="relative h-full">{children}</div>
        </div>
    );
}
