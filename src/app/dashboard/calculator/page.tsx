'use client';

import { useState } from 'react';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Button } from '@/components/ui/button';
import { Delete, Divide, Equal, Minus, Plus, X } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';

export default function CalculatorPage() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

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
      // eslint-disable-next-line no-eval
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation('');
      setIsNewNumber(true);
    } catch (e) {
      setDisplay('Error');
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

  const buttons = [
    { label: 'C', onClick: handleClear, variant: 'destructive', className: 'text-lg font-bold' },
    { label: '÷', onClick: () => handleOperator('/'), variant: 'secondary', icon: Divide },
    { label: '×', onClick: () => handleOperator('*'), variant: 'secondary', icon: X },
    { label: '⌫', onClick: handleDelete, variant: 'secondary', icon: Delete },
    { label: '7', onClick: () => handleNumber('7'), variant: 'outline' },
    { label: '8', onClick: () => handleNumber('8'), variant: 'outline' },
    { label: '9', onClick: () => handleNumber('9'), variant: 'outline' },
    { label: '-', onClick: () => handleOperator('-'), variant: 'secondary', icon: Minus },
    { label: '4', onClick: () => handleNumber('4'), variant: 'outline' },
    { label: '5', onClick: () => handleNumber('5'), variant: 'outline' },
    { label: '6', onClick: () => handleNumber('6'), variant: 'outline' },
    { label: '+', onClick: () => handleOperator('+'), variant: 'secondary', icon: Plus },
    { label: '1', onClick: () => handleNumber('1'), variant: 'outline' },
    { label: '2', onClick: () => handleNumber('2'), variant: 'outline' },
    { label: '3', onClick: () => handleNumber('3'), variant: 'outline' },
    { label: '=', onClick: handleEqual, variant: 'premium', className: 'row-span-2 h-full text-2xl', icon: Equal },
    { label: '0', onClick: () => handleNumber('0'), variant: 'outline', className: 'col-span-2' },
    { label: '.', onClick: () => handleNumber('.'), variant: 'outline' },
  ];

  return (
    <MotionWrapper className="h-[calc(100dvh-14rem)] flex flex-col justify-end pb-[calc(env(safe-area-inset-bottom)+4.5rem)]">
      <div className="flex-1 flex flex-col justify-end items-end p-6 space-y-2">
        <div className="text-muted-foreground text-xl h-8">{equation}</div>
        <div className="text-6xl font-bold tracking-tighter text-foreground break-all text-right">
          {Number(display).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 p-4">
        {buttons.map((btn, i) => (
          <Button
            key={i}
            variant={btn.variant as any}
            onClick={btn.onClick}
            className={`h-16 rounded-2xl text-xl shadow-sm active:scale-95 transition-transform ${btn.className || ''}`}
          >
            {btn.icon ? <btn.icon className="h-6 w-6" /> : btn.label}
          </Button>
        ))}
      </div>
    </MotionWrapper>
  );
}
