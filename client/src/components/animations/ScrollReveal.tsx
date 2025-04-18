import React, { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
  duration?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  threshold = 0.1,
  delay = 0,
  direction = 'up',
  distance = 30,
  once = true,
  duration = 0.7,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: threshold, once });

  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      case 'none':
        return { scale: 0.95 };
      default:
        return { y: distance };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...getInitialPosition(),
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              x: 0,
              scale: 1,
            }
          : {}
      }
      transition={{
        duration,
        delay,
        ease: [0.215, 0.61, 0.355, 1], // Easing inspired by Framer sites
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};