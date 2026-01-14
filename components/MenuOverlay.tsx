

import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { SpringConfig, UITheme, BlendMode, ExportConfig, TrajectoryType, ExportFormat, SymmetryMode, MAX_LAYER_INDEX } from '../types';
import { Slider } from './Slider';
// @ts-ignore
import LZString from 'lz-string';

// Helper Components
const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 mt-2" style={{ color: 'var(--section-title-color)', opacity: 1 }}>{children}</h3>
);

const ControlRow = ({ label, children, isDisabled }: { label: string, children?: React.ReactNode, isDisabled?: boolean }) => (
    <div className="flex items-center justify-between mb-3 last:mb-0 gap-4">
        <span className={`text-sm font-medium whitespace-nowrap`} style={{ color: isDisabled ? 'var(--disabled-color)' : 'var(--text-color)', opacity: isDisabled ? 1 : 0.8 }}>{label}</span>
        <div className="flex items-center gap-2 flex-1 justify-end">{children}</div>
    </div>
);

const ToggleBtn = ({ checked, onChange, icon: Icon, label }: { checked: boolean, onChange: () => void, icon?: any, label: string }) => (
   <button 
      onClick={onChange}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-300 ${
          checked 
          ? 'bg-[var(--active-color)] text-white border-[var(--active-color)]' 
          : 'bg-[var(--button-bg)] text-[var(--icon-color)] border-[var(--button-border)] hover:bg-[var(--secondary-bg)]'
      }`}
   >
      {Icon && <Icon size={14} />}
      {label}
   </button>
);

const BlendGroup = ({ value, onChange }: { value: BlendMode, onChange: (v: BlendMode) => void }) => (
    <div className="flex bg-[var(--button-bg)] rounded-lg p-0.5 border border-[var(--button-border)]">
        {(['normal', 'multiply', 'difference'] as BlendMode[]).map((mode) => (
            <button
                key={mode}
                onClick={() => onChange(mode)}
                className={`px-2 py-1 rounded-md text-[10px] uppercase font-medium transition-all ${
                    value === mode 
                    ? 'bg-[var(--active-color)] text-white shadow-sm' 
                    : 'hover:text-[var(--text-color)]'
                }`}
                style={{ color: value !== mode ? 'var(--secondary-text)' : undefined }}
            >
                {mode}
            </button>
        ))}
    </div>
);

const Separator = () => (
    <div className="h-px bg-[var(--border-color)] w-[calc(100%+32px)] -mx-4" />
);

interface MenuOverlayProps {
  isOpen: boolean;
  parallaxStrength: number;
  parallaxInverted: boolean;
  focalLayerIndex: number;
  springConfig: SpringConfig;
  backgroundColor: string;
  canvasWidth: number;
  globalLayerBlendMode: BlendMode;
  activeLayer: number;
  layerBlendModes: Record<number, BlendMode>;
  layerBlurStrengths: Record<number, number>;
  aspectRatio: number | null;
  uiTheme: UITheme;
  isGridEnabled: boolean;
  isSnappingEnabled: boolean;
  gridSize: number;
  symmetryMode: SymmetryMode;
  useGyroscope: boolean;
  isLowPowerMode: boolean;
  isOnionSkinEnabled: boolean;
  blurStrength: number;
  focusRange: number;
  exportConfig: ExportConfig;
  getEncodedState: () => string; 
  onClose: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onReset: () => void;
  onParallaxStrengthChange: (val: number) => void;
  onParallaxInvertedChange: (val: boolean) => void;
  onFocalLayerChange: (index: number) => void;
  onSpringConfigChange: (config: SpringConfig) => void;
  onBackgroundColorChange: (color: string) => void;
  onCanvasWidthChange: (width: number) => void;
  onAspectRatioChange: (ratio: number | null) => void;
  onGlobalLayerBlendModeChange: (mode: BlendMode) => void;
  onLayerBlendModeChange: (layerId: number, mode: BlendMode) => void;
  onLayerBlurChange: (layerId: number, val: number) => void;
  onUIThemeChange: (theme: UITheme) => void;
  onGridEnabledChange: (val: boolean) => void;
  onSnappingEnabledChange: (val: boolean) => void;
  onGridSizeChange: (val: number) => void;
  onSymmetryModeChange: (val: SymmetryMode) => void;
  onUseGyroscopeChange: (val: boolean) => void;
  onLowPowerModeChange: (val: boolean) => void;
  onOnionSkinEnabledChange: (val: boolean) => void;
  onBlurStrengthChange: (val: number) => void;
  onFocusRangeChange: (val: number) => void;
  onExportConfigChange: (config: ExportConfig) => void;
}

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ 
    isOpen, 
    parallaxStrength,
    parallaxInverted,
    focalLayerIndex,
    springConfig,
    backgroundColor,
    canvasWidth,
    globalLayerBlendMode,
    activeLayer,
    layerBlendModes,
    layerBlurStrengths,
    aspectRatio,
    uiTheme,
    isGridEnabled,
    isSnappingEnabled,
    gridSize,
    symmetryMode,
    useGyroscope,
    isLowPowerMode,
    isOnionSkinEnabled,
    blurStrength,
    focusRange,
    exportConfig,
    getEncodedState,
    onClose, 
    onImport, 
    onExport,
    onReset,
    onParallaxStrengthChange,
    onParallaxInvertedChange,
    onFocalLayerChange,
    onSpringConfigChange,
    onBackgroundColorChange,
    onCanvasWidthChange,
    onAspectRatioChange,
    onGlobalLayerBlendModeChange,
    onLayerBlendModeChange,
    onLayerBlurChange,
    onUIThemeChange,
    onGridEnabledChange,
    onSnappingEnabledChange,
    onGridSizeChange,
    onSymmetryModeChange,
    onUseGyroscopeChange,
    onLowPowerModeChange,
    onOnionSkinEnabledChange,
    onBlurStrengthChange,
    onFocusRangeChange,
    onExportConfigChange
}) => {
  const [showShare, setShowShare] = useState(false);
  const [showExportStudio, setShowExportStudio] = useState(false);
  
  // Cloud Share State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');

  // Embed Styling State
  const [embedBorderRadius, setEmbedBorderRadius] = useState(12);
  const [embedBorderWidth, setEmbedBorderWidth] = useState(0);
  const [embedBorderColor, setEmbedBorderColor] = useState('#efeadc');
  const [embedBgMode, setEmbedBgMode] = useState<'transparent' | 'color'>('transparent');
  const [embedBgColor, setEmbedBgColor] = useState('#ffffff');

  // Local state for sliders that should update only on release
  const [localCanvasWidth, setLocalCanvasWidth] = useState(canvasWidth);

  // Sync local width with prop when prop changes externally (e.g. initial load or reset)
  useEffect(() => {
    setLocalCanvasWidth(canvasWidth);
  }, [canvasWidth]);

  const menuRef = useRef<HTMLDivElement>(null);
  const shareSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if ((event.target as HTMLElement).closest('.menu-toggle-btn')) return;
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              if (isOpen) onClose();
          }
      };
      if (isOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  
  useEffect(() => {
      if (showShare && shareSectionRef.current) {
          setTimeout(() => {
            shareSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
      }
  }, [showShare]);

  const requestGyroPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
            const response = await (DeviceOrientationEvent as any).requestPermission();
            if (response === 'granted') {
                onUseGyroscopeChange(true);
            } else {
                alert('Permission denied');
                onUseGyroscopeChange(false);
            }
        } catch (e) {
            console.error(e);
        }
    } else {
        onUseGyroscopeChange(!useGyroscope);
    }
  };

  const handleSquareToggle = () => {
        if (aspectRatio === 1) {
            onAspectRatioChange(null);
        } else {
            // Calculate equivalent width percentage for square (85vh height)
            // Available Width Calculation matches App.tsx CSS logic
            const isMobile = window.innerWidth < 768;
            const spacingPx = isMobile ? 16 : 48; // 1rem vs 3rem assuming root font size 16px
            const availableWidth = window.innerWidth - (6 * spacingPx);
            
            // Target dimension is the height (85vh)
            const targetSize = window.innerHeight * 0.85;
            
            // We need to know what percentage of availableWidth gives us targetSize
            // targetSize = (percent / 100) * availableWidth
            // percent = (targetSize / availableWidth) * 100
            
            let percent = (targetSize / availableWidth) * 100;
            
            // Clamp to slider bounds
            percent = Math.min(100, Math.max(20, percent));
            
            onCanvasWidthChange(Math.round(percent));
            setLocalCanvasWidth(Math.round(percent));
            onAspectRatioChange(1);
        }
  };

  // ----- NEW SHARE LOGIC -----

  const buildShareUrl = (id: string, isEmbed: boolean = false) => {
      const origin = window.location.origin === 'null' ? 'https://parallax-sketch.vercel.app' : window.location.origin;
      const url = new URL(origin + window.location.pathname);
      url.searchParams.set('id', id);
      
      if (isEmbed) {
          // FOR EMBED CODE (Iframe)
          url.searchParams.set('mode', 'embed');
          
          // Apply Styling Params for Embed
          if (embedBorderRadius > 0) url.searchParams.set('borderRadius', embedBorderRadius.toString());
          if (embedBorderWidth > 0) {
              url.searchParams.set('borderWidth', embedBorderWidth.toString());
              url.searchParams.set('borderColor', embedBorderColor.replace('#', ''));
          }
          
          if (embedBgMode === 'transparent') {
              url.searchParams.set('bg', 'transparent');
          } else {
              url.searchParams.set('bg', embedBgColor.replace('#', ''));
          }
      } else {
          // FOR SHARE LINK (View)
          // Uses 'view' mode to maintain aspect ratio/frame logic
          url.searchParams.set('mode', 'view');
      }
      
      return url.toString();
  };

  const handlePublish = async () => {
      setIsPublishing(true);
      try {
          const jsonString = getEncodedState(); 
          if (!jsonString) {
              alert("Error: No data to publish.");
              setIsPublishing(false);
              return;
          }
          
          const response = await fetch('/api/save-drawing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: JSON.parse(jsonString) })
          });
          
          if (!response.ok) throw new Error('Failed to save');
          
          const { id } = await response.json();
          const shareUrl = buildShareUrl(id, false);
          const embedUrl = buildShareUrl(id, true);
          
          setPublishedUrl(shareUrl);
          setEmbedCode(`<iframe src="${embedUrl}" width="100%" height="600" style="border:none; border-radius:${embedBorderRadius}px; overflow:hidden;" allow="accelerometer; gyroscope;"></iframe>`);
          
      } catch (e) {
          console.error(e);
          alert("Failed to publish drawing.");
      } finally {
          setIsPublishing(false);
      }
  };

  // Re-generate embed code if style changes after publishing
  useEffect(() => {
      if (publishedUrl) {
          // Extract ID from current published URL
          const urlObj = new URL(publishedUrl);
          const id = urlObj.searchParams.get('id');
          if (id) {
              const newEmbedUrl = buildShareUrl(id, true);
              setEmbedCode(`<iframe src="${newEmbedUrl}" width="100%" height="600" style="border:none; border-radius:${embedBorderRadius}px; overflow:hidden;" allow="accelerometer; gyroscope;"></iframe>`);
          }
      }
  }, [embedBorderRadius, embedBorderWidth, embedBorderColor, embedBgMode, embedBgColor]);


  if (!isOpen) return null;

  return (
    <div 
        ref={menuRef}
        onMouseDown={(e) => e.stopPropagation()} 
        className="menu-overlay-container absolute w-96 flex flex-col z-50 animate-in fade-in slide-in-from-right-4 duration-300 shadow-2xl rounded-3xl overflow-hidden bg-[var(--menu-bg)]"
        style={{ 
            color: 'var(--text-color)', 
            top: 'calc(var(--spacing-x) * 0.5)',
            bottom: 'calc(var(--spacing-x) * 0.5)',
            right: 'calc(var(--spacing-x) * 0.5)'
        }} 
    >
      <div className="px-6 py-4 flex items-center justify-between bg-[var(--tool-bg)] border-b border-[var(--border-color)] shrink-0 rounded-t-3xl">
        <h2 className="text-lg font-medium tracking-tight">Settings</h2>
        <button onClick={onClose} className="text-[var(--icon-color)] hover:opacity-70 transition-opacity">
          <Icons.Close size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 custom-scrollbar bg-[var(--menu-bg)]">
        
        {/* ... (Canvas & Grid Section) ... */}
        
        <div>
            <SectionTitle>Canvas & Grid</SectionTitle>
            <div className="bg-[var(--tool-bg)] p-4 rounded-2xl border border-[var(--border-color)] space-y-4">
                <ControlRow label="Width">
                    <div className="w-32">
                        <Slider 
                            min={20} max={100} step={1} 
                            value={localCanvasWidth} 
                            onChange={(v) => {
                                setLocalCanvasWidth(v);
                                if (aspectRatio === 1) {
                                    onCanvasWidthChange(v); // Instant update for Square mode if desired, or defer it too
                                }
                            }}
                            onCommit={(v) => {
                                onCanvasWidthChange(v);
                                if (aspectRatio === 1) {
                                    // Keep ratio, but allow width adjustment logic if needed
                                } else {
                                    onAspectRatioChange(null); // Clear ratio on manual width change
                                }
                            }}
                        />
                    </div>
                </ControlRow>
                <ControlRow label="Layout">
                     <button 
                        onClick={handleSquareToggle} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            aspectRatio === 1
                            ? 'bg-[var(--active-color)] text-white border-[var(--active-color)]' 
                            : 'bg-transparent text-[var(--text-color)] border-[var(--button-border)]'
                        }`}
                    >
                        Square (1:1)
                    </button>
                </ControlRow>

                <ControlRow label="Background">
                    <div className="flex items-center gap-2 px-1 py-1 bg-[var(--secondary-bg)] rounded-lg border border-[var(--button-border)] w-fit">
                         <div className="relative w-6 h-6 flex items-center justify-center cursor-pointer rounded overflow-hidden shadow-sm border border-[var(--border-color)]">
                            <div 
                                className="absolute inset-0"
                                style={{ backgroundColor }}
                            />
                            <input 
                                type="color" 
                                value={backgroundColor}
                                onChange={(e) => onBackgroundColorChange(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                         </div>
                    </div>
                </ControlRow>
                
                <ControlRow label="Focal Layer">
                     <div className="w-32">
                        {/* FIXED: Increased max limit to 8 using constant */}
                        <Slider 
                            min={0} max={MAX_LAYER_INDEX} step={1} 
                            value={focalLayerIndex} 
                            onChange={onFocalLayerChange}
                        />
                     </div>
                </ControlRow>

                <ControlRow label="Focus Range">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium w-8 text-right" style={{ color: 'var(--slider-value-color)' }}>{focusRange < 0 ? 'All' : `±${focusRange}`}</span>
                         <div className="w-24">
                            <Slider 
                                min={-0.5} max={2.5} step={0.5}
                                value={focusRange} 
                                onChange={onFocusRangeChange}
                            />
                        </div>
                    </div>
                </ControlRow>

                <Separator />
                
                <ControlRow label="Symmetry">
                    <div className="flex bg-[var(--button-bg)] rounded-lg p-0.5 border border-[var(--button-border)]">
                        {[SymmetryMode.NONE, SymmetryMode.HORIZONTAL, SymmetryMode.VERTICAL, SymmetryMode.QUAD, SymmetryMode.CENTRAL].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onSymmetryModeChange(mode)}
                                className={`px-1.5 py-1 rounded-md text-[9px] uppercase font-medium transition-all flex-1 ${
                                    symmetryMode === mode 
                                    ? 'bg-[var(--active-color)] text-white shadow-sm' 
                                    : 'hover:text-[var(--text-color)]'
                                }`}
                                style={{ color: symmetryMode !== mode ? 'var(--secondary-text)' : undefined }}
                            >
                                {mode === SymmetryMode.NONE ? 'Off' : mode === SymmetryMode.HORIZONTAL ? 'Hor' : mode === SymmetryMode.VERTICAL ? 'Ver' : mode === SymmetryMode.QUAD ? 'Quad' : 'CNTR'}
                            </button>
                        ))}
                    </div>
                </ControlRow>

                <Separator />
                
                <ControlRow label="Depth of Field">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium w-8 text-right" style={{ color: 'var(--slider-value-color)' }}>{blurStrength}px</span>
                        <div className="w-24">
                            <Slider 
                                min={0} max={20} step={1}
                                value={blurStrength} 
                                onChange={onBlurStrengthChange}
                            />
                        </div>
                    </div>
                </ControlRow>
                
                <ControlRow label={`Layer ${activeLayer} Blur`}>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium w-8 text-right" style={{ color: 'var(--slider-value-color)' }}>{layerBlurStrengths[activeLayer]}px</span>
                        <div className="w-24">
                            <Slider 
                                min={0} max={20} step={1}
                                value={layerBlurStrengths[activeLayer]} 
                                onChange={(v) => onLayerBlurChange(activeLayer, v)}
                            />
                        </div>
                    </div>
                </ControlRow>

                <ControlRow label="Onion Skin">
                    <ToggleBtn 
                        checked={isOnionSkinEnabled} 
                        onChange={() => onOnionSkinEnabledChange(!isOnionSkinEnabled)} 
                        label={isOnionSkinEnabled ? 'Visible' : 'Hidden'}
                    />
                </ControlRow>

                <Separator />

                <ControlRow label="Global">
                    <BlendGroup value={globalLayerBlendMode} onChange={onGlobalLayerBlendModeChange} />
                </ControlRow>

                <ControlRow label={`Layer ${activeLayer}`}>
                    <BlendGroup value={layerBlendModes[activeLayer]} onChange={(m) => onLayerBlendModeChange(activeLayer, m)} />
                </ControlRow>

                 <Separator />

                 <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-[var(--text-color)] opacity-80">Grid Overlay</span>
                     <ToggleBtn 
                        checked={isGridEnabled} 
                        onChange={() => onGridEnabledChange(!isGridEnabled)} 
                        label={isGridEnabled ? 'On' : 'Off'}
                    />
                 </div>
                 
                 {isGridEnabled && (
                     <div className="pt-2 space-y-3 animate-in fade-in">
                         <ControlRow label="Snap to Grid">
                            <ToggleBtn 
                                checked={isSnappingEnabled} 
                                onChange={() => onSnappingEnabledChange(!isSnappingEnabled)} 
                                label={isSnappingEnabled ? 'Active' : 'Disabled'}
                            />
                         </ControlRow>
                         <ControlRow label={`Size (${gridSize}px)`}>
                            <div className="w-32">
                                <Slider 
                                    min={10} max={100} step={1}
                                    value={gridSize} 
                                    onChange={onGridSizeChange}
                                />
                            </div>
                         </ControlRow>
                     </div>
                 )}
            </div>
        </div>
        
        {/* Motion Section (Skipped for brevity) */}
        <div>
            <SectionTitle>Motion & Physics</SectionTitle>
            
            <div className="flex flex-wrap gap-2 mb-4">
                <ToggleBtn 
                    checked={isLowPowerMode} 
                    onChange={() => onLowPowerModeChange(!isLowPowerMode)} 
                    label="Eco Mode"
                    icon={isLowPowerMode ? Icons.Battery : Icons.Eco}
                />
                <ToggleBtn 
                    checked={useGyroscope} 
                    onChange={requestGyroPermission} 
                    label="Gyroscope"
                    icon={Icons.SliderHandle}
                />
            </div>

            <div className="bg-[var(--tool-bg)] p-4 rounded-2xl border border-[var(--border-color)] space-y-4">
                <ControlRow label="Parallax Depth">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium w-8 text-right" style={{ color: 'var(--slider-value-color)' }}>{parallaxStrength}%</span>
                        <div className="w-24">
                            <Slider 
                                min={0} max={100} step={1}
                                value={parallaxStrength} 
                                onChange={onParallaxStrengthChange}
                            />
                        </div>
                     </div>
                </ControlRow>

                <ControlRow label="Invert Direction">
                    <ToggleBtn 
                        checked={parallaxInverted} 
                        onChange={() => onParallaxInvertedChange(!parallaxInverted)} 
                        label={parallaxInverted ? 'On' : 'Off'}
                    />
                </ControlRow>
                
                <Separator />
                
                <div className={`space-y-4 transition-colors duration-300`}>
                    <ControlRow label="Tension" isDisabled={isLowPowerMode}>
                         <div className="w-32">
                            <Slider 
                                min={0.01} max={1.0} step={0.01}
                                value={springConfig.stiffness} 
                                onChange={(v) => onSpringConfigChange({ ...springConfig, stiffness: v })}
                                disabled={isLowPowerMode}
                            />
                         </div>
                    </ControlRow>
                    <ControlRow label="Friction" isDisabled={isLowPowerMode}>
                         <div className="w-32">
                            <Slider 
                                min={0.01} max={0.99} step={0.01}
                                value={springConfig.damping} 
                                onChange={(v) => onSpringConfigChange({ ...springConfig, damping: v })}
                                disabled={isLowPowerMode}
                            />
                         </div>
                    </ControlRow>
                </div>
            </div>
        </div>

        <div>
            <SectionTitle>Share & Export</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
                 <label className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--tool-bg)] border border-[var(--border-color)] hover:bg-[var(--secondary-bg)] transition-all cursor-pointer group">
                    <Icons.Upload size={20} className="text-[var(--icon-color)] mb-1" />
                    <span className="text-[10px] font-medium text-[var(--text-color)]">Import JSON</span>
                    <input type="file" accept=".json" onChange={onImport} className="hidden" />
                 </label>

                 <button 
                    onClick={() => {
                        if (!showShare) {
                            // Reset state when opening
                            setPublishedUrl('');
                            setEmbedCode('');
                        }
                        setShowShare(!showShare);
                        setShowExportStudio(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all group ${
                        showShare 
                        ? 'bg-[var(--active-color)] border-[var(--active-color)]' 
                        : 'bg-[var(--tool-bg)] border-[var(--border-color)] hover:bg-[var(--secondary-bg)]'
                    }`}
                 >
                    <Icons.Link size={20} className={`mb-1 ${showShare ? 'text-white' : 'text-[var(--icon-color)] group-hover:text-[var(--active-color)]'}`} />
                    <span className={`text-[10px] font-medium ${showShare ? 'text-white' : 'text-[var(--text-color)]'}`}>Share Link</span>
                 </button>

                 <button 
                    onClick={onExport}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--tool-bg)] border border-[var(--border-color)] hover:bg-[var(--secondary-bg)] transition-all group"
                 >
                    <Icons.Download size={20} className="text-[var(--icon-color)] mb-1" />
                    <span className="text-[10px] font-medium text-[var(--text-color)]">Download JSON</span>
                 </button>

                 <button 
                    onClick={() => {
                        setShowExportStudio(!showExportStudio);
                        setShowShare(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all group ${
                        showExportStudio 
                        ? 'bg-[var(--active-color)] border-[var(--active-color)]' 
                        : 'bg-[var(--tool-bg)] border-[var(--border-color)] hover:bg-[var(--secondary-bg)]'
                    }`}
                 >
                    <Icons.Play size={20} className={`mb-1 ${showExportStudio ? 'text-white' : 'text-[var(--icon-color)] group-hover:text-[var(--active-color)]'}`} />
                    <span className={`text-[10px] font-medium ${showExportStudio ? 'text-white' : 'text-[var(--text-color)]'}`}>Export Video</span>
                 </button>
            </div>
            
            {showExportStudio && (
                 <div className="mt-3 p-4 bg-[var(--tool-bg)] rounded-xl border border-[var(--border-color)] animate-in fade-in space-y-4">
                     {/* Video Export UI (unchanged) */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-50 block">Motion Path</span>
                        <div className="grid grid-cols-4 gap-1">
                            {[TrajectoryType.CIRCLE, TrajectoryType.FIGURE8, TrajectoryType.SWAY_H, TrajectoryType.SWAY_V].map(type => (
                                <button
                                    key={type}
                                    onClick={() => onExportConfigChange({...exportConfig, trajectory: type})}
                                    className={`py-2 rounded-lg text-[9px] font-medium border transition-all ${
                                        exportConfig.trajectory === type
                                        ? 'bg-[var(--active-color)] text-white border-[var(--active-color)]'
                                        : 'bg-[var(--button-bg)] text-[var(--text-color)] border-[var(--button-border)] hover:bg-[var(--secondary-bg)]'
                                    }`}
                                >
                                    {type === TrajectoryType.CIRCLE ? 'Circle' : type === TrajectoryType.FIGURE8 ? 'Fig. 8' : type === TrajectoryType.SWAY_H ? 'Horiz.' : 'Vert.'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-50 block">Format</span>
                        <div className="flex bg-[var(--secondary-bg)] p-1 rounded-lg border border-[var(--button-border)]">
                            {(['webm', 'mp4'] as ExportFormat[]).map(fmt => (
                                <button 
                                    key={fmt}
                                    onClick={() => onExportConfigChange({...exportConfig, format: fmt})}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-medium transition-all uppercase ${exportConfig.format === fmt ? 'bg-[var(--button-bg)] shadow-sm text-[var(--active-color)]' : 'text-[var(--secondary-text)]'}`}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                        <p className="text-[9px] text-[var(--secondary-text)] text-center">
                            {exportConfig.format === 'webm' ? "Best Quality & Looping (Recommended)" : "MP4 (Experimental/Safari)"}
                        </p>
                    </div>

                    <ControlRow label={`Duration: ${exportConfig.duration}s`}>
                        <div className="w-32">
                             <Slider 
                                min={1} max={10} step={1}
                                value={exportConfig.duration} 
                                onChange={(v) => onExportConfigChange({...exportConfig, duration: v})}
                            />
                        </div>
                    </ControlRow>
                    
                    <Separator />

                    <div className="flex gap-2">
                        <button
                            onClick={() => onExportConfigChange({...exportConfig, isActive: !exportConfig.isActive, isRecording: false})}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                exportConfig.isActive && !exportConfig.isRecording
                                ? 'bg-[var(--active-color)] text-white border-[var(--active-color)]'
                                : 'bg-[var(--button-bg)] text-[var(--text-color)] border-[var(--button-border)] hover:bg-[var(--secondary-bg)]'
                            }`}
                        >
                            {exportConfig.isActive && !exportConfig.isRecording ? 'Stop Preview' : 'Preview Loop'}
                        </button>
                        
                        <button
                            onClick={() => onExportConfigChange({...exportConfig, isActive: true, isRecording: true})}
                            disabled={exportConfig.isRecording}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                exportConfig.isRecording
                                ? 'bg-red-50 text-red-500 border-red-500 cursor-wait'
                                : 'bg-[var(--active-color)] text-white border-[var(--active-color)] opacity-90 hover:opacity-100'
                            }`}
                        >
                            {exportConfig.isRecording ? 'Recording...' : 'Record Video'}
                        </button>
                    </div>
                 </div>
            )}
            
            {showShare && (
                 <div ref={shareSectionRef} className="mt-3 p-4 bg-[var(--tool-bg)] rounded-xl border border-[var(--border-color)] animate-in fade-in space-y-6">
                    
                    {/* NEW SHARE FLOW */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-50 block">One-Click Publish</span>
                        <p className="text-[10px] text-[var(--secondary-text)] leading-tight">
                            Publish your sketch to the cloud to get a shareable link instantly.
                        </p>

                        {!publishedUrl ? (
                            <button 
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className={`w-full py-3 rounded-lg text-xs font-semibold border transition-all ${
                                    isPublishing
                                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                                    : 'bg-[var(--active-color)] text-white border-[var(--active-color)] hover:opacity-90'
                                }`}
                            >
                                {isPublishing ? 'Publishing...' : 'Create Public Link'}
                            </button>
                        ) : (
                            <div className="space-y-3 animate-in fade-in">
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                    <span className="text-[10px] font-bold text-green-700 block mb-1">Published Successfully!</span>
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={publishedUrl}
                                        className="w-full text-[10px] p-2 bg-white border border-green-200 rounded text-gray-600 focus:outline-none"
                                        onClick={(e) => e.currentTarget.select()}
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(publishedUrl);
                                        alert('Link copied!');
                                    }}
                                    className="w-full py-2 rounded-lg text-[10px] font-semibold border bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                                >
                                    Copy Link
                                </button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Embed Styling (Border/Radius/Bg) */}
                    <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-50 block">Embed Styling</span>
                        
                        <ControlRow label="Border Radius">
                            <div className="w-24 flex items-center gap-2">
                                <span className="text-[9px] text-gray-400 w-4 text-right">{embedBorderRadius}</span>
                                <Slider 
                                    min={0} max={50} step={1}
                                    value={embedBorderRadius} 
                                    onChange={setEmbedBorderRadius}
                                />
                            </div>
                        </ControlRow>

                        <ControlRow label="Border Width">
                            <div className="w-24 flex items-center gap-2">
                                <span className="text-[9px] text-gray-400 w-4 text-right">{embedBorderWidth}</span>
                                <Slider 
                                    min={0} max={20} step={1}
                                    value={embedBorderWidth} 
                                    onChange={setEmbedBorderWidth}
                                />
                            </div>
                        </ControlRow>

                        <ControlRow label="Border Color">
                            <div className="flex items-center gap-2 px-1 py-1 bg-[var(--secondary-bg)] rounded-lg border border-[var(--button-border)] w-fit">
                                <div className="relative w-6 h-6 flex items-center justify-center cursor-pointer rounded overflow-hidden shadow-sm border border-[var(--border-color)]">
                                    <div 
                                        className="absolute inset-0"
                                        style={{ backgroundColor: embedBorderColor }}
                                    />
                                    <input 
                                        type="color" 
                                        value={embedBorderColor}
                                        onChange={(e) => setEmbedBorderColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                </div>
                            </div>
                        </ControlRow>

                        <ControlRow label="App Background">
                             <div className="flex bg-[var(--button-bg)] rounded-lg p-0.5 border border-[var(--button-border)]">
                                <button 
                                    onClick={() => setEmbedBgMode('transparent')}
                                    className={`px-2 py-1 rounded-md text-[9px] uppercase font-medium transition-all ${embedBgMode === 'transparent' ? 'bg-[var(--active-color)] text-white shadow-sm' : 'hover:text-[var(--text-color)]'}`}
                                >
                                    Transp
                                </button>
                                <button 
                                    onClick={() => setEmbedBgMode('color')}
                                    className={`px-2 py-1 rounded-md text-[9px] uppercase font-medium transition-all flex items-center gap-2 ${embedBgMode === 'color' ? 'bg-[var(--active-color)] text-white shadow-sm' : 'hover:text-[var(--text-color)]'}`}
                                >
                                    Color
                                    {embedBgMode === 'color' && (
                                        <div className="relative w-3 h-3 rounded-full border border-white/50 overflow-hidden ml-1">
                                            <div className="absolute inset-0" style={{ backgroundColor: embedBgColor }} />
                                            <input 
                                                type="color" 
                                                value={embedBgColor} 
                                                onChange={(e) => setEmbedBgColor(e.target.value)} 
                                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </button>
                            </div>
                        </ControlRow>
                    </div>

                    {/* Embed Code Button */}
                    {publishedUrl && (
                        <div className="pt-2 animate-in fade-in">
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(embedCode);
                                    alert("Embed Code Copied!");
                                }}
                                className={`w-full py-2.5 rounded-lg text-xs font-semibold border transition-all bg-[var(--button-bg)] text-[var(--active-color)] border-[var(--active-color)] hover:bg-[var(--secondary-bg)]`}
                            >
                                Copy Embed Code
                            </button>
                        </div>
                    )}

                </div>
            )}
        </div>

      </div>

      <div className="p-4 bg-[var(--tool-bg)] border-t border-[var(--border-color)] text-center shrink-0 rounded-b-3xl">
          <span className="text-[10px] text-[var(--secondary-text)] opacity-60 font-medium">
              vibecoded by <a 
                href="https://ivangulizia.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline transition-opacity"
                style={{ color: 'var(--active-color)' }}
              >
                  Ivan Gulizia
              </a>
          </span>
      </div>
    </div>
  );
}