import { useEffect, useRef } from 'react';

/**
 * Hook for mouse tracking / interactive contrast effects
 * Tracks mouse position and applies transforms/shadows for interactive effects
 * @param {Object} options - Configuration options
 * @param {number} options.intensity - Intensity of the effect (default: 1)
 * @param {number} options.maxRotation - Max rotation in degrees (default: 5)
 * @param {boolean} options.applyShadow - Apply shadow effect (default: true)
 * @returns {Object} - { ref }
 */
export const useContrastAnimation = ({
  intensity = 1,
  maxRotation = 5,
  applyShadow = true,
} = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate rotation
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * maxRotation * intensity;
      const rotateY = ((x - centerX) / centerX) * maxRotation * intensity;

      // Calculate shadow offset
      let transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      element.style.transform = transform;

      if (applyShadow) {
        const shadowX = ((x - centerX) / centerX) * 20;
        const shadowY = ((y - centerY) / centerY) * 20;
        element.style.boxShadow = `${shadowX}px ${shadowY}px 30px rgba(0, 0, 0, 0.2)`;
      }
    };

    const handleMouseLeave = () => {
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      element.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity, maxRotation, applyShadow]);

  return { ref };
};

/**
 * Hook for parallax scroll effect
 * @param {Object} options - Configuration options
 * @param {number} options.speed - Parallax speed multiplier (default: 0.5)
 * @returns {Object} - { ref }
 */
export const useParallax = ({ speed = 0.5 } = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const elementTop = element.getBoundingClientRect().top + scrollY;
      const distanceFromCenter = scrollY - (elementTop - window.innerHeight / 2);

      element.style.transform = `translateY(${distanceFromCenter * speed}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return { ref };
};

/**
 * Hook for applying animated gradients that shift with mouse position
 * @param {Object} options - Configuration options
 * @param {Array} options.colors - Gradient colors (default: ['#22c55e', '#10b981', '#06b6d4'])
 * @returns {Object} - { ref }
 */
export const useGradientMouse = ({
  colors = ['#22c55e', '#10b981', '#06b6d4'],
} = {}) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Create gradient background based on mouse position
      const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
      
      const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
      element.style.background = gradient;
    };

    const handleMouseLeave = () => {
      element.style.background = `linear-gradient(135deg, ${colors.join(', ')})`;
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [colors]);

  return { ref };
};
