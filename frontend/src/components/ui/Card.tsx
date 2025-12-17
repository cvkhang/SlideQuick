import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'flat';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  noPadding = false,
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-slate-200/60 shadow-sm',
    glass: 'glass-card',
    flat: 'bg-slate-50 border border-slate-100',
  };

  return (
    <div
      className={`rounded-xl overflow-hidden ${variants[variant]} ${noPadding ? '' : 'p-6'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
