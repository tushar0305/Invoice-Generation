'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { CheckCircle2, Sparkles, PartyPopper } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CelebrationModal({ isOpen, onClose }: CelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto close after 2 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Profile Completion Celebration</DialogTitle>
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Sparkles className="absolute top-4 left-4 h-6 w-6 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute top-8 right-8 h-5 w-5 text-yellow-500 animate-pulse delay-100" />
            <Sparkles className="absolute bottom-12 left-12 h-4 w-4 text-yellow-400 animate-pulse delay-200" />
            <Sparkles className="absolute bottom-8 right-4 h-6 w-6 text-yellow-500 animate-pulse delay-75" />
            <PartyPopper className="absolute top-1/2 left-4 h-8 w-8 text-pink-400 animate-bounce" />
            <PartyPopper className="absolute top-1/2 right-4 h-8 w-8 text-purple-400 animate-bounce delay-150" />
          </div>
          
          <div className="relative mb-6 z-10">
            <div className="absolute inset-0 animate-ping opacity-75">
              <div className="w-24 h-24 rounded-full bg-green-400/30"></div>
            </div>
            <div className="relative bg-white rounded-full p-4 shadow-lg">
              <CheckCircle2 className="h-16 w-16 text-green-600 animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-3 z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-green-900 flex items-center gap-2 justify-center flex-wrap">
              <span>🎉</span>
              <span>Congratulations!</span>
              <span>🎊</span>
            </h2>
            <p className="text-base sm:text-lg text-green-700 font-semibold">
              Your profile is complete!
            </p>
            <p className="text-xs sm:text-sm text-green-600/90 max-w-xs mx-auto">
              You're all set to create professional invoices for your business
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
