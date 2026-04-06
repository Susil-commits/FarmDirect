import { useState, useEffect } from 'react';

export default function PageTransition({ children, delay = 100 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay]);

  return (
    <div className={`${isVisible ? 'animate-page-load' : 'opacity-0'}`}>
      {children}
    </div>
  );
}
