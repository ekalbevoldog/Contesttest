import React, { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down';
  offset?: [number, number];
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  className = '',
  speed = 0.2,
  direction = 'up', 
  offset = [-100, 100]
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Adjust the transformation direction based on the prop
  const directionMultiplier = direction === 'up' ? -1 : 1;
  const adjustedSpeed = speed * directionMultiplier;
  const y = useTransform(scrollYProgress, [0, 1], offset.map(val => val * adjustedSpeed));

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
};