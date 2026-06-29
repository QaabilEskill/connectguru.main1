import React from 'react';

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

const FloatingParticles: React.FC<FloatingParticlesProps> = ({ 
  count = 20, 
  className = "" 
}) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.6 + 0.2,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-br from-primary/30 to-primary-glow/20 animate-float"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;