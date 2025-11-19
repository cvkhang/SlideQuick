import React from 'react';
import { X, Check } from 'lucide-react';
import { Template } from '../../types';
import { Button } from '../ui/Button';

interface TemplatePreviewModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen || !template) return null;

  const bgPreview = template.thumbnailUrl
    ? `url(${template.thumbnailUrl})`
    : template.style.backgroundColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{template.name}</h2>
            <p className="text-sm text-slate-500">
              {(template.tags || '').split(',').filter(Boolean).map(tag => `#${tag}`).join(' ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Left: Large Preview */}
            <div className="md:col-span-2 aspect-video rounded-lg shadow-lg overflow-hidden relative border border-slate-200 bg-white">
              <div
                className="absolute inset-0 bg-cover bg-center flex items-center justify-center"
                style={{ background: bgPreview }}
              >
                {/* Mock slide content for preview */}
                <div
                  className="text-center p-8 space-y-4"
                  style={{
                    color: template.style.textColor,
                    fontFamily: template.style.fontFamily
                  }}
                >
                  <h1 className="text-4xl font-bold">プレゼンテーションのタイトル</h1>
                  <p className="text-xl opacity-80" style={{ color: template.style.accentColor }}>サブタイトルをここに入力</p>
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">カラーパレット</h3>
                <div className="flex gap-2">
                  {template.colors.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
                        style={{ background: color }}
                      />
                      <span className="text-[10px] font-mono text-slate-500">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">タイポグラフィ</h3>
                <div className="p-3 bg-white rounded border border-slate-200">
                  <p style={{ fontFamily: template.style.fontFamily }} className="text-lg">
                    Ag (Abc)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{template.fontFamily}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <Button
                  onClick={() => onSelect(template)}
                  className="w-full justify-center py-6 text-lg shadow-xl shadow-primary-500/20"
                >
                  <Check className="w-5 h-5 mr-2" />
                  このテンプレートを使用
                </Button>
                <p className="text-xs text-center text-slate-500 mt-2">
                  このスタイルで新しいプロジェクトを作成
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
