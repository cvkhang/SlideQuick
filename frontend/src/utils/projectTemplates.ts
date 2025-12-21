import { Slide, SlideElement } from "../types";

export interface ProjectTemplateConfig {
    id: string;
    name: string;
    thumbnailUrl?: string;
    description: string;
    tags: string[];
    colors: string[];
    fontFamily: string;
    style: {
        backgroundColor: string;
        textColor: string;
        accentColor: string;
        fontFamily: string;
    };
    slides: Array<{
        title: string;
        template: Slide['template'];
        content: string;
        customElements?: (baseElements: SlideElement[]) => SlideElement[];
    }>;
}

export const SYSTEM_TEMPLATES: ProjectTemplateConfig[] = [
    {
        id: 'modern-business',
        name: 'モダンビジネス',
        description: 'プロフェッショナルな企業向けテンプレート。',
        tags: ['Business', 'Corporate', 'Blue'],
        colors: ['#f8fafc', '#1e293b', '#3b82f6'],
        fontFamily: 'Inter, sans-serif',
        style: {
            backgroundColor: '#f8fafc',
            textColor: '#1e293b',
            accentColor: '#3b82f6',
            fontFamily: 'Inter, sans-serif',
        },
        slides: [
            {
                title: 'ビジネス提案書',
                content: '革新的なソリューションの提案',
                template: 'title',
            },
            {
                title: 'アジェンダ',
                content: '本日の議論内容',
                template: 'three-column',
                customElements: (els) => {
                    const newEls = [...els];
                    const col1 = newEls.find(e => e.role === 'col1');
                    if (col1) col1.content = '### 01. 現状分析\n\n市場の課題と機会について';
                    const col2 = newEls.find(e => e.role === 'col2');
                    if (col2) col2.content = '### 02. 戦略提案\n\n具体的な解決策とロードマップ';
                    const col3 = newEls.find(e => e.role === 'col3');
                    if (col3) col3.content = '### 03. 財務計画\n\n予算とROIの予測';
                    return newEls;
                }
            },
            {
                title: '市場分析',
                content: '競合他社との比較優位性',
                template: 'comparison',
            },
            {
                title: 'プロジェクト計画',
                content: 'タイムラインとマイルストーン',
                template: 'section-header',
            },
            {
                title: '主要統計',
                content: '成長率と市場シェア',
                template: 'big-number',
            },
            {
                title: 'まとめ',
                content: 'ご清聴ありがとうございました',
                template: 'title-content',
            }
        ]
    },
    {
        id: 'creative-dark',
        name: 'クリエイティブ・ダーク',
        description: '洗練されたダークモードのデザイン。',
        tags: ['Creative', 'Dark', 'Portfolio'],
        colors: ['#111827', '#f3f4f6', '#8b5cf6'],
        fontFamily: 'Roboto, sans-serif',
        style: {
            backgroundColor: '#111827',
            textColor: '#f3f4f6',
            accentColor: '#8b5cf6',
            fontFamily: 'Roboto, sans-serif',
        },
        slides: [
            {
                title: 'PORTFOLIO 2024',
                content: 'Works & Achievements',
                template: 'title',
            },
            {
                title: 'Vision',
                content: '"デザインは機能するものでなければならない"',
                template: 'quote',
            },
            {
                title: 'About Me',
                content: 'デザイナーとしての経歴',
                template: 'two-column',
            },
            {
                title: 'Featured Works',
                content: '最近のプロジェクト',
                template: 'grid',
            },
            {
                title: 'Process',
                content: '制作フロー',
                template: 'three-column',
            },
            {
                title: 'Contact',
                content: 'お問い合わせはこちら',
                template: 'title-content',
            }
        ]
    },
    {
        id: 'academic-clean',
        name: 'アカデミック・クリーン',
        description: '論文発表や講義に最適なレイアウト。',
        tags: ['Academic', 'Education', 'Simple'],
        colors: ['#ffffff', '#333333', '#059669'],
        fontFamily: 'Merriweather, serif',
        style: {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            accentColor: '#059669',
            fontFamily: 'Merriweather, serif',
        },
        slides: [
            {
                title: '研究発表',
                content: 'タイトル: 持続可能な開発目標におけるAIの役割',
                template: 'title',
            },
            {
                title: '研究概要',
                content: '本研究の目的と手法',
                template: 'title-content',
            },
            {
                title: '先行研究',
                content: '関連する文献のレビュー',
                template: 'two-column',
            },
            {
                title: '実験結果',
                content: 'データ分析の結果',
                template: 'content-caption',
            },
            {
                title: '考察',
                content: '結果の解釈と意義',
                template: 'three-column',
            },
            {
                title: '結論',
                content: '今後の展望',
                template: 'section-header',
            }
        ]
    },
    {
        id: 'startup-pitch',
        name: 'スタートアップ・ピッチ',
        description: '投資家向けの力強いプレゼンテーション。',
        tags: ['Startup', 'Pitch', 'Bold'],
        colors: ['#fff1f2', '#881337', '#e11d48'],
        fontFamily: 'Montserrat, sans-serif',
        style: {
            backgroundColor: '#fff1f2',
            textColor: '#881337',
            accentColor: '#e11d48',
            fontFamily: 'Montserrat, sans-serif',
        },
        slides: [
            {
                title: 'VENTURE',
                content: 'Future of Technology',
                template: 'title',
            },
            {
                title: 'The Problem',
                content: 'What we are solving',
                template: 'title-content',
            },
            {
                title: 'The Solution',
                content: 'How we fix it',
                template: 'image-text',
            },
            {
                title: 'Market Size',
                content: 'TAM, SAM, SOM',
                template: 'big-number',
            },
            {
                title: 'Business Model',
                content: 'How we make money',
                template: 'grid',
            },
            {
                title: 'Team',
                content: 'Who we are',
                template: 'three-column',
            }
        ]
    },
    {
        id: 'nature-calm',
        name: 'ネイチャー・カーム',
        description: '自然を感じさせるアースカラー。',
        tags: ['Nature', 'Calm', 'Green'],
        colors: ['#f0fdf4', '#14532d', '#15803d'],
        fontFamily: 'Open Sans, sans-serif',
        style: {
            backgroundColor: '#f0fdf4',
            textColor: '#14532d',
            accentColor: '#15803d',
            fontFamily: 'Open Sans, sans-serif',
        },
        slides: [
            {
                title: 'Organic Life',
                content: 'Sustainable Living Guide',
                template: 'title',
            },
            {
                title: 'Concept',
                content: 'Harmony with Nature',
                template: 'image-text',
            },
            {
                title: 'Philosophy',
                content: 'Our core values',
                template: 'quote',
            },
            {
                title: 'Benefits',
                content: 'Key advantages',
                template: 'grid',
            },
            {
                title: 'Products',
                content: 'Our lineup',
                template: 'three-column',
            },
            {
                title: 'Thank You',
                content: 'Join our community',
                template: 'title-content',
            }
        ]
    }
];
