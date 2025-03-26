import React, { useState, useEffect } from 'react';
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
  const [count, setCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flippedDigits, setFlippedDigits] = useState<number[]>([]);

  useEffect(() => {
    // If target is 0, don't animate
    if (targetNumber === 0) {
      setCount(0);
      setPrevCount(0);
      return;
    }

    // Start with a smaller number
    setCount(Math.max(1, Math.floor(targetNumber * 0.4)));
    setPrevCount(Math.max(1, Math.floor(targetNumber * 0.4)));
    
    // Wait a bit before starting the animation for better UX
    const timer = setTimeout(() => {
      setIsFlipping(true);
      
      // Animate the count up to the target
      const startTime = Date.now();
      const startValue = count;
      
      const animateCount = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function for smoother animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        const newCount = Math.floor(startValue + (targetNumber - startValue) * easedProgress);
        
        // Identify which digits are changing
        if (newCount !== count) {
          const prevDigits = count.toString().split('').map(Number);
          const newDigits = newCount.toString().split('').map(Number);
          
          // Pad the arrays to match lengths
          while (prevDigits.length < newDigits.length) {
            prevDigits.unshift(0);
          }
          
          // Find digits that are changing
          const changedIndexes: number[] = [];
          for (let i = 0; i < newDigits.length; i++) {
            const prevIndex = prevDigits.length - 1 - i;
            const newIndex = newDigits.length - 1 - i;
            
            if (prevIndex >= 0 && prevDigits[prevIndex] !== newDigits[newIndex]) {
              changedIndexes.push(newDigits.length - 1 - i);
            }
          }
          
          setFlippedDigits(changedIndexes);
          setPrevCount(count);
          setCount(newCount);
        }
        
        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          setIsFlipping(false);
          setFlippedDigits([]);
          setCount(targetNumber);
          setPrevCount(targetNumber);
        }
      };
      
      requestAnimationFrame(animateCount);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [targetNumber, duration]);

  // Convert number to string to handle each digit
  const countString = count.toString();
  const prevCountString = prevCount.toString();
  
  // Ensure the previous count has the same number of digits for the animation
  const paddedPrevCountString = prevCountString.padStart(countString.length, '0');
  
  return (
    <div className={cn("inline-flex items-center", className)}>
      {prefix && <span className="mr-1">{prefix}</span>}
      
      <div className="flex">
        {countString.split('').map((digit, index) => {
          const isFlippingDigit = flippedDigits.includes(index);
          const prevDigit = paddedPrevCountString[index] || '0';
          
          return (
            <div 
              key={index} 
              className={cn(
                "relative mx-[1px] w-7 h-11 bg-black rounded-sm overflow-hidden shadow-inner border-t border-zinc-800",
                isFlippingDigit && "perspective-[800px]"
              )}
            >
              {/* Top half (static) */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-zinc-900 border-b border-zinc-800 flex items-end justify-center overflow-hidden">
                <span className="text-xl font-bold text-white translate-y-1/4">
                  {digit}
                </span>
              </div>
              
              {/* Bottom half (static) */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-zinc-900 flex items-start justify-center overflow-hidden">
                <span className="text-xl font-bold text-white -translate-y-1/4">
                  {digit}
                </span>
              </div>
              
              {/* Flipping animation for top half */}
              {isFlippingDigit && (
                <>
                  <div 
                    className="absolute inset-x-0 top-0 h-1/2 bg-zinc-900 border-b border-zinc-800 flex items-end justify-center overflow-hidden transform-gpu origin-bottom animate-flip-down z-10"
                  >
                    <span className="text-xl font-bold text-white translate-y-1/4">
                      {prevDigit}
                    </span>
                  </div>
                  
                  {/* Flipping animation for bottom half */}
                  <div 
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-zinc-900 flex items-start justify-center overflow-hidden transform-gpu origin-top animate-flip-up z-10"
                  >
                    <span className="text-xl font-bold text-white -translate-y-1/4">
                      {digit}
                    </span>
                  </div>
                </>
              )}
              
              {/* Highlight effect */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-px bg-red-500/20"></div>
                <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/10 to-transparent"></div>
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent"></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {suffix && <span className="ml-1">{suffix}</span>}
    </div>
  );
}