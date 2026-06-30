import React, { useEffect, useCallback, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, BookOpen, Heart, Play, CreditCard, LogOut, Star, Trophy, Users, Settings, Sparkles, Zap, Award, Globe, Timer, Brain, MessageSquare, Target, FileText, ShieldCheck, LockKeyhole, CheckCircle2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import Navigation from '@/components/Navigation';
import { useUserStats } from '@/hooks/useUserStats';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import DarkModeToggle from '@/components/DarkModeToggle';
import EnhancedCard from '@/components/EnhancedCard';
import { MagneticButton } from '@/components/MicroInteractions';
import { MobileContainer, ResponsiveGrid, ResponsiveText, TouchButton, MobileStack } from '@/components/MobileOptimizations';
import { useIsMobile } from '@/hooks/use-mobile';
import { PSYCHOMETRIC_ORIGINAL_PRICE, PSYCHOMETRIC_PRICE, formatRupees } from '@/config/pricing';

const SHOW_ENGLISH_PLATFORM = false;

const Dashboard = () => {
  const { user, userProfile, subscriptionData, signOut } = useAuth();
  const { lessonsCompleted } = useUserStats();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useScrollReveal();

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/auth');
  }, [signOut, navigate]);

  const handleAccessSelection = useCallback(() => {
    navigate('/test-access');
  }, [navigate]);

  const handleFullAccess = useCallback(() => {
    navigate('/test-access');
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    document.title = 'Dashboard – Learn English | ConnectGuru';
    const ensureMeta = (name: string, content: string) => {
      let m = document.querySelector(`meta[name="${name}"]`);
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', name);
        document.head.appendChild(m);
      }
      m.setAttribute('content', content);
    };
    
    ensureMeta('description', 'Access your personalized English learning dashboard with AI-powered lessons, conversation practice, and progress tracking.');
    ensureMeta('keywords', 'English learning dashboard, personalized lessons, AI tutoring, conversation practice, language learning');
    
    // Don't redirect to payment - show dashboard with payment options instead
    
    // Clean up old meta tags
    return () => {
      // Keep meta tags for SEO
    };
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />
      
      {/* Welcome Header */}
      <MobileContainer className="text-center py-4 sm:py-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/30">
        <ResponsiveText variant="h2" className="font-bold text-foreground">
          Welcome to <span className="gradient-text">ConnectGuru</span>
        </ResponsiveText>
      </MobileContainer>

      {/* Professional Header */}
      <header className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/30">
        <MobileContainer className="max-w-7xl py-3 sm:py-6">
          <MobileStack className="items-center justify-between" spacing="sm" breakpoint="sm">
            <MobileStack className="items-center" spacing="sm" breakpoint="sm">
              <BrandLogo size={isMobile ? 48 : 56} />
              {!isMobile && (
                <div className="hidden sm:block">
                  <ResponsiveText variant="caption" className="text-muted-foreground">Learn English Effectively</ResponsiveText>
                </div>
              )}
            </MobileStack>
            
            <MobileStack className="items-center w-full sm:w-auto" spacing="sm" breakpoint="sm">
              <div className="flex gap-2">
                <DarkModeToggle />
                <TouchButton 
                  onClick={() => navigate('/contact')} 
                  variant="ghost" 
                  size="sm"
                  className="glass-button micro-lift micro-bounce"
                >
                  <span className="hidden sm:inline">Contact</span>
                  <span className="sm:hidden">Help</span>
                </TouchButton>
              </div>
              
              <div className="text-center sm:text-right">
                <ResponsiveText variant="caption" className="text-muted-foreground">Hi, good to see you here!</ResponsiveText>
                <ResponsiveText variant="body" className="font-semibold text-foreground gradient-text">{userProfile?.full_name || user?.email}</ResponsiveText>
              </div>
              
              <TouchButton onClick={handleSignOut} variant="secondary" size="sm" className="glass-button hover-lift">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Exit</span>
              </TouchButton>
            </MobileStack>
          </MobileStack>
        </MobileContainer>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-6 sm:space-y-8 flex flex-col items-center">
          {/* Centered content for mobile */}
          {/* Psychometric Career Guidance Test Section - Top Priority */}
          <Card className="relative overflow-hidden morphism-card w-full max-w-6xl mx-auto mb-8 border-primary/20 bg-card/85 shadow-glow transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card/60 to-secondary/10" />
            <CardHeader className="relative pb-6 sm:pb-8 lg:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl text-left">
                  <Badge className="mb-4 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15">
                    Premium Career Assessment
                  </Badge>
                  <CardTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight animate-gradient">
                    Psychometric Career Guidance Test
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                    Discover your best-fit stream, strengths, personality patterns, and future-ready career path with a scientific assessment built for students.
                  </CardDescription>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-card/75 p-5 text-center shadow-md backdrop-blur-xl lg:min-w-64">
                  <p className="text-sm text-muted-foreground mb-2">Limited-time access</p>
                  <div className="flex items-end justify-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground line-through">{formatRupees(PSYCHOMETRIC_ORIGINAL_PRICE)}</span>
                    <span className="text-5xl font-black text-primary">{formatRupees(PSYCHOMETRIC_PRICE)}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">One-time payment · Instant access</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-8 lg:px-10 lg:pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { icon: Brain, title: "Scientific Assessment", desc: "Interest, aptitude, personality, and goals mapped into clear insights." },
                  { icon: Target, title: "Personalized Direction", desc: "Career recommendations aligned with your profile, not generic advice." },
                  { icon: FileText, title: "Detailed Report", desc: "Actionable roadmap with strengths, study direction, and next steps." },
                  { icon: Zap, title: "Instant Access", desc: "Pay securely and open the test immediately after verification." }
                ].map((feature, index) => (
                  <Card key={index} className="border-primary/15 bg-card/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-md">
                    <CardContent className="p-5 sm:p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h4 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-2xl border border-border/40 bg-card/65 p-5 sm:p-6 backdrop-blur-xl">
                  <h3 className="mb-4 text-xl font-bold text-foreground">What students receive</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Stream-wise career guidance', 'Modern careers like AI, Data Science & FinTech', 'Strengths and personality clarity', 'Clear action plan for higher studies'].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3 rounded-xl bg-primary/5 p-3 text-sm font-medium text-foreground">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 backdrop-blur-xl">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-semibold text-foreground"><ShieldCheck className="h-5 w-5 text-primary" /> Razorpay secure checkout</div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-foreground"><LockKeyhole className="h-5 w-5 text-primary" /> Server-side payment verification</div>
                    <div className="flex items-center gap-3 text-sm font-semibold text-foreground"><Award className="h-5 w-5 text-primary" /> Trusted career guidance framework</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-primary/20 bg-card/75 p-4 sm:p-5 backdrop-blur-xl">
                <div>
                  <p className="text-sm text-muted-foreground">Final assessment price</p>
                  <p className="text-2xl font-black text-foreground"><span className="text-muted-foreground line-through mr-2">{formatRupees(PSYCHOMETRIC_ORIGINAL_PRICE)}</span>{formatRupees(PSYCHOMETRIC_PRICE)}</p>
                </div>
                <MagneticButton>
                  <Button onClick={() => navigate('/test-access')} size="lg" className="premium-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover-lift w-full sm:w-auto">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Pay {formatRupees(PSYCHOMETRIC_PRICE)} & Start Test
                  </Button>
                </MagneticButton>
              </div>
            </CardContent>
          </Card>

          {SHOW_ENGLISH_PLATFORM && (
          <>
          <Card className="morphism-card hover-glow hover-tilt w-full max-w-4xl mx-auto cursor-glow">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 animate-gradient">
                🚀 Complete English Learning Platform
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Master English conversation skills with AI-powered lessons, real-world practice, and personalized feedback designed for your success.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* What You Get Section */}
              <Card className="bg-muted/30 border border-primary/20 hover-glow">
                <CardHeader>
                  <CardTitle className="text-xl text-center text-primary animate-gradient">What You Get</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: "✨", text: "Career Counselling & Assessment", desc: "Discover the right career path with world-class scientific assessments." },
                      { icon: "🧠", text: "Memory Boosting & Study Skills", desc: "Sharper memory, stronger focus, smarter learning." },
                      { icon: "📘", text: "How to Top in Exams", desc: "Smart strategies & time management to score more with less stress." },
                      { icon: "💡", text: "Life Skills Development", desc: "Confidence, communication, leadership & emotional intelligence." },
                      { icon: "🔐", text: "Cyber Security Awareness", desc: "Protect students in the digital world – safe browsing, online fraud prevention & digital ethics." },
                      { icon: "🗣️", text: "AI-Based Spoken English Course", desc: "Learn English the smarter way! AI-powered, interactive, and result-driven – helping students speak fluently with confidence." },
                      { icon: "💰", text: "Financial Literacy", desc: "Financial planning teaches students to manage money wisely, build responsibility, and prepare for future independence." },
                      { icon: "💬", text: "Public Chat & Discussion", desc: "Connect with fellow learners, practice English, and share experiences in our community chat." },
                      { icon: "🎤", text: "English Speaking Practice", desc: "Interactive speaking sessions with AI feedback to improve pronunciation and fluency." },
                      { icon: "🌍", text: "And Much More…", desc: "Personality development, stress management, interview skills & customized school programs." }
                    ].map((feature, index) => (
                      <Card key={index} className="hover-lift transition-all duration-300 hover:bg-accent/20">
                        <CardContent className="flex items-start gap-3 p-3">
                          <span className="text-lg">{feature.icon}</span>
                          <div>
                            <h4 className="font-medium text-sm">{feature.text}</h4>
                            <p className="text-xs text-muted-foreground">{feature.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {userProfile?.has_paid_access ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <MagneticButton>
                    <Button 
                      onClick={handleFullAccess}
                      size="lg" 
                      className="premium-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover-lift w-full sm:w-auto"
                    >
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Start Learning Now
                    </Button>
                  </MagneticButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg font-bold line-through text-muted-foreground">{formatRupees(PSYCHOMETRIC_ORIGINAL_PRICE)}</span>
                      <span className="text-2xl font-bold text-primary">{formatRupees(PSYCHOMETRIC_PRICE)}</span>
                      <Badge variant="destructive" className="animate-pulse">Limited Offer</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">One-time payment for full access</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <MagneticButton>
                      <Button 
                        onClick={handleAccessSelection}
                        size="lg" 
                        className="premium-button text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 hover-lift w-full sm:w-auto"
                      >
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Get Full Access - {formatRupees(PSYCHOMETRIC_PRICE)}
                      </Button>
                    </MagneticButton>
                  </div>
                </div>
              )}
              

            </CardContent>
          </Card>

          {/* Enhanced Features Grid */}
          <div className="mt-16 sm:mt-24 w-full">
            <div className="text-center mb-12 sm:mb-16 scroll-reveal">
              <div className="morphism-card p-6 sm:p-8 hover-glow w-full max-w-4xl mx-auto">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-4 animate-gradient">
                  Why ConnectGuru is Different
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
                  The smart way to master English conversation skills
                </p>
              </div>
            </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-6xl mx-auto">
            {[
              {
                icon: BookOpen,
                title: 'AI-Powered Learning',
                description: 'Advanced AI technology adapts to your learning style, providing personalized lessons and feedback',
                bgGradient: 'from-primary/20 to-primary-glow/10'
              },
              {
                icon: Heart,
                title: 'Interactive Stories',
                description: 'Learn through engaging stories with real-world scenarios that build practical conversation skills',
                bgGradient: 'from-secondary/20 to-secondary/10'
              },
              {
                icon: Users,
                title: 'Global Community',
                description: 'Connect with learners worldwide, practice together, and track your progress on leaderboards',
                bgGradient: 'from-primary-glow/20 to-primary/10'
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="morphism-card hover-tilt hover-glow transition-all duration-500 cursor-glow scroll-reveal"
                style={{animationDelay: `${index * 0.2}s`}}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${feature.bgGradient} rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 transition-all duration-500 hover:scale-110 animate-breathe`}>
                    <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl mb-2 sm:mb-3 text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Inspirational Quote */}
        <div className="text-center mt-16 sm:mt-20 scroll-reveal w-full">
          <Card className="morphism-card hover-glow hover-tilt w-full max-w-3xl mx-auto cursor-glow animate-morph-glow">
            <CardContent className="p-6 sm:p-8 lg:p-12">
              <div className="mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto soft-glow animate-breathe">
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
              <blockquote className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-4 sm:mb-6 font-medium leading-relaxed">
                "The future belongs to those who believe in the beauty of their dreams."
              </blockquote>
              <cite className="text-sm sm:text-base text-primary font-semibold gradient-text">
                - Eleanor Roosevelt
              </cite>
            </CardContent>
          </Card>
        </div>
        </>
        )}
        
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
