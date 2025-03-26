import React from 'react';
import { cn } from '@/lib/utils';

interface FlipCounterProps {
  targetNumber: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function FlipCounter({
  targetNumber,
  prefix = '',
  suffix = '',
  duration = 2000,
  className
}: FlipCounterProps) {
  // Convert number to string to handle each digit
  const numberString = targetNumber.toString();
  
  return (
    <div className={cn("inline-flex items-center", className)}>
      {prefix && <span className="mr-1 text-white">{prefix}</span>}
      
      <div className="flex">
        {numberString.split('').map((digit, index) => (
          <div 
            key={index} 
            className="relative mx-[1px] w-[55px] h-[80px] bg-zinc-950 rounded overflow-hidden shadow-md"
          >
            {/* Static digit display */}
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <span className="text-3xl font-bold text-white">
                {digit}
              </span>
            </div>
            
            {/* Highlight effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-px bg-red-500/20"></div>
              <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent"></div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/10 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent"></div>
            </div>
          </div>
        ))}
      </div>
      
      {suffix && <span className="ml-1 text-white">{suffix}</span>}
    </div>
  );
}