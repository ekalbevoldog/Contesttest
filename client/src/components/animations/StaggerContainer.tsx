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
          // Use data- attribute format for custom props to avoid React DOM warnings
          return React.cloneElement(child, {
            ...child.props,
            'data-delay': delayChildren + (index * staggerChildren)
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
  'data-delay'?: number;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  customVariants,
  customDelay = 0,
  'data-delay': dataDelay,
  ...otherProps
}) => {
  // Use data-delay if provided, otherwise fallback to customDelay
  const delay = dataDelay !== undefined ? dataDelay : customDelay;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: delay,
      }}
      {...otherProps}
    >
      {children}
    </motion.div>
  );
};