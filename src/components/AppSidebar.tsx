import {
  Camera,
  ClipboardList,
  Columns3,
  Flame,
  Home,
  LayoutGrid,
  LogOut,
  MapPin,
  Pencil,
  RotateCcw,
  Smartphone,
  Store,
  User,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { AuthUser, ScreenId } from '../types/delivery';
import { PlateImage } from './PlateImage';
import { Badge } from './ui';

export type AppViewMode = 'responsive' | 'phone' | 'grid';

interface SidebarContentProps {
  user: AuthUser;
  location: string;
  activeScreen: ScreenId;
  viewMode: AppViewMode;
  activeOrderCount: number;
  onSelectScreen: (screen: ScreenId) => void;
  onChangeViewMode: (mode: AppViewMode) => void;
  onFilterLocalFood: () => void;
  onOpenLanding?: () => void;
  onLogout?: () => void;
  onResetDemo: () => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export function SidebarContent({
  user,
  location,
  activeScreen,
  viewMode,
  activeOrderCount,
  onSelectScreen,
  onChangeViewMode,
  onFilterLocalFood,
  onOpenLanding,
  onLogout,
  onResetDemo,
  onClose,
  isMobileDrawer = false,
}: SidebarContentProps) {
  const navItems: {
    id: ScreenId;
    label: string;
    hint: string;
    icon: typeof Home;
    badge?: number;
  }[] = [
    {
      id: 'home',
      label: 'Home Feed',
      hint: 'Search & local dishes',
      icon: Home,
    },
    {
      id: 'menu',
      label: 'Kitchen & Tray',
      hint: 'Browse dishes & order',
      icon: UtensilsCrossed,
    },
    {
      id: 'post',
      label: 'Post Food',
      hint: 'Share a plate for sale',
      icon: Camera,
    },
    {
      id: 'orders',
      label: 'Orders',
      hint: 'Status & live map',
      icon: ClipboardList,
      badge: activeOrderCount,
    },
    {
      id: 'profile',
      label: 'Profile',
      hint: 'My posts, orders & info',
      icon: User,
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between bg-bg p-5">
      <div className="space-y-5 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onOpenLanding?.();
              onClose?.();
            }}
            className="cursor-pointer text-left focus:outline-none"
          >
            <span className="font-heading text-xl font-bold tracking-tight text-text-primary">
              Chop<span className="text-primary">BellyFull</span>
            </span>
            <p className="text-xs font-medium text-text-secondary">
              Warm plates near you.
            </p>
          </button>
          {isMobileDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-bg text-text-primary transition-colors hover:bg-primary-soft"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="rounded-[16px] border border-border-soft bg-primary-soft p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-text-primary">
                {user.avatarUrl ? (
                  <PlateImage
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-full w-full"
                  />
                ) : user.role === 'seller' ? (
                  <Store className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary">
                  {user.name}
                </p>
                <p className="truncate text-xs font-semibold text-text-secondary">
                  {user.role === 'seller' ? 'Local Seller' : 'Buyer'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectScreen('profile');
                onClose?.();
              }}
              aria-label="Edit profile"
              className="inline-flex min-h-[34px] shrink-0 cursor-pointer items-center gap-1 rounded-full bg-primary px-2.5 text-xs font-semibold text-text-primary shadow-xs transition-colors hover:bg-primary-dark"
            >
              <Pencil className="h-3 w-3 text-text-primary" />
              Edit
            </button>
          </div>
          <p className="mt-2 flex items-center gap-1 truncate text-xs text-text-secondary">
            <MapPin className="h-3 w-3 shrink-0 text-primary" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        <nav aria-label="Sidebar navigation" className="space-y-1">
          <p className="px-2 pb-1 text-xs font-semibold text-text-secondary">
            Explore
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectScreen(item.id);
                  onClose?.();
                }}
                className={`flex min-h-[46px] w-full cursor-pointer items-center justify-between gap-2 rounded-[14px] px-3 py-2 text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-text-primary shadow-soft'
                    : 'text-text-primary hover:bg-primary-soft/75'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {item.label}
                    </p>
                    <p
                      className={`truncate text-xs ${
                        isActive ? 'text-text-primary/80' : 'text-text-secondary'
                      }`}
                    >
                      {item.hint}
                    </p>
                  </div>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant={isActive ? 'peach' : 'coral'}>
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <div className="space-y-1">
          <p className="px-2 pb-1 text-xs font-semibold text-text-secondary">
            Quick Cravings
          </p>
          <button
            type="button"
            onClick={() => {
              onFilterLocalFood();
              onClose?.();
            }}
            className="flex min-h-[42px] w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-primary-soft/75"
          >
            <Flame className="h-4 w-4 text-primary" />
            <span>Rice &amp; Jollof Plates</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectScreen('post');
              onClose?.();
            }}
            className="flex min-h-[42px] w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-primary-soft/75"
          >
            <Store className="h-4 w-4 text-primary" />
            <span>Post Fresh Food</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t border-border-soft pt-4">
        {!isMobileDrawer && (
          <div>
            <p className="mb-1.5 px-1 text-xs font-semibold text-text-secondary">
              View Mode
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-[12px] bg-primary-soft p-1">
              <button
                type="button"
                onClick={() => onChangeViewMode('responsive')}
                className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1 rounded-[10px] text-xs font-semibold transition-colors ${
                  viewMode === 'responsive'
                    ? 'bg-primary text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Full
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('phone')}
                className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1 rounded-[10px] text-xs font-semibold transition-colors ${
                  viewMode === 'phone'
                    ? 'bg-primary text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Smartphone className="h-3 w-3" />
                Phone
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('grid')}
                className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1 rounded-[10px] text-xs font-semibold transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-text-primary shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Columns3 className="h-3 w-3" />
                3-Up
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {onOpenLanding && (
            <button
              type="button"
              onClick={() => {
                onOpenLanding();
                onClose?.();
              }}
              className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center rounded-full border border-border-soft bg-primary-soft text-xs font-semibold text-text-primary transition-colors hover:bg-primary"
            >
              Landing
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onResetDemo();
              onClose?.();
            }}
            className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-primary-soft text-xs font-semibold text-text-primary transition-colors hover:bg-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose?.();
            }}
            className="flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-primary-soft/65 text-xs font-bold text-error transition-colors hover:bg-primary-soft"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
