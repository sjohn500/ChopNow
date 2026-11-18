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
          <ellipse cx="20" cy="25" rx="14" ry="7.5" fill="#E8D5B7" />
          <path
            d="M8 22c0 6.5 5.4 10 12 10s12-3.5 12-10H8z"
            fill="#D9232E"
          />
          <path
            d="M11 21c1.5-5 5-8 9-8s7.5 3 9 8H11z"
            fill="#C85A32"
          />
          <circle cx="16.5" cy="18" r="2" fill="#D99B26" />
          <circle cx="23.5" cy="17.5" r="1.8" fill="#4E7A3E" />
          <path
            d="M15 9c0 1.5 1 2 1 3.5M20 8c0 1.5 1 2 1 3.5M25 9c0 1.5 1 2 1 3.5"
            stroke="#D9232E"
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
            fill="#1E1916"
          />
          <ellipse cx="20" cy="21.5" rx="12" ry="4.5" fill="#C85A32" />
          <ellipse cx="20" cy="18.5" rx="6.5" ry="4" fill="#FAF6F1" />
          <circle cx="13" cy="21" r="1.6" fill="#4E7A3E" />
          <circle cx="27" cy="21" r="1.5" fill="#D99B26" />
        </svg>
      );
    case 'suya':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <path
            d="M9 31L30 10"
            stroke="#5C5049"
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
            fill="#9E141D"
          />
          <rect
            x="11"
            y="16"
            width="12"
            height="6.5"
            rx="3.2"
            transform="rotate(-45 17 19)"
            fill="#D9232E"
          />
          <circle cx="13" cy="27" r="3" fill="#4E7A3E" />
          <circle cx="27.5" cy="12.5" r="2.2" fill="#D99B26" />
        </svg>
      );
    case 'small_chops':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <circle cx="14.5" cy="24.5" r="5.5" fill="#D99B26" />
          <circle cx="25.5" cy="24.5" r="5.5" fill="#C85A32" />
          <circle cx="20" cy="16.5" r="5.5" fill="#E6A93B" />
          <path
            d="M15.5 14.5c2-1.8 7-1.8 9 0"
            stroke="#FAF6F1"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="20" cy="10" r="2" fill="#D9232E" />
        </svg>
      );
    case 'pepper_soup':
      return (
        <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
          <path
            d="M8 21c0 6.5 5.4 10 12 10s12-3.5 12-10H8z"
            fill="#C85A32"
          />
          <ellipse cx="20" cy="21" rx="12" ry="4" fill="#D9232E" />
          <ellipse cx="16" cy="20.5" rx="3" ry="1.8" fill="#9E141D" />
          <circle cx="24" cy="21" r="1.8" fill="#4E7A3E" />
          <path
            d="M15 9c0 1.5 1 2 1 3.5M20 8c0 1.5 1 2 1 3.5M25 9c0 1.5 1 2 1 3.5"
            stroke="#C85A32"
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
            stroke="#1E1916"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 13h16l-2 19a2 2 0 01-2 1.8h-8a2 2 0 01-2-1.8L12 13z"
            fill="#FAF6F1"
            stroke="#D9232E"
            strokeWidth="1.6"
          />
          <path d="M13.5 19h13l-1.4 13H14.9l-1.4-13z" fill="#D9232E" />
          <circle cx="27" cy="13" r="4" fill="#D99B26" />
        </svg>
      );
  }
}
