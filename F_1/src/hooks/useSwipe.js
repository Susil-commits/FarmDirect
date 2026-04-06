import { useRef, useEffect } from 'react';

/**
 * Hook for detecting swipe gestures
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for left swipe
 * @param {Function} options.onSwipeRight - Callback for right swipe
 * @param {Function} options.onSwipeUp - Callback for up swipe
 * @param {Function} options.onSwipeDown - Callback for down swipe
 * @param {number} options.minDistance - Minimum swipe distance in px (default: 50)
 * @param {number} options.maxTime - Maximum swipe time in ms (default: 500)
 * @returns {Object} - { ref }
 */
export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minDistance = 50,
  maxTime = 500,
} = {}) => {
  const ref = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      const deltaTime = touchEndTime - touchStartTime.current;

      // Check if swipe time is within limits
      if (deltaTime > maxTime) return;

      // Determine swipe direction
      const absoluteDeltaX = Math.abs(deltaX);
      const absoluteDeltaY = Math.abs(deltaY);

      // Horizontal swipes
      if (absoluteDeltaX > absoluteDeltaY && absoluteDeltaX > minDistance) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      // Vertical swipes
      if (absoluteDeltaY > absoluteDeltaX && absoluteDeltaY > minDistance) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, false);
    element.addEventListener('touchend', handleTouchEnd, false);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart, false);
      element.removeEventListener('touchend', handleTouchEnd, false);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minDistance, maxTime]);

  return { ref };
};

/**
 * Hook for long press detection
 * @param {Object} options - Configuration options
 * @param {Function} options.onLongPress - Callback when long press detected
 * @param {number} options.duration - Duration to trigger long press in ms (default: 500)
 * @returns {Object} - { ref }
 */
export const useLongPress = ({
  onLongPress,
  duration = 500,
} = {}) => {
  const ref = useRef(null);
  const timeoutRef = useRef(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = () => {
      isLongPress.current = false;
      timeoutRef.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress?.();
      }, duration);
    };

    const handleMouseUp = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onLongPress, duration]);

  return { ref };
};

/**
 * Hook for double-tap gesture detection
 * @param {Object} options - Configuration options
 * @param {Function} options.onDoubleTap - Callback when double tap detected
 * @param {number} options.delay - Time between taps in ms (default: 300)
 * @returns {Object} - { ref }
 */
export const useDoubleTap = ({
  onDoubleTap,
  delay = 300,
} = {}) => {
  const ref = useRef(null);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTap = () => {
      tapCount.current += 1;

      if (tapCount.current === 1) {
        tapTimer.current = setTimeout(() => {
          tapCount.current = 0;
        }, delay);
      } else if (tapCount.current === 2) {
        clearTimeout(tapTimer.current);
        onDoubleTap?.();
        tapCount.current = 0;
      }
    };

    element.addEventListener('click', handleTap);

    return () => {
      element.removeEventListener('click', handleTap);
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    };
  }, [onDoubleTap, delay]);

  return { ref };
};
