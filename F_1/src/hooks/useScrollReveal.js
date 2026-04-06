import { useEffect, useRef } from 'react';

/**
 * Hook for advanced scroll-triggered animations with stagger support
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Visibility threshold (0-1, default: 0.2)
 * @param {number} options.duration - Animation duration in ms (default: 600)
 * @param {string} options.animation - Animation class name (default: 'scroll-slide')
 * @param {boolean} options.repeat - Repeat animation on scroll out/in (default: false)
 * @param {number} options.staggerDelay - Delay between staggered child animations in ms (default: 100)
 * @returns {Object} - { ref: ref, animating: boolean }
 */
export const useScrollReveal = ({
  threshold = 0.2,
  duration = 600,
  animation = 'scroll-slide',
  repeat = false,
  staggerDelay = 100,
} = {}) => {
  const ref = useRef(null);
  const observerRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observerOptions = {
      threshold: threshold,
      rootMargin: '0px 0px -100px 0px', // Trigger slightly before visible
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;

        if (entry.isIntersecting) {
          // Add animation class
          if (!hasAnimated.current || repeat) {
            element.classList.add('visible');

            // Apply stagger to children if they exist
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
          // Remove animation class on scroll out if repeat is enabled
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

/**
 * Hook for sequence animation (animate multiple elements in sequence)
 * @param {number} totalItems - Total number of items to animate
 * @param {number} itemDelay - Delay between each item in ms
 * @param {string} triggerClass - Class to trigger animations
 * @returns {Object} - { containerRef, triggerAnimation }
 */
export const useSequenceAnimation = (totalItems = 0, itemDelay = 100, triggerClass = 'visible') => {
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
