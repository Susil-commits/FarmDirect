import { useState, useEffect, useRef } from 'react';

/**
 * Component that animates counting from 0 to a target number
 * @param {Object} props - Component props
 * @param {number} props.value - Target number to count to
 * @param {number} props.duration - Animation duration in ms (default: 2000)
 * @param {string} props.className - CSS class name for styling
 * @param {Function} props.format - Optional function to format the number
 * @param {number} props.decimals - Number of decimal places (default: 0)
 * @param {string} props.suffix - Suffix to append (e.g., '%', 'K')
 * @param {string} props.prefix - Prefix to prepend (e.g., '₹', '$')
 * @param {boolean} props.animateOnVisible - Animate only when visible (default: true)
 * @returns {JSX.Element}
 */
export default function AnimatedNumber({
  value = 0,
  duration = 2000,
  className = '',
  format,
  decimals = 0,
  suffix = '',
  prefix = '',
  animateOnVisible = false,
  placeholder = '--',
}) {
  const isPlaceholder = value === null || value === undefined || Number.isNaN(value);
  const [isVisible, setIsVisible] = useState(!animateOnVisible);
  const nodeRef = useRef(null);

  // Intersection Observer to trigger animation when visible
  useEffect(() => {
    if (!animateOnVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => observer.disconnect();
  }, [animateOnVisible]);

  // High-performance animation using requestAnimationFrame and direct DOM manipulation
  useEffect(() => {
    if (isPlaceholder || !isVisible || !nodeRef.current) return;

    let startTime = null;
    let animationFrameId;
    const startValue = 0;
    const difference = value - startValue;

    const updateValue = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + difference * easeOut;

      const numericValue = Math.floor(currentValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
      const formattedValue = format ? format(numericValue) : numericValue.toFixed(decimals);

      if (nodeRef.current) {
        // Direct DOM update avoids React state re-renders (~60fps)
        nodeRef.current.textContent = `${prefix}${formattedValue}${suffix}`;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateValue);
      } else if (nodeRef.current) {
        // Ensure final exact value is set
        const finalFormatted = format ? format(value) : value.toFixed(decimals);
        nodeRef.current.textContent = `${prefix}${finalFormatted}${suffix}`;
      }
    };

    animationFrameId = requestAnimationFrame(updateValue);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration, decimals, isVisible, isPlaceholder, prefix, suffix, format]);

  if (isPlaceholder) {
    return (
      <span ref={nodeRef} className={className}>
        {placeholder}
      </span>
    );
  }

  // Initial render starts at 0
  const initialValue = 0;
  const formattedInitial = format ? format(initialValue) : initialValue.toFixed(decimals);

  return (
    <span ref={nodeRef} className={className}>
      {prefix}{formattedInitial}{suffix}
    </span>
  );
}
