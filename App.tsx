

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Toolbar } from './components/Toolbar';
import { LayerSlider } from './components/LayerSlider';
import { DrawingCanvas } from './components/DrawingCanvas';
import { MenuOverlay } from './components/MenuOverlay';
import { ToolType, AppState, Stroke, EraserMode, BlendMode, TrajectoryType, SymmetryMode, ShortcutConfig, ShortcutAction, KeyBinding, UITheme, MAX_LAYER_INDEX, MIN_LAYER_INDEX, DEFAULT_LAYER_INDEX, LAYER_COUNT } from './types';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import LZString from 'lz-string';
import { Icons } from './components/Icons';
import { DebugOverlay } from './components/DebugOverlay';

// Extended Harmonious Palettes (7 colors)
const PRESET_PALETTES = [
    ['#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8', '#FFDFD3', '#D6E2E9', '#F1E3D3'],
    ['#F4F1DE', '#E07A5F', '#3D405B', '#81B29A', '#F2CC8F', '#9F86C0', '#5E548E'],
    ['#CCD5AE', '#E9EDC9', '#FEFAE0', '#FAEDCD', '#D4A373', '#A3B18A', '#588157'],
    ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#2B9348', '#8338EC'],
    ['#4A4A4A', '#8C8C80', '#D8D4C5', '#EFEDE6', '#FDFCF8', '#2F3E46', '#CAD2C5'],
    ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'],
    ['#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc', '#d4d4d4', '#e2e2df', '#d2d2cf'],
    ['#003049', '#d62828', '#f77f00', '#fcbf49', '#eae2b7', '#669bbc', '#006d77'],
    ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25', '#a3b18a', '#588157'],
    ['#2b2d42', '#8d99ae', '#edf2f4', '#ef233c', '#d90429', '#023047', '#ffb703'],
    ['#fff100', '#ff8c00', '#e81123', '#ec008c', '#68217a', '#00188f', '#00bcf2'],
    ['#dad7cd', '#a3b18a', '#588157', '#3a5a40', '#344e41', '#3a0ca3', '#4361ee'],
    ['#000000', '#14213d', '#fca311', '#e5e5e5', '#ffffff', '#e0e1dd', '#778da9'],
    ['#cdb4db', '#ffc8dd', '#ffafcc', '#bde0fe', '#a2d2ff', '#8d99ae', '#2b2d42'],
    ['#7400b8', '#6930c3', '#5e60ce', '#5390d9', '#4ea8de', '#48bfe3', '#56cfe1'],
    ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557', '#457b9d', '#a8dadc'],
    ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057'],
    ['#ffe5ec', '#ffc2d1', '#ffb3c6', '#ff8fab', '#fb6f92', '#ff006e', '#8338ec'],
    ['#d8e2dc', '#ffe5d9', '#ffcad4', '#f4acb7', '#9d8189', '#f2e9e4', '#c9ada7'],
    ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48bfe3', '#90e0ef']
];

// Default Objects for 9 Layers
const DEFAULT_LAYER_BLEND_MODES: Record<number, BlendMode> = { 
    0: 'normal', 1: 'normal', 2: 'normal', 3: 'normal', 4: 'normal', 5: 'normal', 6: 'normal', 7: 'normal', 8: 'normal' 
};
const DEFAULT_LAYER_BLUR_STRENGTHS: Record<number, number> = { 
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 
};

// Helper Component for Shortcuts Overlay
const ShortcutsOverlay = ({ onClose, isEmbed }: { onClose: () => void, isEmbed: boolean }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
        <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Shortcuts</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icons.Close size={20} /></button>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span>Play / Pause</span>
                    <div className="flex gap-1"><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">Space</kbd></div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span>Select Color</span>
                    <div className="flex gap-1"><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">1</kbd>...<kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">7</kbd></div>
                </div>
                {!isEmbed && (
                    <>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span>Undo / Redo</span>
                            <div className="flex gap-1"><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">Cmd+Z</kbd> / <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">Cmd+Shift+Z</kbd></div>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span>Export JSON</span>
                            <div className="flex gap-1"><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">E</kbd></div>
                        </div>
                    </>
                )}
                {isEmbed && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span>Menu / Help</span>
                        <div className="flex gap-1"><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">M</kbd></div>
                    </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span>Pick Color</span>
                    <div className="flex gap-1"><span className="text-xs italic">Right Click</span></div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span>Prev / Next Palette</span>
                    <div className="flex gap-1"><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">A</kbd> / <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">D</kbd></div>
                </div>
                 <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span>Focus Layer</span>
                    <div className="flex gap-1"><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">W</kbd> / <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono text-xs">S</kbd></div>
                </div>
                 <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span>Active Layer</span>
                    <div className="flex gap-1"><Icons.ArrowUp size={12}/> / <Icons.ArrowDown size={12}/></div>
                </div>
                <div className="flex justify-between items-center">
                    <span>Depth of Field</span>
                    <div className="flex gap-1"><span className="text-xs italic">Shift + Scroll</span> {isEmbed && <span>or <span className="text-xs italic">Pinch</span></span>}</div>
                </div>
            </div>
        </div>
    </div>
);

// Define default shortcuts
const DEFAULT_SHORTCUTS: ShortcutConfig = {
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
        'LAYER_NEXT': [{ key: 'ArrowUp' }], // Front
        'LAYER_PREV': [{ key: 'ArrowDown' }], // Back
        'FOCUS_NEXT': [{ key: 's' }], // Front
        'FOCUS_PREV': [{ key: 'w' }], // Back
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
        'TOGGLE_GRID': [{ key: 'g' }],
        'SYMMETRY_NEXT': [{ key: 'f' }],
        'COLOR_SLOT_NEXT': [{ key: 'x' }],
        'COLOR_SLOT_PREV': [{ key: 'y' }],
        'RANDOM_LAYER': [{ key: '0' }],
        'RANDOM_COLOR': [{ key: '8' }]
    },
    embed: {
        'UNDO': [],
        'REDO': [],
        'PLAY_PAUSE': [{ key: ' ' }],
        'RESET': [{ key: 'r' }],
        'COLOR_1': [{ key: '1' }],
        'COLOR_2': [{ key: '2' }],
        'COLOR_3': [{ key: '3' }],
        'COLOR_4': [{ key: '4' }],
        'COLOR_5': [{ key: '5' }],
        'COLOR_6': [{ key: '6' }],
        'COLOR_7': [{ key: '7' }],
        'PREV_PALETTE': [],
        'NEXT_PALETTE': [{ key: 'd' }, { key: 'ArrowRight' }],
        'LAYER_NEXT': [{ key: 'ArrowUp' }],
        'LAYER_PREV': [{ key: 'ArrowDown' }],
        'FOCUS_NEXT': [{ key: 's' }],
        'FOCUS_PREV': [{ key: 'w' }],
        'TOGGLE_GYRO': [{ key: 'a' }, { key: 'ArrowLeft' }],
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
};

export default function App() {
  // Detect Mobile/iPad for default settings
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Initialize state with URL params immediately to prevent FOUC
  const [state, setState] = useState<AppState>(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    
    // Determine View Mode
    let initialMode: 'CREATION' | 'VIEW' | 'EMBED' = 'CREATION';
    if (modeParam === 'embed') initialMode = 'EMBED';
    else if (modeParam === 'view') initialMode = 'VIEW';

    // Parse Embed Styles immediately
    const isTransparent = params.get('bg') === 'transparent';
    const pRadius = params.get('borderRadius');
    const pBorderW = params.get('borderWidth');
    const pBorderC = params.get('borderColor');
    const pStrength = params.get('strength');
    const pBg = params.get('bg');

    return {
        viewMode: initialMode,
        activeTool: ToolType.BRUSH,
        activeLayer: DEFAULT_LAYER_INDEX, // Correctly set to Middle Layer
        brushSize: 10,
        eraserSize: 30,
        activeColorSlot: 0,
        activeSecondaryColorSlot: 1,
        activeBlendMode: 'normal',
        activeFillBlendMode: 'normal',
        isFillEnabled: false,
        isColorSynced: false, 
        isStrokeEnabled: true,
        palette: PRESET_PALETTES[0], 
        parallaxStrength: pStrength ? parseInt(pStrength) : 10, 
        parallaxInverted: false,
        springConfig: { stiffness: 0.2, damping: 0.2 }, 
        focalLayerIndex: DEFAULT_LAYER_INDEX, // Correctly set to Middle Layer
        isPlaying: initialMode !== 'CREATION', // Auto-play in view/embed
        useGyroscope: isMobile, 
        isLowPowerMode: true, 
        eraserMode: EraserMode.STROKE, 
        isMenuOpen: false,
        canvasBackgroundColor: isTransparent ? 'transparent' : (pBg ? '#' + pBg : '#FFFFFF'),
        canvasWidth: 100, 
        aspectRatio: null, 
        
        // Grid
        isGridEnabled: false,
        isSnappingEnabled: true,
        isParallaxSnappingEnabled: false,
        gridSize: 40,
        symmetryMode: SymmetryMode.NONE,
        
        // Visual
        isOnionSkinEnabled: true,
        blurStrength: 0,
        focusRange: 0,

        globalLayerBlendMode: 'normal',
        // Initialize with default 9-layer objects
        layerBlendModes: { ...DEFAULT_LAYER_BLEND_MODES },
        layerBlurStrengths: { ...DEFAULT_LAYER_BLUR_STRENGTHS },
        
        uiTheme: {
            appBg: "#f8f8f6",
            menuBg: "#f8f8f6",
            toolBg: "#FFFFFF",
            textColor: "#18284c",
            secondaryText: "#d5cdb4",
            iconColor: "#18284c",
            activeColor: "#18284c",
            borderColor: "#efeadc",
            buttonBg: "#FFFFFF",
            buttonBorder: "#efeadc",
            sliderTrack: "#efeadc",
            sliderFilled: "#d4ccb3",
            sliderHandle: "#18284c",
            sidebarDot: "#d4ccb3",
            visualGuides: "#d4ccb3",
            sectionTitleColor: "#d4ccb3",
            sliderValueColor: "#d4ccb3",
            scrollbarThumb: "#eeeadd",
            scrollbarTrack: "#efeadc",
            disabledColor: "#d4cdb7"
        },
        isEmbedMode: initialMode === 'EMBED', // Keep legacy compatibility
        isTransparentEmbed: isTransparent,
        embedStyle: {
            borderRadius: pRadius ? parseInt(pRadius) : 0,
            borderWidth: pBorderW ? parseInt(pBorderW) : 0,
            borderColor: pBorderC ? '#' + pBorderC : '#000000'
        },

        exportConfig: {
            isActive: false,
            isRecording: false,
            trajectory: TrajectoryType.FIGURE8,
            duration: 3,
            format: 'webm'
        },
        isDebugOpen: false
    };
  });

  const [shortcutConfig, setShortcutConfig] = useState<ShortcutConfig>(DEFAULT_SHORTCUTS);
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [showEmbedShortcuts, setShowEmbedShortcuts] = useState(false);
  const lastTap = useRef<number>(0);

  // New state for View Lock
  const [viewLockTrigger, setViewLockTrigger] = useState<{ type: 'LOCK' | 'RESET' | 'UNLOCK', ts: number } | undefined>(undefined);

  // Sync history with current strokes on load or undo/redo
  useEffect(() => {
      setCurrentStrokes(history[historyIndex]);
  }, [history, historyIndex]);

  // Request Gyro Permission helper
  const requestGyroPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
            const response = await (DeviceOrientationEvent as any).requestPermission();
            if (response === 'granted') {
                setState(s => ({ ...s, useGyroscope: true }));
                return true;
            }
        } catch (e) {
            console.error("Gyro permission error", e);
        }
        return false;
    }
    setState(s => ({ ...s, useGyroscope: !s.useGyroscope }));
    return true; 
  };

  // Apply UI Theme CSS Variables
  useEffect(() => {
      const root = document.documentElement;
      Object.entries(state.uiTheme).forEach(([key, val]) => {
          root.style.setProperty(`--${key.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, val as string);
      });
      const updateSpacing = () => {
          const isMobile = window.innerWidth < 768;
          root.style.setProperty('--spacing-x', isMobile ? '1rem' : '3rem');
      };
      window.addEventListener('resize', updateSpacing);
      updateSpacing();
      return () => window.removeEventListener('resize', updateSpacing);
  }, [state.uiTheme]);

  // Wheel handling
  useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
          if (e.shiftKey) {
              e.preventDefault();
              const sign = Math.sign(e.deltaY); 
              const delta = sign > 0 ? -1 : 1; 
              setState(s => ({ ...s, blurStrength: Math.max(0, Math.min(20, s.blurStrength + delta)) }));
              return;
          }
          if (state.viewMode !== 'CREATION') return;
          if ((e.target as HTMLElement).closest('.menu-overlay-container')) return;

          e.preventDefault();
          if (Math.abs(e.deltaY) > 10) {
              setState(s => {
                  const dir = e.deltaY > 0 ? -1 : 1;
                  // Corrected Limit to MAX_LAYER_INDEX (8)
                  const next = Math.max(MIN_LAYER_INDEX, Math.min(MAX_LAYER_INDEX, s.activeLayer + dir));
                  if (next === s.activeLayer) return s;
                  return { ...s, activeLayer: next };
              });
          }
      };
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => window.removeEventListener('wheel', handleWheel);
  }, [state.isMenuOpen, state.viewMode]);

  const loadData = (data: any, isTransparent: boolean) => {
      if (!data) return;
      if (data.s) {
          const reconstructedStrokes: Stroke[] = data.s.map((minStroke: any) => ({
              id: uuidv4(),
              points: minStroke.p.map((pt: number[]) => ({ x: pt[0], y: pt[1] })),
              colorSlot: minStroke.c,
              fillColorSlot: minStroke.fc,
              size: minStroke.s,
              tool: minStroke.t === 1 ? ToolType.ERASER : ToolType.BRUSH,
              layerId: minStroke.l,
              isEraser: minStroke.t === 1,
              blendMode: minStroke.bm || 'normal',
              fillBlendMode: minStroke.fbm || 'normal',
              isStrokeEnabled: true
          }));
          setHistory([reconstructedStrokes]);
          setHistoryIndex(0);
          if (data.c) {
              setState(s => ({
              ...s,
              palette: data.p || s.palette,
              parallaxStrength: data.c.ps ?? s.parallaxStrength,
              parallaxInverted: data.c.pi === 1,
              canvasWidth: data.c.cw ?? s.canvasWidth,
              focalLayerIndex: data.c.fl ?? s.focalLayerIndex,
              // Keep transparency override if set in state
              canvasBackgroundColor: isTransparent ? 'transparent' : (data.c.bg ?? s.canvasBackgroundColor),
              blurStrength: data.c.bs ?? s.blurStrength,
              focusRange: data.c.fr ?? s.focusRange,
              symmetryMode: data.c.sm ?? SymmetryMode.NONE
              }));
          }
      } 
      else if (data.strokes) {
          setHistory([data.strokes]);
          setHistoryIndex(0);
          setState(s => ({ 
              ...s, 
              ...data.config, 
              // Safe merge for Blend Modes and Blur Strengths to ensure 9 layers exist
              layerBlendModes: { ...DEFAULT_LAYER_BLEND_MODES, ...(data.config.layerBlendModes || {}) },
              layerBlurStrengths: { ...DEFAULT_LAYER_BLUR_STRENGTHS, ...(data.config.layerBlurStrengths || {}) },
              
              // Ensure canvasBackgroundColor is loaded correctly from either key
              canvasBackgroundColor: isTransparent ? 'transparent' : (data.config.canvasBackgroundColor || data.config.backgroundColor || s.canvasBackgroundColor),
              palette: data.palette || s.palette 
          }));
      }
  };

  const handleCyclePalette = (direction: -1 | 1) => {
     const currentIndex = PRESET_PALETTES.indexOf(state.palette);
     let nextIndex = 0;
     if (currentIndex !== -1) {
         nextIndex = (currentIndex + direction + PRESET_PALETTES.length) % PRESET_PALETTES.length;
     }
     setState(s => ({ ...s, palette: PRESET_PALETTES[nextIndex] }));
  };
  
  const handleExport = () => {
      const filename = window.prompt("Enter filename for export:", "zen-sketch");
      if (filename === null) return; // User cancelled
      
      const safeFilename = filename.trim() || "zen-sketch";
      const data = JSON.stringify({ 
        version: 7,
        palette: state.palette,
        strokes: currentStrokes,
        config: {
            parallaxStrength: state.parallaxStrength,
            parallaxInverted: state.parallaxInverted,
            focalLayerIndex: state.focalLayerIndex,
            springConfig: state.springConfig,
            backgroundColor: state.canvasBackgroundColor,
            globalLayerBlendMode: state.globalLayerBlendMode,
            canvasWidth: state.canvasWidth,
            layerBlendModes: state.layerBlendModes,
            layerBlurStrengths: state.layerBlurStrengths,
            blurStrength: state.blurStrength,
            focusRange: state.focusRange,
            symmetryMode: state.symmetryMode
        }
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFilename}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          try {
              const target = ev.target as FileReader;
              if (target?.result && typeof target.result === 'string') {
                  const data = JSON.parse(target.result as string);
                  loadData(data, state.isTransparentEmbed);
              }
          } catch (err) {
              console.error("Failed to parse JSON", err);
              alert("Invalid JSON file");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleLayerSwap = (fromLayer: number, toLayer: number) => {
      if (fromLayer === toLayer) return;

      // Swap Strokes
      const newStrokes = currentStrokes.map(s => {
          if (s.layerId === fromLayer) return { ...s, layerId: toLayer };
          if (s.layerId === toLayer) return { ...s, layerId: fromLayer };
          return s;
      });
      handleStrokeCommit(newStrokes);

      // Swap Metadata (Blend Modes & Blur)
      const swap = (record: Record<number, any>) => {
          const newRecord = { ...record };
          const temp = newRecord[toLayer];
          newRecord[toLayer] = newRecord[fromLayer];
          newRecord[fromLayer] = temp;
          return newRecord;
      };

      setState(prev => ({
          ...prev,
          activeLayer: toLayer, // Move selection to the dropped location
          layerBlendModes: swap(prev.layerBlendModes),
          layerBlurStrengths: swap(prev.layerBlurStrengths)
      }));
  };

  // Color Pick with Sync Fix
  const handleColorPick = (slotIndex: number) => {
      setState(s => ({ 
          ...s, 
          activeColorSlot: slotIndex, 
          // If synced, update secondary too. If not, leave it alone.
          activeSecondaryColorSlot: s.isColorSynced ? slotIndex : s.activeSecondaryColorSlot,
          activeTool: ToolType.BRUSH 
      }));
  };

  // --- Input Handling Refactor ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const mode = state.viewMode === 'CREATION' ? 'creation' : 'embed';
          const bindings = shortcutConfig[mode];
          
          let action: ShortcutAction | null = null;

          // Find matching action
          for (const [act, keys] of Object.entries(bindings)) {
              for (const binding of (keys as KeyBinding[])) {
                  if (binding.key.toLowerCase() === e.key.toLowerCase()) {
                      // Check modifiers
                      const metaMatch = !!binding.meta === (e.metaKey || e.ctrlKey);
                      const shiftMatch = !!binding.shift === e.shiftKey;
                      if (metaMatch && shiftMatch) {
                          action = act as ShortcutAction;
                          break;
                      }
                  }
              }
              if (action) break;
          }

          if (action) {
              // Only prevent default if it's not a modifier-only press
              if (!['Control', 'Shift', 'Meta', 'Alt'].includes(e.key)) {
                  // Don't prevent default for refresh (Cmd+R) unless we map it specifically
                  if (action !== 'RESET' || !e.metaKey) {
                      e.preventDefault(); 
                  }
              }

              switch (action) {
                  case 'PLAY_PAUSE': handleTogglePlay(); break;
                  case 'UNDO': handleUndo(); break;
                  case 'REDO': handleRedo(); break;
                  case 'RESET': handleReset(); break;
                  case 'EXPORT': handleExport(); break;
                  case 'TOGGLE_MENU': setShowEmbedShortcuts(prev => !prev); break;
                  case 'TOGGLE_DEBUG': setState(s => ({ ...s, isDebugOpen: !s.isDebugOpen })); break;
                  case 'TOGGLE_GYRO': setState(s => ({ ...s, useGyroscope: !s.useGyroscope })); break;
                  
                  case 'PREV_PALETTE': handleCyclePalette(-1); break;
                  case 'NEXT_PALETTE': handleCyclePalette(1); break;
                  
                  // Corrected Limit to MAX_LAYER_INDEX (8)
                  case 'LAYER_NEXT': setState(s => ({ ...s, activeLayer: Math.min(MAX_LAYER_INDEX, s.activeLayer + 1) })); break;
                  case 'LAYER_PREV': setState(s => ({ ...s, activeLayer: Math.max(MIN_LAYER_INDEX, s.activeLayer - 1) })); break;
                  
                  // Corrected Limit to MAX_LAYER_INDEX (8)
                  case 'FOCUS_NEXT': setState(s => ({ ...s, focalLayerIndex: Math.min(MAX_LAYER_INDEX, s.focalLayerIndex + 1) })); break;
                  case 'FOCUS_PREV': setState(s => ({ ...s, focalLayerIndex: Math.max(MIN_LAYER_INDEX, s.focalLayerIndex - 1) })); break;
                  
                  case 'COLOR_1': handleColorPick(0); break;
                  case 'COLOR_2': handleColorPick(1); break;
                  case 'COLOR_3': handleColorPick(2); break;
                  case 'COLOR_4': handleColorPick(3); break;
                  case 'COLOR_5': handleColorPick(4); break;
                  case 'COLOR_6': handleColorPick(5); break;
                  case 'COLOR_7': handleColorPick(6); break;

                  case 'LOCK_VIEW': setViewLockTrigger({ type: 'LOCK', ts: Date.now() }); break;
                  case 'RESET_VIEW': setViewLockTrigger({ type: 'RESET', ts: Date.now() }); break;
                  case 'DOF_INC': setState(s => ({ ...s, blurStrength: Math.min(20, s.blurStrength + 1) })); break;
                  case 'DOF_DEC': setState(s => ({ ...s, blurStrength: Math.max(0, s.blurStrength - 1) })); break;
                  case 'INVERT_PARALLAX': setState(s => ({ ...s, parallaxInverted: !s.parallaxInverted })); break;
                  case 'BLEND_MODE_NEXT': {
                      const modes: BlendMode[] = ['normal', 'multiply', 'overlay', 'difference'];
                      setState(s => {
                          const idx = modes.indexOf(s.activeBlendMode);
                          return { ...s, activeBlendMode: modes[(idx + 1) % modes.length] };
                      });
                      break;
                  }
                  case 'TOGGLE_GRID': setState(s => ({ ...s, isGridEnabled: !s.isGridEnabled })); break;
                  case 'SYMMETRY_NEXT': {
                      const modes = [SymmetryMode.NONE, SymmetryMode.HORIZONTAL, SymmetryMode.VERTICAL, SymmetryMode.QUAD, SymmetryMode.CENTRAL];
                      setState(s => {
                          const idx = modes.indexOf(s.symmetryMode);
                          return { ...s, symmetryMode: modes[(idx + 1) % modes.length] };
                      });
                      break;
                  }
                  case 'COLOR_SLOT_NEXT': {
                       setState(s => {
                           const next = (s.activeColorSlot + 1) % 7;
                           return { ...s, activeColorSlot: next, activeSecondaryColorSlot: s.isColorSynced ? next : s.activeSecondaryColorSlot };
                       });
                       break;
                  }
                  case 'COLOR_SLOT_PREV': {
                       setState(s => {
                           const prev = (s.activeColorSlot - 1 + 7) % 7;
                           return { ...s, activeColorSlot: prev, activeSecondaryColorSlot: s.isColorSynced ? prev : s.activeSecondaryColorSlot };
                       });
                       break;
                  }
                  // Corrected Random Range to 9
                  case 'RANDOM_LAYER': setState(s => ({ ...s, activeLayer: Math.floor(Math.random() * LAYER_COUNT) })); break;
                  case 'RANDOM_COLOR': {
                       const slot = Math.floor(Math.random() * 7);
                       handleColorPick(slot);
                       break;
                  }
              }
          }
      };

      // ... Touch handlers (existing)
      let touchStartX = 0;
      let touchStartY = 0;
      const handleTouchStart = (e: TouchEvent) => {
          if (state.viewMode !== 'CREATION' && e.touches.length === 1) {
              touchStartX = e.touches[0].clientX;
              touchStartY = e.touches[0].clientY;
          }
      };
      const handleTouchEnd = (e: TouchEvent) => {
          if (state.viewMode !== 'CREATION' && e.changedTouches.length === 1) {
             const dx = e.changedTouches[0].clientX - touchStartX;
             if (Math.abs(dx) > 100) {
                 if (dx > 0) handleCyclePalette(1); // Swipe Right
             }
             // Double tap logic
             const now = Date.now();
             if (now - lastTap.current < 300) requestGyroPermission();
             lastTap.current = now;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchend', handleTouchEnd);
      };
  }, [state, shortcutConfig]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // --- LOAD FROM SUPABASE SHARE ID ---
    const sharedId = params.get('id');
    if (sharedId) {
        // Fetch the drawing from our Serverless Function
        fetch(`/api/get-drawing?id=${sharedId}`)
            .then(res => {
                if (!res.ok) throw new Error("Drawing not found");
                return res.json();
            })
            .then(data => {
                const isEmbed = params.get('mode') === 'embed';
                loadData(data, isEmbed && params.get('bg') === 'transparent');
                if (isEmbed) {
                    setState(s => ({ ...s, viewMode: 'EMBED', isPlaying: true }));
                }
            })
            .catch(err => console.error("Failed to load shared drawing", err));
    }

    // Existing Embed Logic
    if (params.get('mode') === 'embed' && !sharedId) {
        const isTransparent = params.get('bg') === 'transparent';
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // Load params...
        const pRadius = params.get('borderRadius');
        const pBorderW = params.get('borderWidth');
        const pBorderC = params.get('borderColor');

        setState(s => ({
            ...s,
            viewMode: 'EMBED',
            isTransparentEmbed: isTransparent,
            isPlaying: true,
            // ... (other params same as before)
            parallaxStrength: parseInt(params.get('strength') || '50'),
            canvasBackgroundColor: isTransparent ? 'transparent' : (params.get('bg') ? '#' + params.get('bg') : '#FFFFFF'),
            useGyroscope: isMobileDevice,
            embedStyle: {
                borderRadius: pRadius ? parseInt(pRadius) : 0,
                borderWidth: pBorderW ? parseInt(pBorderW) : 0,
                borderColor: pBorderC ? '#' + pBorderC : '#000000'
            }
        }));

        const externalUrl = params.get('url');
        if (externalUrl) {
            const decodedUrl = decodeURIComponent(externalUrl);
            fetch(decodedUrl)
                .then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); })
                .then(data => loadData(data, isTransparent))
                .catch(err => console.error("Ext error", err));
        }
    }
  }, []);

  const handleStrokesChange = useCallback((newStrokes: Stroke[]) => {
    setCurrentStrokes(newStrokes);
  }, []);

  const handleStrokeCommit = useCallback((finalStrokes: Stroke[]) => {
      const safeStrokes = JSON.parse(JSON.stringify(finalStrokes));
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(safeStrokes);
      if (newHistory.length > 20) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentStrokes(safeStrokes);
  }, [history, historyIndex]);

  const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(historyIndex - 1); };
  const handleRedo = () => { if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1); };
  const handleReset = () => { handleStrokeCommit([]); };
  
  const handleTogglePlay = async () => {
    if (isMobile && !state.isPlaying && state.useGyroscope) await requestGyroPermission();
    
    // Reset view lock if we are starting to play
    if (!state.isPlaying) {
        setViewLockTrigger({ type: 'RESET', ts: Date.now() });
    }

    setState(s => ({ ...s, isPlaying: !s.isPlaying }));
  };

  const getEncodedState = useCallback(() => {
     return JSON.stringify({ 
        version: 7,
        palette: state.palette,
        strokes: currentStrokes,
        config: {
            parallaxStrength: state.parallaxStrength,
            parallaxInverted: state.parallaxInverted,
            focalLayerIndex: state.focalLayerIndex,
            springConfig: state.springConfig,
            backgroundColor: state.canvasBackgroundColor,
            canvasBackgroundColor: state.canvasBackgroundColor, // Added for consistency
            globalLayerBlendMode: state.globalLayerBlendMode,
            canvasWidth: state.canvasWidth,
            layerBlendModes: state.layerBlendModes,
            layerBlurStrengths: state.layerBlurStrengths,
            blurStrength: state.blurStrength,
            focusRange: state.focusRange,
            symmetryMode: state.symmetryMode
        }
    }); 
  }, [currentStrokes, state]);

  // Styling Logic for Container
  const getContainerStyle = () => {
      // EMBED MODE: Fill the container, apply internal styling
      if (state.viewMode === 'EMBED') {
          const style: React.CSSProperties = {
              width: '100%', 
              height: '100%',
              overflow: 'hidden', // Clip content for border radius
          };
          if (state.embedStyle) {
              if (state.embedStyle.borderRadius > 0) style.borderRadius = `${state.embedStyle.borderRadius}px`;
              if (state.embedStyle.borderWidth > 0) {
                  style.border = `${state.embedStyle.borderWidth}px solid ${state.embedStyle.borderColor}`;
                  style.boxSizing = 'border-box';
              }
          }
          return style;
      }
      
      // CREATION & VIEW MODES: Respect the canvasWidth setting
      // View Mode removes UI but keeps the "frame" aspect.
      const baseStyle: React.CSSProperties = {};
      if (state.aspectRatio === 1) {
          baseStyle.height = '85vh';
          baseStyle.aspectRatio = '1/1';
          baseStyle.width = 'auto'; // Width driven by height + aspect ratio
          baseStyle.maxWidth = '100%'; // Ensure it doesn't overflow on mobile
      } else {
          baseStyle.width = `calc(${state.canvasWidth / 100} * (100vw - (6 * var(--spacing-x))))`;
          baseStyle.height = '85vh';
      }
      return baseStyle;
  };

  const isCreationMode = state.viewMode === 'CREATION';
  const isEmbedOrView = state.viewMode !== 'CREATION';

  return (
    <main 
        className={`relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-300 ${state.isTransparentEmbed ? '' : (isCreationMode ? 'bg-[var(--menu-bg)]' : 'bg-white')}`}
        style={{ 
            // In View Mode, we typically want a clean background (e.g., white or appBg) unless specified otherwise.
            // In Embed Mode, transparency is often desired.
            backgroundColor: state.isTransparentEmbed ? 'transparent' : (isCreationMode ? undefined : state.uiTheme.appBg)
        }}
    >
      {state.isDebugOpen && (
          <DebugOverlay 
            onClose={() => setState(s => ({ ...s, isDebugOpen: false }))} 
            config={shortcutConfig}
            setConfig={setShortcutConfig}
            uiTheme={state.uiTheme}
            setUITheme={(theme) => setState(s => ({ ...s, uiTheme: theme }))}
            currentMode={isEmbedOrView ? 'embed' : 'creation'}
            presetPalettes={PRESET_PALETTES} // Pass presets
          />
      )}

      {isEmbedOrView && showEmbedShortcuts && (
          <ShortcutsOverlay onClose={() => setShowEmbedShortcuts(false)} isEmbed={true} />
      )}

      {isCreationMode && (
        <div className="absolute top-0 left-0 w-full h-[7.5vh] flex items-center justify-center z-50">
            <Toolbar 
                activeTool={state.activeTool}
                isPlaying={state.isPlaying}
                activeColorSlot={state.activeColorSlot}
                activeSecondaryColorSlot={state.activeSecondaryColorSlot}
                activeBlendMode={state.activeBlendMode}
                activeFillBlendMode={state.activeFillBlendMode}
                isFillEnabled={state.isFillEnabled}
                isColorSynced={state.isColorSynced}
                isStrokeEnabled={true}
                palette={state.palette}
                // Pass correct decoupled size
                brushSize={state.activeTool === ToolType.ERASER ? state.eraserSize : state.brushSize}
                eraserMode={state.eraserMode}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                isEmbedMode={isEmbedOrView}
                onTogglePlay={handleTogglePlay}
                onToolChange={(tool) => setState(s => ({ ...s, activeTool: tool }))}
                onColorSlotChange={(index, isSecondary) => {
                    if (isSecondary) setState(s => ({ ...s, activeSecondaryColorSlot: index }));
                    else handleColorPick(index);
                }}
                onPaletteChange={(idx, col) => {
                    const newP = [...state.palette];
                    newP[idx] = col;
                    setState(s => ({...s, palette: newP}));
                }}
                onCyclePalette={handleCyclePalette}
                onBlendModeChange={(mode, isFill) => {
                    if (isFill) setState(s => ({ ...s, activeFillBlendMode: mode }));
                    else setState(s => ({ ...s, activeBlendMode: mode }));
                }}
                onToggleFill={(enabled) => setState(s => ({ ...s, isFillEnabled: enabled }))}
                onToggleColorSync={(enabled) => {
                    if (enabled) setState(s => ({ ...s, isColorSynced: true, activeSecondaryColorSlot: s.activeColorSlot }));
                    else setState(s => ({ ...s, isColorSynced: false }));
                }}
                onToggleStroke={() => {}} 
                // Decoupled size change handler
                onSizeChange={(size) => {
                    setState(s => ({
                        ...s,
                        brushSize: s.activeTool === ToolType.BRUSH ? size : s.brushSize,
                        eraserSize: s.activeTool === ToolType.ERASER ? size : s.eraserSize
                    }))
                }}
                onEraserModeChange={(mode) => setState(s => ({ ...s, eraserMode: mode }))}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onReset={handleReset}
                onMenuToggle={() => setState(s => ({ ...s, isMenuOpen: !s.isMenuOpen }))}
            />
        </div>
      )}

      <div className={`w-full flex flex-col items-center justify-center pb-0 scroll-layer-area ${state.viewMode === 'EMBED' ? 'p-0 pb-0 h-full' : ''}`}>
        <div 
            className={`relative transition-all duration-300 ease-in-out`}
            style={getContainerStyle()}
        >
            <div className={`w-full h-full overflow-hidden ${state.viewMode === 'EMBED' ? '' : 'rounded-3xl border border-[var(--border-color)]'}`}
                 style={state.viewMode === 'EMBED' ? { borderRadius: 'inherit' } : {}}
            >
                <DrawingCanvas 
                    // Props passed...
                    activeTool={state.activeTool}
                    activeLayer={state.activeLayer}
                    // Pass correct decoupled size
                    brushSize={state.activeTool === ToolType.ERASER ? state.eraserSize : state.brushSize}
                    activeColorSlot={state.activeColorSlot}
                    activeSecondaryColorSlot={state.activeSecondaryColorSlot}
                    activeBlendMode={state.activeBlendMode}
                    activeFillBlendMode={state.activeFillBlendMode}
                    isFillEnabled={state.isFillEnabled}
                    isStrokeEnabled={true}
                    palette={state.palette}
                    parallaxStrength={state.parallaxStrength}
                    parallaxInverted={state.parallaxInverted}
                    springConfig={state.springConfig}
                    focalLayerIndex={state.focalLayerIndex}
                    isPlaying={state.isPlaying}
                    eraserMode={state.eraserMode}
                    backgroundColor={state.canvasBackgroundColor}
                    globalLayerBlendMode={state.globalLayerBlendMode}
                    layerBlendModes={state.layerBlendModes}
                    isGridEnabled={state.isGridEnabled}
                    isSnappingEnabled={state.isSnappingEnabled}
                    isParallaxSnappingEnabled={state.isParallaxSnappingEnabled} // Added Prop
                    gridSize={state.gridSize}
                    symmetryMode={state.symmetryMode}
                    useGyroscope={state.useGyroscope}
                    isLowPowerMode={state.isLowPowerMode}
                    isOnionSkinEnabled={state.isOnionSkinEnabled}
                    blurStrength={state.blurStrength}
                    focusRange={state.focusRange}
                    onStrokesChange={handleStrokesChange}
                    onStrokeCommit={handleStrokeCommit}
                    strokes={currentStrokes}
                    exportConfig={state.exportConfig}
                    onExportComplete={() => setState(s => ({ ...s, exportConfig: { ...s.exportConfig, isRecording: false } }))}
                    onStopPreview={() => setState(s => ({ ...s, exportConfig: { ...s.exportConfig, isActive: false, isRecording: false } }))}
                    onColorPick={handleColorPick}
                    isEmbedMode={isEmbedOrView}
                    isMobile={isMobile}
                    onEmbedContextMenu={() => setShowEmbedShortcuts(true)}
                    layerBlurStrengths={state.layerBlurStrengths}
                    guideColor={state.uiTheme.visualGuides} // Passed new color prop
                    viewLockTrigger={viewLockTrigger}
                />
            </div>
            
            {isCreationMode && (
                <div 
                    className="absolute top-0 bottom-0 hidden md:block"
                    style={{ left: '100%', marginLeft: 'var(--spacing-x)', width: 'var(--spacing-x)' }}
                >
                     <LayerSlider 
                        activeLayer={state.activeLayer}
                        onChange={(layer) => setState(s => ({ ...s, activeLayer: layer }))}
                        onSwap={handleLayerSwap}
                    />
                </div>
            )}

            <MenuOverlay 
                // Props passed...
                isOpen={state.isMenuOpen} 
                parallaxStrength={state.parallaxStrength}
                parallaxInverted={state.parallaxInverted}
                focalLayerIndex={state.focalLayerIndex}
                springConfig={state.springConfig}
                backgroundColor={state.canvasBackgroundColor}
                canvasWidth={state.canvasWidth}
                globalLayerBlendMode={state.globalLayerBlendMode}
                activeLayer={state.activeLayer}
                layerBlendModes={state.layerBlendModes}
                layerBlurStrengths={state.layerBlurStrengths}
                aspectRatio={state.aspectRatio}
                uiTheme={state.uiTheme}
                isGridEnabled={state.isGridEnabled}
                isSnappingEnabled={state.isSnappingEnabled}
                gridSize={state.gridSize}
                symmetryMode={state.symmetryMode}
                useGyroscope={state.useGyroscope}
                isLowPowerMode={state.isLowPowerMode}
                isOnionSkinEnabled={state.isOnionSkinEnabled}
                blurStrength={state.blurStrength}
                focusRange={state.focusRange}
                exportConfig={state.exportConfig}
                getEncodedState={getEncodedState}
                onClose={() => setState(s => ({ ...s, isMenuOpen: false }))}
                onImport={handleImport}
                onExport={handleExport}
                onReset={handleReset}
                onParallaxStrengthChange={(val) => setState(s => ({ ...s, parallaxStrength: val }))}
                onParallaxInvertedChange={(val) => setState(s => ({ ...s, parallaxInverted: val }))}
                onFocalLayerChange={(idx) => setState(s => ({ ...s, focalLayerIndex: idx }))}
                onSpringConfigChange={(config) => setState(s => ({ ...s, springConfig: config }))}
                onBackgroundColorChange={(c) => setState(s => ({ ...s, canvasBackgroundColor: c }))}
                onCanvasWidthChange={(w) => setState(s => ({ ...s, canvasWidth: w }))}
                onAspectRatioChange={(r) => setState(s => ({ ...s, aspectRatio: r }))}
                onGlobalLayerBlendModeChange={(mode) => setState(s => ({ ...s, globalLayerBlendMode: mode }))}
                onLayerBlendModeChange={(layerId, mode) => setState(s => ({ ...s, layerBlendModes: { ...s.layerBlendModes, [layerId]: mode } }))}
                onLayerBlurChange={(layerId, val) => setState(s => ({ ...s, layerBlurStrengths: { ...s.layerBlurStrengths, [layerId]: val } }))}
                onUIThemeChange={(theme) => setState(s => ({ ...s, uiTheme: theme }))}
                onGridEnabledChange={(val) => setState(s => ({ ...s, isGridEnabled: val }))}
                onSnappingEnabledChange={(val) => setState(s => ({ ...s, isSnappingEnabled: val }))}
                onGridSizeChange={(val) => setState(s => ({ ...s, gridSize: val }))}
                onSymmetryModeChange={(val) => setState(s => ({ ...s, symmetryMode: val }))}
                onUseGyroscopeChange={(val) => setState(s => ({ ...s, useGyroscope: val }))}
                onLowPowerModeChange={(val) => setState(s => ({ ...s, isLowPowerMode: val }))}
                onOnionSkinEnabledChange={(val) => setState(s => ({ ...s, isOnionSkinEnabled: val }))}
                onBlurStrengthChange={(val) => setState(s => ({ ...s, blurStrength: val }))}
                onFocusRangeChange={(val) => setState(s => ({ ...s, focusRange: val }))}
                onExportConfigChange={(config) => setState(s => ({ ...s, exportConfig: config }))}
            />
        </div>
      </div>
    </main>
  );
}