'use client';

import { useState, useEffect } from 'react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Button } from '@/components/ui/button';
import { Delete, Divide, Equal, Minus, Plus, X, History, Calculator as CalcIcon, Coins } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { ImpactStyle } from '@/lib/haptics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, cn } from '@/lib/utils';
import { evaluate } from 'mathjs';
import { useToast } from '@/hooks/use-toast';

export default function CalculatorPage() {
  const { toast } = useToast();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);
  const [history, setHistory] = useState<string[]>([]);

  // Purity Calculator State
  const [baseRate, setBaseRate] = useState('');
  const [purityResults, setPurityResults] = useState<Record<string, number>>({});

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

  const handleEqual = () => {
    haptics.impact(ImpactStyle.Heavy);
    try {
      // Safe mathematical expression evaluation (no code injection risk)
      const result = evaluate(equation + display);
      const resultStr = String(result);
      const historyItem = `${equation} ${display} = ${resultStr}`;

      setDisplay(resultStr);
      setEquation('');
      setHistory((prev) => [historyItem, ...prev].slice(0, 10));
    } catch (error) {
      // Invalid mathematical expression
      toast({
        title: "Invalid Expression",
        description: "Please check your calculation and try again.",
        variant: "destructive"
      });
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
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewNumber(true);
    }
  };

  // Calculate purity rates whenever base rate changes
  useEffect(() => {
    const rate = parseFloat(baseRate);
    if (!isNaN(rate)) {
      // Assuming base rate is for 24K (999) or 22K (916) - usually market rate is 24K
      // Let's assume input is 24K rate
      const k24 = rate;
      setPurityResults({
        '24K (99.9%)': k24,
        '22K (91.6%)': k24 * 0.916,
        '20K (83.3%)': k24 * 0.833,
        '18K (75.0%)': k24 * 0.750,
        '14K (58.5%)': k24 * 0.585,
      });
    } else {
      setPurityResults({});
    }
  }, [baseRate]);

  const buttons = [
    { label: 'C', onClick: handleClear, variant: 'destructive', className: 'text-lg font-bold' },
    { label: '÷', onClick: () => handleOperator('/'), variant: 'outline', icon: Divide },
    { label: '×', onClick: () => handleOperator('*'), variant: 'outline', icon: X },
    { label: '⌫', onClick: handleDelete, variant: 'outline', icon: Delete },
    { label: '7', onClick: () => handleNumber('7'), variant: 'outline' },
    { label: '8', onClick: () => handleNumber('8'), variant: 'outline' },
    { label: '9', onClick: () => handleNumber('9'), variant: 'outline' },
    { label: '-', onClick: () => handleOperator('-'), variant: 'outline', icon: Minus },
    { label: '4', onClick: () => handleNumber('4'), variant: 'outline' },
    { label: '5', onClick: () => handleNumber('5'), variant: 'outline' },
    { label: '6', onClick: () => handleNumber('6'), variant: 'outline' },
    { label: '+', onClick: () => handleOperator('+'), variant: 'outline', icon: Plus },
    { label: '1', onClick: () => handleNumber('1'), variant: 'outline' },
    { label: '2', onClick: () => handleNumber('2'), variant: 'outline' },
    { label: '3', onClick: () => handleNumber('3'), variant: 'outline' },
    { label: '=', onClick: handleEqual, variant: 'default', className: 'row-span-2 h-full text-2xl', icon: Equal },
    { label: '0', onClick: () => handleNumber('0'), variant: 'outline', className: 'col-span-2' },
    { label: '.', onClick: () => handleNumber('.'), variant: 'outline' },
  ];

  return (
    <MotionWrapper className="h-full flex flex-col">
      <Tabs defaultValue="calculator" className="flex-1 flex flex-col h-full">
        {/* Custom Glassy Tabs - Fixed alignment with safe area */}
        <div className="px-4 pt-3 pb-3 shrink-0">
          <TabsList className="w-full h-auto p-1.5 rounded-[18px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-amber-100/40 dark:border-amber-900/30 shadow-sm grid grid-cols-2 gap-1.5">
            <TabsTrigger
              value="calculator"
              className="h-11 rounded-[14px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-amber-400 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-amber-500/20 transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 font-medium"
            >
              <CalcIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">Calculator</span>
            </TabsTrigger>
            <TabsTrigger
              value="tools"
              className="h-11 rounded-[14px] data-[state=active]:bg-gradient-to-b data-[state=active]:from-amber-400 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-amber-500/20 transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 font-medium"
            >
              <Coins className="h-4 w-4 mr-2" />
              <span className="text-sm">Gold Tools</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calculator" className="flex-1 flex flex-col mt-0 h-full overflow-hidden">
          {/* Display Area - Reduced padding */}
          <div className="flex-1 flex flex-col justify-end items-end px-4 pt-2 pb-4 space-y-1 bg-gradient-to-b from-transparent to-amber-50/20 dark:to-amber-950/10 min-h-0">
            <div className="text-muted-foreground text-xs h-12 overflow-y-auto w-full text-right no-scrollbar opacity-50">
              {history.map((h, i) => (
                <div key={i} className="mb-1">{h}</div>
              ))}
            </div>
            <div className="text-muted-foreground text-base h-5">{equation}</div>
            <div className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground break-all text-right leading-none pb-1">
              {Number(display).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
            </div>
          </div>

          {/* Keypad - Improved contrast and = button styling */}
          <div className="grid grid-cols-4 gap-2.5 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-t-[24px] border-t border-amber-100/30 dark:border-amber-900/20 shadow-lg flex-shrink-0">
            {buttons.map((btn, i) => {
              const isEquals = btn.label === '=';
              const isOperator = ['÷', '×', '-', '+'].includes(btn.label);
              const isClear = btn.label === 'C';
              
              return (
                <Button
                  key={i}
                  variant={btn.variant as any}
                  onClick={btn.onClick}
                  className={cn(
                    "h-14 rounded-[14px] text-xl transition-all duration-150 active:scale-95",
                    // Default number keys - improved contrast
                    !isEquals && !isOperator && !isClear && "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700",
                    // Operator keys
                    isOperator && "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
                    // Equals key - prominent with shadow
                    isEquals && "bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/25 hover:from-amber-500 hover:to-amber-600",
                    btn.className || ''
                  )}
                >
                  {btn.icon ? <btn.icon className="h-5 w-5" /> : btn.label}
                </Button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="flex-1 px-4 pt-1 pb-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <Card className="glass-card border-primary/20 shadow-xl shadow-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-primary text-xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Coins className="h-5 w-5" />
                    </div>
                    <span>Gold Rate Calculator</span>
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Calculate rates for different gold purities</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Current 24K Gold Rate (per 10g)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                    <Input
                      type="number"
                      placeholder="75000"
                      value={baseRate}
                      onChange={(e) => setBaseRate(e.target.value)}
                      className="text-lg h-14 pl-8 bg-background/50 border-white/20 focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>

                {Object.keys(purityResults).length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground text-sm">Calculated Rates (per 10g)</Label>
                      <div className="h-px flex-1 mx-3 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    <div className="grid gap-3">
                      {Object.entries(purityResults).map(([purity, rate], index) => (
                        <div
                          key={purity}
                          className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-primary/30 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold text-sm">{index + 1}</span>
                            </div>
                            <span className="font-medium group-hover:text-primary transition-colors">{purity}</span>
                          </div>
                          <span className="font-bold text-primary text-xl">{formatCurrency(rate)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!baseRate && (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Coins className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Enter the 24K gold rate above</p>
                      <p className="text-muted-foreground/60 text-xs mt-1">to see prices for other purities</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MotionWrapper>
  );
}
