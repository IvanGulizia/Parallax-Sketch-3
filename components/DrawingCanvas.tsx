
import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { ToolType, Point, Stroke, EraserMode, SpringConfig, BlendMode, ExportConfig, TrajectoryType, SymmetryMode } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DrawingCanvasProps {
  activeTool: ToolType;
  activeLayer: number;
  brushSize: number;
  activeColorSlot: number;
  activeSecondaryColorSlot: number;
  activeBlendMode: BlendMode;
  activeFillBlendMode: BlendMode;
  isFillEnabled: boolean;
  isStrokeEnabled: boolean;
  palette: string[];
  parallaxStrength: number;
  parallaxInverted: boolean;
  springConfig: SpringConfig;
  focalLayerIndex: number;
  isPlaying: boolean;
  eraserMode: EraserMode;
  backgroundColor: string;
  globalLayerBlendMode: BlendMode;
  layerBlendModes: Record<number, BlendMode>;
  layerBlurStrengths?: Record<number, number>;
  isGridEnabled: boolean;
  isSnappingEnabled: boolean;
  gridSize: number;
  symmetryMode: SymmetryMode;
  useGyroscope: boolean;
  isLowPowerMode: boolean;
  isOnionSkinEnabled: boolean;
  blurStrength: number;
  focusRange: number; 
  exportConfig?: ExportConfig;
  onStrokesChange: (strokes: Stroke[]) => void;
  onStrokeCommit: (strokes: Stroke[]) => void;
  onExportComplete?: () => void;
  onStopPreview?: () => void;
  onColorPick?: (colorSlot: number) => void;
  onEmbedContextMenu?: () => void;
  strokes: Stroke[];
  isEmbedMode?: boolean;
  isMobile?: boolean;
  guideColor?: string; // New Prop for guide colors
  viewLockTrigger?: { type: 'LOCK' | 'RESET' | 'UNLOCK', ts: number }; // Updated Prop for View Locking
}

const OVERSCAN_MARGIN = 800; // Increased for "Infinite Canvas" feel

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  activeTool,
  activeLayer,
  brushSize,
  activeColorSlot,
  activeSecondaryColorSlot,
  activeBlendMode,
  activeFillBlendMode,
  isFillEnabled,
  isStrokeEnabled,
  palette,
  parallaxStrength,
  parallaxInverted,
  springConfig,
  focalLayerIndex,
  isPlaying,
  eraserMode,
  backgroundColor,
  globalLayerBlendMode,
  layerBlendModes,
  layerBlurStrengths,
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
  onStrokesChange,
  onStrokeCommit,
  onExportComplete,
  onStopPreview,
  onColorPick,
  onEmbedContextMenu,
  strokes,
  isEmbedMode,
  isMobile = false,
  guideColor = '#d5cdb4',
  viewLockTrigger
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const offscreenCanvases = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null, null, null, null]);
  
  // Physics State
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);
  
  // View Lock State
  const isViewLocked = useRef(false);
  const lockedOffset = useRef({ x: 0, y: 0 });

  // Interaction
  const isDrawing = useRef(false);
  const isDraggingView = useRef(false);
  const currentStrokePoints = useRef<Point[]>([]);
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const isDraggingSelection = useRef(false);
  const dragStartPos = useRef<Point>({ x: 0, y: 0 });

  const [pickerFeedback, setPickerFeedback] = useState<{ x: number, y: number, color: string, active: boolean }>({ x: 0, y: 0, color: '', active: false });
  const [renderVersion, setRenderVersion] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const recordingCanvas = useRef<HTMLCanvasElement | null>(null);
  const recordingStartTime = useRef<number>(0);

  useEffect(() => {
    offscreenCanvases.current = offscreenCanvases.current.map((_, i) => {
        return offscreenCanvases.current[i] || document.createElement('canvas');
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            setDimensions({ width, height });
        }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // --- View Locking Effect ---
  useEffect(() => {
      if (!viewLockTrigger || viewLockTrigger.ts === 0) return;

      if (viewLockTrigger.type === 'LOCK') {
           // We can only lock if we are currently playing (moving)
           // Capture the CURRENT visual offset (smoothed) to avoid jumps
           if (isPlaying) {
             isViewLocked.current = true;
             lockedOffset.current = { ...currentOffset.current };
           }
      } else if (viewLockTrigger.type === 'RESET') {
          // Reset to center (0,0) and unlock
          isViewLocked.current = false;
          lockedOffset.current = { x: 0, y: 0 };
          targetOffset.current = { x: 0, y: 0 };
      } else if (viewLockTrigger.type === 'UNLOCK') {
          // Just unlock, resume normal physics
          isViewLocked.current = false;
      }
  }, [viewLockTrigger, isPlaying]);

  const normalizePoint = (x: number, y: number, width: number, height: number): Point => ({
      x: x / width,
      y: y / height
  });

  const denormalizePoint = (p: Point, width: number, height: number): Point => ({
      x: (p.x * width) + OVERSCAN_MARGIN,
      y: (p.y * height) + OVERSCAN_MARGIN
  });

  const getScaleFactor = useCallback(() => {
      if (dimensions.width === 0) return 1;
      return Math.max(0.1, dimensions.width / 1000);
  }, [dimensions.width]);

  // --- Rendering ---
  const renderLayer = useCallback((layerIndex: number) => {
    const canvas = offscreenCanvases.current[layerIndex];
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;
    
    const fullWidth = dimensions.width + (OVERSCAN_MARGIN * 2);
    const fullHeight = dimensions.height + (OVERSCAN_MARGIN * 2);
    const scaleFactor = getScaleFactor();

    if (canvas.width !== fullWidth || canvas.height !== fullHeight) {
        canvas.width = fullWidth;
        canvas.height = fullHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // --- Grid Rendering (CENTERED) ---
    // Use guideColor prop for rendering grid
    if (isGridEnabled && layerIndex === activeLayer && !isPlaying && !exportConfig?.isActive) {
        ctx.save();
        ctx.fillStyle = guideColor;
        ctx.globalAlpha = 1; 
        
        // Calculate Center of the bitmap
        const centerX = fullWidth / 2;
        const centerY = fullHeight / 2;

        // Calculate offset to ensure a grid line hits the center
        // We start from (center % gridSize) and iterate
        const startX = (centerX % gridSize);
        const startY = (centerY % gridSize);

        for (let x = startX; x <= fullWidth; x += gridSize) {
            for (let y = startY; y <= fullHeight; y += gridSize) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // --- Symmetry Guides Rendering (CENTERED) ---
    // Use guideColor prop for rendering guides
    if (layerIndex === activeLayer && symmetryMode !== SymmetryMode.NONE && !isEmbedMode && !exportConfig?.isActive && !isPlaying) {
        ctx.save();
        ctx.beginPath();
        
        ctx.strokeStyle = guideColor; 
        ctx.setLineDash([4, 6]); 
        ctx.lineWidth = 1; 
        
        // This coordinates already point to the exact center of the bitmap
        const centerX = (dimensions.width / 2) + OVERSCAN_MARGIN;
        const centerY = (dimensions.height / 2) + OVERSCAN_MARGIN;

        if (symmetryMode === SymmetryMode.HORIZONTAL || symmetryMode === SymmetryMode.QUAD || symmetryMode === SymmetryMode.CENTRAL) {
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, fullHeight);
        }
        if (symmetryMode === SymmetryMode.VERTICAL || symmetryMode === SymmetryMode.QUAD) {
            ctx.moveTo(0, centerY);
            ctx.lineTo(fullWidth, centerY);
        }
        
        ctx.stroke();
        ctx.restore();
    }

    const layerStrokes = strokes.filter(s => s.layerId === layerIndex);

    layerStrokes.forEach(stroke => {
        if (stroke.points.length < 2) return;

        const start = denormalizePoint(stroke.points[0], dimensions.width, dimensions.height);
        
        if (stroke.fillColorSlot !== undefined && stroke.fillColorSlot !== -1) {
             ctx.beginPath();
             ctx.moveTo(start.x, start.y);
             for (let i = 1; i < stroke.points.length; i++) {
                const p = denormalizePoint(stroke.points[i], dimensions.width, dimensions.height);
                ctx.lineTo(p.x, p.y);
             }
             ctx.closePath(); 
             ctx.fillStyle = palette[stroke.fillColorSlot] || 'transparent';
             
             let compositeOp: GlobalCompositeOperation = 'source-over';
             if (stroke.fillBlendMode === 'multiply') compositeOp = 'multiply';
             else if (stroke.fillBlendMode === 'overlay') compositeOp = 'overlay';
             else if (stroke.fillBlendMode === 'difference') compositeOp = 'difference';

             ctx.globalCompositeOperation = compositeOp;
             ctx.fill();
        }

        if (stroke.isStrokeEnabled !== false || stroke.tool === ToolType.ERASER) {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            for (let i = 1; i < stroke.points.length; i++) {
                const p = denormalizePoint(stroke.points[i], dimensions.width, dimensions.height);
                ctx.lineTo(p.x, p.y);
            }

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = stroke.size * scaleFactor;
            
            if (stroke.tool === ToolType.ERASER) {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.stroke();
            } else {
                let compositeOp: GlobalCompositeOperation = 'source-over';
                if (stroke.blendMode === 'multiply') compositeOp = 'multiply';
                else if (stroke.blendMode === 'overlay') compositeOp = 'overlay';
                else if (stroke.blendMode === 'difference') compositeOp = 'difference';

                ctx.globalCompositeOperation = compositeOp;
                
                if (stroke.colorSlot === -1) {
                    ctx.strokeStyle = '#FFFFFF';
                } else {
                    ctx.strokeStyle = palette[stroke.colorSlot] || '#000000';
                }
                
                if (stroke.id === selectedStrokeId) {
                    ctx.shadowColor = '#000000';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }
                ctx.stroke();
            }
        }
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
    });
    
    setRenderVersion(v => v + 1);
  }, [strokes, selectedStrokeId, dimensions, palette, isLowPowerMode, symmetryMode, activeLayer, isEmbedMode, exportConfig, isPlaying, getScaleFactor, guideColor, isGridEnabled, gridSize]);

  useEffect(() => {
    [0, 1, 2, 3, 4, 5, 6].forEach(renderLayer);
  }, [strokes, renderLayer, selectedStrokeId, dimensions, palette, symmetryMode, guideColor, isGridEnabled]);

  const applyParallaxTransforms = (offsetX: number, offsetY: number) => {
    const maxPx = (parallaxStrength / 100) * OVERSCAN_MARGIN;
    const direction = parallaxInverted ? -1 : 1;
    
    const layers = containerRef.current?.querySelectorAll('.layer-canvas');
    layers?.forEach((layer, i) => {
        const relativeDepth = (i - focalLayerIndex) * 0.5;
        const x = -offsetX * maxPx * relativeDepth * direction;
        const y = -offsetY * maxPx * relativeDepth * direction;
        (layer as HTMLElement).style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    });
  };

  useLayoutEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
        applyParallaxTransforms(currentOffset.current.x, currentOffset.current.y);
    }
  }, [dimensions, focalLayerIndex, parallaxStrength, parallaxInverted]);

  useEffect(() => {
      if (exportConfig?.isRecording && !recorderRef.current) {
          if (!recordingCanvas.current) {
              recordingCanvas.current = document.createElement('canvas');
          }
          recordingCanvas.current.width = dimensions.width;
          recordingCanvas.current.height = dimensions.height;
          
          const stream = recordingCanvas.current.captureStream(60); 
          let options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 5000000 };
          
          if (exportConfig.format === 'mp4') {
             if (MediaRecorder.isTypeSupported('video/mp4')) {
                options = { mimeType: 'video/mp4', videoBitsPerSecond: 5000000 };
             } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
                 options = { mimeType: 'video/webm;codecs=h264', videoBitsPerSecond: 5000000 };
             }
          } else {
              if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                  options = { mimeType: 'video/webm', videoBitsPerSecond: 5000000 };
              }
          }
          
          try {
            recorderRef.current = new MediaRecorder(stream, options);
          } catch (e) {
            console.warn("Preferred mimeType failed, falling back", e);
             recorderRef.current = new MediaRecorder(stream);
          }

          recordedChunks.current = [];
          recorderRef.current.ondataavailable = (e) => {
              if (e.data.size > 0) recordedChunks.current.push(e.data);
          };
          
          recorderRef.current.onstop = () => {
             const type = recorderRef.current?.mimeType || 'video/webm';
             const blob = new Blob(recordedChunks.current, { type });
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             
             let ext = 'webm';
             if (exportConfig.format === 'mp4') {
                 ext = 'mp4'; 
             }
             
             a.download = `zen-parallax-${Date.now()}.${ext}`;
             a.click();
             onExportComplete?.();
          };

          recorderRef.current.start();
          recordingStartTime.current = Date.now();
      } else if (!exportConfig?.isRecording && recorderRef.current) {
          if (recorderRef.current.state !== 'inactive') {
              recorderRef.current.stop();
          }
          recorderRef.current = null;
      }
  }, [exportConfig?.isRecording, exportConfig?.format, dimensions, onExportComplete]);

  useEffect(() => {
    // We attach to window to handle dragging outside
    const handleWindowMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        
        // Physics view dragging - Only if NOT drawing
        // Logic Update:
        // 1. Must be playing to move view with mouse
        // 2. Must NOT be locked
        if (!isDrawing.current && !exportConfig?.isActive && !useGyroscope && !isViewLocked.current && isPlaying) {
            const { width, height, left, top } = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - left) / width) * 2 - 1;
            const y = ((e.clientY - top) / height) * 2 - 1;
            
            if (!isDraggingView.current) {
                targetOffset.current = { x, y };
            }
        }
        
        // Drawing Continuation - Works even if playing
        if (isDrawing.current) {
            const pt = getNormalizedLocalPoint(e);
            currentStrokePoints.current.push(pt);
            
            const baseStroke: Stroke = {
                id: 'current',
                points: currentStrokePoints.current,
                colorSlot: activeColorSlot,
                fillColorSlot: isFillEnabled ? activeSecondaryColorSlot : undefined,
                size: brushSize,
                tool: activeTool,
                layerId: activeLayer,
                isEraser: activeTool === ToolType.ERASER,
                blendMode: activeBlendMode,
                fillBlendMode: activeFillBlendMode,
                isStrokeEnabled: isStrokeEnabled
            };

            const allNewStrokes = generateSymmetryStrokes(baseStroke);
            const otherStrokes = strokes.filter(s => !s.id.startsWith('current'));
            onStrokesChange([...otherStrokes, ...allNewStrokes]);
        }
    };

    const handleWindowMouseUp = () => {
        if (isDrawing.current) {
            isDrawing.current = false;
            
            const baseStroke: Stroke = {
                id: uuidv4(),
                points: currentStrokePoints.current,
                colorSlot: activeColorSlot,
                fillColorSlot: isFillEnabled ? activeSecondaryColorSlot : undefined,
                size: brushSize,
                tool: activeTool,
                layerId: activeLayer,
                isEraser: activeTool === ToolType.ERASER,
                blendMode: activeBlendMode,
                fillBlendMode: activeFillBlendMode,
                isStrokeEnabled: isStrokeEnabled
            };
            
            const allNewStrokes = generateSymmetryStrokes(baseStroke);
            const otherStrokes = strokes.filter(s => !s.id.startsWith('current'));
            
            onStrokeCommit([...otherStrokes, ...allNewStrokes]);
            currentStrokePoints.current = [];
        }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
        if (!isPlaying || !useGyroscope || exportConfig?.isActive || isViewLocked.current) return;
        
        let angle = 0;
        if (window.screen?.orientation?.angle !== undefined) {
             angle = window.screen.orientation.angle;
        } else if (typeof window.orientation !== 'undefined') {
             angle = window.orientation as number;
        }

        const gamma = (e.gamma || 0); 
        const beta = (e.beta || 0);

        let x = 0;
        let y = 0;

        if (angle === 0) {
            x = gamma; y = beta;
        } else if (angle === 90) {
            x = beta; y = gamma; 
        } else if (angle === -90 || angle === 270) {
            x = -beta; y = -gamma;
        } else if (angle === 180) {
            x = -gamma; y = -beta;
        }

        x = x / 30; 
        y = y / 30;
        x = Math.max(-1, Math.min(1, x));
        y = Math.max(-1, Math.min(1, y));
        
        if (angle === 90) { x = -x; y = -y; }
        if (angle === -90) { x = -x; y = -y; }

        targetOffset.current = { x, y };
    }

    if (isPlaying || exportConfig?.isActive) {
       if (useGyroscope) {
          window.addEventListener('deviceorientation', handleOrientation);
      }
    } 
    
    // Always attach mouse events for drawing
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
        window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, [isPlaying, useGyroscope, isLowPowerMode, parallaxStrength, focalLayerIndex, parallaxInverted, exportConfig, strokes, activeTool, activeLayer, brushSize, isFillEnabled, activeColorSlot, activeSecondaryColorSlot, activeBlendMode, activeFillBlendMode, isStrokeEnabled]);

  const animationLoop = () => {
    let nextX = currentOffset.current.x;
    let nextY = currentOffset.current.y;
    
    // Priority 1: Export (Procedural)
    if (exportConfig?.isActive) {
        const now = Date.now();
        const durationMs = exportConfig.duration * 1000;
        const elapsed = (now % durationMs) / durationMs; 
        const t = elapsed * Math.PI * 2; 

        let autoX = 0;
        let autoY = 0;

        switch (exportConfig.trajectory) {
            case TrajectoryType.CIRCLE:
                autoX = Math.cos(t);
                autoY = Math.sin(t);
                break;
            case TrajectoryType.FIGURE8:
                const scale = 2 / (3 - Math.cos(2 * t));
                autoX = scale * Math.cos(t);
                autoY = scale * Math.sin(2 * t) / 2;
                break;
            case TrajectoryType.SWAY_H:
                autoX = Math.sin(t);
                autoY = 0;
                break;
            case TrajectoryType.SWAY_V:
                autoX = 0;
                autoY = Math.sin(t);
                break;
        }
        
        nextX = autoX;
        nextY = autoY;
        
        targetOffset.current = { x: nextX, y: nextY };
        currentOffset.current = { x: nextX, y: nextY };
        velocity.current = { x: 0, y: 0 };

        if (exportConfig.isRecording && recordingStartTime.current > 0) {
            if (Date.now() - recordingStartTime.current >= durationMs) {
                 if (recorderRef.current && recorderRef.current.state === 'recording') {
                    recorderRef.current.stop();
                    recorderRef.current = null;
                 }
            }
        }
    } 
    // Priority 2: Locked View (Force to Locked Offset)
    else if (isViewLocked.current) {
         // Spring to locked position for smooth locking, or snap?
         // Prompt says "gèle instantanément" but we capture the currentOffset so it shouldn't jump.
         // We simply drive the offset towards the locked point.
         targetOffset.current = lockedOffset.current;
         
         const stiffness = springConfig.stiffness; 
         const damping = springConfig.damping;
         const forceX = (targetOffset.current.x - currentOffset.current.x) * stiffness;
         const forceY = (targetOffset.current.y - currentOffset.current.y) * stiffness;
         velocity.current.x = (velocity.current.x + forceX) * damping;
         velocity.current.y = (velocity.current.y + forceY) * damping;
         nextX += velocity.current.x;
         nextY += velocity.current.y;
    }
    // Priority 3: Paused (Default to 0,0)
    else if (!isPlaying) {
         targetOffset.current = { x: 0, y: 0 };
         
         if (!isLowPowerMode) {
            const stiffness = springConfig.stiffness; 
            const damping = springConfig.damping;
            const forceX = (targetOffset.current.x - currentOffset.current.x) * stiffness;
            const forceY = (targetOffset.current.y - currentOffset.current.y) * stiffness;
            velocity.current.x = (velocity.current.x + forceX) * damping;
            velocity.current.y = (velocity.current.y + forceY) * damping;
            nextX += velocity.current.x;
            nextY += velocity.current.y;
        } else {
            // In low power, simple lerp back to center
            const lerpFactor = 0.15;
            nextX += (targetOffset.current.x - nextX) * lerpFactor;
            nextY += (targetOffset.current.y - nextY) * lerpFactor;
        }
    }
    // Priority 4: Playing (Follow Mouse/Gyro Target)
    else {
        // targetOffset is updated by mouse move listener
        if (!isLowPowerMode) {
            const stiffness = springConfig.stiffness; 
            const damping = springConfig.damping;

            const forceX = (targetOffset.current.x - currentOffset.current.x) * stiffness;
            const forceY = (targetOffset.current.y - currentOffset.current.y) * stiffness;

            velocity.current.x = (velocity.current.x + forceX) * damping;
            velocity.current.y = (velocity.current.y + forceY) * damping;

            nextX += velocity.current.x;
            nextY += velocity.current.y;
        } else {
            const lerpFactor = 0.15;
            nextX += (targetOffset.current.x - nextX) * lerpFactor;
            nextY += (targetOffset.current.y - nextY) * lerpFactor;
        }
    }

    currentOffset.current.x = nextX;
    currentOffset.current.y = nextY;

    applyParallaxTransforms(nextX, nextY);
    
    if (exportConfig?.isRecording && recordingCanvas.current && recorderRef.current?.state === 'recording') {
        const ctx = recordingCanvas.current.getContext('2d');
        if (ctx) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);

            const maxPx = (parallaxStrength / 100) * OVERSCAN_MARGIN;
            const direction = parallaxInverted ? -1 : 1;
            
            [0, 1, 2, 3, 4, 5, 6].forEach(index => {
                const source = offscreenCanvases.current[index];
                if (!source) return;

                const relativeDepth = (index - focalLayerIndex) * 0.5;
                const offX = -nextX * maxPx * relativeDepth * direction;
                const offY = -nextY * maxPx * relativeDepth * direction;

                const drawX = (dimensions.width - source.width) / 2 + offX;
                const drawY = (dimensions.height - source.height) / 2 + offY;

                let effectiveBlur = 0;
                const manualBlur = (layerBlurStrengths && layerBlurStrengths[index]) || 0;

                if (focusRange < 0) {
                    effectiveBlur = Math.max(blurStrength, manualBlur);
                } else {
                    const dist = Math.abs(index - focalLayerIndex);
                    const depthBlur = Math.max(0, dist - focusRange) * blurStrength;
                    effectiveBlur = Math.max(depthBlur, manualBlur);
                }

                ctx.save();
                if (effectiveBlur > 0) {
                    ctx.filter = `blur(${effectiveBlur}px)`;
                }

                let mixBlend = 'normal';
                const modeToUse = layerBlendModes[index] !== 'normal' ? layerBlendModes[index] : globalLayerBlendMode;
                if (modeToUse === 'multiply') mixBlend = 'multiply';
                else if (modeToUse === 'overlay') mixBlend = 'overlay';
                else if (modeToUse === 'difference') mixBlend = 'difference';
                
                ctx.globalCompositeOperation = mixBlend as GlobalCompositeOperation;
                ctx.drawImage(source, drawX, drawY);
                
                ctx.restore(); 
            });
        }
    }

    requestRef.current = requestAnimationFrame(animationLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animationLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [parallaxStrength, focalLayerIndex, springConfig, parallaxInverted, isLowPowerMode, exportConfig, blurStrength, focusRange, layerBlurStrengths, getScaleFactor, guideColor, isPlaying]); 

  const getNormalizedLocalPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent, overrideLayerId?: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
    }

    // Parallax Compensation Logic:
    // When Parallax moves the layer visually, the mouse click must be mapped
    // to the correct original coordinate on that layer.
    
    const layerToUse = overrideLayerId ?? activeLayer;
    const maxPx = (parallaxStrength / 100) * OVERSCAN_MARGIN;
    const relativeDepth = (layerToUse - focalLayerIndex) * 0.5;
    const direction = parallaxInverted ? -1 : 1;
    
    // The visual offset applied to the layer
    const offsetX = -currentOffset.current.x * maxPx * relativeDepth * direction;
    const offsetY = -currentOffset.current.y * maxPx * relativeDepth * direction;

    // "Reverse" the offset to find the point on the untransformed canvas
    let x = (clientX - rect.left) - offsetX;
    let y = (clientY - rect.top) - offsetY;
    
    // CENTER-BASED SNAPPING
    // FIX: Removed !isPlaying check. Snapping now works during play.
    if (overrideLayerId === undefined && isGridEnabled && isSnappingEnabled) {
        // Calculate the center of the viewport (container)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Snapping logic:
        // 1. Calculate distance from center (delta)
        // 2. Snap this delta to nearest grid multiple
        // 3. Re-apply center offset
        const snapToCenter = (val: number, center: number) => {
            const rel = val - center;
            const snappedRel = Math.round(rel / gridSize) * gridSize;
            return center + snappedRel;
        };

        x = snapToCenter(x, centerX);
        y = snapToCenter(y, centerY);
    }

    return normalizePoint(x, y, rect.width, rect.height);
  };

  const hitTest = (pt: Point, layerId: number) => {
      const pxPt = denormalizePoint(pt, dimensions.width, dimensions.height);
      const layerStrokes = strokes.filter(s => s.layerId === layerId).reverse();
      const scaleFactor = getScaleFactor();
      
      for (const stroke of layerStrokes) {
          for (let i = 0; i < stroke.points.length - 1; i++) {
               const p1 = denormalizePoint(stroke.points[i], dimensions.width, dimensions.height);
               const p2 = denormalizePoint(stroke.points[i+1], dimensions.width, dimensions.height);
               
               const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
               let t = ((pxPt.x - p1.x) * (p2.x - p1.x) + (pxPt.y - p1.y) * (p2.y - p1.y)) / (l2 || 1);
               t = Math.max(0, Math.min(1, t));
               const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y, 2) };
               const d = Math.sqrt(Math.pow(pxPt.x - proj.x, 2) + Math.pow(pxPt.y - proj.y, 2));

               if (d < (stroke.size * scaleFactor) + 5) return stroke;
          }
      }
      return null;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (exportConfig?.isActive) return;

      for (const layerId of [6, 5, 4, 3, 2, 1, 0]) {
          const pt = getNormalizedLocalPoint(e, layerId);
          const hitStroke = hitTest(pt, layerId);
          if (hitStroke && onColorPick) {
              onColorPick(hitStroke.colorSlot);
              setPickerFeedback({ x: e.clientX, y: e.clientY, color: palette[hitStroke.colorSlot], active: true });
              setTimeout(() => setPickerFeedback(prev => ({...prev, active: false})), 400);
              return;
          }
      }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (exportConfig?.isActive) {
        onStopPreview?.();
        return; 
    }
    
    // Removed isPlaying block to allow drawing while playing
    // if (isPlaying && isMobile) return; 

    if (isEmbedMode && isMobile) {
        isDraggingView.current = true;
        return;
    }

    const pt = getNormalizedLocalPoint(e);

    if (activeTool === ToolType.SELECT) {
        const hit = hitTest(pt, activeLayer);
        setSelectedStrokeId(hit ? hit.id : null);
        if (hit) {
            isDraggingSelection.current = true;
            dragStartPos.current = pt;
        }
        return;
    }

    if (activeTool === ToolType.ERASER && eraserMode === EraserMode.STROKE) {
        const hit = hitTest(pt, activeLayer);
        if (hit) {
            onStrokeCommit(strokes.filter(s => s.id !== hit.id));
        }
        return;
    }

    isDrawing.current = true;
    currentStrokePoints.current = [pt];
    setSelectedStrokeId(null);
  };

  const generateSymmetryStrokes = (baseStroke: Stroke): Stroke[] => {
      if (symmetryMode === SymmetryMode.NONE) return [baseStroke];

      const strokes: Stroke[] = [baseStroke];
      const newPoints = baseStroke.points;

      if (symmetryMode === SymmetryMode.HORIZONTAL || symmetryMode === SymmetryMode.QUAD) {
          const hPoints = newPoints.map(p => ({ x: 1 - p.x, y: p.y }));
          strokes.push({ ...baseStroke, id: baseStroke.id + '_h', points: hPoints });
      }
      if (symmetryMode === SymmetryMode.VERTICAL || symmetryMode === SymmetryMode.QUAD) {
          const vPoints = newPoints.map(p => ({ x: p.x, y: 1 - p.y }));
          strokes.push({ ...baseStroke, id: baseStroke.id + '_v', points: vPoints });
      }
      if (symmetryMode === SymmetryMode.QUAD) {
          const qPoints = newPoints.map(p => ({ x: 1 - p.x, y: 1 - p.y }));
          strokes.push({ ...baseStroke, id: baseStroke.id + '_q', points: qPoints });
      }
      if (symmetryMode === SymmetryMode.CENTRAL) {
          const cPoints = newPoints.map(p => ({ x: 1 - p.x, y: 1 - p.y }));
          strokes.push({ ...baseStroke, id: baseStroke.id + '_c', points: cPoints });
      }

      return strokes;
  };

  // Note: Standard handlePointerMove is not attached to the div anymore for drawing, only for embed dragging
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isEmbedMode && containerRef.current) {
         let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        const { width, height, left, top } = containerRef.current.getBoundingClientRect();
        
        if (isDraggingView.current || (!('touches' in e) && isEmbedMode)) { 
            const x = ((clientX - left) / width) * 2 - 1;
            const y = ((clientY - top) / height) * 2 - 1;
            targetOffset.current = { x, y };
        }
        
        if (isEmbedMode && isMobile && 'touches' in e) return;
    }

    // Standard drawing move is handled by window listener in useEffect
  };

  const handlePointerUp = () => {
    if (isDraggingView.current) {
        isDraggingView.current = false;
        return;
    }
    // Standard drawing up is handled by window listener in useEffect
  };

  return (
    <>
        <div 
            ref={containerRef}
            className="relative w-full h-full cursor-crosshair overflow-hidden"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            // onMouseLeave removed to allow drawing outside
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onContextMenu={handleContextMenu}
            style={{
                touchAction: 'none',
                backgroundColor: backgroundColor 
            }}
        >
        {[0, 1, 2, 3, 4, 5, 6].map(layerIndex => {
            let effectiveBlur = 0;
            const manualBlur = (layerBlurStrengths && layerBlurStrengths[layerIndex]) || 0;

            if (focusRange < 0) {
                effectiveBlur = Math.max(blurStrength, manualBlur);
            } else {
                const dist = Math.abs(layerIndex - focalLayerIndex);
                const depthBlur = Math.max(0, dist - focusRange) * blurStrength;
                effectiveBlur = Math.max(depthBlur, manualBlur);
            }
            
            const showOnion = isOnionSkinEnabled && !isPlaying && !exportConfig?.isActive;

            return (
                <div
                    key={layerIndex}
                    className="layer-canvas absolute left-1/2 top-1/2 w-full h-full pointer-events-none will-change-transform"
                    style={{ 
                        zIndex: layerIndex,
                        opacity: showOnion ? (layerIndex === activeLayer ? 1 : 0.6) : 1,
                        filter: `blur(${effectiveBlur}px) ${showOnion && layerIndex !== activeLayer ? 'grayscale(30%)' : ''}`,
                        transition: 'opacity 0.2s, filter 0.2s',
                        mixBlendMode: layerBlendModes[layerIndex] !== 'normal' 
                            ? layerBlendModes[layerIndex] 
                            : globalLayerBlendMode
                    }}
                >
                    <canvas 
                        ref={(el) => { offscreenCanvases.current[layerIndex] = el; }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                </div>
            );
        })}
        {/* Visual Indicator for View Lock */}
        {isViewLocked.current && (
             <div className="absolute top-4 right-4 pointer-events-none px-3 py-1 bg-[var(--active-color)] text-white text-xs font-bold rounded-full opacity-70 animate-pulse shadow-lg">
                 VIEW LOCKED
             </div>
        )}
        </div>
        
        {pickerFeedback.active && (
            <div 
                className="fixed pointer-events-none z-[100] w-12 h-12 rounded-full border-4 border-white shadow-lg animate-ping"
                style={{ 
                    left: pickerFeedback.x, 
                    top: pickerFeedback.y, 
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: pickerFeedback.color 
                }}
            />
        )}
    </>
  );
};
