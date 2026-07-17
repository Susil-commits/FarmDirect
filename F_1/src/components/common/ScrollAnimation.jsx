import { useEffect, useRef, useState } from 'react';

export default function ScrollAnimation({ children, className = '' }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      className={`${className} ${isVisible ? 'visible' : ''}`}
      style={{ pointerEvents: isVisible ? 'auto' : 'auto' }}
    >
      {children}
    </div>
  );
}
