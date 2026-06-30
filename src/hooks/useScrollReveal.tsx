import { useEffect, useRef } from 'react';

export const useScrollReveal = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // Use requestAnimationFrame to throttle DOM operations
      requestAnimationFrame(() => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.classList.contains('revealed')) {
            entry.target.classList.add('revealed');
            // Stop observing once revealed to improve performance
            observerRef.current?.unobserve(entry.target);
          }
        });
      });
    };

    observerRef.current = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe all scroll-reveal elements
    const scrollElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
    scrollElements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);
};