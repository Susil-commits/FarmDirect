import { useEffect, useRef } from 'react';

export const useScrollReveal = ({
  threshold = 0.2,
  repeat = false,
  staggerDelay = 100,
} = {}) => {
  const ref = useRef(null);
  const observerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observerOptions = {
      threshold: threshold,
      rootMargin: '0px 0px -100px 0px', 
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;

        if (entry.isIntersecting) {
          
          if (!hasAnimated.current || repeat) {
            element.classList.add('visible');

            const children = element.querySelectorAll('[data-stagger]');
            if (children.length > 0) {
              children.forEach((child, index) => {
                setTimeout(() => {
                  child.classList.add('visible');
                }, index * staggerDelay);
              });
            }

            if (!repeat) {
              hasAnimated.current = true;
            }
          }
        } else if (repeat) {
          
          element.classList.remove('visible');
          const children = element.querySelectorAll('[data-stagger]');
          children.forEach((child) => {
            child.classList.remove('visible');
          });
        }
      });
    };

    observerRef.current = new IntersectionObserver(
      handleIntersection,
      observerOptions
    );

    const currentRef = ref.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [threshold, repeat, staggerDelay]);

  return { ref };
};

export const useSequenceAnimation = (itemDelay = 100, triggerClass = 'visible') => {
  const containerRef = useRef(null);

  const triggerAnimation = () => {
    if (!containerRef.current) return;

    const items = containerRef.current.querySelectorAll('[data-sequence-item]');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add(triggerClass);
      }, index * itemDelay);
    });
  };

  return { containerRef, triggerAnimation };
};
