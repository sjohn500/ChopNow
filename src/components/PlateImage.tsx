import { UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';

interface PlateImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function PlateImage({ src, alt, className = '' }: PlateImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-primary-soft px-4 text-center text-text-secondary ${className}`}
        role="img"
        aria-label={alt}
      >
        <UtensilsCrossed className="mb-2 h-7 w-7 text-primary" />
        <span className="line-clamp-2 text-xs font-medium text-text-primary">
          {alt}
        </span>
      </div>
    );
  }

  const smartPosition = src.includes('20419328') ? 'object-[50%_18%]' : '';

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover ${smartPosition} ${className}`}
    />
  );
}
