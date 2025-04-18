import React, { useEffect, useState, useRef } from 'react';

// Simple counter animation without external dependencies
export const SimpleCounter: React.FC<{
  end: number;
  className?: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}> = ({ end, className = '', duration = 2000, prefix = '', suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);
  
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      setCount(progress * end);
      
      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [end, duration]);
  
  const formattedCount = count.toFixed(decimals);
  
  return (
    <span className={className}>
      {prefix}{formattedCount}{suffix}
    </span>
  );
};

// Simple scramble text animation
export const SimpleScrambleText: React.FC<{
  text: string;
  className?: string;
  duration?: number;
  characters?: string;
}> = ({ text, className = '', duration = 2000, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' }) => {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    let counter = 0;
    const maxCounter = 10; // Number of scramble iterations
    const interval = duration / maxCounter;
    
    const scramble = () => {
      counter++;
      
      if (counter >= maxCounter) {
        setDisplayText(text);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }
      
      // Calculate how many characters should be revealed
      const revealIndex = Math.floor((text.length * counter) / maxCounter);
      
      let newText = '';
      for (let i = 0; i < text.length; i++) {
        if (i < revealIndex) {
          newText += text[i];
        } else {
          newText += characters.charAt(Math.floor(Math.random() * characters.length));
        }
      }
      
      setDisplayText(newText);
    };
    
    intervalRef.current = setInterval(scramble, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, duration, characters]);
  
  return <span className={className}>{displayText}</span>;
};

// Simple staggered text animation
export const SimpleStaggerText: React.FC<{
  text: string;
  className?: string;
  direction?: 'up' | 'down';
}> = ({ text, className = '', direction = 'up' }) => {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span 
          key={index}
          className={`inline-block animate-fade-in-${direction} [animation-delay:${index * 0.05}s]`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};