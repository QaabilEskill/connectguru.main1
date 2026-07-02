import React, { useState, useEffect } from 'react';

interface LoopingTypewriterProps {
  text: string;
  typingSpeed?: number;
  erasingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

const LoopingTypewriter: React.FC<LoopingTypewriterProps> = ({
  text,
  typingSpeed = 100,
  erasingSpeed = 50,
  pauseDuration = 2000,
  className = ''
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isTyping) {
      // Typing phase
      if (currentIndex < text.length) {
        timeout = setTimeout(() => {
          setDisplayText(text.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, typingSpeed);
      } else {
        // Pause before erasing
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, pauseDuration);
      }
    } else {
      // Erasing phase
      if (currentIndex > 0) {
        timeout = setTimeout(() => {
          setDisplayText(text.slice(0, currentIndex - 1));
          setCurrentIndex(currentIndex - 1);
        }, erasingSpeed);
      } else {
        // Pause before typing again
        timeout = setTimeout(() => {
          setIsTyping(true);
        }, pauseDuration / 2);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, isTyping, text, typingSpeed, erasingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default LoopingTypewriter;