import React from 'react';
import { Search, Filter } from 'lucide-react';

interface TemplateSidebarProps {
  onSearch: (query: string) => void;
  onTagSelect: (tag: string | null) => void;
  selectedTag: string | null;
  tags: string[]; // Aggregated unique tags
}

const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  onSearch,
  onTagSelect,
  selectedTag,
  tags
}) => {
  return (
    <aside className="w-64 border-r border-slate-200 p-4 flex flex-col bg-slate-50">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="テンプレートを検索..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <Filter className="w-3 h-3" />
        カテゴリ
      </div>

      <div className="space-y-1">
        <button
          onClick={() => onTagSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedTag === null
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          すべてのテンプレート
        </button>
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => onTagSelect(tag)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm capitalize transition-colors ${selectedTag === tag
              ? 'bg-primary-50 text-primary-700 font-medium'
              : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default TemplateSidebar;
