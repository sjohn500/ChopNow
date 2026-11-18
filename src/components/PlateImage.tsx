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
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3E7D3] to-[#E8D5B7] px-4 text-center text-[#635850] ${className}`}
        role="img"
        aria-label={alt}
      >
        <UtensilsCrossed className="mb-2 h-7 w-7 text-[#9E141D]" />
        <span className="line-clamp-2 text-xs font-medium text-[#1E1916]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}
