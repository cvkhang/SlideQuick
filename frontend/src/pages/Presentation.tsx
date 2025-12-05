import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { connectToRoomOnce } from '../services/yjs-collab';
import { DraggableElement } from '../components/DraggableElement';
import '../styles/Presentation.css';

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

export default function Presentation() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projects, sharedProjects } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const proj = projects.find(p => p.id === projectId) || sharedProjects.find(p => p.id === projectId);
    const room = searchParams.get('room');

    if (proj) {
      setProject(proj);
      setLoading(false);
    } else if (projectId) {
      // Try fetching as a single project (covers shared projects not yet in list)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      fetch(`${API_URL}/projects/${projectId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed');
          return res.json();
        })
        .then(data => {
          setProject({
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
          });
          setLoading(false);
        })
        .catch(() => {
          // Fallback to Y.js room if available
          if (room) {
            connectToRoomOnce(room)
              .then(({ project: sharedProject }) => {
                if (sharedProject) setProject(sharedProject);
                else setError('共有プレゼンテーションが見つかりません。');
              })
              .catch(() => setError('共有プレゼンテーションの読み込みに失敗しました。'))
              .finally(() => setLoading(false));
          } else {
            // Try public endpoint as last resort (for view-only guests)
            fetch(`${API_URL}/projects/public/${projectId}`)
              .then(res => res.ok ? res.json() : Promise.reject())
              .then(data => {
                setProject({ ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) });
                setLoading(false);
              })
              .catch(() => {
                navigate('/');
              });
          }
        });
    }
  }, [projectId, projects, sharedProjects, searchParams, navigate]);

  // Handle Window Resize for Scaling
  useEffect(() => {
    const handleResize = () => {
      if (!slideContainerRef.current) return;

      // Use window inner dimensions directly effectively full screen
      const availableWidth = window.innerWidth;
      const availableHeight = window.innerHeight;

      const scaleX = availableWidth / SLIDE_WIDTH;
      const scaleY = availableHeight / SLIDE_HEIGHT;

      // Fit Contain
      setScale(Math.min(scaleX, scaleY));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        exitPresentation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, project]);

  if (loading) {
    return (
      <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '2rem', background: '#1e293b' }}>
        <div className="animate-pulse">プレゼンテーションを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', background: '#1e293b' }}>
        <p>{error}</p>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', borderRadius: '0.5rem', cursor: 'pointer' }}
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '2rem', background: '#1e293b' }}>
        読み込み中...
      </div>
    );
  }

  const currentSlide = project.slides[currentIndex];

  const nextSlide = () => {
    if (currentIndex < project.slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const exitPresentation = () => {
    const room = searchParams.get('room');
    if (room) {
      navigate(`/editor/${projectId}?room=${room}`);
    } else {
      navigate(`/editor/${projectId}`);
    }
  };

  return (
    <div className="presentation" ref={slideContainerRef}>
      {/* Scaled Slide Container */}
      <div
        className="presentation-slide-container shadow-2xl"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundColor: currentSlide.backgroundColor || '#ffffff',
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -SLIDE_HEIGHT / 2, // Centering trick combined with absolute
          marginLeft: -SLIDE_WIDTH / 2,
          overflow: 'hidden' // Clip content
        }}
      >
        {/* Render Elements */}
        {currentSlide.elements?.map((element: any) => (
          <DraggableElement
            key={element.id}
            element={element}
            isSelected={false}
            readOnly={true}
            zoomScale={scale}
            onSelect={() => { }}
            onChange={() => { }}
          />
        ))}
      </div>

      {/* Floating Controls */}
      <button className="presentation-exit" onClick={exitPresentation}>
        <X size={24} />
      </button>

      <div className="presentation-controls">
        <button
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="control-btn"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="slide-counter">
          {currentIndex + 1} / {project.slides.length}
        </span>
        <button
          onClick={nextSlide}
          disabled={currentIndex === project.slides.length - 1}
          className="control-btn"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
