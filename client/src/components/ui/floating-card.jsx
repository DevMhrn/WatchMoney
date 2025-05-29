import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

const FloatingCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Initial entrance animation
    animate(card, {
      opacity: [0, 1],
      scale: [0.8, 1],
      y: [50, 0],
      duration: 800,
      ease: 'outExpo'
    });

    // Smooth continuous floating animation - seamless loop
    const floatingAnimation = animate(card, {
      y: [
        { to: -8, duration: 4000, ease: 'inOutSine' },
        { to: 8, duration: 4000, ease: 'inOutSine' },
        { to: -8, duration: 4000, ease: 'inOutSine' }
      ],
      x: [
        { to: 3, duration: 6000, ease: 'inOutSine' },
        { to: -3, duration: 6000, ease: 'inOutSine' },
        { to: 3, duration: 6000, ease: 'inOutSine' }
      ],
      rotate: [
        { to: 0.8, duration: 8000, ease: 'inOutSine' },
        { to: -0.8, duration: 8000, ease: 'inOutSine' },
        { to: 0.8, duration: 8000, ease: 'inOutSine' }
      ],
      loop: true,
      autoplay: true
    });

    // Enhanced mouse interaction with smooth transitions
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      // Reduce sensitivity for smoother interaction
      const rotateX = (mouseY / rect.height) * 8;
      const rotateY = -(mouseX / rect.width) * 8;
      
      // Smooth tilt animation
      animate(card, {
        rotateX: `${rotateX}deg`,
        rotateY: `${rotateY}deg`,
        duration: 300,
        ease: 'outQuart',
        complete: () => {
          // Don't interfere with the floating animation
        }
      });

      // Animate glow effect
      if (glowRef.current) {
        animate(glowRef.current, {
          opacity: [0, 0.6],
          scale: [0.8, 1.1],
          duration: 300,
          ease: 'outQuart'
        });
      }
    };

    const handleMouseLeave = () => {
      // Smooth return to original position
      animate(card, {
        rotateX: '0deg',
        rotateY: '0deg',
        duration: 600,
        ease: 'outExpo'
      });

      // Fade out glow
      if (glowRef.current) {
        animate(glowRef.current, {
          opacity: 0,
          scale: 0.8,
          duration: 400,
          ease: 'outQuart'
        });
      }
    };

    const handleMouseEnter = () => {
      // Subtle scale up on hover
      animate(card, {
        scale: 1.02,
        duration: 300,
        ease: 'outQuart'
      });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mouseenter', handleMouseEnter);
      
      // Stop floating animation on cleanup
      if (floatingAnimation) {
        floatingAnimation.pause();
      }
    };
  }, []);

  return (
    <div className="relative perspective-1000 group">
      <div
        ref={glowRef}
        className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-3xl blur-2xl opacity-0 transition-opacity duration-500"
      />
      <div
        ref={cardRef}
        className={`relative transform-style-preserve-3d ${className}`}
        style={{ 
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          willChange: 'transform'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default FloatingCard;
