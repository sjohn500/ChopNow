import {
  Bike,
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
import { AccountPortalTab } from './AccountPortalModal';
import { PlateImage } from './PlateImage';

export type AppViewMode = 'responsive' | 'phone' | 'grid';

interface SidebarContentProps {
  user: AuthUser;
  location: string;
  activeScreen: ScreenId;
  viewMode: AppViewMode;
  onSelectScreen: (screen: ScreenId) => void;
  onChangeViewMode: (mode: AppViewMode) => void;
  onFilterLocalFood: () => void;
  onOpenPortal: (tab: AccountPortalTab) => void;
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
  onSelectScreen,
  onChangeViewMode,
  onFilterLocalFood,
  onOpenPortal,
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
  }[] = [
    {
      id: 'home',
      label: 'Home Discovery',
      hint: 'Browse local kitchens',
      icon: Home,
    },
    {
      id: 'menu',
      label: 'Restaurant & Menu',
      hint: 'Dishes, local pots & tray',
      icon: UtensilsCrossed,
    },
    {
      id: 'tracking',
      label: 'Live Order Tracking',
      hint: 'Map, ETA & rider chat',
      icon: Bike,
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between bg-white p-5">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onOpenLanding?.();
              onClose?.();
            }}
            className="text-left focus:outline-none"
          >
            <span className="font-display text-xl font-extrabold tracking-tight text-[#1E1916]">
              ChopBellyFull
            </span>
            <p className="text-[11px] font-medium text-[#5C5049]">
              You get what you order.
            </p>
          </button>
          {isMobileDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF6F1] text-[#1E1916]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="rounded-2xl bg-[#F4E8D6]/80 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[#D9232E]">
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
                <p className="truncate text-sm font-bold text-[#1E1916]">
                  {user.name}
                </p>
                <p className="truncate text-[11px] font-semibold text-[#D9232E]">
                  {user.role === 'seller' ? 'Seller Account' : 'Buyer Account'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenPortal('profile');
              }}
              aria-label="Edit profile"
              className="inline-flex min-h-[34px] shrink-0 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] font-bold text-[#1E1916] shadow-xs transition-colors hover:bg-[#FAF6F1]"
            >
              <Pencil className="h-3 w-3 text-[#D9232E]" />
              Edit
            </button>
          </div>
          <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-[#5C5049]">
            <MapPin className="h-3 w-3 shrink-0 text-[#D9232E]" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        <nav aria-label="Sidebar navigation" className="space-y-1.5">
          <p className="px-2 text-[11px] font-semibold text-[#5C5049]">
            Screens
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
                className={`flex min-h-[46px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors ${
                  isActive
                    ? 'bg-[#F4E8D6] text-[#D9232E]'
                    : 'text-[#1E1916] hover:bg-[#FAF6F1]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.label}</p>
                  <p className="truncate text-[11px] text-[#5C5049]">
                    {item.hint}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="space-y-1.5">
          <p className="px-2 text-[11px] font-semibold text-[#5C5049]">
            Quick Actions
          </p>
          <button
            type="button"
            onClick={() => {
              onFilterLocalFood();
              onClose?.();
            }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-[#1E1916] hover:bg-[#FAF6F1]"
          >
            <Flame className="h-4 w-4 text-[#D9232E]" />
            <span>Jollof &amp; Swallows</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onOpenPortal('buyer');
            }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-[#1E1916] hover:bg-[#FAF6F1]"
          >
            <User className="h-4 w-4 text-[#5C5049]" />
            <span>Buyer Sign In &amp; GPS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose?.();
              onOpenPortal('seller');
            }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-[#1E1916] hover:bg-[#FAF6F1]"
          >
            <Store className="h-4 w-4 text-[#D9232E]" />
            <span>Seller Login &amp; Post</span>
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t border-[#E6DDD3] pt-4">
        {!isMobileDrawer && (
          <div>
            <p className="mb-1.5 px-1 text-[10px] font-semibold text-[#5C5049]">
              Display Layout
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#FAF6F1] p-1">
              <button
                type="button"
                onClick={() => onChangeViewMode('responsive')}
                className={`flex min-h-[34px] items-center justify-center gap-1 rounded-lg text-[11px] font-semibold ${
                  viewMode === 'responsive'
                    ? 'bg-white text-[#D9232E] shadow-xs'
                    : 'text-[#5C5049]'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Full
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('phone')}
                className={`flex min-h-[34px] items-center justify-center gap-1 rounded-lg text-[11px] font-semibold ${
                  viewMode === 'phone'
                    ? 'bg-white text-[#D9232E] shadow-xs'
                    : 'text-[#5C5049]'
                }`}
              >
                <Smartphone className="h-3 w-3" />
                Phone
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('grid')}
                className={`flex min-h-[34px] items-center justify-center gap-1 rounded-lg text-[11px] font-semibold ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#D9232E] shadow-xs'
                    : 'text-[#5C5049]'
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
              className="flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-[#E6DDD3] bg-white text-xs font-semibold text-[#1E1916] hover:bg-[#FAF6F1]"
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
            className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FAF6F1] text-xs font-semibold text-[#5C5049] hover:text-[#1E1916]"
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
            className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#F4E8D6]/70 text-xs font-bold text-[#9E141D] hover:bg-[#F4E8D6]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
