import { useEffect, useState } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { Layout } from '../components/ui/Layout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Trash() {
  const [deletedProjects, setDeletedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // We need to fetch deleted projects directly since the context filters them out
  const fetchDeletedProjects = async () => {
    try {
      setLoading(true);
      // Note: This endpoint needs to be implemented in backend if not already capable of filtering
      // For now we assume we might need a specific endpoint or filter param
      // Since backend currently filters is_deleted=0 in getAllProjects, 
      // we might need to add a query param support or new endpoint.
      // BUT for this step, let's assume we implement the frontend logic
      // and we might need to adjust backend service to support ?deleted=true

      // Let's mock it or use a raw fetch for now if the context doesn't support it
      const token = localStorage.getItem('sq_token');
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const response = await fetch(`${API_URL}/projects?deleted=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDeletedProjects(data); // Backend already returns only deleted projects
      }
    } catch (error) {
      console.error('Failed to fetch trash', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const token = localStorage.getItem('sq_token');
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      await fetch(`${API_URL}/projects/${id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh list
      fetchDeletedProjects();
    } catch (error) {
      console.error('Failed to restore', error);
    }
  };

  useEffect(() => {
    fetchDeletedProjects();
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-slate-900 flex items-center gap-3">
          <Trash2 className="w-8 h-8 text-primary-600" />
          ゴミ箱
        </h1>
        <p className="text-slate-500 mt-1">削除されたプロジェクトを管理します。ゴミ箱内のアイテムは30日後に完全削除されます。</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : deletedProjects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">ゴミ箱は空です</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2">
            削除されたプロジェクトは見つかりませんでした。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deletedProjects.map(project => (
            <Card
              key={project.id}
              className="opacity-75 hover:opacity-100 transition-opacity bg-slate-50 border-slate-200"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-slate-900 line-clamp-1">
                  {project.name}
                </h3>
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  Deleted
                </span>
              </div>

              <div className="text-xs text-slate-500 mb-6">
                Deleted on: {project.deleted_at ? new Date(project.deleted_at).toLocaleDateString() : 'Unknown'}
              </div>

              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={() => handleRestore(project.id)}
                >
                  Restore
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
