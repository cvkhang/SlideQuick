// Viewer page - read-only version of Editor
// This page loads a shared project in view-only mode

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Home, Play, Download, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Project } from '../types';
import SlideEditor from '../components/SlideEditor';
import { exportToPDF } from '../utils/pdfExport';
import {
  connectToRoom,
  subscribeChatMessages,
} from '../services/yjs-collab';
import { Button } from '../components/ui/Button';
import '../styles/Editor.css';

interface ProjectWithShareMode extends Project {
  shareMode?: 'private' | 'view' | 'edit';
  ownerId?: string;
}

export default function Viewer() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentSlideIndex, currentSlideIndex } = useApp();

  const [project, setProject] = useState<ProjectWithShareMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roomIdRef = useRef<string | null>(null);

  // Fetch project data from public API
  useEffect(() => {
    if (!projectId) return;

    async function fetchProject() {
      try {
        setLoading(true);
        setError(null);

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/projects/public/${projectId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('プロジェクトが見つかりません');
          } else {
            setError('プロジェクトの読み込みに失敗しました');
          }
          return;
        }

        const data = await response.json();

        // Check access
        if (data.shareMode === 'private') {
          // Check if user is owner
          if (!currentUser || currentUser.id !== data.ownerId) {
            setError('このプロジェクトは非公開です');
            return;
          }
        }

        // If shareMode is 'edit', redirect to editor
        if (data.shareMode === 'edit') {
          navigate(`/editor/${projectId}`, { replace: true });
          return;
        }

        setProject({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        });

      } catch (err) {
        console.error('Error fetching project:', err);
        setError('プロジェクトの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId, currentUser, navigate]);

  // Connect to Y.js for real-time updates (read-only)
  useEffect(() => {
    if (!projectId || !project) return;

    roomIdRef.current = projectId;

    const cleanup = connectToRoom(
      projectId,
      (updatedProject) => {
        setProject(prev => prev ? {
          ...updatedProject,
        } : null);
      },
      () => {
        // No-op for now unless we want to show connection status
      }
    );

    // Subscribe to chat (for future use)
    subscribeChatMessages(projectId, () => { });

    return () => {
      cleanup?.();
      roomIdRef.current = null;
    };
  }, [projectId, project?.id]);

  const handleExport = async () => {
    if (!project) return;
    try {
      await exportToPDF(project);
    } catch (err) {
      console.error('Export failed:', err);
      alert('エクスポートに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">プロジェクトを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">{error}</h2>
          <p className="text-slate-500 mb-4">このプロジェクトへのアクセス権がありません。</p>
          <Button onClick={() => navigate('/')}>ホームへ</Button>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const currentSlide = project.slides[currentSlideIndex] || project.slides[0];

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
      {/* Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 justify-between z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            title="ホームに戻る"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
              {project.name}
              <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600 font-normal">閲覧のみ</span>
            </h1>
            <span className="text-xs text-slate-500">作者: {project.ownerName || '不明'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleExport} className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> PDFエクスポート
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/present/${project.id}`)}>
            <Play className="w-4 h-4 mr-2" /> プレゼンテーション
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Thumbnails */}
        <aside className="w-56 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {project.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${currentSlideIndex === index
                  ? 'border-primary-500 shadow-lg shadow-primary-500/20'
                  : 'border-transparent hover:border-slate-300'
                  }`}
                onClick={() => setCurrentSlideIndex(index)}
              >
                <div className="aspect-video bg-slate-50 relative overflow-hidden">
                  <div
                    className="absolute inset-0 scale-[0.2] origin-top-left"
                    style={{
                      width: '500%',
                      height: '500%',
                      backgroundColor: slide.backgroundColor || '#ffffff',
                    }}
                  >
                    {slide.elements?.map((el) => (
                      <div
                        key={el.id}
                        style={{
                          position: 'absolute',
                          left: el.x,
                          top: el.y,
                          width: el.width,
                          height: el.height,
                          fontSize: el.style?.fontSize,
                          fontWeight: el.style?.fontWeight,
                          color: el.style?.color,
                          textAlign: el.style?.textAlign as any,
                        }}
                      >
                        {el.type === 'text' && el.content}
                        {el.type === 'image' && (
                          <img src={el.content} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex === 0}
              className="p-2 rounded-full bg-white shadow-md hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-500 font-medium">
              {currentSlideIndex + 1} / {project.slides.length}
            </span>
            <button
              onClick={() => setCurrentSlideIndex(Math.min(project.slides.length - 1, currentSlideIndex + 1))}
              disabled={currentSlideIndex === project.slides.length - 1}
              className="p-2 rounded-full bg-white shadow-md hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {currentSlide && (
            <SlideEditor
              slide={currentSlide}
              projectId={project.id}
              readOnly={true}
            />
          )}
        </main>
      </div>
    </div>
  );
}
