import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Plus, Calendar, User, Presentation } from 'lucide-react';
import { Layout } from '../components/ui/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import TemplateLibrary from '../components/TemplateLibrary/TemplateLibrary';
import { Template } from '../types';

export default function Home() {
  const { projects, createProject, deleteProject, setCurrentProject, loading } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [lessonName, setLessonName] = useState('');
  const [basicInfo, setBasicInfo] = useState('');
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const navigate = useNavigate();

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
      template.style // Pass the template style
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

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">ダッシュボード</h1>
          <p className="text-slate-500 mt-1">プレゼンテーションとテンプレートを管理</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          leftIcon={<Plus className="w-5 h-5" />}
          className="shadow-lg shadow-primary-500/20"
        >
          新規プロジェクト
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Presentation className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">プロジェクトがありません</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">
            SlideQuickを始めるには、最初のプレゼンテーションを作成してください。
          </p>
          <Button onClick={() => setShowModal(true)}>
            プロジェクト作成
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card
              key={project.id}
              variant="glass"
              className="group cursor-pointer hover:border-primary-200 transition-all duration-300"
              onClick={() => handleOpenProject(project)}
              noPadding
            >
              <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <Presentation className="w-12 h-12" />
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-red-600 shadow-sm"
                    onClick={(e) => handleDeleteProject(e, project.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur rounded-md text-xs font-medium text-slate-600 shadow-sm">
                    {project.slides.length} スライド
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
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
      )}

      {showModal && (
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
                <label className="block text-sm font-medium text-slate-700">説明</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all duration-200 resize-none h-24"
                  placeholder="簡単な説明..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

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
      )}

      {/* Template Library Modal */}
      <TemplateLibrary
        isOpen={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </Layout>
  );
}

// Helper icon
function Trash2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
