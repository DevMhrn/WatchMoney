import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { useStore } from '../../store';

const AnimatedBackground = () => {
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const shapesRef = useRef([]);
  const { theme } = useStore((state) => state);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing particles and shapes
    particlesRef.current.forEach(particle => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
    shapesRef.current.forEach(shape => {
      if (shape.parentNode) {
        shape.parentNode.removeChild(shape);
      }
    });

    // Enhanced color palettes for better visibility
    const lightThemeColors = [
      'rgba(99, 102, 241, 0.8)',   // Indigo
      'rgba(139, 92, 246, 0.7)',   // Violet  
      'rgba(168, 85, 247, 0.6)',   // Purple
      'rgba(236, 72, 153, 0.7)',   // Pink
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.6)',   // Emerald
      'rgba(245, 158, 11, 0.7)',   // Amber
      'rgba(239, 68, 68, 0.6)',    // Red
      'rgba(34, 197, 94, 0.7)',    // Green
      'rgba(168, 162, 158, 0.5)'   // Stone
    ];

    const darkThemeColors = [
      'rgba(129, 140, 248, 0.9)',  // Indigo lighter
      'rgba(167, 139, 250, 0.8)',  // Violet lighter
      'rgba(196, 181, 253, 0.7)',  // Purple lighter
      'rgba(244, 114, 182, 0.8)',  // Pink lighter
      'rgba(96, 165, 250, 0.9)',   // Blue lighter
      'rgba(52, 211, 153, 0.7)',   // Emerald lighter
      'rgba(251, 191, 36, 0.8)',   // Amber lighter
      'rgba(248, 113, 113, 0.7)',  // Red lighter
      'rgba(74, 222, 128, 0.8)',   // Green lighter
      'rgba(214, 211, 209, 0.6)'   // Stone lighter
    ];

    const colors = theme === 'dark' ? darkThemeColors : lightThemeColors;

    // Create enhanced particles with better visibility
    const createParticles = () => {
      const particleCount = 80; // Increased count
      const particles = [];

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 6 + 3; // Larger particles
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.className = 'particle';
        particle.style.position = 'absolute';
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.background = `radial-gradient(circle, ${color}, ${color.replace(/[\d.]+\)$/g, '0.2)')})`;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.left = Math.random() * window.innerWidth + 'px';
        particle.style.top = Math.random() * window.innerHeight + 'px';
        particle.style.filter = 'blur(0.5px)';
        particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
        particle.style.zIndex = '1';
        particle.style.willChange = 'transform, opacity';
        
        // Enhanced visibility with glow effect
        if (theme === 'dark') {
          particle.style.mixBlendMode = 'screen';
          particle.style.filter = 'blur(0.3px) brightness(1.2)';
        } else {
          particle.style.mixBlendMode = 'multiply';
          particle.style.filter = 'blur(0.3px) saturate(1.5)';
        }
        
        container.appendChild(particle);
        particles.push(particle);
      }

      particlesRef.current = particles;
      return particles;
    };

    // Enhanced particle animation with more visible movement
    const animateParticles = (particles) => {
      particles.forEach((particle, index) => {
        const baseDelay = index * 80;
        const movementRadius = 100 + Math.random() * 60; // Larger movement
        const duration = 10000 + Math.random() * 6000;
        
        const angleOffset = (index / particles.length) * 360;
        
        // More pronounced X movement
        animate(particle, {
          x: [
            { to: Math.cos((angleOffset) * Math.PI / 180) * movementRadius, duration: duration / 4, ease: 'linear' },
            { to: Math.cos((angleOffset + 90) * Math.PI / 180) * movementRadius, duration: duration / 4, ease: 'linear' },
            { to: Math.cos((angleOffset + 180) * Math.PI / 180) * movementRadius, duration: duration / 4, ease: 'linear' },
            { to: Math.cos((angleOffset + 270) * Math.PI / 180) * movementRadius, duration: duration / 4, ease: 'linear' },
            { to: Math.cos((angleOffset + 360) * Math.PI / 180) * movementRadius, duration: 0, ease: 'linear' }
          ],
          loop: true,
          delay: baseDelay
        });

        // More pronounced Y movement
        animate(particle, {
          y: [
            { to: Math.sin((angleOffset) * Math.PI / 180) * movementRadius * 0.8, duration: duration / 4, ease: 'linear' },
            { to: Math.sin((angleOffset + 90) * Math.PI / 180) * movementRadius * 0.8, duration: duration / 4, ease: 'linear' },
            { to: Math.sin((angleOffset + 180) * Math.PI / 180) * movementRadius * 0.8, duration: duration / 4, ease: 'linear' },
            { to: Math.sin((angleOffset + 270) * Math.PI / 180) * movementRadius * 0.8, duration: duration / 4, ease: 'linear' },
            { to: Math.sin((angleOffset + 360) * Math.PI / 180) * movementRadius * 0.8, duration: 0, ease: 'linear' }
          ],
          loop: true,
          delay: baseDelay
        });

        // Enhanced opacity with higher visibility
        animate(particle, {
          opacity: [
            { to: 0.6, duration: 2500, ease: 'inOutSine' },
            { to: 1, duration: 2500, ease: 'inOutSine' },
            { to: 0.8, duration: 2500, ease: 'inOutSine' },
            { to: 0.6, duration: 2500, ease: 'inOutSine' }
          ],
          loop: true,
          delay: baseDelay + 200
        });

        // Scale animation for more prominence
        animate(particle, {
          scale: [
            { to: 1.3, duration: 4000, ease: 'inOutSine' },
            { to: 0.8, duration: 4000, ease: 'inOutSine' },
            { to: 1.1, duration: 4000, ease: 'inOutSine' },
            { to: 1, duration: 4000, ease: 'inOutSine' }
          ],
          loop: true,
          delay: baseDelay + 500
        });

        // Rotation for dynamic effect
        animate(particle, {
          rotate: '360deg',
          duration: 15000 + Math.random() * 10000,
          loop: true,
          ease: 'linear',
          delay: baseDelay
        });
      });
    };

    // Enhanced mouse interaction with stronger effects
    const handleMouseMove = (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      particlesRef.current.forEach((particle, index) => {
        const rect = particle.getBoundingClientRect();
        const particleX = rect.left + rect.width / 2;
        const particleY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - particleX, 2) + Math.pow(mouseY - particleY, 2)
        );
        
        const maxDistance = 200; // Increased interaction range
        
        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(mouseY - particleY, mouseX - particleX);
          
          // Stronger repulsion with enhanced visibility
          animate(particle, {
            x: `${-Math.cos(angle) * force * 50}px`,
            y: `${-Math.sin(angle) * force * 50}px`,
            scale: 1 + force * 1.2,
            opacity: Math.min(1, 0.8 + force * 0.5),
            duration: 400,
            ease: 'outExpo'
          });
        }
      });

      // Enhanced shape interactions
      shapesRef.current.forEach((shape) => {
        const rect = shape.getBoundingClientRect();
        const shapeX = rect.left + rect.width / 2;
        const shapeY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - shapeX, 2) + Math.pow(mouseY - shapeY, 2)
        );
        
        if (distance < 150) {
          const force = (150 - distance) / 150;
          animate(shape, {
            scale: 1 + force * 0.4,
            opacity: Math.min(0.9, 0.5 + force * 0.6),
            duration: 300,
            ease: 'outQuart'
          });
        }
      });
    };

    // Create enhanced geometric shapes with varied colors
    const createGeometricShapes = () => {
      const shapes = ['circle', 'triangle', 'square', 'diamond', 'hexagon'];
      const shapeCount = 12; // Increased count
      
      for (let i = 0; i < shapeCount; i++) {
        const shape = document.createElement('div');
        const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
        const size = Math.random() * 35 + 25; // Larger shapes
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        shape.className = `geometric-shape ${shapeType}`;
        shape.style.position = 'absolute';
        shape.style.left = Math.random() * window.innerWidth + 'px';
        shape.style.top = Math.random() * window.innerHeight + 'px';
        shape.style.pointerEvents = 'none';
        shape.style.opacity = '0.6'; // Increased base opacity
        shape.style.zIndex = '2';
        shape.style.willChange = 'transform, opacity';
        
        if (shapeType === 'circle') {
          shape.style.width = size + 'px';
          shape.style.height = size + 'px';
          shape.style.borderRadius = '50%';
          shape.style.border = `2px solid ${color}`;
          shape.style.background = `radial-gradient(circle, ${color.replace(/[\d.]+\)$/g, '0.3)')}, transparent 60%)`;
          shape.style.boxShadow = `0 0 ${size}px ${color.replace(/[\d.]+\)$/g, '0.4)')}`;
        } else if (shapeType === 'square') {
          shape.style.width = size + 'px';
          shape.style.height = size + 'px';
          shape.style.border = `2px solid ${color}`;
          shape.style.background = `linear-gradient(45deg, ${color.replace(/[\d.]+\)$/g, '0.3)')}, transparent 70%)`;
          shape.style.boxShadow = `0 0 ${size/2}px ${color.replace(/[\d.]+\)$/g, '0.4)')}`;
        } else if (shapeType === 'diamond') {
          shape.style.width = size + 'px';
          shape.style.height = size + 'px';
          shape.style.border = `2px solid ${color}`;
          shape.style.transform = 'rotate(45deg)';
          shape.style.background = `linear-gradient(45deg, ${color.replace(/[\d.]+\)$/g, '0.3)')}, transparent 70%)`;
          shape.style.boxShadow = `0 0 ${size/2}px ${color.replace(/[\d.]+\)$/g, '0.4)')}`;
        } else if (shapeType === 'hexagon') {
          shape.style.width = size + 'px';
          shape.style.height = size * 0.87 + 'px';
          shape.style.background = `linear-gradient(60deg, ${color.replace(/[\d.]+\)$/g, '0.3)')}, transparent 70%)`;
          shape.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
          shape.style.border = `2px solid ${color}`;
          shape.style.boxShadow = `0 0 ${size/2}px ${color.replace(/[\d.]+\)$/g, '0.4)')}`;
        } else if (shapeType === 'triangle') {
          shape.style.width = '0';
          shape.style.height = '0';
          shape.style.borderLeft = `${size/2}px solid transparent`;
          shape.style.borderRight = `${size/2}px solid transparent`;
          shape.style.borderBottom = `${size}px solid ${color}`;
          shape.style.filter = `drop-shadow(0 0 ${size/3}px ${color.replace(/[\d.]+\)$/g, '0.5)')})`;
        }
        
        container.appendChild(shape);
        shapesRef.current.push(shape);
        
        // Enhanced shape animations
        const rotationDuration = 20000 + Math.random() * 15000;
        const movementDuration = 15000 + Math.random() * 10000;
        
        // Smooth rotation
        animate(shape, {
          rotate: '360deg',
          duration: rotationDuration,
          loop: true,
          ease: 'linear'
        });
        
        // Enhanced movement pattern
        const amplitude = 60 + Math.random() * 40;
        const phaseOffset = (i / shapeCount) * 360;
        
        animate(shape, {
          x: [
            { to: Math.cos(phaseOffset * Math.PI / 180) * amplitude, duration: movementDuration / 4, ease: 'linear' },
            { to: Math.cos((phaseOffset + 90) * Math.PI / 180) * amplitude, duration: movementDuration / 4, ease: 'linear' },
            { to: Math.cos((phaseOffset + 180) * Math.PI / 180) * amplitude, duration: movementDuration / 4, ease: 'linear' },
            { to: Math.cos((phaseOffset + 270) * Math.PI / 180) * amplitude, duration: movementDuration / 4, ease: 'linear' },
            { to: Math.cos((phaseOffset + 360) * Math.PI / 180) * amplitude, duration: 0, ease: 'linear' }
          ],
          y: [
            { to: Math.sin(phaseOffset * 2 * Math.PI / 180) * amplitude * 0.6, duration: movementDuration / 4, ease: 'linear' },
            { to: Math.sin((phaseOffset + 90) * 2 * Math.PI / 180) * amplitude * 0.6, duration: movementDuration / 4, ease: 'linear' },
            { to: Math.sin((phaseOffset + 180) * 2 * Math.PI / 180) * amplitude * 0.6, duration: movementDuration / 4, ease: 'linear' },
            { to: Math.sin((phaseOffset + 270) * 2 * Math.PI / 180) * amplitude * 0.6, duration: movementDuration / 4, ease: 'linear' },
            { to: Math.sin((phaseOffset + 360) * 2 * Math.PI / 180) * amplitude * 0.6, duration: 0, ease: 'linear' }
          ],
          loop: true,
          delay: i * 400
        });

        // Enhanced scale and opacity animation
        animate(shape, {
          scale: [
            { to: 1.2, duration: 3500, ease: 'inOutSine' },
            { to: 0.8, duration: 3500, ease: 'inOutSine' },
            { to: 1.0, duration: 3500, ease: 'inOutSine' }
          ],
          opacity: [
            { to: 0.8, duration: 3000, ease: 'inOutSine' },
            { to: 0.4, duration: 3000, ease: 'inOutSine' },
            { to: 0.6, duration: 3000, ease: 'inOutSine' }
          ],
          loop: true,
          delay: i * 500
        });
      }
    };

    const particles = createParticles();
    animateParticles(particles);
    createGeometricShapes();

    // Add enhanced mouse interaction
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      particlesRef.current.forEach(particle => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
      shapesRef.current.forEach(shape => {
        if (shape.parentNode) {
          shape.parentNode.removeChild(shape);
        }
      });
    };
  }, [theme]);

  // Enhanced background gradient with better layering
  const backgroundGradient = theme === 'dark'
    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(51, 65, 85, 0.75) 100%)'
    : 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.75) 50%, rgba(226, 232, 240, 0.7) 100%)';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{
        background: backgroundGradient,
        zIndex: 0
      }}
    />
  );
};

export default AnimatedBackground;
