import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ValidationFeedback, AnimatedInput } from './ValidationFeedback';

interface AnimatedFormFieldProps {
  type: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  errorMessage?: string;
  icon?: React.ReactNode;
  className?: string;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
}

export const AnimatedFormField: React.FC<AnimatedFormFieldProps> = ({
  type,
  name,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  minLength,
  errorMessage,
  icon,
  className = '',
  pattern,
  min,
  max,
  step,
  prefix
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Validate field based on type and requirements
  const validateField = () => {
    // Don't validate until the field has been touched
    if (!isTouched) return true;
    
    if (required && (value === '' || value === null || value === undefined)) {
      return false;
    }
    
    if (typeof value === 'string' && minLength && value.length < minLength) {
      return false;
    }
    
    if (type === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return false;
    }
    
    if (pattern && typeof value === 'string') {
      const patternRegex = new RegExp(pattern);
      if (!patternRegex.test(value)) return false;
    }
    
    if (type === 'number' && typeof value === 'number') {
      if (min !== undefined && value < min) return false;
      if (max !== undefined && value > max) return false;
    }
    
    return true;
  };
  
  const isValid = validateField();
  
  // Handle onBlur to mark field as touched
  const handleBlur = () => {
    setIsFocused(false);
    setIsTouched(true);
  };
  
  // Calculate label animation variants
  const labelVariants = {
    focused: { 
      y: -20, 
      x: 0,
      scale: 0.85, 
      color: isValid ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)'
    },
    blurred: {
      y: value ? -20 : 0,
      x: 0,
      scale: value ? 0.85 : 1,
      color: value ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'
    },
    hover: {
      color: 'rgb(212, 212, 216)',
    }
  };
  
  return (
    <div className={`mb-4 ${className}`}>
      <div className="relative">
        {label && (
          <motion.label
            htmlFor={name}
            className="absolute left-3 pointer-events-none z-10 px-1 bg-zinc-800 rounded"
            style={{ top: '50%', transformOrigin: 'left' }}
            initial="blurred"
            animate={isFocused ? 'focused' : isHovered ? 'hover' : 'blurred'}
            variants={labelVariants}
            transition={{ 
              duration: 0.2,
              ease: [0.2, 0.65, 0.3, 0.9]
            }}
          >
            {label}{required && <span className="text-red-500 ml-1">*</span>}
          </motion.label>
        )}
        
        <AnimatedInput isValid={isValid} isFocused={isFocused} isTouched={isTouched}>
          <div className="relative">
            {/* Prefix for currency or other prefixed inputs */}
            {prefix && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none">
                {prefix}
              </span>
            )}
            
            <motion.input
              type={type}
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              placeholder={isFocused ? placeholder : ''}
              className={`w-full p-3 bg-zinc-800/90 rounded-lg transition-colors text-base ${
                prefix ? 'pl-8' : ''
              } ${name === 'zipCode' ? 'text-lg font-medium tracking-wide' : ''}`}
              style={{ borderWidth: 0 }}  // Border is handled by AnimatedInput
              required={required}
              minLength={minLength}
              pattern={pattern}
              min={min}
              max={max}
              step={step}
            />
            
            {/* Icon display on the right side */}
            {icon && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
                {icon}
              </div>
            )}
          </div>
        </AnimatedInput>
        
        <ValidationFeedback
          isValid={isValid}
          isTouched={isTouched}
          message={!isValid ? errorMessage : undefined}
        />
      </div>
    </div>
  );
};