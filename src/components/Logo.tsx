import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
}

export const Logo: React.FC<LogoProps> = ({ className, variant = 'color' }) => {
  const getStyle = () => {
    switch (variant) {
      case 'light':
        return { 
          primary: 'white',
          accent: '#ffffff'
        };
      case 'dark':
        return { 
          primary: '#1a1c2e', 
          accent: '#7c0000'
        };
      default:
        return { 
          primary: '#333333', // Dark text color
          accent: 'url(#flowerGradient)' // Gradient for the flower
        };
    }
  };

  const style = getStyle();

  return (
    <svg 
      viewBox="0 0 240 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="flowerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" /> {/* Red */}
          <stop offset="50%" stopColor="#f59e0b" /> {/* Orange */}
          <stop offset="100%" stopColor="#fbbf24" /> {/* Yellow */}
        </linearGradient>
      </defs>
      
      {/* Script-like 'Amparo' Text Representation */}
      <text 
        x="10" 
        y="70" 
        fontFamily="cursive, 'Brush Script MT', sans-serif" 
        fontSize="54" 
        fill={variant === 'light' ? 'white' : '#333333'}
        style={{ fontWeight: 'bold' }}
      >
        Amparo
      </text>

      {/* Abstract Tropical Flower (Heliconia style) */}
      <g transform="translate(160, 45) scale(0.9)">
        {/* Heliconia Bracts - Staggered set of downward-curved boat shapes */}
        <path d="M0 0C5 10 20 15 35 5C25 -5 10 -10 0 0Z" transform="translate(0, 0) rotate(15)" fill={variant === 'light' ? 'rgba(255,255,255,1)' : '#7c0000'} />
        <path d="M0 0C5 10 20 15 35 5C25 -5 10 -10 0 0Z" transform="translate(5, 12) rotate(15)" fill={variant === 'light' ? 'rgba(255,255,255,0.8)' : '#ef4444'} />
        <path d="M0 0C5 10 20 15 35 5C25 -5 10 -10 0 0Z" transform="translate(10, 24) rotate(15)" fill={variant === 'light' ? 'rgba(255,255,255,0.6)' : '#f59e0b'} />
        <path d="M0 0C5 10 20 15 35 5C25 -5 10 -10 0 0Z" transform="translate(15, 36) rotate(15)" fill={variant === 'light' ? 'rgba(255,255,255,0.4)' : '#fbbf24'} />
      </g>
    </svg>
  );
};
