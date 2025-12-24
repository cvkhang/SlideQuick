import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Home, Plus, Trash2, Play, Download, ChevronLeft, ChevronRight, Share2, Copy, X, Lock, Eye, Edit3 } from 'lucide-react';
import { Slide } from '../types';
import SlideEditor from '../components/SlideEditor';
import { SlideThumbnail } from '../components/SlideThumbnail';
import { exportToPDF } from '../utils/pdfExport';
import {
  connectToRoom,
  initializeProjectInRoom,
  updateProjectInRoom,
  setSessionMetadata,
  getSessionMetadata,
  sendChatMessage,
  subscribeChatMessages,
  ChatMessage,
  setUserAwareness,
  subscribeToAwareness,
  UserAwareness,
} from '../services/yjs-collab';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import '../styles/Editor.css';

export default function Editor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projects, currentProject, currentSlideIndex, setCurrentProject, setCurrentSlideIndex, addSlide, deleteSlide, duplicateSlide, updateProject, currentUser, loading: authLoading, markProjectAccessed } = useApp();
  const [showTemplates, setShowTemplates] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideId: string } | null>(null);

  // Collaborative state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  // shareRole is now managed by currentShareMode

  const [isReadOnly, setIsReadOnly] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUsersAwareness, setOtherUsersAwareness] = useState<UserAwareness[]>([]);

  const roomIdRef = useRef<string | null>(null);
  const clientIdRef = useRef<string>(crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 9));
  const projectLoadedRef = useRef(false);
  const lastYjsUpdateTime = useRef<number>(0);
  const skipNextSync = useRef(false);
  const isOwner = useRef(true); // Default to owner when opening own project
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // Renaming state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Load project from local state first, or fetch from public API for guests
  useEffect(() => {
    // Wait for auth to be ready before checking access
    if (authLoading) return;

    const project = projects.find(p => p.id === projectId);

    if (project) {
      // User owns this project
      setCurrentProject(project);
      projectLoadedRef.current = true;
      isOwner.current = true;
      setAccessDenied(null);
    } else if (projectId) {
      // Not in user's projects - check public access
      isOwner.current = false;

      async function checkAccess() {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const response = await fetch(`${API_URL}/projects/public/${projectId}`);

          if (!response.ok) {
            setAccessDenied('プロジェクトが見つかりません');
            return;
          }

          const data = await response.json();

          if (data.shareMode === 'private') {
            // Check if logged in user is owner
            if (!currentUser || currentUser.id !== data.ownerId) {
              setAccessDenied('このプロジェクトは非公開です');
              return;
            }
          }

          if (data.shareMode === 'view') {
            // Redirect to viewer
            navigate(`/viewer/${projectId}`, { replace: true });
            return;
          }

          // shareMode is 'edit' - require login
          if (data.shareMode === 'edit' && !currentUser) {
            // Redirect to login with return URL
            navigate(`/login?redirect=/editor/${projectId}`, { replace: true });
            return;
          }

          // shareMode is 'edit' and user is logged in - allow access
          setCurrentProject({
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          });
          projectLoadedRef.current = true;
          projectLoadedRef.current = true;
          setAccessDenied(null);

          // Track access for "Shared with me" history
          if (currentUser && data.ownerId !== currentUser.id && projectId) {
            markProjectAccessed(projectId);
          }

        } catch (err) {
          console.error('Error checking access:', err);
          setAccessDenied('プロジェクトの読み込みに失敗しました');
        }
      }

      checkAccess();
    }
  }, [projectId, projects, currentUser, navigate, authLoading]);

  const [loadingError, setLoadingError] = useState<string | null>(null);

  // ALWAYS connect to Y.js room using projectId (like Canva)
  // The ?room param just indicates a shared session for access control
  useEffect(() => {
    if (!projectId) return;

    const shareRoom = searchParams.get('room');
    // Use projectId as the room name for consistent collaboration
    const actualRoomId = projectId;

    setLoadingError(null);
    roomIdRef.current = actualRoomId;

    const timer = setTimeout(() => {
      // Only show timeout error for non-owners waiting for data
      if (!projectLoadedRef.current && !isOwner.current) {
        setLoadingError('読み込みがタイムアウトしました。リンクを確認するか、更新してください。');
      }
    }, 15000);

    let cleanup: (() => void) | null = null;
    let chatCleanup: (() => void) | null = null;
    let awarenessCleanup: (() => void) | null = null;
    let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      // Connect to Y.js room
      cleanup = connectToRoom(
        actualRoomId,
        (updatedProject) => {
          try {
            // Mark that this update came from Y.js - skip syncing back for 200ms
            lastYjsUpdateTime.current = Date.now();
            skipNextSync.current = true;

            setCurrentProject(updatedProject);
            projectLoadedRef.current = true;
            setLoadingError(null); // Clear any pending error

            // Check role for shared sessions
            if (shareRoom) {
              const meta = getSessionMetadata(shareRoom);
              if (meta) {
                const isSessionOwner = !!(currentUser && meta.ownerId && currentUser.id === meta.ownerId);
                setIsReadOnly(meta.role === 'view' && !isSessionOwner);
              }
            }
          } catch (err) {
            console.error('Error processing Y.js project update:', err);
          }
        },
        (status) => {
          // Clear pending disconnect error timer on connect
          if (status === 'connected' && disconnectTimer) {
            clearTimeout(disconnectTimer);
            disconnectTimer = null;
          }

          // When owner connects and Y.js is empty, initialize with local project
          if (status === 'connected' && isOwner.current && currentProject) {
            // Small delay to let sync complete first
            setTimeout(() => {
              const yProject = getSessionMetadata(actualRoomId);
              // If no data in Y.js yet, initialize it
              if (!yProject) {
                initializeProjectInRoom(actualRoomId, currentProject);
                setSessionMetadata(actualRoomId, 'edit', currentUser?.id);
              }
            }, 500);
          }

          // Delay showing disconnect error
          if (status === 'disconnected' && !projectLoadedRef.current && !isOwner.current) {
            disconnectTimer = setTimeout(() => {
              if (!projectLoadedRef.current && roomIdRef.current === actualRoomId) {
                setLoadingError('接続が切れました。ネットワークを確認して再試行してください。');
              }
            }, 1000);
          }
        }
      );

      // Subscribe to chat
      try {
        chatCleanup = subscribeChatMessages(actualRoomId, setMessages);
      } catch (chatErr) {
        console.error('Failed to subscribe to chat:', chatErr);
      }

      // Subscribe to awareness (other users' selections)
      try {
        awarenessCleanup = subscribeToAwareness(actualRoomId, (users) => {
          // Filter out current user's own awareness
          setOtherUsersAwareness(users.filter(u => u.user?.name !== currentUser?.username));
        });
      } catch (awarenessErr) {
        console.error('Failed to subscribe to awareness:', awarenessErr);
      }
    } catch (err) {
      console.error('Failed to connect to Y.js room:', err);
      // Only show error for non-owners
      if (!isOwner.current) {
        setLoadingError('コラボレーションセッションへの接続に失敗しました。再試行してください。');
      }
    }

    return () => {
      clearTimeout(timer);
      if (disconnectTimer) clearTimeout(disconnectTimer);
      cleanup?.();
      chatCleanup?.();
      awarenessCleanup?.();
      roomIdRef.current = null;
    };
  }, [projectId, searchParams, currentUser]);

  // Sync project changes to Y.js room (with loop prevention)
  useEffect(() => {
    if (!roomIdRef.current || !currentProject || isReadOnly) return;

    // Skip syncing if this update came from Y.js (within last 200ms)
    if (skipNextSync.current || Date.now() - lastYjsUpdateTime.current < 200) {
      skipNextSync.current = false;
      return;
    }

    // Update Y.js document with current project
    updateProjectInRoom(roomIdRef.current, currentProject);
  }, [currentProject, isReadOnly]);

  // Current share mode state
  const [currentShareMode, setCurrentShareMode] = useState<'private' | 'view' | 'edit'>('private');

  // Get the appropriate share link based on mode
  function getShareLink(mode: 'private' | 'view' | 'edit'): string {
    if (!currentProject) return '';
    const basePath = mode === 'view' ? '/viewer' : '/editor';
    return `${window.location.origin}${basePath}/${currentProject.id}`;
  }

  // Open share modal - fetch current share mode and show fixed link
  async function handleOpenShareModal() {
    if (!currentProject) return;

    setShareError(null);
    setShareModalOpen(true);

    // Fetch current share mode from server
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/projects/public/${currentProject.id}`);
      if (response.ok) {
        const data = await response.json();
        const mode = data.shareMode || 'private';
        setCurrentShareMode(mode);
        setShareLink(getShareLink(mode));
      } else {
        setCurrentShareMode('private');
        setShareLink(getShareLink('private'));
      }
    } catch (err) {
      console.error('Failed to fetch share mode:', err);
      setCurrentShareMode('private');
      setShareLink(getShareLink('private'));
    }
  }

  // Update share mode
  async function handleUpdateShareMode(newMode: 'private' | 'view' | 'edit') {
    if (!currentProject) return;

    const token = localStorage.getItem('sq_token');
    if (!token) {
      setShareError('共有設定を変更するにはログインが必要です。');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${API_URL}/projects/${currentProject.id}/share`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ shareMode: newMode }),
      });

      if (response.ok) {
        setCurrentShareMode(newMode);
        setShareLink(getShareLink(newMode));
        setShareError(null);
      } else if (response.status === 401) {
        setShareError('セッションの有効期限が切れました。再度ログインしてください。');
      } else {
        const data = await response.json();
        setShareError(data.error || '共有モードの更新に失敗しました');
      }
    } catch (err) {
      console.error('Failed to update share mode:', err);
      setShareError('共有モードの更新に失敗しました。再試行してください。');
    }
  }


  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleExport = async () => {
    if (!currentProject) return;
    await exportToPDF(currentProject);
  };

  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">エラー</h2>
        <p className="text-slate-600 mb-6">{loadingError}</p>
        <Button onClick={() => navigate('/')}>ホームに戻る</Button>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const slides = currentProject.slides || [];
  const currentSlide = slides[currentSlideIndex];

  if (!currentSlide) {
    return <div className="p-8 text-center text-slate-500">スライドを読み込み中...</div>;
  }

  const handleAddSlide = async (template: Slide['template']) => {
    if (isReadOnly) return;
    await addSlide(currentProject.id, template);
    setShowTemplates(false);
  };

  const handleDeleteSlide = async () => {
    if (isReadOnly) return;
    if (currentProject.slides.length > 1 && confirm('このスライドを削除してもよろしいですか？')) {
      await deleteSlide(currentProject.id, currentSlide.id);
      if (currentSlideIndex >= currentProject.slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
      }
    }
  };

  const handleDuplicateSlide = async () => {
    if (isReadOnly) return;
    if (contextMenu) {
      await duplicateSlide(currentProject.id, contextMenu.slideId);
      setContextMenu(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, slideId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, slideId });
  };

  const handleSendMessage = async (text: string) => {
    if (roomIdRef.current) {
      sendChatMessage(roomIdRef.current, {
        sender: currentUser?.username || `ゲスト-${clientIdRef.current.slice(0, 4)}`,
        text,
        timestamp: Date.now()
      });
    }
  };

  const templates: Array<{ id: Slide['template']; name: string; description: string }> = [
    { id: 'blank', name: '空白', description: '空のキャンバス' },
    { id: 'title', name: 'タイトルのみ', description: '中央に大きなタイトル' },
    { id: 'title-content', name: 'タイトルとコンテンツ', description: 'クラシックなレイアウト' },
    { id: 'two-column', name: '2カラム', description: '横並びのコンテンツ' },
    { id: 'image-text', name: '画像とテキスト', description: 'キャプション付きビジュアル' },
    { id: 'quote', name: '引用', description: '引用を強調' },
    { id: 'big-number', name: '大きな数字', description: '統計を強調' },
  ];



  // Access denied screen
  if (accessDenied) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">{accessDenied}</h2>
          <p className="text-slate-500 mb-4">このプロジェクトへのアクセス権がありません。</p>
          <Button onClick={() => navigate('/')}>ホームへ</Button>
        </div>
      </div>
    );
  }

  const handleNameSave = async () => {
    if (tempName.trim() && tempName !== currentProject.name) {
      await updateProject({
        ...currentProject,
        name: tempName.trim()
      });
    }
    setIsEditingName(false);
  };

  // Loading state while checking access
  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">プロジェクトを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 justify-between z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            title="Back to Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                autoFocus
                className="text-lg font-bold font-display text-slate-800 bg-white border border-primary-300 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            ) : (
              <h1
                className={`text-lg font-bold font-display text-slate-800 flex items-center gap-2 ${!isReadOnly ? 'cursor-pointer hover:bg-slate-100 rounded px-2 -ml-2 py-0.5 transition-colors group' : ''}`}
                onClick={() => {
                  if (!isReadOnly) {
                    setTempName(currentProject.name);
                    setIsEditingName(true);
                  }
                }}
              >
                {currentProject.name}
                {!isReadOnly && <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                {isReadOnly && <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600 font-normal">閲覧のみ</span>}
              </h1>
            )}
            <span className="text-xs text-slate-500">たった今編集</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <Button variant="ghost" size="sm" onClick={handleExport} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" /> PDFエクスポート
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleOpenShareModal}>
            <Share2 className="w-4 h-4 mr-2" /> 共有
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(searchParams.get('room') ? `/present/${currentProject.id}?room=${searchParams.get('room')}` : `/present/${currentProject.id}`)}>
            <Play className="w-4 h-4 mr-2" /> プレゼンテーション
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-700">スライド</h3>
            {!isReadOnly && (
              <button
                onClick={() => setShowTemplates(true)}
                className="p-1.5 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 transition-colors shadow-sm cursor-pointer"
                title="スライドを追加"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {currentProject.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`group relative rounded-lg border-2 transition-all duration-200 cursor-pointer overflow-hidden ${index === currentSlideIndex
                  ? 'border-primary-500 shadow-md ring-2 ring-primary-100 transform scale-[1.02]'
                  : 'border-transparent hover:border-slate-300 hover:shadow-sm bg-white'
                  }`}
                onClick={() => setCurrentSlideIndex(index)}
                onContextMenu={(e) => { if (!isReadOnly) handleContextMenu(e, slide.id); }}
              >
                <div className="absolute left-2 top-2 z-10 w-6 h-6 flex items-center justify-center bg-black/50 text-white text-xs font-bold rounded-full shadow-sm backdrop-blur-sm">
                  {index + 1}
                </div>
                {/* Mini Slide Preview using SlideThumbnail */}
                <div className="aspect-video w-full relative">
                  <SlideThumbnail slide={slide} scale={0.24} className="w-full h-full" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Editor Stage */}
        <main className="flex-1 flex flex-col relative bg-slate-100/50">
          {/* Canvas Toolbar */}
          <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <button
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-slate-500 min-w-[3rem] text-center">
                {currentSlideIndex + 1} / {currentProject.slides.length}
              </span>
              <button
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                onClick={() => setCurrentSlideIndex(Math.min(currentProject.slides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === currentProject.slides.length - 1}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {!isReadOnly && (
              <button
                onClick={handleDeleteSlide}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">スライド削除</span>
              </button>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <SlideEditor
              slide={currentSlide}
              projectId={currentProject.id}
              readOnly={isReadOnly}
              messages={messages}
              username={currentUser?.username || `ゲスト-${clientIdRef.current.slice(0, 4)}`}
              onSendMessage={handleSendMessage}
              otherUsersSelections={otherUsersAwareness}
              onElementSelect={(elementId: string | null) => {
                if (roomIdRef.current && currentUser) {
                  setUserAwareness(
                    roomIdRef.current,
                    currentUser.username,
                    elementId,
                    currentSlide.id
                  );
                }
              }}
            />
          </div>
        </main>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold font-display text-slate-900">レイアウトを選択</h2>
              <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="group cursor-pointer"
                  onClick={() => handleAddSlide(template.id)}
                >
                  <div className="aspect-video bg-slate-100 rounded-lg border-2 border-transparent group-hover:border-primary-500 group-hover:shadow-lg transition-all mb-3 flex items-center justify-center overflow-hidden relative">
                    {/* Preview Placeholder */}
                    <div className="absolute inset-0 bg-white opacity-50"></div>
                    <span className="relative z-10 text-slate-400 font-medium text-xs uppercase tracking-wider">{template.name}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-center group-hover:text-primary-600 transition-colors">{template.name}</h3>
                  <p className="text-xs text-slate-500 text-center mt-1">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-xl rounded-lg py-1 z-[100] border border-slate-100 min-w-[160px] animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-2"
            onClick={handleDuplicateSlide}
          >
            <Copy className="w-4 h-4" /> スライドを複製
          </button>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShareModalOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-900">プロジェクトを共有</h2>
                <p className="text-sm text-slate-500 mt-1">このプロジェクトへのアクセス権を管理します。</p>
              </div>
              <button onClick={() => setShareModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Access Mode Selection */}
            <div className="space-y-2 mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">アクセスレベル</p>

              {/* Private */}
              <button
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${currentShareMode === 'private'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                onClick={() => handleUpdateShareMode('private')}
              >
                <Lock className="w-5 h-5" />
                <div className="text-left flex-1">
                  <div className="font-medium">非公開</div>
                  <div className="text-xs opacity-70">あなただけがアクセス可能</div>
                </div>
              </button>

              {/* View Only */}
              <button
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${currentShareMode === 'view'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                onClick={() => handleUpdateShareMode('view')}
              >
                <Eye className="w-5 h-5" />
                <div className="text-left flex-1">
                  <div className="font-medium">リンクを知っている全員が閲覧可能</div>
                  <div className="text-xs opacity-70">閲覧者向けの読み取り専用アクセス</div>
                </div>
              </button>

              {/* Can Edit */}
              <button
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${currentShareMode === 'edit'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                onClick={() => handleUpdateShareMode('edit')}
              >
                <Edit3 className="w-5 h-5" />
                <div className="text-left flex-1">
                  <div className="font-medium">リンクを知っている全員が編集可能</div>
                  <div className="text-xs opacity-70">全員に完全な編集権限</div>
                </div>
              </button>
            </div>

            {/* Share Link (only show if not private) */}
            {currentShareMode !== 'private' && shareLink && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">共有リンク</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-600 focus:outline-none"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (shareLink) {
                        await navigator.clipboard.writeText(shareLink);
                        alert('リンクをクリップボードにコピーしました！');
                      }
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {shareError && (
              <p className="text-xs text-red-500 mt-2">{shareError}</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
