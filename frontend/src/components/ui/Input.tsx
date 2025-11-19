import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-lg border bg-white
              ${leftIcon ? 'pl-10 pr-4' : 'px-4'} py-2.5
              text-slate-900 placeholder:text-slate-400
              transition-all duration-200 outline-none
              disabled:opacity-50 disabled:bg-slate-50
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 animate-slide-up">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
