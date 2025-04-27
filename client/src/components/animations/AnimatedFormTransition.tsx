import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedFormTransitionProps {
  children: React.ReactNode;
  step?: string | number;
  direction?: 'forward' | 'backward';
  className?: string;
}

/**
 * AnimatedFormTransition - Provides a smooth transition between form steps
 * 
 * This component animates transitions between different form steps, with customizable
 * animation direction to indicate forward/backward progress.
 */
export const AnimatedFormTransition: React.FC<AnimatedFormTransitionProps> = ({
  children,
  step = 'default',
  direction = 'forward',
  className = '',
}) => {
  // Animation variants
  const variants = {
    hidden: {
      x: direction === 'forward' ? 50 : -50,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1], // Custom ease curve for smoother transition
      },
    },
    exit: {
      x: direction === 'forward' ? -50 : 50,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className={`overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};