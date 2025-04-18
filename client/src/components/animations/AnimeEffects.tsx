import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimeTextProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  staggerDelay?: number;
}

export const AnimeText: React.FC<AnimeTextProps> = ({
  children,
  className = '',
  duration = 0.8,
  delay = 0,
  staggerDelay = 0.02
}) => {
  // Split text into array of characters for animation
  const chars = children.split('');
  
  // Configure the variants for staggered animation
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { 
        staggerChildren: staggerDelay, 
        delayChildren: delay,
      },
    }),
  };
  
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
        duration: duration
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200,
      },
    },
  };

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {chars.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          variants={child}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

interface AnimeBlobProps {
  className?: string;
  size?: number;
  color?: string;
  pulseSpeed?: number;
  pulseScale?: number;
  rotationSpeed?: number;
  rotationRange?: number;
}

export const AnimeBlob: React.FC<AnimeBlobProps> = ({
  className = '',
  size = 100,
  color = 'rgba(255, 100, 100, 0.15)',
  pulseSpeed = 2.5,
  pulseScale = 1.1,
  rotationSpeed = 8,
  rotationRange = 10,
}) => {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
      }}
      animate={{
        scale: [1, pulseScale, 1],
        rotate: [0, rotationRange, 0],
      }}
      transition={{
        scale: {
          repeat: Infinity,
          duration: pulseSpeed,
          ease: 'easeInOut',
        },
        rotate: {
          repeat: Infinity,
          duration: rotationSpeed,
          ease: 'easeInOut',
        },
      }}
    />
  );
};

interface AnimeScrambleTextProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  scrambleChars?: string;
}

export const AnimeScrambleText: React.FC<AnimeScrambleTextProps> = ({
  children,
  className = '',
  duration = 2.5,
  delay = 0,
  scrambleChars = '!<>-_\\/[]{}—=+*^?#_abcdefghijklmnopqrstuvwxyz0123456789',
}) => {
  const [displayText, setDisplayText] = useState('');
  const textRef = useRef<string>(children);
  
  useEffect(() => {
    textRef.current = children;
    
    // Randomized character scrambling effect
    let iteration = 0;
    const totalIterations = Math.floor(duration * 10);
    let interval: NodeJS.Timeout;
    
    // Start with random characters
    setDisplayText(generateRandomText(children.length, scrambleChars));
    
    setTimeout(() => {
      interval = setInterval(() => {
        if (iteration >= totalIterations) {
          clearInterval(interval);
          setDisplayText(textRef.current);
          return;
        }
        
        const progress = iteration / totalIterations;
        
        // Gradually reveal the correct text
        const newText = textRef.current.split('').map((char: string, index: number) => {
          if (char === ' ') return ' ';
          const shouldReveal = Math.random() < progress || index < progress * textRef.current.length;
          return shouldReveal ? char : scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        }).join('');
        
        setDisplayText(newText);
        iteration++;
      }, 30);
    }, delay * 1000);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [children, duration, delay, scrambleChars]);
  
  function generateRandomText(length: number, chars: string): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += children[i] === ' ' ? ' ' : chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  return (
    <div className={className}>
      {displayText}
    </div>
  );
};