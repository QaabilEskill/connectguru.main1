import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TiltCard } from './MicroInteractions';

interface EnhancedCardProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'premium' | 'floating';
  hover?: 'lift' | 'tilt' | 'glow' | 'scale';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  title,
  description,
  icon,
  className,
  variant = 'default',
  hover = 'lift',
  onClick,
  style
}) => {
  const variantClasses = {
    default: 'bg-card border border-border',
    glass: 'glass-card backdrop-blur-xl',
    gradient: 'bg-gradient-to-br from-card to-card/95 border border-border/30',
    premium: 'morphism-card animate-morph-glow',
    floating: 'floating-card shadow-elegant'
  };

  const hoverClasses = {
    lift: 'hover-lift',
    tilt: 'hover-tilt',
    glow: 'hover-glow',
    scale: 'hover:scale-105'
  };

  const CardComponent = hover === 'tilt' ? TiltCard : 'div';

  return (
    <CardComponent
      className={cn(
        'transition-all duration-300 cursor-pointer transform-gpu',
        variantClasses[variant],
        hoverClasses[hover],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={style}
    >
      <Card className="bg-transparent border-0 shadow-none">
        {(title || description || icon) && (
          <CardHeader className="space-y-2">
            {icon && (
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                {icon}
              </div>
            )}
            {title && (
              <CardTitle className="text-foreground flex items-center gap-2">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        {children && (
          <CardContent>
            {children}
          </CardContent>
        )}
      </Card>
    </CardComponent>
  );
};

export default EnhancedCard;