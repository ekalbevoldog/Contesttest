import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedFormTransitionProps {
  children: React.ReactNode;
  step: string | number;
  direction?: 'forward' | 'backward';
  className?: string;
}

/**
 * AnimatedFormTransition - Provides a smooth transition between form steps
 * 
 * This component animates transitions between different form steps, with customizable
 * animation direction to indicate forward/backward progress.
 */
export const AnimatedFormTransition: React.FC<AnimatedFormTransitionProps> = ({
  children,
  step,
  direction = 'forward',
  className = '',
}) => {
  const [previousStep, setPreviousStep] = useState<string | number>(step);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>(direction);

  // Update direction based on step change
  useEffect(() => {
    if (step !== previousStep) {
      setAnimationDirection(direction);
      setPreviousStep(step);
    }
  }, [step, direction, previousStep]);

  // Animation variants
  const variants = {
    hidden: {
      x: animationDirection === 'forward' ? 50 : -50,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1], // Custom ease curve for smoother transition
      },
    },
    exit: {
      x: animationDirection === 'forward' ? -50 : 50,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <div className={`overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/**
 * ProgressBar - Animated progress bar for multi-step forms
 * 
 * Shows visual progress through the form with a smooth animation.
 */
export const AnimatedProgressBar: React.FC<{
  currentStep: number;
  totalSteps: number;
  className?: string;
}> = ({ currentStep, totalSteps, className = '' }) => {
  const progress = Math.min(Math.floor((currentStep / (totalSteps - 1)) * 100), 100);

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <motion.span
          key={progress}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {progress}% Complete
        </motion.span>
      </div>
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-full"
          initial={{ width: `${Math.max(progress - 5, 0)}%`, opacity: 0.8 }}
          animate={{ width: `${progress}%`, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

/**
 * StepIndicator - Animated step indicator for multi-step forms
 * 
 * Visual representation of all steps in the form with the current step highlighted.
 */
export const StepIndicator: React.FC<{
  steps: string[];
  currentStep: number;
  className?: string;
}> = ({ steps, currentStep, className = '' }) => {
  return (
    <div className={`flex items-center justify-center mb-6 ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ 
              scale: currentStep === index ? 1 : 0.8,
              opacity: currentStep === index ? 1 : 0.7,
            }}
            transition={{ duration: 0.2 }}
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStep 
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white' 
                  : 'bg-zinc-800 text-zinc-400'}`}
            >
              {index + 1}
            </div>
            {currentStep === index && (
              <motion.div
                className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-600/30 to-amber-600/30 -z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  repeatDelay: 0.5
                }}
              />
            )}
          </motion.div>
          
          {index < steps.length - 1 && (
            <div 
              className={`h-0.5 w-8 mx-1 
                ${index < currentStep 
                  ? 'bg-gradient-to-r from-red-600 to-amber-600' 
                  : 'bg-zinc-800'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};