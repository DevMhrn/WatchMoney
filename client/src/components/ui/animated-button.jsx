import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';
import clsx from 'clsx';

const AnimatedButton = ({ 
  children, 
  className = "", 
  variant = "primary", 
  size = "default",
  disabled = false,
  onClick,
  ...props 
}) => {
  const buttonRef = useRef(null);
  const rippleRef = useRef(null);

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
    secondary: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    default: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseEnter = () => {
      if (disabled) return;
      
      animate(button, {
        scale: 1.05,
        duration: 200,
        ease: 'outQuad'
      });
    };

    const handleMouseLeave = () => {
      if (disabled) return;
      
      animate(button, {
        scale: 1,
        duration: 200,
        ease: 'outQuad'
      });
    };

    const handleMouseDown = () => {
      if (disabled) return;
      
      animate(button, {
        scale: 0.95,
        duration: 100,
        ease: 'outQuad'
      });
    };

    const handleMouseUp = () => {
      if (disabled) return;
      
      animate(button, {
        scale: 1.05,
        duration: 100,
        ease: 'outQuad'
      });
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mousedown', handleMouseDown);
    button.addEventListener('mouseup', handleMouseUp);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mousedown', handleMouseDown);
      button.removeEventListener('mouseup', handleMouseUp);
    };
  }, [disabled]);

  const handleClick = (e) => {
    if (disabled) return;
    
    // Ripple effect
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.className = 'absolute rounded-full bg-white/30 pointer-events-none';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.transform = 'scale(0)';
    
    button.appendChild(ripple);
    
    animate(ripple, {
      scale: [0, 1],
      opacity: [0.5, 0],
      duration: 600,
      ease: 'outExpo',
      complete: () => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }
    });
    
    onClick?.(e);
  };

  return (
    <button
      ref={buttonRef}
      className={clsx(
        "relative overflow-hidden rounded-xl font-semibold transition-all duration-200 transform-gpu active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        "shadow-lg hover:shadow-xl dark:shadow-gray-900/50",
        "backdrop-blur-sm",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default AnimatedButton;
