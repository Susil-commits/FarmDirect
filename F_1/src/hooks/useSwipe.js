import { useRef, useEffect } from 'react';

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

      if (deltaTime > maxTime) return;

      const absoluteDeltaX = Math.abs(deltaX);
      const absoluteDeltaY = Math.abs(deltaY);

      if (absoluteDeltaX > absoluteDeltaY && absoluteDeltaX > minDistance) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

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
