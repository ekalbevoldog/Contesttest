import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  delayChildren = 0.15,
  staggerChildren = 0.1,
}) => {
  // Using a more reliable approach for staggered animations
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          // Apply delay based on child index
          return React.cloneElement(child, {
            ...child.props,
            customDelay: delayChildren + (index * staggerChildren)
          });
        }
        return child;
      })}
    </div>
  );
};

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  customVariants?: any;
  customDelay?: number;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  customVariants,
  customDelay = 0,
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: customDelay,
      }}
    >
      {children}
    </motion.div>
  );
};