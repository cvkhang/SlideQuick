import React from 'react';
import { Star } from 'lucide-react';
import { Template } from '../../types';

interface TemplateCardProps {
  template: Template;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isFavorite,
  onClick,
  onToggleFavorite,
}) => {
  // Parse colors if they are strings (from JSON in DB)
  // But wait, the API service returns parsed JSON. Good.

  // Create a gradient or solid background preview
  const bgPreview = template.thumbnailUrl
    ? `url(${template.thumbnailUrl})`
    : template.style.backgroundColor.includes('gradient')
      ? template.style.backgroundColor
      : template.style.backgroundColor;

  return (
    <div
      className="group relative flex flex-col cursor-pointer transition-all hover:-translate-y-1"
      onClick={onClick}
    >
      {/* Thumbnail / Preview Area */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-sm border border-slate-200 group-hover:shadow-md transition-shadow bg-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ background: bgPreview }}
        >
          {/* If no thumbnail, show some text preview maybe? */}
          {!template.thumbnailUrl && (
            <div className="flex items-center justify-center w-full h-full p-4">
              <div style={{ color: template.style.textColor, fontFamily: template.style.fontFamily }}>
                <h3 className="text-xl font-bold">Aa</h3>
              </div>
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={onToggleFavorite}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-colors ${isFavorite
            ? 'bg-yellow-100/80 text-yellow-500 hover:bg-yellow-200'
            : 'bg-white/50 text-slate-400 hover:bg-white hover:text-yellow-400 opacity-0 group-hover:opacity-100'
            }`}
          title="お気に入り"
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>

      {/* Info Area */}
      <div className="mt-3 px-1">
        <h3 className="text-sm font-semibold text-slate-800 truncate">{template.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          {/* Color swatches */}
          <div className="flex -space-x-1">
            {template.colors.map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border border-white ring-1 ring-slate-100"
                style={{ background: color }}
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 truncate">{(template.fontFamily || 'Sans').split(',')[0]}</span>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
