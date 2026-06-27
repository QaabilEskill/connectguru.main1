import React from 'react';
import { cn } from '@/lib/utils';

// Mobile-First Container
interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ 
  children, 
  className, 
  padding = 'md' 
}) => {
  const paddingClasses = {
    sm: 'px-3 sm:px-4 lg:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
    xl: 'px-8 sm:px-12 lg:px-16'
  };

  return (
    <div className={cn(paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

// Responsive Grid
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: '1' | '2' | '3' | '4';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  columns = '3', 
  gap = 'md',
  className 
}) => {
  const gridClasses = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  const gapClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  return (
    <div className={cn(
      'grid',
      gridClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-Optimized Text
interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption';
  className?: string;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({ 
  children, 
  variant = 'body',
  className 
}) => {
  const variantClasses = {
    h1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold',
    h2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold',
    h3: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    h4: 'text-base sm:text-lg lg:text-xl font-semibold',
    body: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm'
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  );
};

// Touch-Friendly Button
interface TouchButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const TouchButton: React.FC<TouchButtonProps> = ({ 
  children, 
  className, 
  onClick,
  variant = 'primary',
  size = 'md'
}) => {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };

  const sizeClasses = {
    sm: 'h-10 px-4 text-sm min-h-[44px]', // 44px is minimum touch target
    md: 'h-12 px-6 text-base min-h-[44px]',
    lg: 'h-14 px-8 text-lg min-h-[44px]'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold',
        'transition-all duration-200 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Mobile Stack
interface MobileStackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg';
  breakpoint?: 'sm' | 'md' | 'lg';
}

export const MobileStack: React.FC<MobileStackProps> = ({ 
  children, 
  className,
  spacing = 'md',
  breakpoint = 'sm'
}) => {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  const breakpointClasses = {
    sm: `${spacingClasses[spacing]} sm:space-y-0 sm:flex sm:gap-4`,
    md: `${spacingClasses[spacing]} md:space-y-0 md:flex md:gap-4`,
    lg: `${spacingClasses[spacing]} lg:space-y-0 lg:flex lg:gap-4`
  };

  return (
    <div className={cn(breakpointClasses[breakpoint], className)}>
      {children}
    </div>
  );
};