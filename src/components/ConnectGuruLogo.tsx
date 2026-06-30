import React from 'react';

const connectGuruLogoUrl = '/logo.png';

interface ConnectGuruLogoProps {
  className?: string;
  size?: number;
}

const ConnectGuruLogo: React.FC<ConnectGuruLogoProps> = ({ 
  className = "", 
  size = 200 
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={connectGuruLogoUrl}
        alt="ConnectGuru Logo"
        className="object-contain"
        style={{ width: size, height: size, background: 'transparent' }}
        loading="lazy"
      />
    </div>
  );
};

export default ConnectGuruLogo;