import React, { useRef, useEffect, useState } from 'react';

interface ParallaxSliderProps {
  value: number; // 0 to 100
  onChange: (val: number) => void;
}

export const ParallaxSlider: React.FC<ParallaxSliderProps> = ({ value, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleInteraction = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    // The track width is the full width of the element
    // But we want the interactive area to be within the padding
    const padding = 24; // px-6 = 24px
    const activeWidth = rect.width - (padding * 2);
    const x = clientX - rect.left - padding;
    
    const percent = Math.min(Math.max(x / activeWidth, 0), 1);
    onChange(Math.round(percent * 100));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleInteraction(e.touches[0].clientX);
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (isDragging) handleInteraction(e.clientX);
    };
    const handleUp = () => setIsDragging(false);
    
    const handleTouchMove = (e: TouchEvent) => {
        if (isDragging) handleInteraction(e.touches[0].clientX);
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        className="w-80 h-12 bg-[var(--tool-bg)] rounded-3xl flex items-center px-6 relative cursor-pointer shadow-sm"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        ref={trackRef}
      >
        {/* Gradient Track Visual */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-[var(--active-color)] opacity-30" />
        </div>

        {/* Thumb */}
        {/* We position the thumb container absolute within the padding area */}
        <div className="absolute inset-0 px-6 pointer-events-none flex items-center">
            <div 
                className="relative w-full h-0"
            >
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--primary-bg)] border-2 border-[var(--active-color)] rounded-full shadow-sm transition-transform duration-75 ease-out"
                    style={{ left: `${value}%`, transform: 'translate(-50%, -50%)' }}
                />
            </div>
        </div>
      </div>
    </div>
  );
};