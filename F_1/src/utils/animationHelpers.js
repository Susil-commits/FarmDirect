/**
 * Animation Helpers - Utility functions for managing animations
 */

/**
 * Create staggered animation delays for multiple elements
 * @param {number} itemCount - Number of items to stagger
 * @param {number} baseDelay - Base delay in ms between items (default: 100)
 * @returns {Array} - Array of delay values
 */
export const createStaggerDelays = (itemCount, baseDelay = 100) => {
  return Array.from({ length: itemCount }, (_, i) => i * baseDelay);
};

/**
 * Apply staggered animation to elements
 * @param {HTMLElement|NodeList} elements - Element(s) to animate
 * @param {string} animationClass - CSS animation class to apply
 * @param {number} baseDelay - Base delay between items in ms
 * @param {Function} callback - Optional callback after all animations complete
 */
export const applyStaggerAnimation = (
  elements,
  animationClass,
  baseDelay = 100,
  callback
) => {
  const elementArray = elements instanceof NodeList ? Array.from(elements) : [elements];

  elementArray.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add(animationClass);
    }, index * baseDelay);
  });

  if (callback) {
    const totalDuration = (elementArray.length - 1) * baseDelay + 600; // 600ms is default animation duration
    setTimeout(callback, totalDuration);
  }
};

/**
 * Chain animations sequentially
 * @param {Array} animations - Array of animation functions to execute in sequence
 * @param {number} delayBetween - Delay between animations in ms (default: 0)
 * @returns {Promise} - Resolves when all animations complete
 */
export const chainAnimations = (animations, delayBetween = 0) => {
  return animations.reduce((promise, animation) => {
    return promise.then(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          animation().then(resolve);
        }, delayBetween);
      });
    });
  }, Promise.resolve());
};

/**
 * Parallelize animations (run multiple animations simultaneously)
 * @param {Array} animations - Array of animation functions to execute in parallel
 * @returns {Promise} - Resolves when all animations complete
 */
export const parallelizeAnimations = (animations) => {
  return Promise.all(animations.map((animation) => animation()));
};

/**
 * Create a fade-in animation loop for list items
 * @param {string} selector - CSS selector for elements to animate
 * @param {number} duration - Duration of each animation in ms
 * @param {number} staggerDelay - Delay between items in ms
 */
export const createFadeInLoop = (selector, duration = 600, staggerDelay = 100) => {
  const elements = document.querySelectorAll(selector);
  const style = document.createElement('style');

  let keyframes = `@keyframes fadeInStagger {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }`;

  elements.forEach((el, index) => {
    style.textContent +=
      `[data-index="${index}"] { animation: fadeInStagger ${duration}ms ease-out ${
        index * staggerDelay
      }ms forwards; }`;
  });

  style.textContent = keyframes + style.textContent;
  document.head.appendChild(style);

  elements.forEach((el, index) => {
    el.setAttribute('data-index', index);
  });

  return () => {
    document.head.removeChild(style);
  };
};

/**
 * Debounce animation triggers to prevent excessive reflows
 * @param {Function} callback - The animation callback
 * @param {number} delay - Debounce delay in ms (default: 100)
 * @returns {Function} - Debounced function
 */
export const debounceAnimation = (callback, delay = 100) => {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      requestAnimationFrame(() => callback(...args));
    }, delay);
  };
};

/**
 * Throttle animation triggers for performance
 * @param {Function} callback - The animation callback
 * @param {number} limit - Throttle limit in ms (default: 16, ~60fps)
 * @returns {Function} - Throttled function
 */
export const throttleAnimation = (callback, limit = 16) => {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      callback(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean} - True if prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Apply animation with respect to prefers-reduced-motion
 * @param {HTMLElement} element - Element to animate
 * @param {string} animationClass - CSS animation class
 * @param {boolean} forceAnimation - Force animation even if prefers reduced motion
 * @returns {Promise} - Resolves when animation completes
 */
export const applyResponsiveAnimation = (
  element,
  animationClass,
  forceAnimation = false
) => {
  return new Promise((resolve) => {
    if (prefersReducedMotion() && !forceAnimation) {
      // Skip animation but resolve immediately
      resolve();
      return;
    }

    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    };

    element.addEventListener('animationend', handleAnimationEnd);
    element.classList.add(animationClass);
  });
};

/**
 * Create a timed animation sequence
 * @param {Object} config - Configuration object
 * @param {Array} config.steps - Array of animation steps with timing
 * @param {Function} config.onComplete - Callback when sequence completes
 * @returns {Object} - { start, stop, pause, resume }
 */
export const createAnimationSequence = ({ steps = [], onComplete } = {}) => {
  let currentStep = 0;
  let isRunning = false;
  let isPaused = false;
  let timeoutIds = [];

  const start = () => {
    isRunning = true;
    executeSteps();
  };

  const stop = () => {
    isRunning = false;
    isPaused = false;
    timeoutIds.forEach((id) => clearTimeout(id));
    timeoutIds = [];
    currentStep = 0;
  };

  const pause = () => {
    isPaused = true;
  };

  const resume = () => {
    isPaused = false;
  };

  const executeSteps = () => {
    if (!isRunning || isPaused || currentStep >= steps.length) {
      if (currentStep >= steps.length) {
        isRunning = false;
        onComplete?.();
      }
      return;
    }

    const step = steps[currentStep];
    const timeoutId = setTimeout(() => {
      step.action();
      currentStep++;
      executeSteps();
    }, step.delay || 0);

    timeoutIds.push(timeoutId);
  };

  return { start, stop, pause, resume };
};

/**
 * Detect if animation is possible in current browser
 * @returns {boolean} - True if animations are supported
 */
export const supportsAnimations = () => {
  const animation = document.createElement('div').style;
  return (
    animation.animation !== undefined ||
    animation.WebkitAnimation !== undefined
  );
};

/**
 * Get animation duration from CSS class
 * @param {string} className - CSS animation class name
 * @returns {number} - Duration in milliseconds
 */
export const getAnimationDuration = (className) => {
  // Parse common durations from class names (e.g., 'animate-300' = 300ms)
  const match = className.match(/animate-(\d+)/);
  return match ? parseInt(match[1]) : 600; // Default to 600ms
};

/**
 * Clone animation effect from one element to another
 * @param {HTMLElement} sourceElement - Element to clone animation from
 * @param {HTMLElement} targetElement - Element to apply animation to
 */
export const cloneAnimationEffect = (sourceElement, targetElement) => {
  const computedStyle = window.getComputedStyle(sourceElement);
  const animation = computedStyle.animation;
  targetElement.style.animation = animation;
};
