import React, { forwardRef, useEffect, useRef } from "react";
import { animate } from 'animejs';
import clsx from "clsx";

const sizeClasses = {
  default: "h-12 px-4 py-3",
  sm: "h-10 px-3 py-2",
  lg: "h-14 px-5 py-4",
};

const AnimatedInput = forwardRef(
  ({ id, label, error, size = "default", className, onFocus, onBlur, ...props }, ref) => {
    const containerRef = useRef(null);
    const labelRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
      const container = containerRef.current;
      const labelEl = labelRef.current;
      const input = inputRef.current || ref?.current;
      
      if (container && labelEl) {
        // Check if input has value on mount
        const hasValue = input && input.value && input.value.length > 0;
        
        if (hasValue) {
          // If input has value, position label at top with background
          animate(labelEl, {
            scale: 0.85,
            y: -28,
            duration: 0
          });
          labelEl.style.backgroundColor = 'white';
          labelEl.style.padding = '0 4px';
        } else {
          // Initial centered state
          animate(labelEl, {
            scale: 1,
            y: 0,
            duration: 0
          });
          labelEl.style.backgroundColor = 'transparent';
          labelEl.style.padding = '0';
        }
      }
    }, []);

    const handleFocus = (e) => {
      const labelEl = labelRef.current;
      const container = containerRef.current;
      
      if (labelEl) {
        animate(labelEl, {
          scale: 0.85,
          y: -28,
          color: '#6366f1',
          duration: 200,
          ease: 'outQuad'
        });
        // Add white background when focused
        labelEl.style.backgroundColor = 'white';
        labelEl.style.padding = '0 4px';
      }
      
      if (container) {
        animate(container, {
          scale: 1.02,
          duration: 200,
          ease: 'outQuad'
        });
      }
      
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      const labelEl = labelRef.current;
      const container = containerRef.current;
      
      if (labelEl && !e.target.value) {
        animate(labelEl, {
          scale: 1,
          y: 0,
          color: '#6b7280',
          duration: 200,
          ease: 'outQuad'
        });
        // Remove background when returning to center
        labelEl.style.backgroundColor = 'transparent';
        labelEl.style.padding = '0';
      }
      
      if (container) {
        animate(container, {
          scale: 1,
          duration: 200,
          ease: 'outQuad'
        });
      }
      
      onBlur?.(e);
    };

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        <div 
          ref={containerRef}
          className="relative transform-gpu"
        >
          {label && (
            <label
              ref={labelRef}
              htmlFor={id}
              className="absolute left-4 top-[30%] transform -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-400 pointer-events-none transition-colors duration-200 origin-left z-10 rounded-sm"
            >
              {label}
            </label>
          )}
          <input
            id={id}
            ref={ref || inputRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={clsx(
              "w-full rounded-xl border-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400",
              error ? "border-red-500 dark:border-red-400" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
              sizeClasses[size],
              "text-gray-900 dark:text-gray-100 placeholder:text-transparent",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 dark:text-red-400 animate-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

export default AnimatedInput;
