import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Settings, MessageSquare, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Type, Square, Circle, Triangle, MousePointer2, Undo2, Redo2, Copy } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Slide, SlideElement } from "../types";
import "../styles/SlideEditor.css";
import { DraggableElement } from "./DraggableElement";
// generateLayoutElements is dynamically imported

// Type for other users' selections
interface UserSelection {
  clientId: number;
  user: { name: string; color: string };
  selectedElementId?: string | null;
  slideId?: string;
}

interface SlideEditorProps {
  slide: Slide;
  projectId: string;
  readOnly?: boolean;
  messages?: Array<{ id: string; sender: string; text: string; timestamp: number }>;
  onSendMessage?: (text: string) => Promise<void>;
  username?: string;
  hasUnreadMessages?: boolean; // Add unread status flag
  onChatViewed?: () => void; // Callback when chat is viewed
  // Awareness props for showing other users' selections
  otherUsersSelections?: UserSelection[];
  onElementSelect?: (elementId: string | null) => void;
}

// 16:9 Aspect Ratio Base Dimensions
const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

export default function SlideEditor({
  slide,
  projectId,
  readOnly = false,
  messages = [],
  onSendMessage,
  username,
  hasUnreadMessages = false,
  onChatViewed,
  otherUsersSelections = [],
  onElementSelect,
}: SlideEditorProps) {
  const { updateSlide } = useApp();
  const [activeTab, setActiveTab] = useState<'settings' | 'chat'>('settings');
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const { offsetWidth, offsetHeight } = canvasContainerRef.current;
        // Padding/Margin subtraction to keep it looking nice
        const availableWidth = offsetWidth - 48;
        const availableHeight = offsetHeight - 48;

        const scaleX = availableWidth / SLIDE_WIDTH;
        const scaleY = availableHeight / SLIDE_HEIGHT;

        setScale(Math.min(scaleX, scaleY, 1.5));
      }
    };

    window.addEventListener('resize', handleResize);
    // Timeout to ensure layout is settled
    const t = setTimeout(handleResize, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, []);

  // Call onChatViewed when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && onChatViewed) {
      onChatViewed();
    }
  }, [activeTab, onChatViewed]);

  // Element Selection State
  const [selectedElementId, setSelectedElementIdState] = useState<string | null>(null);

  // Wrapper to notify parent about selection change for awareness
  const setSelectedElementId = useCallback((id: string | null) => {
    setSelectedElementIdState(id);
    onElementSelect?.(id);
  }, [onElementSelect]);

  // No persistent cache - content is read directly from elements during layout switch
  // Backup persistence for layout switching (fixes data loss if backend sync is slow)
  const savedContentRef = useRef<Record<string, string>>({});

  // Reset/Sync local memory when slide changes
  useEffect(() => {
    savedContentRef.current = slide.savedContent || {};
  }, [slide.id, slide.savedContent]);

  // --- Sidebar Text Input with Debounce (prevents jitter on Vercel) ---
  const SIDEBAR_TEXT_DEBOUNCE = 500;
  const [sidebarText, setSidebarText] = useState("");
  const sidebarTextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSidebarTypingRef = useRef(false);
  // Store a ref to updateSlide to avoid stale closures in setTimeout
  const updateSlideRef = useRef(updateSlide);
  useEffect(() => {
    updateSlideRef.current = updateSlide;
  }, [updateSlide]);

  // Sync sidebar text from selected element when selection changes or element content changes externally
  useEffect(() => {
    const selectedElement = slide.elements?.find(el => el.id === selectedElementId);
    if (selectedElement && !isSidebarTypingRef.current) {
      setSidebarText(selectedElement.content || "");
    }
  }, [selectedElementId, slide.elements]);

  // Cleanup sidebar text timeout
  useEffect(() => {
    return () => {
      if (sidebarTextTimeoutRef.current) {
        clearTimeout(sidebarTextTimeoutRef.current);
      }
    };
  }, []);

  // --- Undo/Redo History (Simple approach) ---
  const MAX_HISTORY = 50;
  const [undoStack, setUndoStack] = useState<SlideElement[][]>([]);
  const [redoStack, setRedoStack] = useState<SlideElement[][]>([]);
  const isUndoRedoAction = useRef(false);
  const lastSavedJson = useRef<string>('');

  // Reset stacks when slide changes
  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
    lastSavedJson.current = JSON.stringify(slide.elements || []);
  }, [slide.id]);

  // Record changes to undo stack immediately
  useEffect(() => {
    const currentJson = JSON.stringify(slide.elements || []);

    // Skip if this is an undo/redo action
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      lastSavedJson.current = currentJson;
      return;
    }

    // Skip if nothing changed
    if (currentJson === lastSavedJson.current) {
      return;
    }

    // Skip initial empty state
    if (lastSavedJson.current === '') {
      lastSavedJson.current = currentJson;
      return;
    }

    // Save previous state to undo stack
    const previousElements = JSON.parse(lastSavedJson.current) as SlideElement[];
    setUndoStack(prev => {
      console.log('SlideEditor: Adding to undo stack. New size:', prev.length + 1);
      return [...prev.slice(-(MAX_HISTORY - 1)), previousElements];
    });
    setRedoStack([]); // Clear redo on new action
    lastSavedJson.current = currentJson;
  }, [slide.elements]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const handleUndo = useCallback(() => {
    console.log('SlideEditor: handleUndo called. Stack size:', undoStack.length, 'ReadOnly:', readOnly);
    if (undoStack.length === 0 || readOnly) return;

    isUndoRedoAction.current = true;

    const previousState = undoStack[undoStack.length - 1];
    const currentState = slide.elements || [];

    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    updateSlide(projectId, slide.id, { elements: previousState });
  }, [undoStack, slide.elements, readOnly, projectId, slide.id, updateSlide]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || readOnly) return;

    isUndoRedoAction.current = true;

    const nextState = redoStack[redoStack.length - 1];
    const currentState = slide.elements || [];

    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    updateSlide(projectId, slide.id, { elements: nextState });
  }, [redoStack, slide.elements, readOnly, projectId, slide.id, updateSlide]);

  // --- Duplicate Element ---
  const handleDuplicateElement = useCallback(() => {
    if (readOnly || !selectedElementId) return;
    const currentElements = slide.elements || [];
    const elementToDuplicate = currentElements.find(el => el.id === selectedElementId);
    if (!elementToDuplicate) return;

    const newElement: SlideElement = {
      ...JSON.parse(JSON.stringify(elementToDuplicate)),
      id: crypto.randomUUID(),
      x: elementToDuplicate.x + 20,
      y: elementToDuplicate.y + 20,
    };

    updateSlide(projectId, slide.id, { elements: [...currentElements, newElement] });
    setSelectedElementId(newElement.id);
  }, [readOnly, selectedElementId, slide.elements, projectId, slide.id, updateSlide]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
      // Duplicate: Ctrl+D
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicateElement();
      }
      // Delete: Delete or Backspace (when not editing text)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target as HTMLElement).matches('textarea, input')) {
        handleDeleteElement();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDuplicateElement]);

  // Content is now read directly from elements during layout switch - no persistent cache

  useEffect(() => {
    if (readOnly) setActiveTab('chat');
  }, [readOnly]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !onSendMessage) return;
    try {
      await onSendMessage(chatInput.trim());
      setChatInput("");
    } catch (e) {
      console.error(e);
    }
  };

  // --- Element Management ---

  const handleAddElement = (type: 'text' | 'image' | 'shape') => {
    if (readOnly) return;
    const newElement: SlideElement = {
      id: crypto.randomUUID(),
      type,
      content: type === 'text' ? 'New Text' : type === 'image' ? '' : '',
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 150,
      style: {
        fontSize: 20,
        backgroundColor: type === 'shape' ? '#3b82f6' : undefined,
        textAlign: 'left',
        color: '#000000',
        shapeType: type === 'shape' ? 'rectangle' : undefined,
      }
    };

    const currentElements = slide.elements || [];
    updateSlide(projectId, slide.id, { elements: [...currentElements, newElement] });
    setSelectedElementId(newElement.id);
  };

  const handleElementUpdate = useCallback((id: string, updates: Partial<SlideElement>) => {
    if (readOnly) return;
    const currentElements = slide.elements || [];
    let newSavedContent = slide.savedContent;

    const updatedElements = currentElements.map(el => {
      if (el.id === id) {
        // If content is changing and element has a role, update savedContent immediately
        if (updates.content !== undefined && el.role && el.role !== 'decoration') {
          newSavedContent = { ...(newSavedContent || {}), [el.role]: updates.content };
        }
        return { ...el, ...updates };
      }
      return el;
    });

    updateSlide(projectId, slide.id, { elements: updatedElements, savedContent: newSavedContent });
  }, [readOnly, slide.elements, slide.savedContent, projectId, slide.id, updateSlide]);

  const handleElementStyleUpdate = (id: string, styleUpdates: any) => {
    if (readOnly) return;
    const currentElements = slide.elements || [];
    const element = currentElements.find(el => el.id === id);
    if (element) {
      handleElementUpdate(id, { style: { ...element.style, ...styleUpdates } });
    }
  };

  // Debounced sidebar text change handler (defined after handleElementUpdate)
  const handleSidebarTextChange = useCallback((newText: string) => {
    setSidebarText(newText);
    isSidebarTypingRef.current = true;

    if (sidebarTextTimeoutRef.current) {
      clearTimeout(sidebarTextTimeoutRef.current);
    }

    sidebarTextTimeoutRef.current = setTimeout(() => {
      isSidebarTypingRef.current = false;
      if (selectedElementId) {
        handleElementUpdate(selectedElementId, { content: newText });
      }
    }, SIDEBAR_TEXT_DEBOUNCE);
  }, [selectedElementId, handleElementUpdate, SIDEBAR_TEXT_DEBOUNCE]);

  // Flush sidebar text on blur
  const handleSidebarTextBlur = useCallback(() => {
    if (sidebarTextTimeoutRef.current) {
      clearTimeout(sidebarTextTimeoutRef.current);
      sidebarTextTimeoutRef.current = null;
    }
    isSidebarTypingRef.current = false;
    const selectedElement = slide.elements?.find(el => el.id === selectedElementId);
    if (selectedElement && sidebarText !== selectedElement.content) {
      handleElementUpdate(selectedElementId!, { content: sidebarText });
    }
  }, [selectedElementId, sidebarText, slide.elements, handleElementUpdate]);

  const handleDeleteElement = () => {
    if (readOnly || !selectedElementId) return;
    const currentElements = slide.elements || [];
    const updatedElements = currentElements.filter(el => el.id !== selectedElementId);
    updateSlide(projectId, slide.id, { elements: updatedElements });
    setSelectedElementId(null);
  };

  const { updateSlide: updateSlideDirect } = useApp();
  const handleColorUpdate = (updates: Partial<Slide>) => {
    if (readOnly) return;
    updateSlideDirect(projectId, slide.id, updates);
  };

  // --- Smart Guides (Canva-like) ---
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [activeGuides, setActiveGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const SNAP_THRESHOLD = 8; // px - slightly larger for better UX

  const handleDragStateChange = useCallback((dragging: boolean, elementId: string) => {
    console.log('SlideEditor: handleDragStateChange', { dragging, elementId });
    setIsDraggingElement(dragging);

    if (!dragging) {
      setGuides({ x: [], y: [] });
      setActiveGuides({ x: [], y: [] });
      return;
    }

    // Calculate guide positions based on other elements
    const currentElements = slide.elements || [];
    // Fallback: If updated state hasn't propagated, assume the dragged element is the valid one passed by ID
    const draggedElement = currentElements.find(el => el.id === elementId) || { id: elementId };
    if (!draggedElement) return;

    const xGuides: number[] = [];
    const yGuides: number[] = [];

    // Canvas center guides
    xGuides.push(SLIDE_WIDTH / 2);
    yGuides.push(SLIDE_HEIGHT / 2);

    // Canvas edges
    xGuides.push(0, SLIDE_WIDTH);
    yGuides.push(0, SLIDE_HEIGHT);

    // Other elements' edges and centers
    currentElements.forEach(el => {
      if (el.id === elementId) return;

      // Left, Center, Right of other elements
      xGuides.push(el.x, el.x + el.width / 2, el.x + el.width);
      // Top, Center, Bottom of other elements
      yGuides.push(el.y, el.y + el.height / 2, el.y + el.height);
    });

    setGuides({ x: [...new Set(xGuides)], y: [...new Set(yGuides)] });
  }, [slide.elements]);

  // New handleElementDrag for smooth snapping without committing
  const handleElementDrag = useCallback((id: string, x: number, y: number) => {
    if (readOnly) return { x, y };

    const currentElements = slide.elements || [];
    const element = currentElements.find(el => el.id === id);
    if (!element) return { x, y };

    let newX = x;
    let newY = y;
    const elWidth = element.width;
    const elHeight = element.height;

    const elRight = newX + elWidth;
    const elBottom = newY + elHeight;
    const elCenterX = newX + elWidth / 2;
    const elCenterY = newY + elHeight / 2;

    const activeX: number[] = [];
    const activeY: number[] = [];

    // Snap X (left, center, right) and track active guides
    for (const gx of guides.x) {
      if (Math.abs(newX - gx) < SNAP_THRESHOLD) {
        newX = gx;
        activeX.push(gx);
        break;
      }
      if (Math.abs(elCenterX - gx) < SNAP_THRESHOLD) {
        newX = gx - elWidth / 2;
        activeX.push(gx);
        break;
      }
      if (Math.abs(elRight - gx) < SNAP_THRESHOLD) {
        newX = gx - elWidth;
        activeX.push(gx);
        break;
      }
    }

    // Snap Y (top, center, bottom) and track active guides
    for (const gy of guides.y) {
      if (Math.abs(newY - gy) < SNAP_THRESHOLD) {
        newY = gy;
        activeY.push(gy);
        break;
      }
      if (Math.abs(elCenterY - gy) < SNAP_THRESHOLD) {
        newY = gy - elHeight / 2;
        activeY.push(gy);
        break;
      }
      if (Math.abs(elBottom - gy) < SNAP_THRESHOLD) {
        newY = gy - elHeight;
        activeY.push(gy);
        break;
      }
    }

    setActiveGuides({ x: activeX, y: activeY });
    return { x: newX, y: newY };
  }, [readOnly, slide.elements, guides]);

  // Helper to get selected element
  const selectedElement = slide.elements?.find(el => el.id === selectedElementId);

  const handleLayoutSelect = (template: Slide["template"]) => {
    if (readOnly) return;

    const currentElements = slide.elements || [];

    // --- STEP 1: GATHER CONTENT & IDENTIFY ROLES ---
    const currentContentByRole: Record<string, string> = {};
    const customElements: SlideElement[] = [];

    // Helper: Is this a decoration?
    const isDecoration = (role: string | undefined, content: string) => {
      return role === 'decoration' || content === '"' || content === '“' || content === '”';
    };

    const hasExplicitRoles = currentElements.some(el => !!el.role && el.role !== 'decoration');

    if (hasExplicitRoles) {
      // Strict Mode
      // Import layout specs to auto-heal missing roles
      import('../utils/layoutUtils').then(({ LAYOUT_SPECS }) => {
        const currentSpecs = LAYOUT_SPECS[slide.template] || {};

        currentElements.forEach(el => {
          // If element has a semantic role, use it
          if (el.role && !isDecoration(el.role, el.content)) {
            currentContentByRole[el.role] = el.content;
          }
          // If no role, try to rescue it based on specs
          else if (!el.role && !isDecoration(undefined, el.content)) {
            let matchedRole: string | undefined;

            // Try to match with current layout specs
            if (el.type === 'text') {
              for (const [role, spec] of Object.entries(currentSpecs)) {
                if (spec.type === 'text' && Math.abs(spec.y - el.y) < 50 && Math.abs(spec.x - el.x) < 50) {
                  matchedRole = role;
                  break;
                }
              }
            }

            if (matchedRole) {
              currentContentByRole[matchedRole] = el.content;
            } else {
              customElements.push(el);
            }
          }
        });

        // Continue with normal flow (step 2...)
        finishLayoutSelect(currentContentByRole, customElements, template);
      });
      return; // Async handling
    } else {
      // Legacy Mode: Guess roles once based on CURRENT template
      const sortedTexts = currentElements.filter(el => el.type === 'text' && !isDecoration(el.role, el.content)).sort((a, b) => a.y - b.y);
      const otherElements = currentElements.filter(el => el.type !== 'text' && !isDecoration(el.role, el.content));

      customElements.push(...otherElements);

      if (sortedTexts.length > 0) {
        currentContentByRole['title'] = sortedTexts[0].content;
        if (sortedTexts.length > 1) {
          if (slide.template === 'title') {
            currentContentByRole['subtitle'] = sortedTexts[1].content;
          } else {
            // Check vertical gap, if huge, maybe body
            currentContentByRole['body'] = sortedTexts[1].content;
          }
        }
        if (sortedTexts.length > 2) {
          currentContentByRole['body2'] = sortedTexts[2].content;
        }
      }
      finishLayoutSelect(currentContentByRole, customElements, template);
    }
  };

  const finishLayoutSelect = (
    currentContentByRole: Record<string, string>,
    customElements: SlideElement[],
    template: Slide["template"]
  ) => {
    // --- STEP 2: UPDATE GLOBAL MEMORY (savedContent) ---
    // Merge: SlideSaved < RefSaved < Current
    // We update the Ref to be the master source of truth for this session
    const newSavedContent = {
      ...(slide.savedContent || {}),
      ...savedContentRef.current,
      ...currentContentByRole
    };

    // Safety cleanup
    delete newSavedContent['decoration'];

    // Update local ref immediately so it survives this render cycle
    savedContentRef.current = newSavedContent;

    // --- STEP 3: GENERATE NEW LAYOUT ---
    import('../utils/layoutUtils').then(({ generateLayoutElements }) => {
      const newElements = generateLayoutElements(template);

      // --- STEP 4: FILL NEW LAYOUT FROM MEMORY ---
      // For each new element, look up its role in newSavedContent
      const mergedElements = newElements.map(el => {
        if (el.role && newSavedContent[el.role]) {
          return { ...el, content: newSavedContent[el.role] };
        }
        return el;
      });

      // --- STEP 5: SAVE ---
      // --- STEP 5: SAVE ---
      updateSlide(projectId, slide.id, {
        template,
        elements: [...mergedElements, ...customElements],
        savedContent: newSavedContent,
      });
    });
  };

  return (
    <div className="flex flex-1 w-full h-full gap-4">
      <div className="flex-1 flex flex-col relative h-full">

        {/* Slide Canvas Wrapper */}
        <div ref={canvasContainerRef} className="flex-1 overflow-hidden relative bg-slate-100 flex items-center justify-center">
          {/* The Scaled Canvas */}
          <div
            className="relative bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden transition-transform duration-100 ease-linear origin-center"
            style={{
              width: SLIDE_WIDTH,
              height: SLIDE_HEIGHT,
              transform: `scale(${scale})`,
              backgroundColor: slide.backgroundColor,
            }}
            onClick={() => setSelectedElementId(null)} // Deselect on background click
          >
            {/* Render Template Features (Title, etc) - Optional, can be removed if strictly element-based, 
                        but good to keep for legacy slides */}
            {!slide.elements?.length && (
              <div className="absolute inset-0 pointer-events-none opacity-50 flex items-center justify-center">
                <span className="text-slate-300 text-4xl font-bold uppercase tracking-widest border-2 border-dashed border-slate-300 p-4 rounded-xl">
                  {slide.template === 'blank' ? '空白のキャンバス' : slide.template}
                </span>
              </div>
            )}

            {/* Render Elements */}
            {slide.elements?.map(element => (
              <DraggableElement
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                readOnly={readOnly}
                zoomScale={scale}
                onSelect={setSelectedElementId}
                onChange={handleElementUpdate}
                onDrag={handleElementDrag}
                onDragStateChange={handleDragStateChange}
              />
            ))}

            {/* Other Users' Selection Overlays */}
            {otherUsersSelections
              .filter(sel => sel.selectedElementId && sel.slideId === slide.id)
              .map(sel => {
                const element = slide.elements?.find(el => el.id === sel.selectedElementId);
                if (!element) return null;
                return (
                  <div
                    key={`sel-${sel.clientId}`}
                    className="absolute pointer-events-none z-40"
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      border: `2px solid ${sel.user.color}`,
                      borderRadius: 4,
                    }}
                  >
                    {/* User name badge */}
                    <div
                      className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap"
                      style={{ backgroundColor: sel.user.color }}
                    >
                      {sel.user.name}
                    </div>
                  </div>
                );
              })
            }

            {/* Smart Guide Lines - Only show ACTIVE guides (Canva-style) */}
            {isDraggingElement && (
              <>
                {activeGuides.x.map((x, i) => {
                  const isCenter = x === SLIDE_WIDTH / 2;
                  return (
                    <div
                      key={`gx-${i}`}
                      className={`absolute top-0 bottom-0 pointer-events-none z-50 ${isCenter ? 'w-[2px] bg-blue-500' : 'w-px bg-pink-500'}`}
                      style={{ left: x - (isCenter ? 1 : 0) }}
                    >
                      {/* Center indicator dot */}
                      {isCenter && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  );
                })}
                {activeGuides.y.map((y, i) => {
                  const isCenter = y === SLIDE_HEIGHT / 2;
                  return (
                    <div
                      key={`gy-${i}`}
                      className={`absolute left-0 right-0 pointer-events-none z-50 ${isCenter ? 'h-[2px] bg-blue-500' : 'h-px bg-pink-500'}`}
                      style={{ top: y - (isCenter ? 1 : 0) }}
                    >
                      {/* Center indicator dot */}
                      {isCenter && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Floating Undo/Redo Buttons */}
          {!readOnly && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-1">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`p-2 rounded-md transition-colors ${canUndo ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'}`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={16} />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className={`p-2 rounded-md transition-colors ${canRedo ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'}`}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar (Settings & Chat) - Hidden for viewers */}
      {!readOnly && (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-lg z-10">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'settings' ? 'text-primary-600 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Settings size={16} /> プロパティ
              {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>}
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === 'chat' ? 'text-primary-600 bg-primary-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {hasUnreadMessages && activeTab !== 'chat' && (
                <span className="absolute top-2 right-6 flex h-2.5 w-2.5 z-10">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
              <MessageSquare size={16} /> チャット
              {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>}
            </button>
          </div>

          {/* Settings Panel */}
          {activeTab === 'settings' && !readOnly && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Insert Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">挿入</h3>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => setSelectedElementId(null)} className={`p-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${!selectedElementId ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} title="Select">
                    <MousePointer2 size={20} />
                    <span className="text-[10px]">選択</span>
                  </button>
                  <button onClick={() => handleAddElement('text')} className="p-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex flex-col items-center justify-center gap-1" title="Add Text">
                    <Type size={20} />
                    <span className="text-[10px]">テキスト</span>
                  </button>
                  <button onClick={() => handleAddElement('image')} className="p-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex flex-col items-center justify-center gap-1" title="Add Image">
                    <ImageIcon size={20} />
                    <span className="text-[10px]">画像</span>
                  </button>
                  <button onClick={() => handleAddElement('shape')} className="p-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex flex-col items-center justify-center gap-1" title="Add Shape">
                    <Square size={20} />
                    <span className="text-[10px]">図形</span>
                  </button>
                </div>
                {/* Actions Row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleDuplicateElement}
                    disabled={!selectedElementId}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${selectedElementId ? 'hover:bg-slate-100 text-slate-600' : 'text-slate-300 cursor-not-allowed'}`}
                    title="Duplicate (Ctrl+D)"
                  >
                    <Copy size={14} />
                    複製
                  </button>
                  <button
                    onClick={handleDeleteElement}
                    disabled={!selectedElementId}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${selectedElementId ? 'hover:bg-red-50 text-red-500' : 'text-slate-300 cursor-not-allowed'}`}
                    title="Delete"
                  >
                    削除
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Properties Section (Conditional) */}
              {selectedElement ? (
                <div>
                  <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-4">
                    {selectedElement.type === 'text' ? 'テキスト' : selectedElement.type === 'image' ? '画像' : '図形'} プロパティ
                  </h3>

                  <div className="space-y-3">
                    {selectedElement.type === 'text' && (
                      <>
                        {/* Content */}
                        <textarea
                          value={sidebarText}
                          onChange={(e) => handleSidebarTextChange(e.target.value)}
                          onBlur={handleSidebarTextBlur}
                          className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary-300 outline-none resize-none"
                          rows={2}
                          placeholder="テキストを入力..."
                        />

                        {/* Font + Size + Color row */}
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedElement.style?.fontFamily || 'Inter'}
                            onChange={(e) => handleElementStyleUpdate(selectedElement.id, { fontFamily: e.target.value })}
                            className="flex-1 h-8 px-2 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary-300 outline-none"
                          >
                            <option>Inter</option>
                            <option>Arial</option>
                            <option>Roboto</option>
                            <option>Georgia</option>
                            <option>Montserrat</option>
                          </select>
                          <input
                            type="number"
                            value={selectedElement.style?.fontSize || 20}
                            onChange={(e) => handleElementStyleUpdate(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                            className="w-14 h-8 px-2 bg-white border border-slate-200 rounded text-xs text-center focus:ring-1 focus:ring-primary-300 outline-none"
                          />
                          <div
                            className="relative w-8 h-8 rounded border border-slate-200 overflow-hidden cursor-pointer shrink-0"
                            style={{ backgroundColor: selectedElement.style?.color || '#000000' }}
                          >
                            <input
                              type="color"
                              value={selectedElement.style?.color || '#000000'}
                              onChange={(e) => handleElementStyleUpdate(selectedElement.id, { color: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Style + Alignment row */}
                        <div className="flex items-center gap-2">
                          {/* B I U */}
                          <div className="flex border border-slate-200 rounded overflow-hidden">
                            <button
                              onClick={() => handleElementStyleUpdate(selectedElement.id, { fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                              className={`w-7 h-7 flex items-center justify-center text-xs font-bold ${selectedElement.style?.fontWeight === 'bold' ? 'bg-primary-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >B</button>
                            <button
                              onClick={() => handleElementStyleUpdate(selectedElement.id, { fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                              className={`w-7 h-7 flex items-center justify-center text-xs italic border-l border-slate-200 ${selectedElement.style?.fontStyle === 'italic' ? 'bg-primary-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >I</button>
                            <button
                              onClick={() => handleElementStyleUpdate(selectedElement.id, { textDecoration: selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline' })}
                              className={`w-7 h-7 flex items-center justify-center text-xs underline border-l border-slate-200 ${selectedElement.style?.textDecoration === 'underline' ? 'bg-primary-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                            >U</button>
                          </div>

                          {/* Horizontal align */}
                          <div className="flex border border-slate-200 rounded overflow-hidden">
                            {[{ v: 'left', Icon: AlignLeft }, { v: 'center', Icon: AlignCenter }, { v: 'right', Icon: AlignRight }].map(({ v, Icon }, i) => (
                              <button
                                key={v}
                                onClick={() => handleElementStyleUpdate(selectedElement.id, { textAlign: v as any })}
                                className={`w-7 h-7 flex items-center justify-center ${i > 0 ? 'border-l border-slate-200' : ''} ${selectedElement.style?.textAlign === v ? 'bg-primary-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                              >
                                <Icon size={13} />
                              </button>
                            ))}
                          </div>

                          {/* Vertical align */}
                          <div className="flex border border-slate-200 rounded overflow-hidden">
                            {[{ v: 'flex-start', Icon: AlignVerticalJustifyStart }, { v: 'center', Icon: AlignVerticalJustifyCenter }, { v: 'flex-end', Icon: AlignVerticalJustifyEnd }].map(({ v, Icon }, i) => (
                              <button
                                key={v}
                                onClick={() => handleElementStyleUpdate(selectedElement.id, { alignItems: v })}
                                className={`w-7 h-7 flex items-center justify-center ${i > 0 ? 'border-l border-slate-200' : ''} ${selectedElement.style?.alignItems === v ? 'bg-primary-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                              >
                                <Icon size={13} />
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {selectedElement.type === 'shape' && (
                      <div className="space-y-3">
                        {/* Shape Type Selector */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">図形</label>
                          <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
                            <button
                              onClick={() => handleElementUpdate(selectedElement.id, { style: { ...(selectedElement.style || {}), shapeType: 'rectangle' } })}
                              className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${selectedElement.style?.shapeType === 'rectangle' || !selectedElement.style?.shapeType ? 'bg-white text-primary-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                              title="正方形"
                            >
                              <Square size={16} />
                            </button>
                            <button
                              onClick={() => handleElementUpdate(selectedElement.id, { style: { ...(selectedElement.style || {}), shapeType: 'circle' } })}
                              className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${selectedElement.style?.shapeType === 'circle' ? 'bg-white text-primary-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                              title="円"
                            >
                              <Circle size={16} />
                            </button>
                            <button
                              onClick={() => handleElementUpdate(selectedElement.id, { style: { ...(selectedElement.style || {}), shapeType: 'triangle' } })}
                              className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${selectedElement.style?.shapeType === 'triangle' ? 'bg-white text-primary-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                              title="三角形"
                            >
                              <Triangle size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Fill Color */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">塗りつぶし色</label>
                          <div className="flex items-center gap-3">
                            <div
                              className="relative w-8 h-8 rounded-lg border-2 border-slate-300 overflow-hidden shrink-0 shadow-sm"
                              style={{ backgroundColor: selectedElement.style?.backgroundColor || '#3b82f6' }}
                            >
                              <input
                                type="color"
                                value={selectedElement.style?.backgroundColor || '#3b82f6'}
                                onChange={(e) => handleElementStyleUpdate(selectedElement.id, { backgroundColor: e.target.value })}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={selectedElement.style?.backgroundColor || '#3b82f6'}
                                onChange={(e) => handleElementStyleUpdate(selectedElement.id, { backgroundColor: e.target.value })}
                                className="w-full h-8 px-3 py-1 rounded-md border border-slate-200 text-sm text-slate-600 font-medium uppercase focus:border-primary-300 focus:ring-2 focus:ring-primary-50 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedElement.type === 'image' && (
                      <div className="space-y-3">
                        {/* File Upload Button - Compact */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">画像</label>
                          <label className="flex items-center gap-2 w-full p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors bg-white">
                            <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center text-primary-600">
                              <ImageIcon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-700 truncate">
                                {selectedElement.content === 'uploading...'
                                  ? 'アップロード中...'
                                  : (selectedElement.content ? '画像を変更' : '画像をアップロード')}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {selectedElement.content && selectedElement.content !== 'uploading...'
                                  ? selectedElement.content.split('/').pop() || 'image.png'
                                  : 'クリックしてファイルを選択'}
                              </div>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                try {
                                  // Dynamic import to avoid breaking if service not configured
                                  const { uploadImageToSupabase, isSupabaseConfigured } = await import('../services/supabaseStorage');

                                  if (!isSupabaseConfigured()) {
                                    alert('Supabaseが構成されていません。 .envファイルにVITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYを追加してください');
                                    return;
                                  }

                                  // Show loading state via temporary content
                                  handleElementUpdate(selectedElement.id, { content: 'uploading...' });

                                  const url = await uploadImageToSupabase(file);
                                  handleElementUpdate(selectedElement.id, { content: url });
                                } catch (err) {
                                  console.error('Upload failed:', err);
                                  alert('画像のアップロードに失敗しました。再試行してください。');
                                  // Reset to placeholder
                                  handleElementUpdate(selectedElement.id, { content: '' });
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* URL Input - Compact */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">またはURL</label>
                          <input
                            type="text"
                            value={selectedElement.content === 'uploading...' ? '' : selectedElement.content}
                            onChange={(e) => handleElementUpdate(selectedElement.id, { content: e.target.value })}
                            placeholder="https://example.com/image.png"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:border-primary-300 focus:ring-2 focus:ring-primary-50 outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div>X: {Math.round(selectedElement.x)}</div>
                        <div>Y: {Math.round(selectedElement.y)}</div>
                        <div>W: {Math.round(selectedElement.width)}</div>
                        <div>H: {Math.round(selectedElement.height)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <p className="text-xs">要素が選択されていません</p>
                  <p className="text-[10px] mt-1">プロパティを編集するには要素を選択してください</p>
                </div>
              )}

              <hr className="border-slate-100" />

              {/* Background Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">背景</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative w-8 h-8 rounded-lg border-2 border-slate-300 overflow-hidden shrink-0 shadow-sm"
                      style={{ backgroundColor: slide.backgroundColor || '#ffffff' }}
                    >
                      <input
                        type="color"
                        value={slide.backgroundColor || '#ffffff'}
                        onChange={(e) => handleColorUpdate({ backgroundColor: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={slide.backgroundColor || '#ffffff'}
                        onChange={(e) => handleColorUpdate({ backgroundColor: e.target.value })}
                        className="w-full h-8 px-3 py-1 rounded-md border border-slate-200 text-sm text-slate-600 font-medium uppercase focus:border-primary-300 focus:ring-2 focus:ring-primary-50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Layouts Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">レイアウト</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['blank', 'title', 'title-content', 'two-column', 'image-text', 'quote', 'big-number'].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleLayoutSelect(t as Slide["template"])}
                      className={`p-2 rounded border text-xs text-center capitalize transition-all ${slide.template === t
                        ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}


          {/* Chat Panel */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="text-center mt-10">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <MessageSquare size={20} />
                    </div>
                    <p className="text-sm text-slate-400">メッセージはまだありません。</p>
                    <p className="text-xs text-slate-300">会話を始めましょう！</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender === username;
                    return (
                      <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[90%] ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                        {!isMe && <span className="text-[10px] text-slate-400 ml-1 mb-0.5">{msg.sender}</span>}
                        <div className={`px-3 py-2 rounded-2xl text-sm ${isMe
                          ? 'bg-primary-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
                          }`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-300 mt-1 mr-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="メッセージを入力..."
                    className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
