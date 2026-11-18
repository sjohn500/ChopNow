import { FoodCategoryKey } from '../types/delivery';

export function CategoryIllustration({
  category,
}: {
  category: Exclude<FoodCategoryKey, 'all'>;
}) {
  switch (category) {
    case 'jollof':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <ellipse cx="20" cy="25" rx="14" ry="7.5" fill="#FFE3DA" />
          <path
            d="M8 22c0 6.5 5.4 10 12 10s12-3.5 12-10H8z"
            fill="#FF6F61"
          />
          <path
            d="M11 21c1.5-5 5-8 9-8s7.5 3 9 8H11z"
            fill="#E8504A"
          />
          <circle cx="16.5" cy="18" r="2" fill="#FFB703" />
          <circle cx="23.5" cy="17.5" r="1.8" fill="#2E9E6B" />
          <path
            d="M15 9c0 1.5 1 2 1 3.5M20 8c0 1.5 1 2 1 3.5M25 9c0 1.5 1 2 1 3.5"
            stroke="#FF6F61"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case 'swallows':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <path
            d="M8 22c0 6.5 5.4 10 12 10s12-3.5 12-10H8z"
            fill="#2B2B2B"
          />
          <ellipse cx="20" cy="21.5" rx="12" ry="4.5" fill="#FF6F61" />
          <ellipse cx="20" cy="18.5" rx="6.5" ry="4" fill="#FFF8F3" />
          <circle cx="13" cy="21" r="1.6" fill="#2E9E6B" />
          <circle cx="27" cy="21" r="1.5" fill="#FFB703" />
        </svg>
      );
    case 'suya':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <path
            d="M9 31L30 10"
            stroke="#6B6B6B"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <rect
            x="17"
            y="10"
            width="12"
            height="6.5"
            rx="3.2"
            transform="rotate(-45 23 13)"
            fill="#E8504A"
          />
          <rect
            x="11"
            y="16"
            width="12"
            height="6.5"
            rx="3.2"
            transform="rotate(-45 17 19)"
            fill="#FF6F61"
          />
          <circle cx="13" cy="27" r="3" fill="#2E9E6B" />
          <circle cx="27.5" cy="12.5" r="2.2" fill="#FFB703" />
        </svg>
      );
    case 'small_chops':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <circle cx="14.5" cy="24.5" r="5.5" fill="#FFB703" />
          <circle cx="25.5" cy="24.5" r="5.5" fill="#FF6F61" />
          <circle cx="20" cy="16.5" r="5.5" fill="#FFB703" />
          <path
            d="M15.5 14.5c2-1.8 7-1.8 9 0"
            stroke="#FFF8F3"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="20" cy="10" r="2" fill="#E8504A" />
        </svg>
      );
    case 'pepper_soup':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <path
            d="M8 21c0 6.5 5.4 10 12 10s12-3.5 12-10H8z"
            fill="#E8504A"
          />
          <ellipse cx="20" cy="21" rx="12" ry="4" fill="#FF6F61" />
          <ellipse cx="16" cy="20.5" rx="3" ry="1.8" fill="#D62839" />
          <circle cx="24" cy="21" r="1.8" fill="#2E9E6B" />
          <path
            d="M15 9c0 1.5 1 2 1 3.5M20 8c0 1.5 1 2 1 3.5M25 9c0 1.5 1 2 1 3.5"
            stroke="#FF6F61"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case 'drinks':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <path
            d="M23 7l-2 9"
            stroke="#2B2B2B"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 13h16l-2 19a2 2 0 01-2 1.8h-8a2 2 0 01-2-1.8L12 13z"
            fill="#FFF8F3"
            stroke="#FF6F61"
            strokeWidth="1.6"
          />
          <path d="M13.5 19h13l-1.4 13H14.9l-1.4-13z" fill="#FF6F61" />
          <circle cx="27" cy="13" r="4" fill="#FFB703" />
        </svg>
      );
  }
}
