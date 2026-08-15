import { useRef, useCallback } from 'react';

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

        const angle = (i / particleCount) * Math.PI * 2;
        const _velocity = 4 + Math.random() * 4; 
        const distance = 80 + Math.random() * 40; 

        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.animationDuration = duration + 'ms';

        containerRef.current.appendChild(particle);
        particlesRef.current.push(particle);
      }

      setTimeout(clearParticles, duration);
    },
    [particleCount, particleColor, particleSize, duration, clearParticles]
  );

  return { ref: containerRef, triggerBurst, clearParticles };
};

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

      setTimeout(() => {
        ripple.remove();
      }, duration);
    },
    [rippleColor, duration]
  );

  return { ref: containerRef, triggerRipple };
};
