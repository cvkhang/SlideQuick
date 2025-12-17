// Y.js collaboration service for real-time sync
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Project, Slide, SlideElement } from '../types';

// WebSocket server URL
// @ts-ignore - Vite specific
const WS_URL = (import.meta as any).env?.VITE_YJS_WS_URL || 'ws://localhost:3001/yjs';

// Active providers and documents
const activeConnections = new Map<string, {
  doc: Y.Doc;
  provider: WebsocketProvider;
}>();

/**
 * Connect to a Y.js room for real-time collaboration
 */
export function connectToRoom(
  roomName: string,
  onProjectChange: (project: Project) => void,
  onConnectionStatus?: (status: 'connecting' | 'connected' | 'disconnected') => void
): () => void {
  // Check if already connected
  if (activeConnections.has(roomName)) {

    return () => disconnectFromRoom(roomName);
  }

  const ydoc = new Y.Doc();

  onConnectionStatus?.('connecting');

  const provider = new WebsocketProvider(
    WS_URL,
    roomName,
    ydoc,
    { connect: true }
  );

  // Connection status handlers
  provider.on('status', (event: { status: string }) => {

    if (event.status === 'connected') {
      onConnectionStatus?.('connected');
    } else if (event.status === 'disconnected') {
      onConnectionStatus?.('disconnected');
    }
  });

  // Handle connection errors
  provider.on('connection-error', (event: Event) => {
    console.error('Y.js WebSocket connection error:', event);
    onConnectionStatus?.('disconnected');
  });

  provider.on('sync', (isSynced: boolean) => {

    if (isSynced) {
      // Initial sync complete, get project data
      try {
        const project = getProjectFromDoc(ydoc);
        if (project) {
          onProjectChange(project);
        }
      } catch (err) {
        console.error('Error parsing project from Y.js doc:', err);
      }
    }
  });

  // Observe changes on the project map
  const yProject = ydoc.getMap('project');

  const observeDeep = () => {
    try {
      const project = getProjectFromDoc(ydoc);
      if (project) {
        onProjectChange(project);
      }
    } catch (err) {
      console.error('Error in Y.js observer:', err);
    }
  };

  yProject.observeDeep(observeDeep);

  // Store connection
  activeConnections.set(roomName, { doc: ydoc, provider });

  // Return cleanup function
  return () => disconnectFromRoom(roomName);
}

/**
 * Disconnect from a Y.js room
 */
export function disconnectFromRoom(roomName: string): void {
  const connection = activeConnections.get(roomName);
  if (connection) {
    connection.provider.disconnect();
    connection.doc.destroy();
    activeConnections.delete(roomName);

  }
}

/**
 * Initialize a project in Y.js document (for owner creating share session)
 */
export function initializeProjectInRoom(roomName: string, project: Project): void {
  const connection = activeConnections.get(roomName);
  if (!connection) {
    console.error(`Not connected to room: ${roomName}`);
    return;
  }

  const { doc } = connection;

  doc.transact(() => {
    const yProject = doc.getMap('project');

    // Set basic properties
    yProject.set('id', project.id);
    yProject.set('name', project.name);
    yProject.set('createdAt', project.createdAt?.toISOString?.() || String(project.createdAt));
    yProject.set('updatedAt', new Date().toISOString());

    // Initialize slides as Y.Array
    let ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;
    if (!ySlides) {
      ySlides = new Y.Array();
      yProject.set('slides', ySlides);
    }

    // Clear existing slides and add new ones
    ySlides.delete(0, ySlides.length);

    project.slides.forEach((slide) => {
      const ySlide = createYSlide(slide);
      ySlides!.push([ySlide]);
    });
  });


}

/**
 * Update a specific slide in Y.js document
 */
export function updateSlideInRoom(
  roomName: string,
  slideIndex: number,
  updates: Partial<Slide>
): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;
  const yProject = doc.getMap('project');
  const ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;

  if (!ySlides || slideIndex >= ySlides.length) return;

  doc.transact(() => {
    const ySlide = ySlides.get(slideIndex);
    if (!ySlide) return;

    // Update simple properties
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'elements' && Array.isArray(value)) {
        // Handle elements array specially
        let yElements = ySlide.get('elements') as Y.Array<Y.Map<any>> | undefined;
        if (!yElements) {
          yElements = new Y.Array();
          ySlide.set('elements', yElements);
        }

        // Clear and rebuild elements
        yElements.delete(0, yElements.length);
        value.forEach((el: SlideElement) => {
          const yElement = createYElement(el);
          yElements!.push([yElement]);
        });
      } else {
        ySlide.set(key, value);
      }
    });

    if (updates.savedContent) {
      ySlide.set('savedContent', JSON.stringify(updates.savedContent));
    }

    // Update timestamp
    yProject.set('updatedAt', new Date().toISOString());
  });
}

/**
 * Update element in Y.js document
 */
export function updateElementInRoom(
  roomName: string,
  slideIndex: number,
  elementIndex: number,
  updates: Partial<SlideElement>
): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;
  const yProject = doc.getMap('project');
  const ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;

  if (!ySlides || slideIndex >= ySlides.length) return;

  doc.transact(() => {
    const ySlide = ySlides.get(slideIndex);
    const yElements = ySlide?.get('elements') as Y.Array<Y.Map<any>> | undefined;

    if (!yElements || elementIndex >= yElements.length) return;

    const yElement = yElements.get(elementIndex);
    if (!yElement) return;

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        yElement.set('style', JSON.stringify(value));
      } else {
        yElement.set(key, value);
      }
    });

    yProject.set('updatedAt', new Date().toISOString());
  });
}

/**
 * Add a new slide to Y.js document
 */
export function addSlideToRoom(roomName: string, slide: Slide): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;
  const yProject = doc.getMap('project');
  const ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;

  if (!ySlides) return;

  doc.transact(() => {
    const ySlide = createYSlide(slide);
    ySlides.push([ySlide]);
    yProject.set('updatedAt', new Date().toISOString());
  });
}

/**
 * Delete a slide from Y.js document
 */
export function deleteSlideFromRoom(roomName: string, slideIndex: number): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;
  const yProject = doc.getMap('project');
  const ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;

  if (!ySlides || slideIndex >= ySlides.length) return;

  doc.transact(() => {
    ySlides.delete(slideIndex, 1);
    yProject.set('updatedAt', new Date().toISOString());
  });
}

/**
 * Add element to slide
 */
export function addElementToRoom(roomName: string, slideIndex: number, element: SlideElement): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;
  const yProject = doc.getMap('project');
  const ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;

  if (!ySlides || slideIndex >= ySlides.length) return;

  doc.transact(() => {
    const ySlide = ySlides.get(slideIndex);
    let yElements = ySlide?.get('elements') as Y.Array<Y.Map<any>> | undefined;

    if (!yElements) {
      yElements = new Y.Array();
      ySlide?.set('elements', yElements);
    }

    const yElement = createYElement(element);
    yElements.push([yElement]);
    yProject.set('updatedAt', new Date().toISOString());
  });
}

/**
 * Delete element from slide
 */
export function deleteElementFromRoom(roomName: string, slideIndex: number, elementIndex: number): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;
  const yProject = doc.getMap('project');
  const ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;

  if (!ySlides || slideIndex >= ySlides.length) return;

  doc.transact(() => {
    const ySlide = ySlides.get(slideIndex);
    const yElements = ySlide?.get('elements') as Y.Array<Y.Map<any>> | undefined;

    if (yElements && elementIndex < yElements.length) {
      yElements.delete(elementIndex, 1);
      yProject.set('updatedAt', new Date().toISOString());
    }
  });
}

// ============ Helper Functions ============

function createYSlide(slide: Slide): Y.Map<any> {
  const ySlide = new Y.Map();

  ySlide.set('id', slide.id);
  ySlide.set('title', slide.title || '');
  ySlide.set('content', slide.content || '');
  ySlide.set('template', slide.template);
  ySlide.set('backgroundColor', slide.backgroundColor || '#ffffff');
  ySlide.set('textColor', slide.textColor || '#000000');
  ySlide.set('savedContent', JSON.stringify(slide.savedContent || {}));

  // Handle elements
  const yElements = new Y.Array();
  if (slide.elements) {
    slide.elements.forEach((el) => {
      const yElement = createYElement(el);
      yElements.push([yElement]);
    });
  }
  ySlide.set('elements', yElements);

  return ySlide;
}

function createYElement(element: SlideElement): Y.Map<any> {
  const yElement = new Y.Map();

  yElement.set('id', element.id);
  yElement.set('type', element.type);
  yElement.set('x', element.x);
  yElement.set('y', element.y);
  yElement.set('width', element.width);
  yElement.set('height', element.height);
  yElement.set('content', element.content);
  yElement.set('zIndex', (element as any).zIndex || 0);
  yElement.set('role', element.role);

  if (element.style) {
    yElement.set('style', JSON.stringify(element.style));
  }

  return yElement;
}

function getProjectFromDoc(doc: Y.Doc): Project | null {
  const yProject = doc.getMap('project');

  if (yProject.size === 0) return null;

  const slides: Slide[] = [];
  const ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;

  if (ySlides) {
    ySlides.forEach((ySlide) => {
      const slide: Slide = {
        id: ySlide.get('id') as string,
        title: ySlide.get('title') as string || '',
        content: ySlide.get('content') as string || '',
        template: ySlide.get('template') as Slide['template'],
        backgroundColor: ySlide.get('backgroundColor') as string || '#ffffff',
        textColor: ySlide.get('textColor') as string || '#000000',
        savedContent: (() => {
          const raw = ySlide.get('savedContent');
          if (typeof raw === 'string') {
            try { return JSON.parse(raw); } catch { return {}; }
          }
          if (typeof raw === 'object' && raw !== null) return raw;
          return {};
        })(),
        elements: [],
      };

      const yElements = ySlide.get('elements') as Y.Array<Y.Map<any>> | undefined;
      if (yElements) {
        yElements.forEach((yElement) => {
          const styleStr = yElement.get('style') as string;
          const element: SlideElement = {
            id: yElement.get('id') as string,
            type: yElement.get('type') as SlideElement['type'],
            x: yElement.get('x') as number,
            y: yElement.get('y') as number,
            width: yElement.get('width') as number,
            height: yElement.get('height') as number,
            content: yElement.get('content') as string,
            style: styleStr ? JSON.parse(styleStr) : undefined,
            role: yElement.get('role') as any, // Sync role
          };
          slide.elements!.push(element);
        });
      }

      slides.push(slide);
    });
  }

  return {
    id: yProject.get('id') as string,
    name: yProject.get('name') as string,
    slides,
    createdAt: new Date(yProject.get('createdAt') as string),
    updatedAt: new Date(yProject.get('updatedAt') as string),
  };
}

/**
 * Get current connection status
 */
export function isConnectedToRoom(roomName: string): boolean {
  const connection = activeConnections.get(roomName);
  return connection?.provider.wsconnected ?? false;
}

/**
 * Generate a unique room ID
 */
export function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Connect to room, wait for sync, get project once, then disconnect
 * Useful for presentation mode where we just need to load the project
 */
export function connectToRoomOnce(
  roomName: string,
  timeout: number = 10000
): Promise<{ project: Project | null; role: 'edit' | 'view'; ownerId: string | null }> {
  return new Promise((resolve, reject) => {
    const ydoc = new Y.Doc();

    const provider = new WebsocketProvider(
      WS_URL,
      roomName,
      ydoc,
      { connect: true }
    );

    const timeoutId = setTimeout(() => {
      provider.disconnect();
      ydoc.destroy();
      reject(new Error('Connection timeout'));
    }, timeout);

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        clearTimeout(timeoutId);

        const project = getProjectFromDoc(ydoc);
        const yMeta = ydoc.getMap('meta');
        const role = (yMeta.get('role') as 'edit' | 'view') || 'edit';
        const ownerId = (yMeta.get('ownerId') as string) || null;

        // Disconnect after getting data
        provider.disconnect();
        ydoc.destroy();

        resolve({ project, role, ownerId });
      }
    });

    provider.on('connection-error', () => {
      clearTimeout(timeoutId);
      provider.disconnect();
      ydoc.destroy();
      reject(new Error('Connection error'));
    });
  });
}

/**
 * Set session metadata (role, ownerId) for access control
 */
export function setSessionMetadata(
  roomName: string,
  role: 'edit' | 'view',
  ownerId?: string
): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;

  doc.transact(() => {
    const yMeta = doc.getMap('meta');
    yMeta.set('role', role);
    if (ownerId) {
      yMeta.set('ownerId', ownerId);
    }
    yMeta.set('createdAt', new Date().toISOString());
  });
}

/**
 * Get session metadata
 */
export function getSessionMetadata(roomName: string): { role: 'edit' | 'view'; ownerId: string | null } | null {
  const connection = activeConnections.get(roomName);
  if (!connection) return null;

  const { doc } = connection;
  const yMeta = doc.getMap('meta');

  return {
    role: (yMeta.get('role') as 'edit' | 'view') || 'edit',
    ownerId: (yMeta.get('ownerId') as string) || null,
  };
}

/**
 * Update entire project in Y.js document (for syncing changes from local state)
 */
export function updateProjectInRoom(roomName: string, project: Project): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;

  doc.transact(() => {
    const yProject = doc.getMap('project');

    // Update basic properties
    yProject.set('id', project.id);
    yProject.set('name', project.name);
    yProject.set('updatedAt', new Date().toISOString());

    // Update slides
    let ySlides = yProject.get('slides') as Y.Array<Y.Map<any>> | undefined;
    if (!ySlides) {
      ySlides = new Y.Array();
      yProject.set('slides', ySlides);
    }

    // Clear and rebuild all slides
    ySlides.delete(0, ySlides.length);

    project.slides.forEach((slide) => {
      const ySlide = createYSlide(slide);
      ySlides!.push([ySlide]);
    });
  });
}

// ============ Chat Functions ============

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

/**
 * Send a chat message in the room
 */
export function sendChatMessage(roomName: string, message: Omit<ChatMessage, 'id'>): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const { doc } = connection;

  doc.transact(() => {
    const yChat = doc.getArray('chat');
    const yMessage = new Y.Map();

    yMessage.set('id', crypto.randomUUID());
    yMessage.set('sender', message.sender);
    yMessage.set('text', message.text);
    yMessage.set('timestamp', message.timestamp);

    yChat.push([yMessage]);
  });
}

/**
 * Subscribe to chat messages in the room
 */
export function subscribeChatMessages(
  roomName: string,
  onMessages: (messages: ChatMessage[]) => void
): () => void {
  const connection = activeConnections.get(roomName);
  if (!connection) return () => { };

  const { doc } = connection;
  const yChat = doc.getArray('chat');

  const getChatMessages = (): ChatMessage[] => {
    const messages: ChatMessage[] = [];
    yChat.forEach((item) => {
      if (item instanceof Y.Map) {
        messages.push({
          id: item.get('id') as string,
          sender: item.get('sender') as string,
          text: item.get('text') as string,
          timestamp: item.get('timestamp') as number,
        });
      }
    });
    return messages;
  };

  // Initial call
  onMessages(getChatMessages());

  // Observe changes
  const observer = () => {
    onMessages(getChatMessages());
  };

  yChat.observe(observer);

  return () => {
    yChat.unobserve(observer);
  };
}

/**
 * Get current project from connected room (useful for getting latest state)
 */
export function getProjectFromRoom(roomName: string): Project | null {
  const connection = activeConnections.get(roomName);
  if (!connection) return null;

  return getProjectFromDoc(connection.doc);
}

// ============= AWARENESS (User Presence & Selection) =============

export interface UserAwareness {
  clientId: number;
  user: {
    name: string;
    color: string;
  };
  selectedElementId?: string | null;
  slideId?: string;
}

// Generate random color for user
function generateUserColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Set user awareness (name and selected element)
 */
export function setUserAwareness(
  roomName: string,
  userName: string,
  selectedElementId: string | null,
  slideId?: string
): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const awareness = connection.provider.awareness;

  // Get existing state or create new
  const currentState = awareness.getLocalState() || {};

  awareness.setLocalState({
    ...currentState,
    user: {
      name: userName,
      color: currentState?.user?.color || generateUserColor(),
    },
    selectedElementId,
    slideId,
  });
}

/**
 * Clear user selection
 */
export function clearUserSelection(roomName: string): void {
  const connection = activeConnections.get(roomName);
  if (!connection) return;

  const awareness = connection.provider.awareness;
  const currentState = awareness.getLocalState() || {};

  awareness.setLocalState({
    ...currentState,
    selectedElementId: null,
    slideId: null,
  });
}

/**
 * Subscribe to awareness changes (other users' selections)
 */
export function subscribeToAwareness(
  roomName: string,
  onAwarenessChange: (users: UserAwareness[]) => void
): () => void {
  const connection = activeConnections.get(roomName);
  if (!connection) {
    return () => { };
  }

  const awareness = connection.provider.awareness;

  const updateHandler = () => {
    const states = awareness.getStates();
    const users: UserAwareness[] = [];

    states.forEach((state, clientId) => {
      if (state.user) {
        users.push({
          clientId,
          user: state.user,
          selectedElementId: state.selectedElementId,
          slideId: state.slideId,
        });
      }
    });

    onAwarenessChange(users);
  };

  awareness.on('change', updateHandler);

  // Initial call
  updateHandler();

  return () => {
    awareness.off('change', updateHandler);
  };
}

/**
 * Get awareness provider for a room
 */
export function getAwareness(roomName: string) {
  const connection = activeConnections.get(roomName);
  return connection?.provider.awareness;
}
