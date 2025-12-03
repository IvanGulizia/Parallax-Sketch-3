
import React from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({ value, min, max, step, onChange, disabled }) => {
  // Calculate percentage for the linear-gradient background (Filled vs Track color)
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={`relative w-full h-6 flex items-center ${disabled ? 'opacity-50' : ''}`}>
      <style>
        {`
          .custom-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--slider-handle);
            border: 1px solid rgba(0,0,0,0.1);
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            margin-top: -4px; /* Center thumb on track (track height 4px, thumb 12px -> 12/2 - 4/2 = 4px offset) */
            transition: transform 0.1s ease;
          }
          .custom-range::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          .custom-range::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            border-radius: 99px;
            cursor: pointer;
          }
          .custom-range::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--slider-handle);
            border: 1px solid rgba(0,0,0,0.1);
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          }
        `}
      </style>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseDown={(e) => e.stopPropagation()} // Prevent Menu closing
        onTouchStart={(e) => e.stopPropagation()} // Prevent Menu closing
        className="custom-range w-full appearance-none bg-transparent focus:outline-none"
        style={{
          // This allows us to have different colors for the filled part (left) and the track (right)
          background: `linear-gradient(to right, var(--slider-filled) 0%, var(--slider-filled) ${percent}%, var(--slider-track) ${percent}%, var(--slider-track) 100%)`,
          height: '4px',
          borderRadius: '99px'
        }}
      />
    </div>
  );
};
