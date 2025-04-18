import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  floatIntensity?: number;
  duration?: number;
  hoverScale?: number;
  disabled?: boolean; // Option to disable the floating animation
  delay?: number;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className = '',
  floatIntensity = 2.5, // Reduced default intensity for subtlety
  duration = 4,
  hoverScale = 1.01, // More subtle hover effect
  disabled = false,
  delay = 0,
}) => {
  // More subtle animation
  const floatingAnimation = disabled ? {} : {
    y: [-floatIntensity, floatIntensity],
    transition: {
      duration,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: [0.33, 1, 0.68, 1], // Custom cubic-bezier for smoother motion
      delay,
    },
  };

  return (
    <motion.div
      animate={floatingAnimation}
      whileHover={{ 
        scale: hoverScale, 
        transition: { 
          duration: 0.3, 
          ease: [0.22, 1, 0.36, 1] // Smooth cubic-bezier curve
        } 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};