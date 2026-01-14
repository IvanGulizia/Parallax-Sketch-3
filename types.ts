

export enum ToolType {
  BRUSH = 'BRUSH',
  ERASER = 'ERASER',
  SELECT = 'SELECT',
}

// --- CONSTANTS ---
export const LAYER_COUNT = 9;
export const MAX_LAYER_INDEX = 8;
export const MIN_LAYER_INDEX = 0;
export const DEFAULT_LAYER_INDEX = 4; // Middle of 0-8

export enum EraserMode {
  STANDARD = 'STANDARD',
  STROKE = 'STROKE' // Erase whole stroke
}

export enum SymmetryMode {
  NONE = 'NONE',
  HORIZONTAL = 'HORIZONTAL', // Mirror Left/Right
  VERTICAL = 'VERTICAL',     // Mirror Top/Bottom
  QUAD = 'QUAD',             // Mirror Both
  CENTRAL = 'CENTRAL'        // Point Reflection (Inverted)
}

export type ViewMode = 'CREATION' | 'VIEW' | 'EMBED';

export interface Point {
  x: number;
  y: number;
}

export type BlendMode = 'normal' | 'multiply' | 'overlay' | 'difference';

export interface Stroke {
  id: string;
  points: Point[];
  colorSlot: number; // Reference to the palette index (0-4)
  fillColorSlot?: number; // If undefined, no fill
  size: number;
  tool: ToolType; 
  layerId: number;
  isEraser?: boolean;
  blendMode?: BlendMode;
  fillBlendMode?: BlendMode;
  isStrokeEnabled?: boolean; // Kept for compatibility, but logic will enforce true mostly
}

export interface SpringConfig {
  stiffness: number; // 0.01 to 1.0
  damping: number;   // 0.1 to 0.99
}

export interface UITheme {
  activeColor: string;
  toolBg: string; // The toolbar bubbles
  menuBg: string; // The settings menu background
  appBg: string; // The main backdrop
  buttonBg: string; // New: Standard button background
  textColor: string;
  secondaryText: string; // Less prominent text
  borderColor: string;
  buttonBorder: string;
  iconColor: string;
  sliderTrack: string; // The empty part of the track
  sliderFilled: string; // New: The filled part of the track
  sliderHandle: string; // The knob
  disabledColor: string;
  scrollbarThumb: string;
  scrollbarTrack: string; 
  sidebarDot: string; // New: Specific color for sidebar dots
  visualGuides: string; // New: Specific color for grid and symmetry lines
  sectionTitleColor: string; // New: Color for menu section titles
  sliderValueColor: string; // New: Color for text next to sliders
}

export enum TrajectoryType {
  CIRCLE = 'CIRCLE',
  FIGURE8 = 'FIGURE8',
  SWAY_H = 'SWAY_H',
  SWAY_V = 'SWAY_V'
}

export type ExportFormat = 'webm' | 'mp4';

export interface ExportConfig {
  isActive: boolean; // Is previewing or recording
  isRecording: boolean;
  trajectory: TrajectoryType;
  duration: number; // seconds
  format: ExportFormat;
}

export interface EmbedStyle {
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}

// Shortcut System Types
export type ShortcutAction = 
  | 'UNDO' | 'REDO' | 'PLAY_PAUSE' | 'RESET'
  | 'COLOR_1' | 'COLOR_2' | 'COLOR_3' | 'COLOR_4' | 'COLOR_5' | 'COLOR_6' | 'COLOR_7'
  | 'PREV_PALETTE' | 'NEXT_PALETTE'
  | 'LAYER_NEXT' | 'LAYER_PREV' // Active Layer
  | 'FOCUS_NEXT' | 'FOCUS_PREV' // Focal Layer
  | 'TOGGLE_GYRO' | 'TOGGLE_MENU' | 'EXPORT' | 'TOGGLE_DEBUG'
  | 'LOCK_VIEW' | 'RESET_VIEW'
  | 'DOF_INC' | 'DOF_DEC' // Depth of Field
  | 'INVERT_PARALLAX'
  | 'BLEND_MODE_NEXT'
  | 'TOGGLE_GRID'
  | 'SYMMETRY_NEXT'
  | 'COLOR_SLOT_NEXT' | 'COLOR_SLOT_PREV'
  | 'RANDOM_LAYER' | 'RANDOM_COLOR'; // Added Random Actions

export interface KeyBinding {
  key: string;
  meta?: boolean; // Cmd/Ctrl
  shift?: boolean;
}

export interface ShortcutConfig {
  creation: Record<ShortcutAction, KeyBinding[]>;
  embed: Record<ShortcutAction, KeyBinding[]>;
}

export interface AppState {
  viewMode: ViewMode;
  activeTool: ToolType;
  activeLayer: number; // 0 to 8
  brushSize: number;
  eraserSize: number; // New: Decoupled eraser size
  activeColorSlot: number; // 0 to 6
  activeSecondaryColorSlot: number; // 0 to 6 (Fill color)
  activeBlendMode: BlendMode;
  activeFillBlendMode: BlendMode;
  isFillEnabled: boolean;
  isColorSynced: boolean; // New: If true, fill color follows stroke color
  isStrokeEnabled: boolean; 
  palette: string[]; // Array of 7 hex codes
  parallaxStrength: number;
  parallaxInverted: boolean; 
  springConfig: SpringConfig;
  focalLayerIndex: number; // The layer that stays still (0-8)
  isPlaying: boolean;
  useGyroscope: boolean; // New: Use device orientation for parallax
  isLowPowerMode: boolean; // New: Disables springs and loops for battery saving
  eraserMode: EraserMode;
  isMenuOpen: boolean;
  canvasBackgroundColor: string;
  canvasWidth: number; // Percentage 20-100
  aspectRatio: number | null; // null = responsive/custom width, 1 = square 1:1
  
  // Grid Settings
  isGridEnabled: boolean;
  isSnappingEnabled: boolean;
  isParallaxSnappingEnabled: boolean; // New: Snaps parallax offset to grid
  gridSize: number; // 10 to 100
  symmetryMode: SymmetryMode; // New

  // Visual Settings
  isOnionSkinEnabled: boolean; // New: Depth based opacity
  blurStrength: number; // 0 to 20px blur for depth of field
  focusRange: number; // 0 to 2 layers around focal point stay sharp

  globalLayerBlendMode: BlendMode; 
  layerBlendModes: Record<number, BlendMode>; // Per-layer blend mode (CSS mix-blend-mode)
  layerBlurStrengths: Record<number, number>; // Per-layer blur override
  uiTheme: UITheme; 
  isEmbedMode: boolean;
  isTransparentEmbed: boolean; // New: for transparent background embeds
  embedStyle?: EmbedStyle; // Visual style for embed container

  // Export
  exportConfig: ExportConfig;
  
  // Debug
  isDebugOpen: boolean;
}