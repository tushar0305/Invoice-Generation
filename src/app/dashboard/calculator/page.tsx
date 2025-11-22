'use client';

import { useState, useEffect, useRef } from 'react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Button } from '@/components/ui/button';
import { Delete, Divide, Equal, Minus, Plus, X, History, Percent, Calculator as CalcIcon, ArrowLeftRight, Receipt } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

type HistoryItem = {
  equation: string;
  result: string;
  timestamp: number;
};

export default function CalculatorPage() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll display to end
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [display]);

  const handleNumber = (num: string) => {
    haptics.impact(ImpactStyle.Light);
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    haptics.impact(ImpactStyle.Medium);
    setEquation(display + ' ' + op + ' ');
    setIsNewNumber(true);
  };

  const calculate = (expr: string) => {
    try {
      // eslint-disable-next-line no-eval
      const result = eval(expr.replace(/×/g, '*').replace(/÷/g, '/'));
      return result;
    } catch (e) {
      return null;
    }
  };

  const handleEqual = () => {
    haptics.impact(ImpactStyle.Heavy);
    if (!equation) return;

    const fullEquation = equation + display;
    const result = calculate(fullEquation);

    if (result !== null) {
      const resultStr = String(result);
      setDisplay(resultStr);
      setEquation('');
      setIsNewNumber(true);

      // Add to history
      setHistory(prev => [{
        equation: fullEquation,
        result: resultStr,
        timestamp: Date.now()
      }, ...prev].slice(0, 50));
    } else {
      setDisplay('Error');
      setIsNewNumber(true);
    }
  };

  const handleClear = () => {
    haptics.impact(ImpactStyle.Medium);
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const handleDelete = () => {
    haptics.impact(ImpactStyle.Light);
    if (isNewNumber) {
      setDisplay('0');
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewNumber(true);
    }
  };

  const handleSmartAction = (action: 'gst' | 'discount' | 'tola') => {
    haptics.impact(ImpactStyle.Medium);
    const current = parseFloat(display);
    if (isNaN(current)) return;

    let result = 0;
    let eq = '';

    switch (action) {
      case 'gst':
        result = current * 1.03;
        eq = `${current} + 3% GST`;
        break;
      case 'discount':
        result = current * 0.9; // 10% discount
        eq = `${current} - 10%`;
        break;
      case 'tola':
        // 1 Tola = 11.664g (Standard)
        result = current / 11.664;
        eq = `${current}g → Tola`;
        break;
    }

    setDisplay(result.toFixed(2));
    setIsNewNumber(true);
    setHistory(prev => [{
      equation: eq,
      result: result.toFixed(2),
      timestamp: Date.now()
    }, ...prev].slice(0, 50));
  };

  const buttons = [
    { label: 'C', onClick: handleClear, variant: 'destructive', className: 'text-red-500 bg-red-500/10 hover:bg-red-500/20' },
    { label: '÷', onClick: () => handleOperator('/'), variant: 'secondary', icon: Divide, className: 'text-primary bg-primary/10' },
    { label: '×', onClick: () => handleOperator('*'), variant: 'secondary', icon: X, className: 'text-primary bg-primary/10' },
    { label: '⌫', onClick: handleDelete, variant: 'secondary', icon: Delete, className: 'text-primary bg-primary/10' },

    { label: '7', onClick: () => handleNumber('7'), variant: 'outline' },
    { label: '8', onClick: () => handleNumber('8'), variant: 'outline' },
    { label: '9', onClick: () => handleNumber('9'), variant: 'outline' },
    { label: '-', onClick: () => handleOperator('-'), variant: 'secondary', icon: Minus, className: 'text-primary bg-primary/10' },

    { label: '4', onClick: () => handleNumber('4'), variant: 'outline' },
    { label: '5', onClick: () => handleNumber('5'), variant: 'outline' },
    { label: '6', onClick: () => handleNumber('6'), variant: 'outline' },
    { label: '+', onClick: () => handleOperator('+'), variant: 'secondary', icon: Plus, className: 'text-primary bg-primary/10' },

    { label: '1', onClick: () => handleNumber('1'), variant: 'outline' },
    { label: '2', onClick: () => handleNumber('2'), variant: 'outline' },
    { label: '3', onClick: () => handleNumber('3'), variant: 'outline' },
    { label: '=', onClick: handleEqual, variant: 'premium', className: 'row-span-2 h-full text-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 border-none', icon: Equal },

    { label: '0', onClick: () => handleNumber('0'), variant: 'outline', className: 'col-span-2' },
    { label: '.', onClick: () => handleNumber('.'), variant: 'outline' },
  ];

  return (
    <MotionWrapper className="h-[calc(100dvh-8rem)] flex flex-col bg-background/50 backdrop-blur-sm">
      {/* Display Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden p-6">
        {/* History Toggle */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className={cn("rounded-full transition-colors", showHistory ? "bg-primary/10 text-primary" : "text-muted-foreground")}
          >
            <History className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Display */}
        <div className="flex-1 flex flex-col justify-end items-end space-y-1 z-0">
          <AnimatePresence mode="wait">
            {showHistory ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 top-16 bottom-0 bg-background/95 backdrop-blur-xl z-20 rounded-2xl border border-border/50 p-4 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
                  <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider">History Tape</h3>
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])} className="h-6 text-xs text-destructive hover:text-destructive">Clear</Button>
                </div>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  <div className="space-y-4">
                    {history.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-8">No calculations yet</p>
                    )}
                    {history.map((item, i) => (
                      <div key={i} className="flex flex-col items-end gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => {
                        setDisplay(item.result);
                        setShowHistory(false);
                      }}>
                        <span className="text-xs text-muted-foreground font-mono">{item.equation}</span>
                        <span className="text-lg font-bold text-foreground">{Number(item.result).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            ) : (
              <>
                <div className="text-muted-foreground text-xl font-light h-8 flex items-center justify-end w-full overflow-hidden">
                  <span className="truncate">{equation}</span>
                </div>
                <div
                  ref={displayRef}
                  className="text-6xl md:text-7xl font-bold tracking-tighter text-foreground w-full text-right overflow-x-auto scrollbar-hide whitespace-nowrap pb-2"
                >
                  {Number(display).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Keypad Area */}
      <div className="bg-card/30 backdrop-blur-xl border-t border-border/50 p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {/* Smart Keys */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Button
            variant="outline"
            onClick={() => handleSmartAction('gst')}
            className="h-10 rounded-xl bg-amber-500/10 text-amber-600 border-amber-200/50 hover:bg-amber-500/20 hover:border-amber-300/50 transition-all"
          >
            <span className="text-xs font-bold">+3% GST</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSmartAction('discount')}
            className="h-10 rounded-xl bg-green-500/10 text-green-600 border-green-200/50 hover:bg-green-500/20 hover:border-green-300/50 transition-all"
          >
            <span className="text-xs font-bold">-10% Off</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSmartAction('tola')}
            className="h-10 rounded-xl bg-purple-500/10 text-purple-600 border-purple-200/50 hover:bg-purple-500/20 hover:border-purple-300/50 transition-all"
          >
            <ArrowLeftRight className="h-3 w-3 mr-1" />
            <span className="text-xs font-bold">g → Tola</span>
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-4 gap-3">
          {buttons.map((btn, i) => (
            <Button
              key={i}
              variant={btn.variant as any}
              onClick={btn.onClick}
              className={cn(
                "h-16 rounded-2xl text-2xl font-medium shadow-sm active:scale-95 transition-all duration-200 border-border/50",
                btn.variant === 'outline' && "bg-background/50 hover:bg-background/80",
                btn.className
              )}
            >
              {btn.icon ? <btn.icon className="h-6 w-6" /> : btn.label}
            </Button>
          ))}
        </div>
      </div>
    </MotionWrapper>
  );
}
