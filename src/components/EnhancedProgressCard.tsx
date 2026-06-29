import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EnhancedProgressCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
  delay?: number;
}

const EnhancedProgressCard: React.FC<EnhancedProgressCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  iconColor,
  delay = 0
}) => {
  return (
    <Card 
      className="glass-card hover-lift group cursor-pointer transform transition-all duration-500 hover:scale-105 animate-fade-in-up" 
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-6 text-center relative overflow-hidden">
        {/* Background gradient effect */}
        <div className={`absolute inset-0 ${gradient} opacity-5 rounded-2xl transition-opacity group-hover:opacity-10`} />
        
        {/* Floating icon with gradient background */}
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${gradient} relative`}>
          <Icon className={`w-8 h-8 ${iconColor} drop-shadow-sm`} />
          
          {/* Glow effect */}
          <div className={`absolute inset-0 ${gradient} rounded-2xl blur-xl opacity-20 scale-150 group-hover:opacity-40 transition-opacity`} />
        </div>
        
        {/* Value with enhanced typography */}
        <div className="text-3xl font-bold text-foreground mb-2 group-hover:scale-110 transition-transform duration-300">
          {value}
        </div>
        
        {/* Description */}
        <div className="text-sm text-muted-foreground font-medium">
          {description}
        </div>
        
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </CardContent>
    </Card>
  );
};

export default EnhancedProgressCard;