import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedGradientProps {
  className?: string;
  colors?: string[];
  duration?: number;
  blur?: number;
}

export const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  className = '',
  colors = ['hsl(345, 90%, 55%)', 'hsl(235, 100%, 50%)', 'hsl(195, 100%, 50%)'],
  duration = 20,
  blur = 70,
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: colors.map((color) => `radial-gradient(circle, ${color} 0%, transparent 70%)`).join(', '),
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{
          filter: `blur(${blur}px)`,
          backgroundSize: '150% 150%',
          backgroundPosition: 'center',
          opacity: 0.7,
        }}
      />
    </div>
  );
};