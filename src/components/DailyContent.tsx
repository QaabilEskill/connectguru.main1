import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Quote } from 'lucide-react';

import { motivationalQuotes } from '@/data/motivationalQuotes';

const DailyContent = () => {
  const [storyIndex, setStoryIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);

  useEffect(() => {
    loadDailyContent();
  }, []);

  const loadDailyContent = async () => {
    try {
      // Rotate story and quote by date for variety
      const now = new Date();
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      setQuoteIndex(dayOfYear % motivationalQuotes.length);
    } catch (error) {
      console.error('Error loading daily content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnotherQuote = async () => {
    setLoadingQuote(true);
    try {
      setQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length);
    } catch (e) {
      console.error('Error fetching another quote:', e);
    } finally {
      setLoadingQuote(false);
    }
  };


  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="islamic-card animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="islamic-card animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Daily Quote */}
      <Card className="floating-card animate-fade-in-up bounce-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl gradient-text">
            <div className="p-2 rounded-full bg-primary/20 pulse-gentle">
              <Quote className="w-7 h-7" />
            </div>
            Daily Quote
          </CardTitle>
          <CardDescription className="text-base">A powerful quote to inspire your day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20 shadow-elegant">
            <p className="text-base text-muted-foreground font-medium leading-relaxed">"{motivationalQuotes[quoteIndex]}"</p>
          </div>
          <Button onClick={getAnotherQuote} disabled={loadingQuote} className="premium-button">
            {loadingQuote ? 'Loading...' : 'Get Another Quote'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyContent;