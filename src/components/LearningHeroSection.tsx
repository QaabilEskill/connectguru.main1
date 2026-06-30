import React from 'react';
import { BookOpen } from 'lucide-react';
// Using direct paths for better compatibility
const heroImage = '/src/assets/learning-hero.jpg';
const readingCharacter = '/src/assets/reading-character.png';

interface LearningHeroSectionProps {
  totalActivities?: number;
  userName?: string;
}

const LearningHeroSection: React.FC<LearningHeroSectionProps> = ({
  totalActivities = 0,
  userName
}) => {
  return (
    <div className="relative min-h-[400px] hero-3d-background rounded-3xl overflow-hidden mb-12">
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-8 lg:p-12 h-full">
        {/* Left content */}
        <div className="flex-1 text-center lg:text-left space-y-6 lg:pr-8">
          <div className="space-y-2">
            <div className="inline-block p-4 rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20 floating-animation mb-4">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold gradient-text animate-fade-in">
              🎓 Learning Hub
            </h1>
            
            {userName && (
              <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Welcome back, {userName}! 🌟
              </p>
            )}
            
            <p className="text-lg text-muted-foreground max-w-2xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Enhance your English skills through structured lessons, inspiring stories, and interactive practice
            </p>
          </div>
          
          {/* Achievement highlight */}
          {totalActivities > 0 && (
            <div className="inline-flex items-center gap-3 bg-card/80 backdrop-blur-sm border border-border/30 rounded-2xl px-6 py-3 animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse-gentle" />
              <span className="text-sm font-medium text-foreground">
                {totalActivities} activities completed! Keep going! 🚀
              </span>
            </div>
          )}
        </div>
        
        {/* Right illustration */}
        <div className="flex-1 max-w-md lg:max-w-lg relative">
          <div className="relative">
            {/* Main hero image */}
            <img 
              src={heroImage} 
              alt="Learning journey illustration" 
              className="w-full h-auto rounded-2xl shadow-luxury animate-fade-in" 
              style={{ animationDelay: '0.8s' }}
            />
            
            {/* Floating character */}
            <div className="absolute -top-8 -right-8 w-24 h-24 animate-bounce-subtle" style={{ animationDelay: '1s' }}>
              <img 
                src={readingCharacter} 
                alt="Reading character" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary/20 rounded-full animate-pulse-gentle" style={{ animationDelay: '1.2s' }} />
            <div className="absolute top-1/4 -right-2 w-8 h-8 bg-primary/20 rounded-full animate-bounce-subtle" style={{ animationDelay: '1.4s' }} />
          </div>
        </div>
      </div>
      
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/50 to-transparent" />
    </div>
  );
};

export default LearningHeroSection;