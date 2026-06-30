import React from 'react';
const cgLogo = '/logo.png';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 48, showText = true }) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={cgLogo}
        alt="ConnectGuru logo"
        width={size}
        height={size}
        className="object-contain"
        style={{ background: 'transparent' }}
        loading="lazy"
      />
      {showText && (
        <span className="text-xl sm:text-2xl font-bold gradient-text">ConnectGuru</span>
      )}
    </div>
  );
};

export default BrandLogo;
