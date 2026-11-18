import {
  Camera,
  ClipboardList,
  Home,
  Search,
  User,
} from 'lucide-react';
import { ScreenId } from '../types/delivery';

export type BottomNavItem = 'home' | 'search' | 'post' | 'orders' | 'profile';

interface MobileBottomNavProps {
  activeNav: BottomNavItem;
  onSelect: (item: BottomNavItem) => void;
  orderCount?: number;
  className?: string;
}

const ITEMS: {
  id: BottomNavItem;
  label: string;
  icon: typeof Home;
}[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'post', label: 'Post Food', icon: Camera },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'profile', label: 'Profile', icon: User },
];

export function screenToBottomNav(screen: ScreenId, isSearchFocused: boolean): BottomNavItem {
  if (screen === 'post') return 'post';
  if (screen === 'orders') return 'orders';
  if (screen === 'profile') return 'profile';
  if (isSearchFocused && screen === 'home') return 'search';
  return 'home';
}

export function MobileBottomNav({
  activeNav,
  onSelect,
  orderCount = 0,
  className = '',
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className={`floating-bar-shadow z-30 border-t border-border-soft bg-surface/95 backdrop-blur-md ${className}`}
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`relative flex min-h-[48px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[12px] px-1 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-primary ${
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 h-1 w-5 rounded-full bg-primary" />
              )}
              <div className="relative">
                <Icon
                  className="h-5 w-5 transition-transform duration-200"
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
                {item.id === 'orders' && orderCount > 0 && (
                  <span className="tabular-nums-clean absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {orderCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] whitespace-nowrap ${
                  isActive ? 'font-semibold text-primary' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
