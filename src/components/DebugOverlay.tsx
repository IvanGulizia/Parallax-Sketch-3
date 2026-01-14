
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { ShortcutConfig, ShortcutAction, KeyBinding, UITheme } from '../types';

interface DebugOverlayProps {
  onClose: () => void;
  config: ShortcutConfig;
  setConfig: (config: ShortcutConfig) => void;
  uiTheme: UITheme;
  setUITheme: (theme: UITheme) => void;
  currentMode: 'creation' | 'embed';
  presetPalettes?: string[][];
}

const CATEGORIES: Record<string, ShortcutAction[]> = {
    'Navigation': ['LAYER_NEXT', 'LAYER_PREV', 'FOCUS_NEXT', 'FOCUS_PREV', 'PREV_PALETTE', 'NEXT_PALETTE', 'RANDOM_LAYER'],
    'Colors': ['COLOR_1', 'COLOR_2', 'COLOR_3', 'COLOR_4', 'COLOR_5', 'COLOR_6', 'COLOR_7', 'RANDOM_COLOR'],
    'Canvas': ['PLAY_PAUSE', 'UNDO', 'REDO', 'RESET', 'TOGGLE_GYRO', 'LOCK_VIEW', 'RESET_VIEW', 'TOGGLE_GRID'],
    'System': ['EXPORT', 'TOGGLE_MENU', 'TOGGLE_DEBUG']
};

// Explicit order to ensure specific fields are visible and grouped
const ORDERED_THEME_KEYS: (keyof UITheme)[] = [
    'appBg', 'menuBg', 'toolBg', 
    'textColor', 'secondaryText', 'iconColor', 
    'activeColor', 'borderColor', 'buttonBg', 'buttonBorder',
    'sliderTrack', 'sliderFilled', 'sliderHandle', 
    'sidebarDot', 'visualGuides', 'sectionTitleColor', 'sliderValueColor',
    'scrollbarThumb', 'scrollbarTrack', 'disabledColor'
];

const PRESET_SHORTCUTS: Record<string, ShortcutConfig> = {
    'Desktop (Default)': {
        creation: {
            'UNDO': [{ key: 'z', meta: true }],
            'REDO': [{ key: 'z', meta: true, shift: true }],
            'PLAY_PAUSE': [{ key: ' ' }],
            'RESET': [{ key: 'r' }],
            'COLOR_1': [{ key: '1' }],
            'COLOR_2': [{ key: '2' }],
            'COLOR_3': [{ key: '3' }],
            'COLOR_4': [{ key: '4' }],
            'COLOR_5': [{ key: '5' }],
            'COLOR_6': [{ key: '6' }],
            'COLOR_7': [{ key: '7' }],
            'PREV_PALETTE': [{ key: 'a' }],
            'NEXT_PALETTE': [{ key: 'd' }],
            
            // Updated Presets to match new Defaults
            'LAYER_NEXT': [{ key: 'w' }], 
            'LAYER_PREV': [{ key: 's' }],
            'FOCUS_NEXT': [{ key: 'ArrowUp' }],
            'FOCUS_PREV': [{ key: 'ArrowDown' }],
            
            'TOGGLE_GYRO': [],
            'TOGGLE_MENU': [],
            'EXPORT': [{ key: 'e' }],
            'TOGGLE_DEBUG': [{ key: 'h' }],
            'LOCK_VIEW': [{ key: 'l' }],
            'RESET_VIEW': [{ key: 'k' }],
            'DOF_INC': [{ key: 'ArrowRight' }],
            'DOF_DEC': [{ key: 'ArrowLeft' }],
            'INVERT_PARALLAX': [{ key: 'i' }],
            'BLEND_MODE_NEXT': [{ key: 'o' }],
            'TOGGLE_GRID': [{ key: 'g' }], // Updated
            'SYMMETRY_NEXT': [{ key: 'f' }],
            'COLOR_SLOT_NEXT': [{ key: 'x' }],
            'COLOR_SLOT_PREV': [{ key: 'y' }],
            'RANDOM_LAYER': [{ key: '0' }], // New
            'RANDOM_COLOR': [{ key: '8' }] // New
        },
        embed: {
            'UNDO': [], 'REDO': [],
            'PLAY_PAUSE': [{ key: ' ' }],
            'RESET': [{ key: 'r' }],
            'COLOR_1': [{ key: '1' }], 'COLOR_2': [{ key: '2' }], 'COLOR_3': [{ key: '3' }],
            'COLOR_4': [{ key: '4' }], 'COLOR_5': [{ key: '5' }], 'COLOR_6': [{ key: '6' }],
            'COLOR_7': [{ key: '7' }],
            'PREV_PALETTE': [],
            'NEXT_PALETTE': [{ key: 'd' }, { key: 'ArrowRight' }],
            'LAYER_NEXT': [{ key: 'w' }, { key: 'ArrowUp' }],
            'LAYER_PREV': [{ key: 's' }, { key: 'ArrowDown' }],
            'FOCUS_NEXT': [], 'FOCUS_PREV': [],
            'TOGGLE_GYRO': [{ key: 'a' }, { key: 'ArrowLeft' }],
            'TOGGLE_MENU': [{ key: 'm' }],
            'EXPORT': [],
            'TOGGLE_DEBUG': [{ key: 'h' }],
            'LOCK_VIEW': [],
            'RESET_VIEW': [],
            'DOF_INC': [{ key: 'ArrowRight' }],
            'DOF_DEC': [{ key: 'ArrowLeft' }],
            'INVERT_PARALLAX': [{ key: 'i' }],
            'BLEND_MODE_NEXT': [{ key: 'o' }],
            'TOGGLE_GRID': [{ key: 'g' }], // Updated
            'SYMMETRY_NEXT': [{ key: 'f' }],
            'COLOR_SLOT_NEXT': [{ key: 'x' }],
            'COLOR_SLOT_PREV': [{ key: 'y' }],
            'RANDOM_LAYER': [],
            'RANDOM_COLOR': []
        }
    },
    'iPad / Tablet': {
         creation: {
            'UNDO': [{ key: 'z', meta: true }],
            'REDO': [{ key: 'z', meta: true, shift: true }],
            'PLAY_PAUSE': [{ key: ' ' }],
            'RESET': [{ key: 'r' }],
            'COLOR_1': [{ key: '1' }], 'COLOR_2': [{ key: '2' }], 'COLOR_3': [{ key: '3' }],
            'COLOR_4': [{ key: '4' }], 'COLOR_5': [{ key: '5' }], 'COLOR_6': [{ key: '6' }], 'COLOR_7': [{ key: '7' }],
            'PREV_PALETTE': [{ key: 'ArrowLeft' }],
            'NEXT_PALETTE': [{ key: 'ArrowRight' }],
            'LAYER_NEXT': [{ key: 'ArrowUp' }],
            'LAYER_PREV': [{ key: 'ArrowDown' }],
            'FOCUS_NEXT': [], 'FOCUS_PREV': [],
            'TOGGLE_GYRO': [{ key: 'g' }],
            'TOGGLE_MENU': [],
            'EXPORT': [{ key: 'e' }],
            'TOGGLE_DEBUG': [{ key: 'h' }],
            'LOCK_VIEW': [],
            'RESET_VIEW': [],
            'DOF_INC': [],
            'DOF_DEC': [],
            'INVERT_PARALLAX': [],
            'BLEND_MODE_NEXT': [],
            'TOGGLE_GRID': [],
            'SYMMETRY_NEXT': [],
            'COLOR_SLOT_NEXT': [],
            'COLOR_SLOT_PREV': [],
            'RANDOM_LAYER': [],
            'RANDOM_COLOR': []
        },
        embed: {
            'UNDO': [], 'REDO': [],
            'PLAY_PAUSE': [{ key: ' ' }],
            'RESET': [{ key: 'r' }],
            'COLOR_1': [], 'COLOR_2': [], 'COLOR_3': [], 'COLOR_4': [], 'COLOR_5': [], 'COLOR_6': [], 'COLOR_7': [],
            'PREV_PALETTE': [{ key: 'ArrowLeft' }],
            'NEXT_PALETTE': [{ key: 'ArrowRight' }],
            'LAYER_NEXT': [{ key: 'ArrowUp' }],
            'LAYER_PREV': [{ key: 'ArrowDown' }],
            'FOCUS_NEXT': [], 'FOCUS_PREV': [],
            'TOGGLE_GYRO': [{ key: 'g' }],
            'TOGGLE_MENU': [{ key: 'm' }],
            'EXPORT': [],
            'TOGGLE_DEBUG': [{ key: 'h' }],
            'LOCK_VIEW': [],
            'RESET_VIEW': [],
            'DOF_INC': [],
            'DOF_DEC': [],
            'INVERT_PARALLAX': [],
            'BLEND_MODE_NEXT': [],
            'TOGGLE_GRID': [],
            'SYMMETRY_NEXT': [],
            'COLOR_SLOT_NEXT': [],
            'COLOR_SLOT_PREV': [],
            'RANDOM_LAYER': [],
            'RANDOM_COLOR': []
        }
    }
};

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ onClose, config, setConfig, uiTheme, setUITheme, currentMode, presetPalettes }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'theme'>('theme');
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // --- Dragging Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- Shortcuts Logic ---
  const updateKeyBinding = (action: ShortcutAction, index: number, field: keyof KeyBinding, value: any) => {
      const mode = currentMode;
      const newConfig = { ...config };
      const bindings = [...newConfig[mode][action]];
      bindings[index] = { ...bindings[index], [field]: value };
      newConfig[mode][action] = bindings;
      setConfig(newConfig);
  };

  const addBinding = (action: ShortcutAction) => {
      const mode = currentMode;
      const newConfig = { ...config };
      newConfig[mode][action] = [...newConfig[mode][action], { key: '' }];
      setConfig(newConfig);
  };

  const removeBinding = (action: ShortcutAction, index: number) => {
      const mode = currentMode;
      const newConfig = { ...config };
      const bindings = [...newConfig[mode][action]];
      bindings.splice(index, 1);
      newConfig[mode][action] = bindings;
      setConfig(newConfig);
  };

  const applyPreset = (presetName: string) => {
      if (PRESET_SHORTCUTS[presetName]) {
          setConfig(PRESET_SHORTCUTS[presetName]);
      }
  };

  const exportShortcuts = () => {
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      alert("Shortcuts Configuration copied to clipboard!");
  };

  // --- Theme Logic ---
  const formatKeyName = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

  const exportTheme = () => {
      navigator.clipboard.writeText(JSON.stringify(uiTheme, null, 2));
      alert("Theme Configuration copied to clipboard!");
  };

  const copyPalette = (palette: string[]) => {
      navigator.clipboard.writeText(JSON.stringify(palette));
      alert("Palette copied!");
  };

  const exportAllPalettes = () => {
      if (presetPalettes) {
          navigator.clipboard.writeText(JSON.stringify(presetPalettes, null, 2));
          alert("All Preset Palettes copied!");
      }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
        <div 
            ref={windowRef}
            className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 pointer-events-auto flex flex-col w-[600px] max-h-[80vh] overflow-hidden"
            style={{ 
                left: position.x, 
                top: position.y,
                transform: 'translate3d(0,0,0)', // GPU assist
                touchAction: 'none'
            }}
        >
            {/* Header (Draggable) */}
            <div 
                onMouseDown={handleMouseDown}
                className={`flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            >
                <div className="flex items-center gap-2 select-none pointer-events-none">
                    <Icons.Bug size={18} className="text-gray-500" />
                    <h2 className="font-bold text-gray-700">Debug & Settings</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600">
                    <Icons.Close size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('theme')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'theme' ? 'bg-white text-[var(--active-color)] border-b-2 border-[var(--active-color)]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                    Theme & Colors
                </button>
                <button 
                    onClick={() => setActiveTab('shortcuts')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'shortcuts' ? 'bg-white text-[var(--active-color)] border-b-2 border-[var(--active-color)]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                    Shortcuts
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                
                {/* --- THEME TAB --- */}
                {activeTab === 'theme' && (
                    <div className="space-y-8">
                        {/* Theme Variables */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">UI Variables</h3>
                                <button onClick={exportTheme} className="text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200 text-gray-600 font-medium">
                                    Export Config
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {ORDERED_THEME_KEYS.map((key) => (
                                    <label key={key} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                                        <span className="text-xs font-medium text-gray-600">{formatKeyName(key)}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 font-mono">{uiTheme[key] || '#??????'}</span>
                                            <input 
                                                type="color" 
                                                value={uiTheme[key] || '#ffffff'} 
                                                onChange={(e) => setUITheme({ ...uiTheme, [key]: e.target.value })}
                                                className="w-6 h-6 rounded cursor-pointer border-none p-0 overflow-hidden"
                                            />
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Preset Palettes */}
                        {presetPalettes && (
                             <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Color Palettes</h3>
                                    <button onClick={exportAllPalettes} className="text-xs bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200 text-gray-600 font-medium">
                                        Export All
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    {presetPalettes.map((palette, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer group" onClick={() => copyPalette(palette)}>
                                             <div className="flex -space-x-2">
                                                 {palette.map((c, i) => (
                                                     <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                                                 ))}
                                             </div>
                                             <span className="text-[10px] text-gray-400 group-hover:text-blue-500">Copy</span>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>
                )}

                {/* --- SHORTCUTS TAB --- */}
                {activeTab === 'shortcuts' && (
                    <div className="space-y-6">
                         {/* Presets & Header */}
                         <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <div className="flex gap-2">
                                 {Object.keys(PRESET_SHORTCUTS).map(name => (
                                     <button 
                                        key={name}
                                        onClick={() => applyPreset(name)}
                                        className="text-xs px-2 py-1 bg-white border shadow-sm rounded hover:border-[var(--active-color)]"
                                     >
                                         {name}
                                     </button>
                                 ))}
                             </div>
                             <button onClick={exportShortcuts} className="text-xs bg-white px-3 py-1.5 rounded border shadow-sm hover:bg-gray-50 text-gray-600 font-medium">
                                Export JSON
                            </button>
                         </div>

                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mb-2 font-mono">
                            Editing Mode: <span className="font-bold uppercase">{currentMode}</span>
                        </div>

                        {/* Editor */}
                        <div className="space-y-8">
                            {Object.entries(CATEGORIES).map(([catName, actions]) => (
                                <div key={catName}>
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">{catName}</h5>
                                    <div className="space-y-2">
                                        {actions.map(action => {
                                            const bindings = config[currentMode][action] || [];
                                            
                                            return (
                                                <div key={action} className="py-2 border-b border-gray-50 last:border-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-gray-700 text-xs">{action.replace(/_/g, ' ')}</span>
                                                        <button onClick={() => addBinding(action)} className="text-[10px] text-blue-500 hover:underline">+ Add</button>
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        {bindings.map((binding, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <label className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer select-none ${binding.meta ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 text-gray-400'}`}>
                                                                    <input type="checkbox" checked={binding.meta || false} onChange={e => updateKeyBinding(action, idx, 'meta', e.target.checked)} className="hidden" />
                                                                    Cmd
                                                                </label>
                                                                <label className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer select-none ${binding.shift ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 text-gray-400'}`}>
                                                                    <input type="checkbox" checked={binding.shift || false} onChange={e => updateKeyBinding(action, idx, 'shift', e.target.checked)} className="hidden" />
                                                                    Shift
                                                                </label>
                                                                <input 
                                                                    type="text" 
                                                                    value={binding.key} 
                                                                    onKeyDown={(e) => e.stopPropagation()}
                                                                    onKeyUp={(e) => e.stopPropagation()}
                                                                    onChange={e => updateKeyBinding(action, idx, 'key', e.target.value)}
                                                                    className="w-20 text-xs p-1 border rounded text-center font-mono uppercase focus:border-blue-500 focus:outline-none"
                                                                    placeholder="Key"
                                                                />
                                                                <button onClick={() => removeBinding(action, idx)} className="text-gray-300 hover:text-red-500">
                                                                    <Icons.Close size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {bindings.length === 0 && <span className="text-[10px] text-gray-400 italic pl-1">No bindings</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
