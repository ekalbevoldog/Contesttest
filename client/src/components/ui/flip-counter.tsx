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
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    // If target is 0, don't animate
    if (targetNumber === 0) {
      setCount(0);
      return;
    }

    // Start with a smaller number
    setCount(Math.max(1, Math.floor(targetNumber * 0.4)));
    
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
        
        const currentCount = Math.floor(startValue + (targetNumber - startValue) * easedProgress);
        setCount(currentCount);
        
        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          setIsFlipping(false);
          setCount(targetNumber);
        }
      };
      
      requestAnimationFrame(animateCount);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [targetNumber, duration]);

  // Convert number to string to handle each digit
  const countString = count.toString();
  
  return (
    <div className={cn("inline-flex items-center", className)}>
      {prefix && <span className="mr-1">{prefix}</span>}
      
      <div className="flex">
        {countString.split('').map((digit, index) => (
          <div 
            key={index} 
            className={cn(
              "relative mx-[1px] w-10 h-14 bg-zinc-900 rounded-md overflow-hidden border border-red-500/20",
              isFlipping && "animate-pulse"
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "text-2xl font-bold transition-all duration-300",
                isFlipping ? "text-red-500" : "text-white"
              )}>
                {digit}
              </div>
            </div>
            
            {isFlipping && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent animate-flip-pulse"></div>
            )}
          </div>
        ))}
      </div>
      
      {suffix && <span className="ml-2">{suffix}</span>}
    </div>
  );
}