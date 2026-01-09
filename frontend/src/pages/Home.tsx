import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Calendar, User, Presentation, Trash2, Edit3, Search, Share2, ArrowUpDown, Copy, Check, Lock, Eye, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Layout } from '../components/ui/Layout';
import TemplateLibrary from '../components/TemplateLibrary/TemplateLibrary';
import { SlideThumbnail } from '../components/SlideThumbnail';
import { Template, Project } from '../types';

export default function Home() {
  const { projects, sharedProjects, createProject, deleteProject, updateProject, setCurrentProject, loading, fetchSharedProjects, refreshProjects } = useApp();
  console.log('Home Render - Projects:', projects);
  const [activeTab, setActiveTab] = useState<'my' | 'shared'>('my');

  // Fetch shared projects when tab changes
  useEffect(() => {
    if (activeTab === 'shared') {
      console.log('Home: Switching to shared tab, fetching...');
      fetchSharedProjects();
    }
  }, [activeTab]);

  useEffect(() => {
    console.log('Home: sharedProjects updated:', sharedProjects);
  }, [sharedProjects]);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [lessonName, setLessonName] = useState('');
  const [basicInfo, setBasicInfo] = useState('');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  // Editing state
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editLessonName, setEditLessonName] = useState('');
  const [editBasicInfo, setEditBasicInfo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingProject, setSharingProject] = useState<Project | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentShareMode, setCurrentShareMode] = useState<'private' | 'view' | 'edit'>('private');

  const navigate = useNavigate();

  // Helper to generate share link based on mode
  const getShareLink = (mode: 'private' | 'view' | 'edit', projectId: string) => {
    const basePath = mode === 'view' ? '/viewer' : '/editor';
    return `${window.location.origin}${basePath}/${projectId}`;
  };

  const handleCreateProject = () => {
    if (projectName.trim()) {
      setShowModal(false);
      setShowTemplateLibrary(true);
    }
  };

  const handleTemplateSelect = async (template: Template) => {
    await createProject(
      projectName.trim(),
      description,
      lessonName,
      basicInfo,
      template.style, // Pass the template style
      template.id // Pass the template ID
    );

    // Reset form
    setProjectName('');
    setDescription('');
    setLessonName('');
    setBasicInfo('');
    setShowTemplateLibrary(false);
  };

  const handleOpenProject = (project: any) => {
    setCurrentProject(project);
    navigate(`/editor/${project.id}`);
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('このプロジェクトをゴミ箱に移動してもよろしいですか？')) {
      await deleteProject(id);
    }
  };

  const handleShareClick = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    console.log('Opening share modal for project:', project);

    setSharingProject(project);
    setShareModalOpen(true);
    setCopiedLink(false);

    // Fetch fresh project data from API to get current shareMode (like Editor does)
    try {
      const token = localStorage.getItem('sq_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/projects/${project.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched project data:', data);
        setCurrentShareMode(data.shareMode || 'private');
      } else {
        console.error('Failed to fetch project data');
        setCurrentShareMode(project.shareMode || 'private');
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      setCurrentShareMode(project.shareMode || 'private');
    }
  };

  const handleCopyLink = () => {
    if (!sharingProject) return;
    const url = getShareLink(currentShareMode, sharingProject.id);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareModeChange = async (mode: 'private' | 'view' | 'edit') => {
    if (!sharingProject) return;

    // Optimistic local update
    setCurrentShareMode(mode);
    setSharingProject(prev => prev ? { ...prev, shareMode: mode } : null);

    try {
      const token = localStorage.getItem('sq_token');
      await fetch(`http://localhost:3001/api/projects/${sharingProject.id}/share`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shareMode: mode })
      });

      // Refresh the projects list to ensure global state is in sync
      if (refreshProjects) await refreshProjects(undefined, true);
    } catch (error) {
      console.error("Failed to update share mode", error);
    }
  };

  const handleRenameClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setRenamingProject(project);
    setEditName(project.name || '');
    setEditLessonName(project.lessonName || '');
    setEditBasicInfo(project.basicInfo || '');
  };

  const handleRenameSubmit = async () => {
    if (renamingProject && editName.trim()) {
      await updateProject({
        ...renamingProject,
        name: editName.trim(),
        lessonName: editLessonName.trim(),
        basicInfo: editBasicInfo.trim()
      });
      setRenamingProject(null);
      setEditName('');
      setEditLessonName('');
      setEditBasicInfo('');
    }
  };

  // Determine which list to show
  const sourceList = activeTab === 'my' ? projects : sharedProjects;
  const currentList = sourceList.filter(project => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name?.toLowerCase().includes(query) ||
      project.lessonName?.toLowerCase().includes(query) ||
      project.basicInfo?.toLowerCase().includes(query) ||
      project.ownerName?.toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });
  const isListEmpty = sourceList.length === 0 && !searchQuery;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">ダッシュボード</h1>
          <p className="text-slate-500 mt-1">プレゼンテーションを管理・作成します</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="shadow-lg shadow-primary-500/20"
        >
          新規プロジェクト
        </Button>
      </div>


      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="プロジェクト、レッスン名、基本情報で検索..."
            leftIcon={<Search className="w-5 h-5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          leftIcon={<ArrowUpDown className="w-4 h-4" />}
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
        >
          {sortOrder === 'desc' ? '新しい順' : '古い順'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'my' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('my')}
        >
          マイプロジェクト
          {activeTab === 'my' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />}
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'shared' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('shared')}
        >
          共有されたプロジェクト
          {activeTab === 'shared' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />}
        </button>
      </div>

      {
        loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : isListEmpty ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Presentation className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {activeTab === 'my' ? 'プロジェクトがありません' : '共有されたプロジェクトはありません'}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">
              {activeTab === 'my'
                ? 'SlideQuickを始めるには、最初のプレゼンテーションを作成してください。'
                : '他のユーザーから共有されたプロジェクトがここに表示されます。'}
            </p>
            {activeTab === 'my' && (
              <Button onClick={() => setShowModal(true)}>
                プロジェクト作成
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentList.map(project => (
              <Card
                key={project.id}
                variant="glass"
                className="group cursor-pointer hover:border-primary-200 transition-all duration-300"
                onClick={() => handleOpenProject(project)}
                noPadding
              >
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                  {project.slides && project.slides.length > 0 ? (
                    <div className="w-full h-full relative">
                      <SlideThumbnail
                        slide={project.slides[0]}
                        scale={0.16}
                        className="w-full h-full transform origin-top-left scale-[1]"
                      />
                      {/* Hover Overlay with Info */}
                      <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center p-6 text-center backdrop-blur-[2px]">
                        {project.lessonName && (
                          <div className="text-white font-bold text-lg mb-2 line-clamp-2">
                            {project.lessonName}
                          </div>
                        )}
                        {project.basicInfo && (
                          <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                            {project.basicInfo}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <Presentation className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-blue-600 shadow-sm"
                      onClick={(e) => handleShareClick(e, project)}
                      title="共有"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    {/* Only show actions for my projects */}
                    {activeTab === 'my' && (
                      <>
                        <button
                          className="p-1.5 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-primary-600 shadow-sm"
                          onClick={(e) => handleRenameClick(e, project)}
                          title="名前を変更"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-red-600 shadow-sm"
                          onClick={(e) => handleDeleteProject(e, project.id)}
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur rounded-md text-xs font-medium text-slate-600 shadow-sm">
                      {project.slides?.length || 0} スライド
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2 pr-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      {project.hasUnreadMessages && (
                        <span className="flex-shrink-0 relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="max-w-[100px] truncate">
                        {project.ownerName || '不明'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      }

      {/* New Project Modal */}
      {
        showModal && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-1">新しいプレゼンテーション</h2>
              <p className="text-sm text-slate-500 mb-6">新しいプレゼンテーションの詳細を入力してください。</p>

              <div className="space-y-4">
                <Input
                  label="プロジェクト名"
                  placeholder="プロジェクト名"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                />

                <Input
                  label="レッスン名"
                  placeholder="例: レッスン1"
                  value={lessonName}
                  onChange={(e) => setLessonName(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">基本情報</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-200 resize-none h-24"
                    placeholder="追加のコンテキスト..."
                    value={basicInfo}
                    onChange={(e) => setBasicInfo(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleCreateProject())}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setShowModal(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCreateProject}>
                    テンプレートを選択
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Modal (formerly Rename Modal) */}
      {
        renamingProject && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setRenamingProject(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-slate-900 mb-4">プロジェクトを編集</h2>

              <div className="space-y-4">
                <Input
                  label="プロジェクト名"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />

                <Input
                  label="レッスン名"
                  value={editLessonName}
                  onChange={(e) => setEditLessonName(e.target.value)}
                  placeholder="例: レッスン1"
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">基本情報</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-200 resize-none h-24"
                    placeholder="追加のコンテキスト..."
                    value={editBasicInfo}
                    onChange={(e) => setEditBasicInfo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) handleRenameSubmit();
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setRenamingProject(null)}>
                  キャンセル
                </Button>
                <Button onClick={handleRenameSubmit} disabled={!editName.trim()}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Share Modal */}
      {
        shareModalOpen && sharingProject && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShareModalOpen(false)}>
            <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold font-display text-slate-900">プロジェクトを共有</h2>
                    <p className="text-sm text-slate-500 mt-1">「<span className="font-semibold">{sharingProject.name}</span>」へのアクセス権を管理します。</p>
                  </div>
                  <button type="button" onClick={() => setShareModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Access Mode Selection */}
                <div className="space-y-2 mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">アクセスレベル</p>

                  {/* Private */}
                  <button
                    type="button"
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${currentShareMode === 'private'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    onClick={() => handleShareModeChange('private')}
                  >
                    <Lock className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-medium">非公開</div>
                      <div className="text-xs opacity-70">あなただけがアクセス可能</div>
                    </div>
                  </button>

                  {/* View Only */}
                  <button
                    type="button"
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${currentShareMode === 'view'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    onClick={() => handleShareModeChange('view')}
                  >
                    <Eye className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-medium">リンクを知っている全員が閲覧可能</div>
                      <div className="text-xs opacity-70">閲覧者向けの読み取り専用アクセス</div>
                    </div>
                  </button>

                  {/* Can Edit */}
                  <button
                    type="button"
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${currentShareMode === 'edit'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    onClick={() => handleShareModeChange('edit')}
                  >
                    <Edit3 className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-medium">リンクを知っている全員が編集可能</div>
                      <div className="text-xs opacity-70">全員に完全な編集権限</div>
                    </div>
                  </button>
                </div>

                {/* Share Link (only show if not private) */}
                {currentShareMode !== 'private' && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">共有リンク</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getShareLink(currentShareMode, sharingProject.id)}
                        className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-600 focus:outline-none"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyLink}
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )
      }

      {/* Template Library Modal */}
      <TemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </Layout >
  );
}


