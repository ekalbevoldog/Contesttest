import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  intensity?: 'subtle' | 'medium' | 'strong';
  duration?: number;
  offsetY?: number;
  offsetX?: number;
  rotate?: number;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className = '',
  delay = 0,
  intensity = 'subtle',
  duration = 6,
  offsetY = 10,
  offsetX = 0,
  rotate = 0
}) => {
  // Set intensity multipliers
  let intensityFactor;
  switch (intensity) {
    case 'strong':
      intensityFactor = 1.5;
      break;
    case 'medium':
      intensityFactor = 1;
      break;
    case 'subtle':
    default:
      intensityFactor = 0.6;
      break;
  }

  // Adjust values based on intensity
  const adjustedY = offsetY * intensityFactor;
  const adjustedX = offsetX * intensityFactor;
  const adjustedRotate = rotate * intensityFactor;

  // Animation variants
  const floatingAnimation = {
    initial: {
      y: 0,
      x: 0,
      rotate: 0
    },
    animate: {
      y: [0, -adjustedY, 0],
      x: [0, adjustedX, 0],
      rotate: [0, adjustedRotate, 0],
      transition: {
        duration: duration,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror" as const,
        delay: delay
      }
    }
  };

  return (
    <motion.div
      className={`${className}`}
      variants={floatingAnimation}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};