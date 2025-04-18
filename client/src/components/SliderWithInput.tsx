import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { DollarSign } from 'lucide-react';

interface SliderWithInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

const SliderWithInput: React.FC<SliderWithInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 10000,
  step = 100,
  label
}) => {
  const [sliderValue, setSliderValue] = useState<number>(value || min);
  const [inputValue, setInputValue] = useState<string>(value?.toString() || '0');
  
  // Update local state when prop value changes
  useEffect(() => {
    setSliderValue(value || min);
    setInputValue(value?.toString() || min.toString());
  }, [value, min]);
  
  // Handle slider change
  const handleSliderChange = (newValue: number[]) => {
    const value = newValue[0];
    setSliderValue(value);
    setInputValue(value.toString());
    onChange(value);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);
    
    const numericValue = parseInt(inputVal);
    if (!isNaN(numericValue)) {
      // Constrain value within min-max range
      const constrainedValue = Math.min(Math.max(numericValue, min), max);
      setSliderValue(constrainedValue);
      onChange(constrainedValue);
    }
  };
  
  // Ensure the value is constrained when input loses focus
  const handleInputBlur = () => {
    let numericValue = parseInt(inputValue);
    
    if (isNaN(numericValue)) {
      numericValue = min;
    } else {
      numericValue = Math.min(Math.max(numericValue, min), max);
    }
    
    setInputValue(numericValue.toString());
    setSliderValue(numericValue);
    onChange(numericValue);
  };
  
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>}
      
      <div className="flex items-center space-x-4">
        <div className="flex-grow">
          <Slider
            value={[sliderValue]}
            onValueChange={handleSliderChange}
            max={max} 
            min={min}
            step={step}
            className="my-2"
          />
        </div>
        
        <div className="w-28 relative">
          <DollarSign 
            size={16} 
            className="absolute text-zinc-400 left-2 top-1/2 transform -translate-y-1/2" 
          />
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="pl-7 focus:border-red-500 bg-zinc-800/50 border-zinc-700"
            min={min}
            max={max}
            step={step}
          />
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-zinc-500 px-0.5">
        <span>${min}</span>
        <span>${max}</span>
      </div>
    </div>
  );
};

export default SliderWithInput;