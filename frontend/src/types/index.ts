export interface Template {
  id: string;
  name: string;
  thumbnailUrl?: string;
  colors: string[];
  fontFamily: string;
  tags: string;
  isStandard: boolean;
  style: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
  };
  createdAt: string;
}


// Re-exporting these if they were supposed to be here,
// allows AppContext to import from here without breaking if I overwrite/create index.ts

export interface ElementStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string; // 'bold' | 'normal'
  fontStyle?: string; // 'italic' | 'normal'
  textDecoration?: string; // 'underline' | 'none'
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  alignItems?: string; // 'flex-start' | 'center' | 'flex-end' (vertical alignment)
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  border?: string;
  borderRadius?: string | number;
  zIndex?: number;
  lineHeight?: number;
  shapeType?: 'rectangle' | 'circle' | 'triangle'; // Shape type for shape elements
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  style?: ElementStyle;
  role?: 'title' | 'subtitle' | 'body' | 'body2' | 'image' | 'decoration' | 'number' | 'author' | 'subtitle1' | 'subtitle2' | 'body1' | 'caption' | 'col1' | 'col2' | 'col3' | 'item1' | 'item2' | 'item3' | 'item4';
}

export interface Slide {
  id: string;
  title: string;
  content: string;
  template: 'blank' | 'title' | 'title-content' | 'two-column' | 'image-text' | 'quote' | 'big-number' | 'comparison' | 'section-header' | 'content-caption' | 'three-column' | 'grid';
  backgroundColor: string;
  textColor: string;
  imageUrl?: string;
  textAlign?: 'left' | 'center' | 'right';
  contentFontSize?: 'small' | 'medium' | 'large';
  elements?: SlideElement[];
  savedContent?: Record<string, string>; // Dictionary of role -> content for persistent memory
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  lessonName?: string;
  basicInfo?: string;
  ownerName?: string;
  slides: Slide[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppState {
  projects: Project[];
  currentProject: Project | null;
  currentSlideIndex: number;
}

export interface User {
  id: string;
  username: string;
  email?: string | null;
  createdAt: string | Date;
}
