import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Template } from '../../types';
import { SYSTEM_TEMPLATES } from '../../utils/projectTemplates';

import TemplateCard from './TemplateCard';
import TemplateSidebar from './TemplateSidebar';
import TemplatePreviewModal from './TemplatePreviewModal';
import { useApp } from '../../context/AppContext';

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

const API_URL = 'http://localhost:3001/api/templates';

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const { currentUser } = useApp();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [favorites, setFavorites] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recent'>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (currentUser) {
        fetchFavorites();
      }
    }
  }, [isOpen, currentUser]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      // Convert system templates to match Template interface
      // Convert system templates to match Template interface
      const systemTemplates = SYSTEM_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        thumbnailUrl: t.thumbnailUrl,
        colors: t.colors,
        fontFamily: t.fontFamily,
        tags: t.tags.join(','),
        isStandard: true,
        style: t.style,
        createdAt: new Date().toISOString()
      }));

      // Only use system templates for standard library to avoid duplicates from DB
      setTemplates(systemTemplates);

    } catch (err) {
      console.error('Failed to load templates', err);
      // Fallback to system templates
      const systemTemplates = SYSTEM_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        thumbnailUrl: t.thumbnailUrl,
        colors: t.colors,
        fontFamily: t.fontFamily,
        tags: t.tags.join(','),
        isStandard: true,
        style: t.style,
        createdAt: new Date().toISOString()
      }));
      setTemplates(systemTemplates);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    // Requires auth
    const token = localStorage.getItem('sq_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFavorites(await res.json());
      }
    } catch (err) {
      console.error('Failed to load favorites', err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, template: Template) => {
    e.stopPropagation();
    if (!currentUser) return; // TODO: Prompt login?

    const token = localStorage.getItem('sq_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/${template.id}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const { favorited } = await res.json();
        if (favorited) {
          setFavorites(prev => [template, ...prev]);
        } else {
          setFavorites(prev => prev.filter(t => t.id !== template.id));
        }
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Filter logic
  const getFilteredTemplates = () => {
    let source = activeTab === 'favorites' ? favorites : templates;
    // For 'recent', needed API implementation which I added, but for now activeTab 'recent' 
    // functionality is deferred or I can quickly fetch it. I'll stick to basic.
    // If 'all', use `templates`.

    return source.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? t.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  };

  // Extract unique tags
  // Extract unique tags from the current view source (Standard vs Favorites)
  const currentSource = activeTab === 'favorites' ? favorites : templates;
  const tags = Array.from(new Set(currentSource.flatMap(t => (t.tags || '').split(',')))).filter(tag => tag && tag.trim().length > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-white flex flex-col">
      {/* Modal Header */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-800">テンプレートを選択</h1>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <TemplateSidebar
          onSearch={setSearchQuery}
          onTagSelect={setSelectedTag}
          selectedTag={selectedTag}
          tags={tags}
        />

        {/* Main Content */}
        <main className="flex-1 bg-slate-50 overflow-y-auto p-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-2 text-sm font-medium transition-colors relative ${activeTab === 'all' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              標準ライブラリ
              {activeTab === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`pb-2 px-2 text-sm font-medium transition-colors relative ${activeTab === 'favorites' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              お気に入り
              {activeTab === 'favorites' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />}
            </button>
          </div>

          {loading ? (
            <div className="flex py-20 justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* "Blank" Option always first in "All" tab */}
              {activeTab === 'all' && !searchQuery && !selectedTag && (
                <div
                  className="group flex flex-col cursor-pointer transition-all hover:-translate-y-1"
                  onClick={() => onSelectTemplate({
                    id: 'sub_blank', name: '空白のプレゼンテーション', colors: ['#ffffff', '#000000'],
                    fontFamily: 'Inter, sans-serif', tags: '', isStandard: true,
                    style: { backgroundColor: '#ffffff', textColor: '#000000', accentColor: '#3b82f6', fontFamily: 'Inter, sans-serif' },
                    createdAt: ''
                  })}
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-sm border border-slate-200 group-hover:shadow-md transition-shadow bg-white flex items-center justify-center">
                    <span className="text-slate-400 font-medium">空白</span>
                  </div>
                  <div className="mt-3 px-1">
                    <h3 className="text-sm font-semibold text-slate-800">空白のプレゼンテーション</h3>
                    <span className="text-xs text-slate-500">最初から作成</span>
                  </div>
                </div>
              )}

              {getFilteredTemplates().map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isFavorite={favorites.some(f => f.id === t.id)}
                  onClick={() => setPreviewTemplate(t)}
                  onToggleFavorite={(e) => handleToggleFavorite(e, t)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <TemplatePreviewModal
        isOpen={!!previewTemplate}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onSelect={onSelectTemplate}
      />
    </div>
  );
};

export default TemplateLibrary;
