import React from 'react';
import { motion } from 'framer-motion';
import { ValidationFeedback } from './ValidationFeedback';

interface SelectionOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface AnimatedSelectionFieldProps {
  type: 'radio' | 'checkbox';
  name: string;
  options: SelectionOption[];
  selectedValues: string | string[];
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomChange?: (value: any) => void;
  label?: string;
  required?: boolean;
  errorMessage?: string;
  isTouched?: boolean;
  cardStyle?: boolean;  // Enhanced card style for user type selection
}

export const AnimatedSelectionField: React.FC<AnimatedSelectionFieldProps> = ({
  type,
  name,
  options,
  selectedValues,
  onChange,
  onCustomChange,
  label,
  required = false,
  errorMessage,
  isTouched = false,
  cardStyle = false,
}) => {
  // Check if the option is selected
  const isSelected = (value: string) => {
    if (Array.isArray(selectedValues)) {
      return selectedValues.includes(value);
    }
    return selectedValues === value;
  };

  // Custom handler for more direct updates
  const handleSelection = (value: string) => {
    if (onCustomChange) {
      if (type === 'checkbox') {
        // For checkboxes, we need to toggle the value in the array
        if (Array.isArray(selectedValues)) {
          const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
          onCustomChange(newValues);
        }
      } else {
        // For radio buttons, just set the value
        onCustomChange(value);
      }
    }
  };

  // Validate if a selection is made
  const isValid = required ? 
    (Array.isArray(selectedValues) ? selectedValues.length > 0 : !!selectedValues) 
    : true;

  return (
    <div className="mb-4">
      {label && (
        <div className="mb-2 text-zinc-300 font-medium">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}

      <div className={`${cardStyle ? 'grid grid-cols-1 gap-4 w-full' : 'space-y-3'}`}>
        {options.map((option) => (
          <motion.label
            key={option.value}
            className={`
              flex ${cardStyle ? 'flex-col items-center p-6' : 'items-start p-3'} 
              rounded-lg border ${isSelected(option.value) ? 'border-red-500/70' : 'border-zinc-700'} 
              bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors
              ${cardStyle ? 'text-center' : ''}
            `}
            whileHover={{ scale: 1.01, borderColor: 'rgb(239, 68, 68)' }}
            whileTap={{ scale: 0.99 }}
            animate={{ 
              backgroundColor: isSelected(option.value) 
                ? 'rgba(30, 30, 33, 0.9)' 
                : 'rgba(24, 24, 27, 0.5)',
              borderColor: isSelected(option.value) 
                ? 'rgb(239, 68, 68)' 
                : 'rgb(63, 63, 70)' 
            }}
            transition={{ duration: 0.2 }}
            onClick={() => handleSelection(option.value)}
          >
            {cardStyle && option.icon && (
              <div className="mb-4">
                {option.icon}
              </div>
            )}
            
            <div className={`flex items-center ${cardStyle ? 'justify-center mb-3' : 'h-6'}`}>
              <input
                type={type}
                name={name}
                value={option.value}
                checked={isSelected(option.value)}
                onChange={onChange}
                className={`${cardStyle ? 'mr-2' : 'mr-3 mt-0.5'}`}
              />
              {cardStyle && (
                <span className="font-bold text-lg text-white">{option.label}</span>
              )}
            </div>

            {!cardStyle ? (
              <div className="ml-1">
                <div className="font-medium text-white">{option.label}</div>
                {option.description && (
                  <p className="text-sm text-zinc-400 mt-1">{option.description}</p>
                )}
              </div>
            ) : (
              option.description && (
                <p className="text-zinc-400 mt-1">{option.description}</p>
              )
            )}
          </motion.label>
        ))}
      </div>

      <ValidationFeedback
        isValid={isValid}
        isTouched={isTouched}
        message={!isValid ? errorMessage : undefined}
        showSuccess={false}
      />
    </div>
  );
};