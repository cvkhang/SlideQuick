import { SlideElement } from "../../types";

export type LayoutSpec = {
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  w: number;
  h: number;
  defaultContent: string;
  defaultStyle: any;
};

export const LAYOUT_SPECS: Record<string, Record<string, LayoutSpec>> = {
  'title': {
    title: { type: 'text', x: 80, y: 180, w: 800, h: 120, defaultContent: 'プレゼンテーションのタイトル', defaultStyle: { fontSize: 64, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#1e293b' } },
    subtitle: { type: 'text', x: 180, y: 310, w: 600, h: 60, defaultContent: 'サブタイトルまたは作成者', defaultStyle: { fontSize: 28, textAlign: 'center', alignItems: 'center', color: '#64748b' } },
  },
  'title-content': {
    title: { type: 'text', x: 50, y: 40, w: 860, h: 70, defaultContent: 'スライドのタイトル', defaultStyle: { fontSize: 48, fontWeight: 'bold', textAlign: 'left', alignItems: 'center', color: '#334155' } },
    body: { type: 'text', x: 50, y: 130, w: 860, h: 350, defaultContent: '• クリックしてテキストを編集\n• ここにコンテンツを追加', defaultStyle: { fontSize: 24, textAlign: 'left', alignItems: 'flex-start', color: '#475569', lineHeight: 1.6 } },
  },
  'two-column': {
    title: { type: 'text', x: 50, y: 40, w: 860, h: 70, defaultContent: '比較のタイトル', defaultStyle: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#334155' } },
    body: { type: 'text', x: 50, y: 140, w: 410, h: 350, defaultContent: '• カラム1のポイント', defaultStyle: { fontSize: 22, textAlign: 'left', alignItems: 'flex-start', color: '#475569' } },
    body2: { type: 'text', x: 500, y: 140, w: 410, h: 350, defaultContent: '• カラム2のポイント', defaultStyle: { fontSize: 22, textAlign: 'left', alignItems: 'flex-start', color: '#475569' } },
  },
  'image-text': {
    title: { type: 'text', x: 500, y: 100, w: 410, h: 60, defaultContent: 'ビジュアルコンセプト', defaultStyle: { fontSize: 42, fontWeight: 'bold', textAlign: 'left', alignItems: 'center', color: '#334155' } },
    body: { type: 'text', x: 500, y: 180, w: 410, h: 260, defaultContent: 'ここに画像の説明を記述', defaultStyle: { fontSize: 20, textAlign: 'left', alignItems: 'flex-start', color: '#64748b', lineHeight: 1.5 } },
    image: { type: 'image', x: 50, y: 100, w: 400, h: 340, defaultContent: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80', defaultStyle: {} },
  },
  'quote': {
    decoration: { type: 'text', x: 80, y: 80, w: 100, h: 100, defaultContent: '"', defaultStyle: { fontSize: 140, fontWeight: 'bold', textAlign: 'left', alignItems: 'flex-start', color: '#e2e8f0' } },
    body: { type: 'text', x: 150, y: 180, w: 660, h: 180, defaultContent: '"革新はリーダーとフォロワーを区別する。"', defaultStyle: { fontSize: 36, fontStyle: 'italic', textAlign: 'center', alignItems: 'center', color: '#1e293b', fontWeight: '500' } },
    author: { type: 'text', x: 580, y: 350, w: 300, h: 50, defaultContent: '— 著者名', defaultStyle: { fontSize: 24, fontWeight: 'bold', textAlign: 'right', alignItems: 'center', color: '#64748b' } },
  },
  'big-number': {
    decoration: { type: 'shape', x: 360, y: 80, w: 240, h: 240, defaultContent: '', defaultStyle: { backgroundColor: '#f1f5f9', borderRadius: '50%', shapeType: 'circle' } },
    number: { type: 'text', x: 330, y: 150, w: 300, h: 100, defaultContent: '85%', defaultStyle: { fontSize: 96, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#3b82f6' } },
    title: { type: 'text', x: 230, y: 340, w: 500, h: 50, defaultContent: '成長率', defaultStyle: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#1e293b' } },
    subtitle: { type: 'text', x: 230, y: 400, w: 500, h: 80, defaultContent: '前年比増加', defaultStyle: { fontSize: 20, textAlign: 'center', alignItems: 'center', color: '#64748b' } },
  },
  'blank': {},
};

export function generateLayoutElements(template: string): SlideElement[] {
  const specs = LAYOUT_SPECS[template] || {};
  const elements: SlideElement[] = [];

  for (const [role, spec] of Object.entries(specs)) {
    elements.push({
      id: crypto.randomUUID(),
      type: spec.type,
      role: role as any,
      content: spec.defaultContent,
      x: spec.x,
      y: spec.y,
      width: spec.w,
      height: spec.h,
      style: spec.defaultStyle,
    });
  }

  return elements;
}
