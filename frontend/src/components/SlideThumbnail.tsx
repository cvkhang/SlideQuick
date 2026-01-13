import React from 'react';
import { Slide } from '../types';

interface SlideThumbnailProps {
    slide: Slide;
    scale?: number;
    className?: string;
    templateName?: boolean;
}

export const SlideThumbnail: React.FC<SlideThumbnailProps> = ({
    slide,
    scale = 0.24,
    className = '',
    templateName = false
}) => {
    return (
        <div
            className={`relative overflow-hidden bg-white ${className}`}
            style={{
                backgroundColor: slide.backgroundColor || '#ffffff',
                isolation: 'isolate', // Create new stacking context for z-index
            }}
        >
            {/* Render actual elements scaled down */}
            {slide.elements?.map(el => {
                if (el.type === 'text') {
                    return (
                        <div
                            key={el.id}
                            className="absolute overflow-hidden whitespace-pre-wrap flex"
                            style={{
                                left: el.x * scale,
                                top: el.y * scale,
                                width: el.width * scale,
                                height: el.height * scale,
                                padding: 8 * scale, // Tailwind p-2 = 8px
                                fontSize: (el.style?.fontSize || 20) * scale,
                                fontWeight: el.style?.fontWeight,
                                fontStyle: el.style?.fontStyle,
                                textAlign: el.style?.textAlign,
                                textDecoration: el.style?.textDecoration,
                                color: el.style?.color || '#000',
                                fontFamily: el.style?.fontFamily,
                                lineHeight: el.style?.lineHeight || 1.2,
                                pointerEvents: 'none',
                                zIndex: el.style?.zIndex ?? 0,
                                alignItems: el.style?.alignItems || 'flex-start',
                                justifyContent: el.style?.textAlign === 'center' ? 'center' : el.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <span style={{ width: '100%', textAlign: el.style?.textAlign }}>
                                {el.content}
                            </span>
                        </div>
                    );
                }
                if (el.type === 'image') {
                    return (
                        <img
                            key={el.id}
                            src={el.content}
                            alt=""
                            className="absolute object-cover"
                            style={{
                                left: el.x * scale,
                                top: el.y * scale,
                                width: el.width * scale,
                                height: el.height * scale,
                                pointerEvents: 'none',
                                zIndex: el.style?.zIndex ?? 0,
                            }}
                        />
                    );
                }
                if (el.type === 'shape') {
                    return (
                        <div
                            key={el.id}
                            className="absolute"
                            style={{
                                left: el.x * scale,
                                top: el.y * scale,
                                width: el.width * scale,
                                height: el.height * scale,
                                backgroundColor: el.style?.backgroundColor || '#e2e8f0',
                                borderRadius: el.style?.borderRadius,
                                pointerEvents: 'none',
                                zIndex: el.style?.zIndex ?? 0,
                            }}
                        />
                    );
                }
                return null;
            })}

            {/* Empty state or Template Name */}
            {(!slide.elements || slide.elements.length === 0 || templateName) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {(!slide.elements || slide.elements.length === 0) && (
                        <span className="text-[8px] text-slate-300 uppercase tracking-wider">
                            {slide.template === 'blank' ? '空白' : slide.template}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
