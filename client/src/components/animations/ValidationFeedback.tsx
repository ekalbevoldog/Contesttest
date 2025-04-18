import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

type ValidationFeedbackProps = {
  isValid: boolean;
  isTouched: boolean;
  message?: string;
  showSuccess?: boolean;
};

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ 
  isValid, 
  isTouched, 
  message,
  showSuccess = true
}) => {
  // Don't show anything if the field hasn't been touched yet
  if (!isTouched) return null;

  return (
    <AnimatePresence mode="wait">
      {!isValid && message ? (
        <motion.div 
          key="error"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-start mt-1.5 text-sm text-red-500"
        >
          <AlertCircle size={14} className="mr-1.5 mt-0.5 shrink-0" />
          <span>{message}</span>
        </motion.div>
      ) : isValid && showSuccess ? (
        <motion.div 
          key="success"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
        >
          <Check size={18} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

// Animated input wrapper component that adds a highlight effect on focus
export const AnimatedInput: React.FC<{
  children: React.ReactNode;
  isValid?: boolean;
  isFocused?: boolean;
  isTouched?: boolean;
}> = ({ children, isValid = true, isFocused = false, isTouched = false }) => {
  // Determine border color based on validation state
  let borderColorClass = "border-zinc-700";
  
  if (isTouched) {
    if (!isValid) {
      borderColorClass = "border-red-500";
    } else if (isValid) {
      borderColorClass = "border-green-500";
    }
  }
  
  if (isFocused) {
    if (!isValid) {
      borderColorClass = "border-red-400";
    } else {
      borderColorClass = "border-red-500";
    }
  }

  return (
    <motion.div
      className={`relative rounded-lg overflow-hidden transition-all duration-300 ${borderColorClass}`}
      initial={{ borderWidth: 1 }}
      animate={{ 
        borderWidth: isFocused ? 2 : 1,
        boxShadow: isFocused 
          ? `0 0 0 2px rgba${!isValid ? '(220, 38, 38, 0.2)' : '(239, 68, 68, 0.2)'}`
          : 'none'
      }}
    >
      {children}
    </motion.div>
  );
};

// Form field transition for when fields appear/disappear
export const FormFieldTransition: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: [0.25, 0.1, 0.3, 1.0] // Custom ease curve
      }}
    >
      {children}
    </motion.div>
  );
};