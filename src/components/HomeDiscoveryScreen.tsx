import {
  ArrowRight,
  Bell,
  ChevronDown,
  Clock,
  Flame,
  Home,
  MapPin,
  Menu,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Star,
  User,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import {
  DELIVERY_LOCATIONS,
  findNearestDeliveryArea,
  formatNaira,
  getDistanceToRestaurant,
} from '../data/deliveryData';
import { AuthUser, FoodCategoryKey, Restaurant } from '../types/delivery';
import { CategoryIllustration } from './CategoryIcons';
import { NigeriaLocationPicker } from './NigeriaLocationPicker';
import { PlateImage } from './PlateImage';

interface HomeDiscoveryScreenProps {
  restaurants: Restaurant[];
  user: AuthUser;
  location: string;
  activeCategory: FoodCategoryKey;
  onChangeCategory: (category: FoodCategoryKey) => void;
  onChangeLocation: (loc: string) => void;
  selectedRestaurantId: string;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenOrders: () => void;
  onOpenAccountPortal: (tab: 'buyer' | 'seller') => void;
  onOpenSidebar: () => void;
  activeOrderCount: number;
  overlayInset?: boolean;
  layoutMode?: 'frame' | 'responsive';
}

const CATEGORIES: {
  key: Exclude<FoodCategoryKey, 'all'>;
  label: string;
}[] = [
  { key: 'jollof', label: 'Jollof & Rice' },
  { key: 'swallows', label: 'Swallows & Soup' },
  { key: 'suya', label: 'Suya & Grills' },
  { key: 'small_chops', label: 'Small Chops' },
  { key: 'pepper_soup', label: 'Pepper Soup' },
  { key: 'drinks', label: 'Palm Wine/Drinks' },
];

type FilterOption = 'all' | 'nearby' | 'free' | 'fast' | 'top';

export function HomeDiscoveryScreen({
  restaurants,
  user,
  location,
  activeCategory,
  onChangeCategory,
  onChangeLocation,
  selectedRestaurantId,
  onSelectRestaurant,
  onOpenOrders,
  onOpenAccountPortal,
  onOpenSidebar,
  activeOrderCount,
  overlayInset = false,
  layoutMode = 'frame',
}: HomeDiscoveryScreenProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadBell, setUnreadBell] = useState(true);
  const [activeNav, setActiveNav] = useState<'home' | 'search'>('home');

  const isResponsive = layoutMode === 'responsive';
  const promoRestaurant = restaurants[0];
  const firstName = user.name.split(' ')[0] || 'Tunde';

  const filteredRestaurants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return restaurants
      .map((r) => ({
        restaurant: r,
        distanceKm: getDistanceToRestaurant(location, r),
      }))
      .filter(({ restaurant: r, distanceKm }) => {
        const matchCat =
          activeCategory === 'all' ||
          r.categoryKey === activeCategory ||
          (activeCategory === 'swallows' &&
            r.menu.some((m) => m.category === 'Swallows')) ||
          (activeCategory === 'suya' &&
            r.menu.some((m) => m.name.toLowerCase().includes('suya'))) ||
          (activeCategory === 'small_chops' &&
            r.menu.some(
              (m) =>
                m.name.toLowerCase().includes('chops') ||
                m.name.toLowerCase().includes('puff')
            )) ||
          (activeCategory === 'pepper_soup' &&
            r.menu.some((m) => m.name.toLowerCase().includes('pepper soup'))) ||
          (activeCategory === 'drinks' &&
            r.menu.some(
              (m) =>
                m.name.toLowerCase().includes('zobo') ||
                m.name.toLowerCase().includes('palm')
            ));

        const matchQuery =
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.cuisineTags.some((tag) => tag.toLowerCase().includes(q)) ||
          r.menu.some((m) => m.name.toLowerCase().includes(q));

        const matchFilter =
          filterOption === 'all' ||
          (filterOption === 'nearby' && distanceKm <= 5) ||
          (filterOption === 'free' && r.deliveryFee === 0) ||
          (filterOption === 'fast' && r.deliveryMinutes.startsWith('1')) ||
          (filterOption === 'top' && r.rating >= 4.8);

        return matchCat && matchQuery && matchFilter;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [restaurants, location, activeCategory, searchQuery, filterOption]);

  const modalWrapperClass = isResponsive
    ? 'fixed inset-0 z-50 flex items-end justify-center bg-[#1E1916]/45 backdrop-blur-[1px] md:items-center md:p-4'
    : 'absolute inset-0 z-30 flex items-end bg-[#1E1916]/40 backdrop-blur-[1px]';

  const modalCardClass = isResponsive
    ? 'max-h-[85dvh] w-full overflow-y-auto rounded-t-[24px] bg-white p-5 pb-8 shadow-2xl md:max-w-lg md:rounded-[24px] md:pb-6'
    : 'max-h-[82%] w-full overflow-y-auto rounded-t-[24px] bg-white p-5 pb-8';

  return (
    <div className="relative flex h-full flex-col bg-[#FAF6F1]">
      <div
        className={`no-scrollbar flex-1 overflow-y-auto ${
          isResponsive
            ? 'px-4 pt-4 pb-24 md:px-6 md:pt-6 md:pb-10 lg:px-8'
            : `px-5 pb-24 ${overlayInset ? 'pt-12' : 'pt-2'}`
        }`}
      >
        <div className={isResponsive ? 'mx-auto max-w-6xl' : ''}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {!isResponsive && (
                <button
                  type="button"
                  aria-label="Open menu sidebar"
                  onClick={onOpenSidebar}
                  className="soft-card-shadow flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1E1916] transition-transform active:scale-95"
                >
                  <Menu className="h-[18px] w-[18px]" />
                </button>
              )}

              <div className="min-w-0">
                <p
                  className={`truncate font-medium text-[#5C5049] ${
                    isResponsive ? 'text-xs md:text-sm' : 'text-[11px]'
                  }`}
                >
                  How far, {firstName}? Ready to chop?
                </p>
                <button
                  type="button"
                  onClick={() => setIsLocationOpen((prev) => !prev)}
                  className={`mt-0.5 flex items-center gap-1.5 text-left font-bold text-[#1E1916] ${
                    isResponsive ? 'text-sm md:text-base' : 'text-xs'
                  }`}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-[#D9232E]" />
                  <span className="truncate">{location}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#D9232E]" />
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isResponsive && (
                <button
                  type="button"
                  onClick={() => onOpenAccountPortal(user.role)}
                  className="hidden min-h-[42px] items-center rounded-full bg-[#F4E8D6] px-4 text-xs font-bold text-[#1E1916] transition-colors hover:bg-[#E8D5B7] md:inline-flex"
                >
                  {user.role === 'seller'
                    ? 'Seller: Post Plate'
                    : 'Buyer / Seller Login'}
                </button>
              )}
              <button
                type="button"
                aria-label="Open notifications"
                onClick={() => {
                  setIsNotificationsOpen(true);
                  setUnreadBell(false);
                }}
                className="soft-card-shadow relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1E1916] transition-transform active:scale-95"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadBell && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#D9232E]" />
                )}
              </button>
            </div>
          </div>

          <div
            className={`mt-4 flex items-center gap-2.5 ${
              isResponsive ? 'md:mt-5' : ''
            }`}
          >
            <div className="soft-card-shadow relative flex flex-1 items-center rounded-2xl border border-[#E6DDD3] bg-white">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#5C5049]" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Jollof, Amala, Suya, State or LGA..."
                aria-label="Search Jollof, Amala, Suya, State or LGA"
                className="min-h-[46px] w-full rounded-2xl bg-transparent pr-3 pl-10 text-sm text-[#1E1916] placeholder:text-[#5C5049]/75 focus:outline-none"
              />
            </div>

            <button
              type="button"
              aria-label="Filter kitchens"
              onClick={() => setIsFilterOpen(true)}
              className={`soft-card-shadow flex h-[46px] shrink-0 items-center justify-center gap-2 rounded-2xl border px-3.5 transition-colors ${
                filterOption !== 'all'
                  ? 'border-[#D9232E] bg-[#D9232E] text-white'
                  : 'border-[#E6DDD3] bg-white text-[#1E1916]'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {isResponsive && (
                <span className="hidden text-xs font-semibold md:inline">
                  Filter
                </span>
              )}
            </button>
          </div>

          <div
            data-no-swipe="true"
            className={`no-scrollbar -mx-4 mt-5 flex gap-2.5 overflow-x-auto px-4 pb-1 ${
              isResponsive ? 'md:mx-0 md:gap-4 md:px-0' : ''
            }`}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() =>
                    onChangeCategory(activeCategory === cat.key ? 'all' : cat.key)
                  }
                  className={`flex shrink-0 flex-col items-center gap-1.5 ${
                    isResponsive
                      ? 'md:flex-row md:rounded-full md:px-4 md:py-2 md:transition-colors ' +
                        (isActive
                          ? 'md:bg-[#D9232E] md:text-white'
                          : 'md:bg-[#F4E8D6] md:hover:bg-[#E8D5B7]')
                      : ''
                  }`}
                >
                  <div
                    className={`flex h-15 w-15 items-center justify-center rounded-[18px] transition-all ${
                      isResponsive ? 'md:h-8 md:w-8 md:bg-transparent md:ring-0 ' : ''
                    }${
                      isActive
                        ? 'bg-[#E8D5B7] ring-2 ring-[#D9232E]'
                        : 'bg-[#F4E8D6] hover:bg-[#E8D5B7]/85'
                    }`}
                  >
                    <CategoryIllustration category={cat.key} />
                  </div>
                  <span
                    className={`text-[11px] font-semibold whitespace-nowrap ${
                      isResponsive ? 'md:text-xs ' : ''
                    }${
                      isActive
                        ? isResponsive
                          ? 'text-[#D9232E] md:text-white'
                          : 'text-[#D9232E]'
                        : 'text-[#1E1916]'
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {promoRestaurant && (
            <button
              type="button"
              onClick={() => onSelectRestaurant(promoRestaurant)}
              className={`soft-card-shadow relative mt-5 flex w-full items-center justify-between gap-4 overflow-hidden rounded-[20px] bg-[#D9232E] p-4 text-left text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D] ${
                isResponsive ? 'md:mt-6 md:p-6' : ''
              }`}
            >
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
              >
                <defs>
                  <pattern
                    id="aso-oke-weave"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M0 12L12 0L24 12L12 24Z"
                      fill="none"
                      stroke="#FAF6F1"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M6 12L12 6L18 12L12 18Z"
                      fill="none"
                      stroke="#FAF6F1"
                      strokeWidth="0.9"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#aso-oke-weave)" />
              </svg>

              <div className="relative z-10 min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-[#F4E8D6] md:text-xs">
                  Weekend Owambe Feast
                </p>
                <h2
                  className={`font-display mt-1 leading-snug font-extrabold text-[#FAF6F1] ${
                    isResponsive ? 'text-base md:text-2xl' : 'text-base'
                  }`}
                >
                  Weekend Owambe Feast • 20% Off Party Packs
                </h2>
                {isResponsive && (
                  <p className="mt-1 hidden text-sm text-[#F4E8D6] md:block">
                    Smoky firewood party Jollof, grilled chicken, and sweet dodo delivered hot across Nigeria.
                  </p>
                )}
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#FAF6F1] px-3.5 py-1.5 text-[11px] font-bold text-[#D9232E] md:mt-4 md:text-xs">
                  Chop Now
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <div
                className={`relative z-10 shrink-0 overflow-hidden rounded-2xl bg-[#FAF6F1]/15 p-1 ring-1 ring-[#FAF6F1]/30 ${
                  isResponsive ? 'h-22 w-22 md:h-32 md:w-44' : 'h-22 w-22'
                }`}
              >
                <PlateImage
                  src={promoRestaurant.heroImageUrl}
                  alt="Smoky Jollof rice and grilled chicken"
                  className="h-full w-full rounded-xl"
                />
              </div>
            </button>
          )}

          <div className="mt-6 flex items-center justify-between">
            <h2
              className={`font-display font-extrabold tracking-tight text-[#1E1916] ${
                isResponsive ? 'text-lg md:text-xl' : 'text-lg'
              }`}
            >
              Popular Bukas &amp; Kitchens
            </h2>
            {(activeCategory !== 'all' ||
              filterOption !== 'all' ||
              searchQuery.trim()) && (
              <button
                type="button"
                onClick={() => {
                  onChangeCategory('all');
                  setFilterOption('all');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-[#D9232E]"
              >
                Reset
              </button>
            )}
          </div>

          <div
            className={`mt-3.5 ${
              isResponsive
                ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3'
                : 'space-y-4'
            }`}
          >
            {filteredRestaurants.length === 0 ? (
              <div className="soft-card-shadow col-span-full rounded-[20px] bg-white p-6 text-center">
                <p className="font-display text-sm font-bold text-[#1E1916]">
                  No kitchens match those filters
                </p>
                <p className="mt-1 text-xs text-[#5C5049]">
                  Clear your search or category filter to view all kitchens.
                </p>
              </div>
            ) : (
              filteredRestaurants.map(({ restaurant, distanceKm }, index) => {
                const isSelected = restaurant.id === selectedRestaurantId;
                return (
                  <motion.button
                    key={restaurant.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: Math.min(index * 0.05, 0.25),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectRestaurant(restaurant)}
                    className={`soft-card-shadow group block w-full overflow-hidden rounded-[20px] bg-white text-left ${
                      isSelected ? 'ring-2 ring-[#D9232E]/40' : ''
                    }`}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F4E8D6]">
                      <PlateImage
                        src={restaurant.heroImageUrl}
                        alt={restaurant.name}
                        className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1E1916] backdrop-blur-xs">
                        <Clock className="h-3 w-3 text-[#D9232E]" />
                        <span className="tabular-nums-clean">
                          {restaurant.deliveryMinutes}
                        </span>
                      </div>

                      {restaurant.promoLabel && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[#C85A32] px-2.5 py-1 text-[11px] font-semibold text-[#FAF6F1]">
                          <Flame className="h-3 w-3 text-[#D99B26]" />
                          <span>{restaurant.promoLabel}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display truncate text-base font-bold text-[#1E1916]">
                          {restaurant.name}
                        </h3>
                        <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#1E1916]">
                          <Star className="h-3.5 w-3.5 fill-[#D99B26] text-[#D99B26]" />
                          <span className="tabular-nums-clean">
                            {restaurant.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[#5C5049]">
                        <span className="truncate">{restaurant.area}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums-clean shrink-0 font-medium text-[#1E1916]">
                          {distanceKm} km away
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-[#E6DDD3] pt-2.5 text-xs">
                        <p className="truncate text-[#5C5049]">
                          {restaurant.cuisineTags.slice(0, 2).join(' · ')}
                        </p>
                        <span
                          className={`tabular-nums-clean shrink-0 font-semibold ${
                            restaurant.deliveryFee === 0
                              ? 'text-[#C85A32]'
                              : 'text-[#1E1916]'
                          }`}
                        >
                          {restaurant.deliveryFee === 0
                            ? 'Free delivery'
                            : `${formatNaira(restaurant.deliveryFee)} delivery`}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <nav
        aria-label="Home bottom navigation"
        className={`floating-bar-shadow absolute right-4 bottom-5 left-4 z-20 grid h-14 grid-cols-4 items-center rounded-[20px] border border-[#E6DDD3] bg-white/95 px-2 backdrop-blur-md ${
          isResponsive ? 'md:hidden' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveNav('home')}
          className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            activeNav === 'home' ? 'text-[#D9232E]' : 'text-[#5C5049]'
          }`}
        >
          {activeNav === 'home' && (
            <span className="absolute top-0.5 h-0.5 w-5 rounded-full bg-[#D9232E]" />
          )}
          <Home className="h-[18px] w-[18px]" strokeWidth={2.2} />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNav('search');
            searchInputRef.current?.focus();
          }}
          className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
            activeNav === 'search' ? 'text-[#D9232E]' : 'text-[#5C5049]'
          }`}
        >
          {activeNav === 'search' && (
            <span className="absolute top-0.5 h-0.5 w-5 rounded-full bg-[#D9232E]" />
          )}
          <Search className="h-[18px] w-[18px]" strokeWidth={2} />
          <span className="text-[10px] font-medium">Search</span>
        </button>

        <button
          type="button"
          onClick={onOpenOrders}
          className="relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[#5C5049] transition-colors hover:text-[#1E1916]"
        >
          <div className="relative">
            <ReceiptText className="h-[18px] w-[18px]" strokeWidth={2} />
            {activeOrderCount > 0 && (
              <span className="tabular-nums-clean absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#D9232E] px-1 text-[9px] font-bold text-white">
                {activeOrderCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Orders</span>
        </button>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[#5C5049] transition-colors hover:text-[#1E1916]"
        >
          <User className="h-[18px] w-[18px]" strokeWidth={2} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>

      {isLocationOpen && (
        <div className={modalWrapperClass}>
          <div className={modalCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#1E1916]">
                  Select Location in Nigeria
                </h3>
                <p className="text-[11px] text-[#5C5049]">
                  All 36 States, FCT &amp; 774 Local Governments
                </p>
              </div>
              <button
                type="button"
                aria-label="Close location picker"
                onClick={() => setIsLocationOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF6F1] text-[#1E1916]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <NigeriaLocationPicker
              value={location}
              compact
              isLocating={isLocating}
              onUseGps={() => {
                if (!('geolocation' in navigator)) return;
                setIsLocating(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const nearest = findNearestDeliveryArea(
                      pos.coords.latitude,
                      pos.coords.longitude
                    );
                    onChangeLocation(nearest);
                    setIsLocating(false);
                    setIsLocationOpen(false);
                  },
                  () => setIsLocating(false),
                  { timeout: 6000 }
                );
              }}
              onChange={(nextLoc) => {
                onChangeLocation(nextLoc);
              }}
            />

            <div className="mt-4 border-t border-[#E6DDD3] pt-3">
              <p className="mb-2 text-[11px] font-semibold text-[#5C5049]">
                Quick Cities
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DELIVERY_LOCATIONS.slice(0, 6).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      onChangeLocation(loc);
                      setIsLocationOpen(false);
                    }}
                    className={`min-h-[34px] rounded-full px-3 text-[11px] font-semibold ${
                      loc === location
                        ? 'bg-[#D9232E] text-white'
                        : 'bg-[#F4E8D6] text-[#1E1916]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLocationOpen(false)}
              className="mt-4 min-h-[46px] w-full rounded-2xl bg-[#D9232E] text-sm font-bold text-[#FAF6F1] active:bg-[#9E141D]"
            >
              Show Kitchens Near {location}
            </button>
          </div>
        </div>
      )}

      {isFilterOpen && (
        <div className={modalWrapperClass}>
          <div className={modalCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#1E1916]">
                Filter Kitchens
              </h3>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF6F1] text-[#1E1916]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'all', label: 'All Kitchens' },
                  { id: 'nearby', label: 'Close to me (< 5 km)' },
                  { id: 'free', label: 'Free Delivery' },
                  { id: 'fast', label: 'Under 25 mins' },
                  { id: 'top', label: 'Top Rated (4.8+)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setFilterOption(opt.id);
                    setIsFilterOpen(false);
                  }}
                  className={`min-h-[42px] rounded-full px-4 text-xs font-semibold transition-colors ${
                    filterOption === opt.id
                      ? 'bg-[#D9232E] text-white'
                      : 'bg-[#F4E8D6] text-[#1E1916]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isNotificationsOpen && (
        <div className={modalWrapperClass}>
          <div className={modalCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#1E1916]">
                Updates
              </h3>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF6F1] text-[#1E1916]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationsOpen(false);
                  onOpenOrders();
                }}
                className="w-full rounded-2xl bg-[#FAF6F1] p-3.5 text-left"
              >
                <p className="text-xs font-bold text-[#D9232E]">
                  Rider Don Dey Come
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#1E1916]">
                  Emeka Nwosu is 12 mins away with your Jollof pack.
                </p>
              </button>
              <div className="rounded-2xl bg-[#F4E8D6]/70 p-3.5">
                <p className="text-xs font-bold text-[#C85A32]">
                  Weekend Owambe Feast
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#1E1916]">
                  Save 20% on party Jollof &amp; Suya combos all weekend.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isProfileOpen && (
        <div className={modalWrapperClass}>
          <div className={modalCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#1E1916]">
                  {user.name}
                </h3>
                <p className="text-xs text-[#5C5049]">
                  {user.phone} ·{' '}
                  {user.role === 'seller'
                    ? 'Seller Mode'
                    : `Drop-off: ${location}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF6F1] text-[#1E1916]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onOpenAccountPortal('buyer');
                }}
                className="min-h-[46px] w-full rounded-2xl bg-[#D9232E] text-sm font-semibold text-white transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
              >
                Buyer Sign In &amp; Location
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onOpenAccountPortal('seller');
                }}
                className="min-h-[46px] w-full rounded-2xl bg-[#1E1916] text-sm font-semibold text-white"
              >
                {user.role === 'seller'
                  ? 'Seller: Post New Food Photo'
                  : 'Seller Login · Post Food'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onOpenOrders();
                }}
                className="min-h-[46px] w-full rounded-2xl bg-[#F4E8D6] text-sm font-semibold text-[#1E1916]"
              >
                Track Active Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
