import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
  onComplete?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 100,
  delay = 0,
  className = '',
  cursor = true,
  onComplete
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      } else if (onComplete) {
        onComplete();
      }
    }, currentIndex === 0 ? delay : speed);

    return () => clearTimeout(timer);
  }, [currentIndex, text, speed, delay, onComplete]);

  useEffect(() => {
    if (currentIndex === text.length && cursor) {
      const cursorTimer = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 530);

      return () => clearInterval(cursorTimer);
    }
  }, [currentIndex, text.length, cursor]);

  return (
    <span className={className}>
      {displayText}
      {cursor && (currentIndex < text.length || showCursor) && (
        <span className="inline-block w-0.5 h-[1em] bg-primary ml-1 animate-pulse">|</span>
      )}
    </span>
  );
};

export default TypewriterText;