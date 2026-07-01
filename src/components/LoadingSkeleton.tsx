import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'default' }) => {
  const baseClasses = "animate-pulse bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] animate-shimmer rounded-lg";
  
  const variantClasses = {
    default: "h-4 w-full",
    card: "h-32 w-full rounded-xl",
    text: "h-3 w-3/4",
    avatar: "h-10 w-10 rounded-full",
    button: "h-10 w-24 rounded-lg"
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )} 
    />
  );
};

// Loading Cards Component
export const LoadingCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("glass-card animate-fade-in", className)}>
    <div className="space-y-4">
      <Skeleton variant="avatar" className="mx-auto" />
      <Skeleton variant="text" className="mx-auto" />
      <Skeleton className="h-3 w-1/2 mx-auto" />
      <Skeleton variant="button" className="mx-auto" />
    </div>
  </div>
);

// Loading List Component
export const LoadingList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className 
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="glass-card p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
        <div className="flex items-center gap-4">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Loading Dashboard Component
export const LoadingDashboard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("space-y-8", className)}>
    {/* Header skeleton */}
    <div className="glass-card p-8 text-center">
      <Skeleton variant="avatar" className="w-16 h-16 mx-auto mb-4" />
      <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
      <Skeleton className="h-4 w-3/4 mx-auto" />
    </div>
    
    {/* Stats skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingCard key={i} className="p-4" />
      ))}
    </div>
    
    {/* Content skeleton */}
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <LoadingCard className="h-64" />
      </div>
      <div>
        <LoadingCard className="h-64" />
      </div>
    </div>
  </div>
);

export default Skeleton;