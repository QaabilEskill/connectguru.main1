import React, { useState } from 'react';
import { Menu, LogOut, Home, Info, MessageSquare, Brain, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationItem {
  title: string;
  href: string;
  icon: any;
  requiresAuth?: boolean;
}

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/');
  };

  const navigationItems: NavigationItem[] = [
    {
      title: 'Home',
      href: '/',
      icon: Home,
    },
    {
      title: 'What We Do',
      href: '#features',
      icon: Info,
    },
    {
      title: 'Psychometric Career Guidance',
      href: '/test-access',
      icon: Brain,
      requiresAuth: true,
    },
    {
      title: 'Contact Us',
      href: '/contact',
      icon: MessageSquare,
    },
    {
      title: 'Our Mentors',
      href: '/mentors',
      icon: Users,
    },
  ];

  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const featuresSection = document.querySelector('#features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const handleNavigation = (item: NavigationItem) => {
    if (item.requiresAuth && !user) {
      navigate(`/auth?redirect=${encodeURIComponent(item.href)}`);
    } else if (item.href === '#features') {
      scrollToFeatures({} as React.MouseEvent);
    } else {
      navigate(item.href);
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 bg-background/90 backdrop-blur-sm border-border/50 hover:bg-accent/90 shadow-lg"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle className="text-left">Navigation</SheetTitle>
          </SheetHeader>
          <div className="mt-8 space-y-4">
            {navigationItems.map((item) => (
              <div key={item.title}>
                {item.href === '#features' ? (
                  <button
                    onClick={scrollToFeatures}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavigation(item)}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{item.title}</span>
                    {item.requiresAuth && !user && (
                      <span className="ml-auto text-xs text-muted-foreground">Login required</span>
                    )}
                  </button>
                )}
              </div>
            ))}
            <Separator className="my-2" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent transition-colors text-left text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Navigation;