import React, { ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';

interface FadeInProps extends MotionProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  className = '',
  direction = 'up',
  distance = 20,
  ...props
}) => {
  const getDirectionalMovement = () => {
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
        return {};
      default:
        return { y: distance };
    }
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...getDirectionalMovement(),
      }}
      animate={{
        opacity: 1,
        y: 0,
        x: 0,
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1.0], // Cubic bezier for a smooth, pleasing curve
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};