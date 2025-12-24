import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SlideElement } from '../types';

interface DraggableElementProps {
  element: SlideElement;
  isSelected: boolean;
  readOnly: boolean;
  zoomScale?: number;
  onSelect: (id: string) => void;
  onChange: (id: string, updates: Partial<SlideElement>) => void;
  onDrag?: (id: string, x: number, y: number) => { x: number; y: number }; // For smart guides snapping
  onDragStateChange?: (isDragging: boolean, elementId: string) => void;
}

// Debounce delay for text sync (ms) - prevents jitter on remote deploy
const TEXT_SYNC_DEBOUNCE = 500;

const _DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  isSelected,
  readOnly,
  zoomScale = 1,
  onSelect,
  onChange,
  onDrag,
  onDragStateChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Local text state for smooth typing (prevents jitter on Vercel deploy)
  const [localText, setLocalText] = useState(element.content);
  const textSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Sync from parent when not actively typing
  useEffect(() => {
    if (!isTypingRef.current && element.content !== localText) {
      setLocalText(element.content);
    }
  }, [element.content]);

  // Debounced text sync handler
  const handleTextChange = useCallback((newText: string) => {
    // Update local state immediately for smooth typing
    setLocalText(newText);
    isTypingRef.current = true;

    // Clear existing timeout
    if (textSyncTimeoutRef.current) {
      clearTimeout(textSyncTimeoutRef.current);
    }

    // Debounce the parent state update
    textSyncTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onChange(element.id, { content: newText });
    }, TEXT_SYNC_DEBOUNCE);
  }, [element.id, onChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (textSyncTimeoutRef.current) {
        clearTimeout(textSyncTimeoutRef.current);
      }
    };
  }, []);

  // Flush pending text sync when exiting edit mode
  const handleExitEditMode = useCallback(() => {
    if (textSyncTimeoutRef.current) {
      clearTimeout(textSyncTimeoutRef.current);
      textSyncTimeoutRef.current = null;
    }
    // Sync immediately if there's unsaved text
    if (localText !== element.content) {
      isTypingRef.current = false;
      onChange(element.id, { content: localText });
    }
    setIsEditing(false);
  }, [element.id, element.content, localText, onChange]);

  // Local offset for smooth dragging (CSS transform based)
  // We use refs instead of state for dragOffset while dragging to avoid re-renders
  // const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // REMOVED
  const [resizeOffset, setResizeOffset] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const elementRef = useRef<HTMLDivElement>(null);

  // Refs for tracking values inside event listeners without re-binding
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 }); // Track latest drag offset
  const resizeOffsetRef = useRef({ x: 0, y: 0, w: 0, h: 0 }); // Track latest resize offset

  // Exit edit mode when element is deselected
  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return;
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    if (isEditing && element.type === 'text') return;

    e.stopPropagation();
    console.log('DraggableElement: onSelect', element.id);
    onSelect(element.id);
    console.log('DraggableElement: setIsDragging(true)');
    setIsDragging(true);
    console.log('DraggableElement: onDragStateChange(true)');
    onDragStateChange?.(true, element.id);

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementStartRef.current = { x: element.x, y: element.y, w: element.width, h: element.height };

    dragOffsetRef.current = { x: 0, y: 0 };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    if (element.type === 'text') {
      setIsEditing(true);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (readOnly) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    elementStartRef.current = { x: element.x, y: element.y, w: element.width, h: element.height };
    setResizeOffset({ x: 0, y: 0, w: 0, h: 0 });
    resizeOffsetRef.current = { x: 0, y: 0, w: 0, h: 0 };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // console.log('DraggableElement: mousemove', { isDragging, isResizing });
      if (!dragStartRef.current || !elementStartRef.current) return;

      const dx = (e.clientX - dragStartRef.current.x) / zoomScale;
      const dy = (e.clientY - dragStartRef.current.y) / zoomScale;

      if (isDragging) {
        // Calculate raw new position
        let newX = elementStartRef.current.x + dx;
        let newY = elementStartRef.current.y + dy;

        // Apply snapping if onDrag handler is provided
        if (onDrag) {
          const snapped = onDrag(element.id, newX, newY);
          newX = snapped.x;
          newY = snapped.y;
        }

        // Calculate offset based on potentially snapped position
        const offsetX = newX - elementStartRef.current.x;
        const offsetY = newY - elementStartRef.current.y;

        // Update ref and state
        dragOffsetRef.current = { x: offsetX, y: offsetY };

        // Direct DOM manipulation for performance (no re-renders)
        if (elementRef.current) {
          elementRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        }
        // setDragOffset({ x: offsetX, y: offsetY }); // REMOVED

        // NOTE: We do NOT call onChange here anymore, to avoid flooding backend/global state.
        // Screen updates are handled via setDragOffset (local) and activeGuides (parent state via onDrag)
      } else if (isResizing && elementStartRef.current) {
        const { w, h } = elementStartRef.current;
        let offsetX = 0, offsetY = 0, offsetW = 0, offsetH = 0;

        if (resizeHandle?.includes('e')) offsetW = dx;
        if (resizeHandle?.includes('w')) {
          const deltaW = Math.min(w - 20, dx);
          offsetX = deltaW;
          offsetW = -deltaW;
        }
        if (resizeHandle?.includes('s')) offsetH = dy;
        if (resizeHandle?.includes('n')) {
          const deltaH = Math.min(h - 20, dy);
          offsetY = deltaH;
          offsetH = -deltaH;
        }

        resizeOffsetRef.current = { x: offsetX, y: offsetY, w: offsetW, h: offsetH };
        setResizeOffset({ x: offsetX, y: offsetY, w: offsetW, h: offsetH });

        // For resize, we might still want immediate feedback in parent if needed, 
        // but for now let's keep it consistent: visual only
      }
    };

    const handleMouseUp = () => {
      if (isDragging && elementStartRef.current) {
        // Commit the final position using the latest Ref value
        const finalX = elementStartRef.current.x + dragOffsetRef.current.x;
        const finalY = elementStartRef.current.y + dragOffsetRef.current.y;

        // Reset transform before commit
        if (elementRef.current) {
          elementRef.current.style.transform = '';
        }

        onChange(element.id, { x: finalX, y: finalY });
        onDragStateChange?.(false, element.id);
      }

      if (isResizing && elementStartRef.current) {
        const { x, y, w, h } = elementStartRef.current;
        const ro = resizeOffsetRef.current;

        onChange(element.id, {
          x: x + ro.x,
          y: y + ro.y,
          width: Math.max(20, w + ro.w),
          height: Math.max(20, h + ro.h),
        });
      }

      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      // setDragOffset({ x: 0, y: 0 }); // REMOVED
      setResizeOffset({ x: 0, y: 0, w: 0, h: 0 });
      dragOffsetRef.current = { x: 0, y: 0 };
      resizeOffsetRef.current = { x: 0, y: 0, w: 0, h: 0 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    resizeHandle,
    element.id,
    zoomScale,
    onChange,
    onDrag,
    onDragStateChange
  ]);

  // Calculate visual position (element position + drag offset)
  // dragOffset removed from render calc
  const visualX = element.x + (isResizing ? resizeOffset.x : 0);
  const visualY = element.y + (isResizing ? resizeOffset.y : 0);
  const visualW = element.width + (isResizing ? resizeOffset.w : 0);
  const visualH = element.height + (isResizing ? resizeOffset.h : 0);

  const styles: React.CSSProperties = {
    position: 'absolute',
    left: visualX,
    top: visualY,
    width: Math.max(20, visualW),
    height: Math.max(20, visualH),
    cursor: isDragging ? 'grabbing' : (readOnly ? 'default' : 'grab'),
    border: isSelected && !readOnly ? '2px solid #3b82f6' : element.style?.border || '1px solid transparent',
    boxSizing: 'border-box',
    userSelect: isEditing ? 'text' : 'none',
    willChange: isDragging || isResizing ? 'left, top, width, height' : 'auto',
  };

  return (
    <div
      ref={elementRef}
      className="slide-element group"
      style={styles}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => { e.stopPropagation(); onSelect(element.id); }}
    >
      {/* Content Rendering */}
      {element.type === 'text' && (
        <>
          {isEditing && !readOnly ? (
            <textarea
              autoFocus
              className="w-full h-full p-2 bg-transparent resize-none border-none outline-none focus:ring-0 overflow-hidden"
              style={{
                fontSize: element.style?.fontSize,
                fontWeight: element.style?.fontWeight,
                fontStyle: element.style?.fontStyle,
                textAlign: element.style?.textAlign,
                textDecoration: element.style?.textDecoration,
                color: element.style?.color,
                fontFamily: element.style?.fontFamily || 'inherit',
                cursor: 'text',
              }}
              value={localText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onBlur={handleExitEditMode}
            />
          ) : (
            <div
              className="w-full h-full p-2 pointer-events-none whitespace-pre-wrap flex"
              style={{
                fontSize: element.style?.fontSize,
                fontWeight: element.style?.fontWeight,
                fontStyle: element.style?.fontStyle,
                textAlign: element.style?.textAlign,
                textDecoration: element.style?.textDecoration,
                color: element.style?.color,
                fontFamily: element.style?.fontFamily || 'inherit',
                alignItems: element.style?.alignItems || 'flex-start',
                justifyContent: element.style?.textAlign === 'center' ? 'center' : element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
              }}
            >
              <span style={{ width: '100%', textAlign: element.style?.textAlign }}>{localText}</span>
            </div>
          )}
        </>
      )}

      {element.type === 'image' && (
        <>
          {element.content && element.content !== 'uploading...' && element.content !== '' ? (
            <img
              src={element.content}
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found')}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 rounded">
              {element.content === 'uploading...' ? (
                <>
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs text-slate-500">読み込み中...</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-slate-400">画像を選択</span>
                </>
              )}
            </div>
          )}
        </>
      )}

      {element.type === 'shape' && (
        <>
          {/* Rectangle (default) */}
          {(!element.style?.shapeType || element.style.shapeType === 'rectangle') && (
            <div
              className="w-full h-full"
              style={{
                backgroundColor: element.style?.backgroundColor || '#3b82f6',
                borderRadius: element.style?.borderRadius
              }}
            />
          )}

          {/* Circle */}
          {element.style?.shapeType === 'circle' && (
            <div
              className="w-full h-full rounded-full"
              style={{
                backgroundColor: element.style?.backgroundColor || '#3b82f6',
              }}
            />
          )}

          {/* Triangle - using CSS borders or SVG */}
          {element.style?.shapeType === 'triangle' && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <polygon
                points="50,0 100,100 0,100"
                fill={element.style?.backgroundColor || '#3b82f6'}
              />
            </svg>
          )}
        </>
      )}

      {/* Resize Handles */}
      {isSelected && !readOnly && !isEditing && (
        <>
          <div className="resize-handle absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-sm cursor-nwse-resize" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-sm cursor-nesw-resize" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-sm cursor-nesw-resize" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="resize-handle absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-sm cursor-nwse-resize" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle absolute top-1/2 -left-1 w-2 h-4 -translate-y-1/2 bg-white border-2 border-blue-500 rounded-sm cursor-ew-resize" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle absolute top-1/2 -right-1 w-2 h-4 -translate-y-1/2 bg-white border-2 border-blue-500 rounded-sm cursor-ew-resize" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle absolute -top-1 left-1/2 w-4 h-2 -translate-x-1/2 bg-white border-2 border-blue-500 rounded-sm cursor-ns-resize" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle absolute -bottom-1 left-1/2 w-4 h-2 -translate-x-1/2 bg-white border-2 border-blue-500 rounded-sm cursor-ns-resize" onMouseDown={(e) => handleResizeStart(e, 's')} />
        </>
      )}
    </div>
  );
};

// Memoize specifically to prevent re-renders when other elements are being dragged (parent state changes)
export const DraggableElement = React.memo(_DraggableElement, (prev, next) => {
  return (
    prev.element === next.element &&
    prev.isSelected === next.isSelected &&
    prev.readOnly === next.readOnly &&
    prev.zoomScale === next.zoomScale &&
    prev.onDrag === next.onDrag &&
    prev.onDragStateChange === next.onDragStateChange
  );
});
