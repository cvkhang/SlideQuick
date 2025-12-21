import { SlideElement } from "../types";

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
  'comparison': {
    title: { type: 'text', x: 50, y: 30, w: 860, h: 60, defaultContent: '比較', defaultStyle: { fontSize: 42, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#1e293b' } },
    subtitle1: { type: 'text', x: 50, y: 110, w: 410, h: 50, defaultContent: '項目 A', defaultStyle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#334155', backgroundColor: '#f1f5f9' } },
    body1: { type: 'text', x: 50, y: 170, w: 410, h: 320, defaultContent: '• メリット 1\n• メリット 2\n• 特徴 A', defaultStyle: { fontSize: 20, textAlign: 'left', alignItems: 'flex-start', color: '#475569', lineHeight: 1.5 } },
    subtitle2: { type: 'text', x: 500, y: 110, w: 410, h: 50, defaultContent: '項目 B', defaultStyle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#334155', backgroundColor: '#f1f5f9' } },
    body2: { type: 'text', x: 500, y: 170, w: 410, h: 320, defaultContent: '• デメリット 1\n• デメリット 2\n• 特徴 B', defaultStyle: { fontSize: 20, textAlign: 'left', alignItems: 'flex-start', color: '#475569', lineHeight: 1.5 } },
  },
  'section-header': {
    decoration: { type: 'shape', x: 0, y: 0, w: 300, h: 540, defaultContent: '', defaultStyle: { backgroundColor: '#3b82f6', shapeType: 'rectangle', opacity: 1 } },
    title: { type: 'text', x: 350, y: 180, w: 560, h: 120, defaultContent: 'セクション 01', defaultStyle: { fontSize: 72, fontWeight: 'bold', textAlign: 'left', alignItems: 'center', color: '#1e293b' } },
    subtitle: { type: 'text', x: 350, y: 300, w: 560, h: 80, defaultContent: '主要なトピックの概要', defaultStyle: { fontSize: 28, textAlign: 'left', alignItems: 'flex-start', color: '#64748b' } },
  },
  'content-caption': {
    image: { type: 'image', x: 50, y: 50, w: 860, h: 380, defaultContent: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800&q=80', defaultStyle: {} },
    caption: { type: 'text', x: 50, y: 450, w: 860, h: 60, defaultContent: '図1: データの可視化と分析結果の概要', defaultStyle: { fontSize: 18, fontStyle: 'italic', textAlign: 'center', alignItems: 'center', color: '#64748b' } },
  },
  'three-column': {
    title: { type: 'text', x: 50, y: 30, w: 860, h: 60, defaultContent: '3つのポイント', defaultStyle: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#1e293b' } },
    col1: { type: 'text', x: 40, y: 110, w: 280, h: 380, defaultContent: '### ステップ 1\n\n最初のステップについて説明します。', defaultStyle: { fontSize: 18, textAlign: 'left', alignItems: 'flex-start', color: '#475569' } },
    col2: { type: 'text', x: 340, y: 110, w: 280, h: 380, defaultContent: '### ステップ 2\n\n次のステップの詳細です。', defaultStyle: { fontSize: 18, textAlign: 'left', alignItems: 'flex-start', color: '#475569' } },
    col3: { type: 'text', x: 640, y: 110, w: 280, h: 380, defaultContent: '### ステップ 3\n\n最後のポイントです。', defaultStyle: { fontSize: 18, textAlign: 'left', alignItems: 'flex-start', color: '#475569' } },
  },
  'grid': {
    title: { type: 'text', x: 50, y: 30, w: 860, h: 60, defaultContent: 'グリッドレイアウト', defaultStyle: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', alignItems: 'center', color: '#1e293b' } },
    item1: { type: 'text', x: 50, y: 110, w: 410, h: 190, defaultContent: '要素 1', defaultStyle: { fontSize: 24, textAlign: 'center', alignItems: 'center', color: '#1e293b', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' } },
    item2: { type: 'text', x: 500, y: 110, w: 410, h: 190, defaultContent: '要素 2', defaultStyle: { fontSize: 24, textAlign: 'center', alignItems: 'center', color: '#1e293b', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' } },
    item3: { type: 'text', x: 50, y: 320, w: 410, h: 190, defaultContent: '要素 3', defaultStyle: { fontSize: 24, textAlign: 'center', alignItems: 'center', color: '#1e293b', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' } },
    item4: { type: 'text', x: 500, y: 320, w: 410, h: 190, defaultContent: '要素 4', defaultStyle: { fontSize: 24, textAlign: 'center', alignItems: 'center', color: '#1e293b', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' } },
  },
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
