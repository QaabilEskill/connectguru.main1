import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quote as QuoteIcon } from 'lucide-react';
import { motivationalQuotes } from '@/data/motivationalQuotes';

const MotivationalQuoteCard: React.FC = () => {
  const [index, setIndex] = useState(0);

  // Update quote daily at 8 AM
  const currentIndex = useMemo(() => {
    const now = new Date();
    const hoursToday = Math.floor(now.getTime() / (1000 * 60 * 60 * 8)); 
    return hoursToday % motivationalQuotes.length;
  }, []);

  useEffect(() => {
    setIndex(currentIndex);
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % motivationalQuotes.length);
    }, 1000 * 60 * 60 * 8); // 8 hours
    return () => clearInterval(interval);
  }, [currentIndex]);

  const quote = motivationalQuotes[index];

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-center">
          <QuoteIcon className="w-5 h-5 text-primary" />
          Motivational Quote
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-2">
        <p className="text-lg font-medium leading-relaxed">“{quote}”</p>
      </CardContent>
    </Card>
  );
};

export default MotivationalQuoteCard;
