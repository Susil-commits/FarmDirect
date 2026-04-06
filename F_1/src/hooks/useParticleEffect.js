import { useRef, useCallback } from 'react';

/**
 * Hook for creating particle burst effects on elements
 * Creates animated particles that explode from a click/touch point
 * @param {Object} options - Configuration options
 * @param {number} options.particleCount - Number of particles (default: 12)
 * @param {string} options.particleColor - Color of particles (default: '#22c55e')
 * @param {number} options.particleSize - Size of each particle in px (default: 8)
 * @param {number} options.duration - Animation duration in ms (default: 600)
 * @returns {Object} - { ref, triggerBurst, clearParticles }
 */
export const useParticleEffect = ({
  particleCount = 12,
  particleColor = '#22c55e',
  particleSize = 8,
  duration = 600,
} = {}) => {
  const containerRef = useRef(null);
  const particlesRef = useRef([]);

  const clearParticles = useCallback(() => {
    particlesRef.current.forEach((particle) => {
      if (particle && particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    });
    particlesRef.current = [];
  }, []);

  const triggerBurst = useCallback(
    (x, y) => {
      if (!containerRef.current) return;

      clearParticles();

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = particleSize + 'px';
        particle.style.height = particleSize + 'px';
        particle.style.backgroundColor = particleColor;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';

        // Calculate random direction and distance
        const angle = (i / particleCount) * Math.PI * 2;
        const velocity = 4 + Math.random() * 4; // Random speed between 4-8
        const distance = 80 + Math.random() * 40; // Random distance 80-120px

        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.animationDuration = duration + 'ms';

        containerRef.current.appendChild(particle);
        particlesRef.current.push(particle);
      }

      // Cleanup after animation
      setTimeout(clearParticles, duration);
    },
    [particleCount, particleColor, particleSize, duration, clearParticles]
  );

  return { ref: containerRef, triggerBurst, clearParticles };
};

/**
 * Hook for creating ripple effects (water-like expansion)
 * @param {Object} options - Configuration options
 * @param {string} options.rippleColor - Color of ripple (default: 'rgba(255, 255, 255, 0.6)')
 * @param {number} options.duration - Animation duration in ms (default: 600)
 * @returns {Object} - { ref, triggerRipple }
 */
export const useRippleEffect = ({
  rippleColor = 'rgba(255, 255, 255, 0.6)',
  duration = 600,
} = {}) => {
  const containerRef = useRef(null);

  const triggerRipple = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.backgroundColor = rippleColor;
      ripple.style.animationDuration = duration + 'ms';

      container.appendChild(ripple);

      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, duration);
    },
    [rippleColor, duration]
  );

  return { ref: containerRef, triggerRipple };
};
