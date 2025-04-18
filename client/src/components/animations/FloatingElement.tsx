import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  floatIntensity?: number;
  duration?: number;
  hoverScale?: number;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  className = '',
  floatIntensity = 10,
  duration = 5,
  hoverScale = 1.02,
}) => {
  const floatingAnimation = {
    y: [-floatIntensity, floatIntensity],
    transition: {
      duration,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'easeInOut',
    },
  };

  return (
    <motion.div
      animate={floatingAnimation}
      whileHover={{ scale: hoverScale, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
};