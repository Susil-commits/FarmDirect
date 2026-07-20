import { useState, useEffect, useRef } from 'react';

export default function LazySection({ children, height = '400px', rootMargin = '200px' }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        observer.unobserve(domRef.current);
      }
    }, { rootMargin });

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [rootMargin]);

  return (
    <div ref={domRef}>
      {isVisible ? children : <div style={{ height }} />}
    </div>
  );
}


