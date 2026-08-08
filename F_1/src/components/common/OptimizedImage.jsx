import React, { useState } from 'react';

/**
 * OptimizedImage Component
 * Designed to improve Lighthouse scores (LCP and CLS).
 * 
 * Features:
 * - Prevents CLS by reserving space using aspect-ratio or explicit width/height
 * - Prioritizes LCP images with fetchpriority="high" and eager loading
 * - Native lazy loading for below-the-fold images
 * - Smooth fade-in animation once the image loads
 * - Fallback background color while loading
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  objectFit = 'cover',
  onLoad,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  return (
    <div 
      className={`relative overflow-hidden bg-gray-200 ${className}`}
      style={{ width, height }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        className={`w-full h-full transition-opacity duration-500 ease-in-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ objectFit }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
