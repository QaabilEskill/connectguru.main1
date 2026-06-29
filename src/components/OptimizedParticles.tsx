import React, { memo } from 'react';

const OptimizedParticles = memo(() => {
  return (
    <div className="particle-layer">
      <div className="particle animate-particle" style={{left: '15%', top: '25%'}} />
      <div className="particle animate-particle" style={{left: '85%', top: '65%', animationDelay: '1s'}} />
      <div className="particle animate-particle" style={{left: '65%', top: '15%', animationDelay: '2s'}} />
      <div className="particle animate-particle" style={{left: '25%', top: '75%', animationDelay: '3s'}} />
    </div>
  );
});

OptimizedParticles.displayName = 'OptimizedParticles';

export default OptimizedParticles;