
export const createStaggerDelays = (itemCount, baseDelay = 100) => {
  return Array.from({ length: itemCount }, (_, i) => i * baseDelay);
};

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
    const totalDuration = (elementArray.length - 1) * baseDelay + 600; 
    setTimeout(callback, totalDuration);
  }
};

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

export const parallelizeAnimations = (animations) => {
  return Promise.all(animations.map((animation) => animation()));
};

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

export const debounceAnimation = (callback, delay = 100) => {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      requestAnimationFrame(() => callback(...args));
    }, delay);
  };
};

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

export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const applyResponsiveAnimation = (
  element,
  animationClass,
  forceAnimation = false
) => {
  return new Promise((resolve) => {
    if (prefersReducedMotion() && !forceAnimation) {
      
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

export const supportsAnimations = () => {
  const animation = document.createElement('div').style;
  return (
    animation.animation !== undefined ||
    animation.WebkitAnimation !== undefined
  );
};

export const getAnimationDuration = (className) => {
  
  const match = className.match(/animate-(\d+)/);
  return match ? parseInt(match[1]) : 600; 
};

export const cloneAnimationEffect = (sourceElement, targetElement) => {
  const computedStyle = window.getComputedStyle(sourceElement);
  const animation = computedStyle.animation;
  targetElement.style.animation = animation;
};
