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
            style={{ backgroundColor: slide.backgroundColor || '#ffffff' }}
        >
            {/* Render actual elements scaled down */}
            {slide.elements?.map(el => {
                if (el.type === 'text') {
                    return (
                        <div
                            key={el.id}
                            className="absolute overflow-hidden whitespace-pre-wrap"
                            style={{
                                left: el.x * scale,
                                top: el.y * scale,
                                width: el.width * scale,
                                height: el.height * scale,
                                fontSize: (el.style?.fontSize || 20) * scale,
                                fontWeight: el.style?.fontWeight,
                                fontStyle: el.style?.fontStyle,
                                textAlign: el.style?.textAlign,
                                color: el.style?.color || '#000',
                                fontFamily: el.style?.fontFamily,
                                lineHeight: 1.2,
                                pointerEvents: 'none',
                            }}
                        >
                            {el.content}
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
