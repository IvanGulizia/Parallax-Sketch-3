
import React, { useState } from 'react';

interface LayerSliderProps {
  activeLayer: number;
  onChange: (layerIndex: number) => void;
  onSwap: (fromIndex: number, toIndex: number) => void;
}

export const LayerSlider: React.FC<LayerSliderProps> = ({ activeLayer, onChange, onSwap }) => {
  // Layers 0 (Back) to 6 (Front) - Visual Order Top to Bottom is 6 -> 0
  const layers = [6, 5, 4, 3, 2, 1, 0]; 
  
  const [draggedLayer, setDraggedLayer] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, layerIndex: number) => {
      setDraggedLayer(layerIndex);
      e.dataTransfer.setData('text/plain', layerIndex.toString());
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetLayer: number) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLayer: number) => {
      e.preventDefault();
      const sourceLayer = draggedLayer;
      
      if (sourceLayer !== null && sourceLayer !== targetLayer) {
          onSwap(sourceLayer, targetLayer);
      }
      setDraggedLayer(null);
  };

  const handleDragEnd = () => {
      setDraggedLayer(null);
  };

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center z-40 pointer-events-auto gap-2"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* The slider bar itself - Thinner, Pill Shape */}
      <div className="w-8 md:w-9 h-96 bg-[var(--tool-bg)] rounded-full flex flex-col items-center justify-between py-6 border border-[var(--border-color)] relative shadow-sm">
        
        {layers.map((layerIndex) => (
          <div
            key={layerIndex}
            draggable
            onDragStart={(e) => handleDragStart(e, layerIndex)}
            onDragOver={(e) => handleDragOver(e, layerIndex)}
            onDrop={(e) => handleDrop(e, layerIndex)}
            onDragEnd={handleDragEnd}
            onClick={(e) => {
                e.stopPropagation();
                onChange(layerIndex);
            }}
            className="relative z-10 w-full flex items-center justify-center cursor-pointer group py-1"
            title={`Layer ${layerIndex} ${layerIndex === 0 ? '(Back)' : layerIndex === 6 ? '(Front)' : ''}`}
          >
             {/* Indicator Dot */}
             <div 
                className={`
                    rounded-full transition-all duration-300 ease-out
                    ${activeLayer === layerIndex 
                        ? 'w-3 h-3 shadow-sm scale-110' 
                        : 'w-2 h-2 hover:scale-125' // Increased from w-1.5 for better visibility
                    }
                    ${draggedLayer === layerIndex ? 'opacity-30' : 'opacity-100'}
                `} 
                style={{
                    backgroundColor: activeLayer === layerIndex ? 'var(--active-color)' : 'var(--sidebar-dot)'
                }}
             />
             
             {/* Invisible Expand Hit Area */}
             <div className="absolute inset-0 bg-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
};
