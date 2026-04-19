import { useState, useEffect } from 'react';

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
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(!animateOnVisible);
  const [elementId] = useState(() => {
    // Generate unique ID without Math.random
    return `animated-number-${Date.now()}-${Math.floor(performance.now() % 1000)}`;
  });

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = 0;
    const difference = value - startValue;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + difference * easeOut;

      setDisplayValue(Math.floor(currentValue * Math.pow(10, decimals)) / Math.pow(10, decimals));

      if (progress === 1) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [value, duration, decimals, isVisible]);

  useEffect(() => {
    if (!animateOnVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(elementId);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [elementId, animateOnVisible]);

  const formattedValue = format
    ? format(displayValue)
    : displayValue.toFixed(decimals);

  return (
    <span
      id={elementId}
      className={className}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
