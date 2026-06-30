import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Ripple Effect Component
interface RippleProps {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  duration?: number;
}

export const RippleButton: React.FC<RippleProps> = ({ 
  children, 
  className, 
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  duration = 600,
  ...props 
}) => {
  const [ripples, setRipples] = useState<Array<{
    x: number;
    y: number;
    size: number;
    id: number;
  }>>([]);

  const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };
    
    setRipples(prev => [...prev, newRipple]);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setRipples(prev => prev.slice(1));
    }, duration);
    
    return () => clearTimeout(timeout);
  }, [ripples, duration]);

  return (
    <button
      className={cn(
        "relative overflow-hidden transition-all duration-300 transform-gpu",
        className
      )}
      onClick={addRipple}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ping opacity-75 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            background: rippleColor,
            transform: 'scale(0)',
            animation: `ripple ${duration}ms ease-out`,
          }}
        />
      ))}
    </button>
  );
};

// Magnetic Button Component
interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export const MagneticButton: React.FC<MagneticProps> = ({ 
  children, 
  className, 
  strength = 0.3,
  ...props 
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setPosition({ x: x * strength, y: y * strength });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn(
        "transition-transform duration-300 ease-out transform-gpu",
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

// Tilt Card Component
interface TiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export const TiltCard: React.FC<TiltProps> = ({ 
  children, 
  className, 
  maxTilt = 20,
  ...props 
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = ((y - centerY) / centerY) * maxTilt;
    const tiltY = ((centerX - x) / centerX) * maxTilt;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn(
        "transition-transform duration-300 ease-out transform-gpu",
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

// Floating Action Button
export const FloatingActionButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}> = ({ 
  children, 
  className, 
  position = 'bottom-right',
  ...props 
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <button
      className={cn(
        "fixed z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
        "bg-primary text-primary-foreground hover:scale-110 hover:-translate-y-1",
        "animate-bounce-subtle hover:animate-none",
        positionClasses[position],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};