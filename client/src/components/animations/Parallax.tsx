import React, { ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  offset?: [number, number];
  rotate?: number;
  scale?: number;
  opacity?: [number, number];
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  className = '',
  speed = 0.2,
  direction = 'up',
  offset = [-100, 100],
  rotate = 0,
  scale = 0,
  opacity
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Horizontal movement based on direction
  let x;
  if (direction === 'left' || direction === 'right') {
    const horizontalMultiplier = direction === 'left' ? -1 : 1;
    x = useTransform(scrollYProgress, [0, 1], offset.map(val => val * speed * horizontalMultiplier));
  }

  // Vertical movement based on direction
  let y;
  if (direction === 'up' || direction === 'down') {
    const verticalMultiplier = direction === 'up' ? -1 : 1;
    y = useTransform(scrollYProgress, [0, 1], offset.map(val => val * speed * verticalMultiplier));
  }
  
  // Optional rotation effect
  const rotateZ = rotate ? useTransform(scrollYProgress, [0, 1], [0, rotate]) : undefined;
  
  // Optional scale effect
  const scaleValue = scale ? useTransform(scrollYProgress, [0, 0.5, 1], [1, 1 + scale * 0.5, 1 + scale]) : undefined;
  
  // Optional opacity effect
  const opacityValue = opacity ? useTransform(scrollYProgress, [0, 1], opacity) : undefined;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div 
        style={{ 
          x, 
          y, 
          rotateZ, 
          scale: scaleValue,
          opacity: opacityValue
        }} 
        className="will-change-transform"
        initial={{ 
          filter: "blur(0px)",
        }}
        whileInView={{ 
          filter: "blur(0px)",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};