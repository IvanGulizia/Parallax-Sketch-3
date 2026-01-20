
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { ToolType, EraserMode, BlendMode } from '../appTypes';

interface ToolbarProps {
  activeTool: ToolType;
  isPlaying: boolean;
  activeColorSlot: number;
  activeSecondaryColorSlot: number;
  activeBlendMode: BlendMode;
  activeFillBlendMode: BlendMode;
  isFillEnabled: boolean;
  isColorSynced: boolean;
  isStrokeEnabled: boolean;
  palette: string[];
  brushSize: number;
  eraserMode: EraserMode;
  canUndo: boolean;
  canRedo: boolean;
  isEmbedMode: boolean;
  onTogglePlay: () => void;
  onToolChange: (tool: ToolType) => void;
  onColorSlotChange: (index: number, isSecondary?: boolean) => void;
  onPaletteChange: (index: number, newColor: string) => void;
  onCyclePalette: (direction: -1 | 1) => void;
  onBlendModeChange: (mode: BlendMode, isFill?: boolean) => void;
  onToggleFill: (enabled: boolean) => void;
  onToggleColorSync: (enabled: boolean) => void;
  onToggleStroke: (enabled: boolean) => void;
  onSizeChange: (size: number) => void;
  onEraserModeChange: (mode: EraserMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onMenuToggle: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  isPlaying,
  activeColorSlot,
  activeSecondaryColorSlot,
  activeBlendMode,
  activeFillBlendMode,
  isFillEnabled,
  isColorSynced,
  isStrokeEnabled,
  palette,
  brushSize,
  eraserMode,
  canUndo,
  canRedo,
  isEmbedMode,
  onTogglePlay,
  onToolChange,
  onColorSlotChange,
  onPaletteChange,
  onCyclePalette,
  onBlendModeChange,
  onToggleFill,
  onToggleColorSync,
  onToggleStroke,
  onSizeChange,
  onEraserModeChange,
  onUndo,
  onRedo,
  onReset,
  onMenuToggle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showEraserPicker, setShowEraserPicker] = useState(false);
  
  const [isEditingFill, setIsEditingFill] = useState(false);

  // Close all popups when playing
  useEffect(() => {
    if (isPlaying) {
        setShowColorPicker(false);
        setShowSizePicker(false);
        setShowEraserPicker(false);
    }
  }, [isPlaying]);

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setShowColorPicker(false);
            setShowSizePicker(false);
            setShowEraserPicker(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isEmbedMode) return null;

  // Reverted to Filled Background Style
  const btnClass = (isActive: boolean) => `
    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
    transition-all duration-200 ease-in-out flex-shrink-0 border
    ${isActive 
      ? 'bg-[var(--active-color)] text-white border-transparent shadow-sm' 
      : 'bg-[var(--tool-bg)] text-[var(--icon-color)] border-[var(--button-border)] hover:bg-[var(--secondary-bg)]'}
  `;

  // Adjusted width constraints to fit content
  const popupClass = "absolute top-full mt-4 left-1/2 -translate-x-1/2 backdrop-blur-md bg-white/95 flex gap-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 items-center justify-center border border-gray-200 shadow-lg";

  return (
    <div ref={containerRef} className="flex items-center justify-center gap-2 md:gap-3 pointer-events-auto relative">
        
        {/* Play/Pause */}
        <button 
          className={btnClass(isPlaying)}
          onClick={onTogglePlay}
        >
          {isPlaying ? <Icons.Pause size={20} /> : <Icons.Play size={20} />}
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-[var(--border-color)] mx-1" />

        {/* Color Picker */}
        <div className="relative">
            <button 
            className={btnClass(false)} // Always inactive style unless tool specific logic is added, as requested
            style={{ 
                color: (activeTool === ToolType.BRUSH && !showColorPicker) ? palette[activeColorSlot] : undefined 
            }}
            onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowSizePicker(false);
                setShowEraserPicker(false);
                setIsEditingFill(false);
            }}
            >
            <Icons.Droplet size={20} />
            </button>
            
            {showColorPicker && (
                <div className={`${popupClass} rounded-3xl p-4 flex-col gap-3 w-auto min-w-[320px] max-w-[95vw]`}>
                    
                    {/* Tabs */}
                    <div className="flex bg-gray-100 rounded-full p-1 w-full mb-1">
                        <button 
                            onClick={() => setIsEditingFill(false)}
                            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${!isEditingFill ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Stroke
                        </button>
                        <button 
                            onClick={() => setIsEditingFill(true)}
                            className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${isEditingFill ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Fill {isFillEnabled ? '' : '(Off)'}
                        </button>
                    </div>

                    <div className="w-full flex flex-col gap-3">
                        
                        {/* Fill Controls */}
                        {isEditingFill && (
                            <div className="flex flex-col gap-2 w-full px-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-600">Enable Fill</span>
                                    <button 
                                        onClick={() => onToggleFill(!isFillEnabled)}
                                        className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${
                                            isFillEnabled ? 'bg-[var(--active-color)]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full transform transition-transform duration-300 ${
                                            isFillEnabled ? 'translate-x-4' : 'translate-x-0'
                                        }`} />
                                    </button>
                                </div>
                                
                                <button 
                                    onClick={() => onToggleColorSync(!isColorSynced)}
                                    className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg transition-colors ${isColorSynced ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isColorSynced ? <Icons.LinkOn size={14} /> : <Icons.LinkOff size={14} />}
                                        <span className="text-xs font-medium">Link to Stroke</span>
                                    </div>
                                    {isColorSynced && <span className="text-[10px] font-bold">ON</span>}
                                </button>
                            </div>
                        )}

                        {/* Palette - Single Line Fixed */}
                        {((!isEditingFill) || (isEditingFill && isFillEnabled)) && (
                            <>
                                {/* Flex container without wrapping, ensures all items stay on one line */}
                                <div className={`flex gap-2 justify-center items-center transition-opacity duration-200 ${isEditingFill && isColorSynced ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                                    
                                    {palette.map((color, index) => {
                                        const isActive = isEditingFill 
                                            ? activeSecondaryColorSlot === index 
                                            : activeColorSlot === index;
                                        
                                        return (
                                            <div key={index} className="relative group shrink-0">
                                                <button
                                                    onClick={() => {
                                                        onColorSlotChange(index, isEditingFill);
                                                        if (activeTool !== ToolType.BRUSH) {
                                                            onToolChange(ToolType.BRUSH);
                                                        }
                                                    }}
                                                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 transition-transform ${isActive ? 'border-[var(--text-color)]' : 'border-transparent hover:scale-105'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                                {isActive && (
                                                    <div className="absolute -bottom-2 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden hover:scale-110 transition-transform cursor-pointer z-10">
                                                        <input 
                                                            type="color" 
                                                            value={color}
                                                            onChange={(e) => onPaletteChange(index, e.target.value)}
                                                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                        />
                                                        <div className="w-2 h-2 rounded-full bg-gray-400 pointer-events-none" />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                    
                                    {/* Palette Next (Shuffle) - Moved inline */}
                                    <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" /> {/* Little separator */}
                                    <button
                                        onClick={() => onCyclePalette(1)}
                                        className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-black transition-colors shrink-0"
                                        title="Next Palette"
                                    >
                                        <Icons.Shuffle size={14} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Brush Tool */}
        <div className="relative">
            <button 
            className={btnClass(activeTool === ToolType.BRUSH)}
            onClick={() => {
                if (activeTool === ToolType.BRUSH) {
                    setShowSizePicker(!showSizePicker);
                    setShowColorPicker(false);
                    setShowEraserPicker(false);
                } else {
                    onToolChange(ToolType.BRUSH);
                    setShowSizePicker(false); 
                    setShowColorPicker(false);
                    setShowEraserPicker(false);
                }
            }}
            >
                <div className="relative">
                    <Icons.Brush size={20} />
                </div>
            </button>
             {showSizePicker && activeTool === ToolType.BRUSH && (
                <div className={`${popupClass} rounded-full p-3 px-4 flex-row items-center gap-3 w-auto`}>
                    {[2, 6, 12, 24, 40].map((size) => (
                        <button
                            key={size}
                            onClick={() => {
                                onSizeChange(size);
                                setShowSizePicker(false);
                            }}
                            className={`rounded-full bg-[var(--text-color)] transition-all hover:opacity-80 ${brushSize === size ? 'ring-2 ring-offset-1 ring-[var(--active-color)]' : ''}`}
                            style={{ width: size < 10 ? 8 : size < 20 ? 12 : size < 30 ? 16 : 20, height: size < 10 ? 8 : size < 20 ? 12 : size < 30 ? 16 : 20 }}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Eraser */}
        <div className="relative">
            <button 
            className={btnClass(activeTool === ToolType.ERASER)}
            onClick={() => {
                if (activeTool === ToolType.ERASER) {
                    setShowEraserPicker(!showEraserPicker);
                    setShowSizePicker(false);
                    setShowColorPicker(false);
                } else {
                    onToolChange(ToolType.ERASER);
                    setShowEraserPicker(false);
                    setShowSizePicker(false);
                    setShowColorPicker(false);
                }
            }}
            >
            <Icons.Eraser size={20} />
            </button>

             {showEraserPicker && activeTool === ToolType.ERASER && (
                <div className={`${popupClass} rounded-full p-2 px-4 flex-row gap-4 w-auto`}>
                    <div className="flex items-center gap-3">
                        {[10, 30, 50].map(size => (
                            <button
                                key={size}
                                onClick={() => {
                                    onEraserModeChange(EraserMode.STANDARD);
                                    onSizeChange(size);
                                    setShowEraserPicker(false);
                                }}
                                className={`rounded-full border border-gray-300 transition-all ${eraserMode === EraserMode.STANDARD && brushSize === size ? 'bg-[var(--active-color)] border-transparent' : 'bg-transparent hover:bg-gray-100'}`}
                                style={{ width: size < 20 ? 10 : size < 40 ? 14 : 18, height: size < 20 ? 10 : size < 40 ? 14 : 18 }}
                            />
                        ))}
                    </div>
                    <div className="w-px h-4 bg-gray-200" />
                    <button
                        onClick={() => {
                            onEraserModeChange(EraserMode.STROKE);
                            setShowEraserPicker(false);
                        }}
                        className={`p-1.5 rounded-full transition-all ${eraserMode === EraserMode.STROKE ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-50'}`}
                        title="Erase Whole Stroke"
                    >
                        <Icons.Trash size={16} />
                    </button>
                </div>
            )}
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-[var(--border-color)] mx-1" />

        {/* Reset Canvas */}
        <button 
          className={`${btnClass(false)} border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-500 ml-1`}
          onClick={onReset}
          title="Reset Canvas"
        >
          <Icons.X size={20} />
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-2 ml-1">
             <button 
                className={`${btnClass(false)} disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={onUndo}
                disabled={!canUndo}
            >
                <Icons.Undo size={18} />
            </button>
            <button 
                className={`${btnClass(false)} disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={onRedo}
                disabled={!canRedo}
            >
                <Icons.Redo size={18} />
            </button>
        </div>

        {/* Menu */}
        <button 
          className={`${btnClass(false)} ml-1 menu-toggle-btn`}
          onClick={onMenuToggle}
        >
          <Icons.Menu size={20} />
        </button>

    </div>
  );
};