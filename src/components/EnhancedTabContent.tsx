import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
// Using direct paths for better compatibility
const knowledgeTree = '/src/assets/knowledge-tree.png';
const learningIcons = '/src/assets/learning-icons.png';

interface EnhancedTabContentProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  illustration?: 'tree' | 'icons' | 'none';
  gradient?: string;
}

const EnhancedTabContent: React.FC<EnhancedTabContentProps> = ({
  title,
  description,
  icon: Icon,
  children,
  illustration = 'none',
  gradient = 'from-primary/5 to-secondary/5'
}) => {
  const getIllustration = () => {
    switch (illustration) {
      case 'tree':
        return knowledgeTree;
      case 'icons':
        return learningIcons;
      default:
        return null;
    }
  };

  const illustrationSrc = getIllustration();

  return (
    <Card className="glass-card relative overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-30`} />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                {description}
              </CardDescription>
            </div>
          </div>
          
          {/* Floating illustration */}
          {illustrationSrc && (
            <div className="hidden md:block">
              <img 
                src={illustrationSrc} 
                alt="Illustration" 
                className="w-20 h-20 opacity-60 animate-float"
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        {children}
      </CardContent>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-2xl" />
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-secondary/5 to-primary/5 rounded-full blur-xl" />
    </Card>
  );
};

export default EnhancedTabContent;