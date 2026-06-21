import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function ImageWithFallback({ src, alt, className = '', fallbackIcon, fallbackText, ...props }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        {fallbackIcon || <ImageOff size={32} className="text-gray-400" />}
        {fallbackText && <span className="text-xs text-gray-400 mt-1">{fallbackText}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
      {...props}
    />
  );
}