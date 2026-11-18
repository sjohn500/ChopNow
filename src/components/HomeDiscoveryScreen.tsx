import {
  ChevronDown,
  MapPin,
  RefreshCw,
  Search,
  Star,
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
import {
  AuthUser,
  FoodCategoryKey,
  MenuItem,
  Restaurant,
  ScreenId,
} from '../types/delivery';
import { BottomNavItem, MobileBottomNav } from './MobileBottomNav';
import { NigeriaLocationPicker } from './NigeriaLocationPicker';
import { PlateImage } from './PlateImage';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FoodCardSkeleton,
  Input,
} from './ui';

interface HomeDiscoveryScreenProps {
  restaurants: Restaurant[];
  user: AuthUser;
  location: string;
  activeCategory: FoodCategoryKey;
  onChangeCategory: (category: FoodCategoryKey) => void;
  onChangeLocation: (loc: string) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOrderPlate: (restaurant: Restaurant, item: MenuItem) => void;
  onNavigateScreen: (screen: ScreenId) => void;
  activeOrderCount: number;
  overlayInset?: boolean;
  layoutMode?: 'frame' | 'responsive';
}

const FEED_CHIPS: {
  key: FoodCategoryKey;
  label: string;
}[] = [
  { key: 'all', label: 'All Plates' },
  { key: 'jollof', label: 'Rice' },
  { key: 'swallows', label: 'Soups' },
  { key: 'suya', label: 'Grills' },
  { key: 'small_chops', label: 'Snacks' },
  { key: 'drinks', label: 'Drinks' },
];

function itemMatchesFeedCategory(
  item: MenuItem,
  restaurant: Restaurant,
  category: FoodCategoryKey
): boolean {
  if (category === 'all') return true;
  const lower = `${item.name} ${item.description}`.toLowerCase();
  switch (category) {
    case 'jollof':
      return (
        lower.includes('jollof') ||
        lower.includes('rice') ||
        lower.includes('ofada') ||
        restaurant.categoryKey === 'jollof'
      );
    case 'swallows':
      return (
        item.category === 'Swallows' ||
        lower.includes('soup') ||
        lower.includes('egusi') ||
        lower.includes('efo') ||
        lower.includes('amala') ||
        lower.includes('ponmo') ||
        lower.includes('pepper soup')
      );
    case 'suya':
      return (
        lower.includes('suya') ||
        lower.includes('grill') ||
        lower.includes('tilapia') ||
        lower.includes('chicken') ||
        restaurant.categoryKey === 'suya'
      );
    case 'small_chops':
      return (
        lower.includes('akara') ||
        lower.includes('chops') ||
        lower.includes('puff') ||
        lower.includes('breakfast') ||
        lower.includes('dodo') ||
        lower.includes('yam') ||
        lower.includes('tiger')
      );
    case 'drinks':
      return (
        lower.includes('zobo') ||
        lower.includes('pineapple') ||
        lower.includes('cooler') ||
        lower.includes('palm') ||
        lower.includes('drink')
      );
    case 'pepper_soup':
      return lower.includes('pepper soup') || restaurant.categoryKey === 'pepper_soup';
  }
}

export function HomeDiscoveryScreen({
  restaurants,
  user,
  location,
  activeCategory,
  onChangeCategory,
  onChangeLocation,
  onSelectRestaurant,
  onOrderPlate,
  onNavigateScreen,
  activeOrderCount,
  overlayInset = false,
  layoutMode = 'frame',
}: HomeDiscoveryScreenProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeBottomNav, setActiveBottomNav] = useState<BottomNavItem>('home');

  const isResponsive = layoutMode === 'responsive';
  const firstName = user.name.split(' ')[0] || 'Friend';

  const feedPlates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list: {
      item: MenuItem;
      restaurant: Restaurant;
      distanceKm: number;
    }[] = [];

    for (const restaurant of restaurants) {
      const distanceKm = getDistanceToRestaurant(location, restaurant);
      for (const item of restaurant.menu) {
        const matchCat = itemMatchesFeedCategory(
          item,
          restaurant,
          activeCategory
        );
        const matchQuery =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          restaurant.name.toLowerCase().includes(q) ||
          restaurant.area.toLowerCase().includes(q);
        if (matchCat && matchQuery) {
          list.push({ item, restaurant, distanceKm });
        }
      }
    }

    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [restaurants, location, activeCategory, searchQuery]);

  function handleRefreshFeed() {
    setIsRefreshing(true);
    window.setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  }

  function handleBottomNavSelect(nav: BottomNavItem) {
    setActiveBottomNav(nav);
    if (nav === 'home') {
      onNavigateScreen('home');
    } else if (nav === 'search') {
      searchInputRef.current?.focus();
    } else if (nav === 'post') {
      onNavigateScreen('post');
    } else if (nav === 'orders') {
      onNavigateScreen('orders');
    } else if (nav === 'profile') {
      onNavigateScreen('profile');
    }
  }

  const modalWrapperClass = isResponsive
    ? 'fixed inset-0 z-50 flex items-end justify-center bg-text-primary/45 backdrop-blur-[2px] md:items-center md:p-4'
    : 'absolute inset-0 z-40 flex items-end bg-text-primary/45 backdrop-blur-[2px]';

  const modalCardClass = isResponsive
    ? 'max-h-[85dvh] w-full overflow-y-auto rounded-t-[20px] bg-surface p-5 pb-8 shadow-2xl md:max-w-lg md:rounded-[16px] md:pb-6'
    : 'max-h-[82%] w-full overflow-y-auto rounded-t-[20px] bg-surface p-5 pb-8';

  return (
    <div className="relative flex h-full flex-col bg-bg">
      <div
        className={`no-scrollbar flex-1 overflow-y-auto ${
          isResponsive
            ? 'px-4 pt-4 pb-24 md:px-6 md:pt-6 md:pb-12 lg:px-8'
            : `px-4 pb-24 ${overlayInset ? 'pt-12' : 'pt-3'}`
        }`}
      >
        <div className={isResponsive ? 'mx-auto max-w-6xl' : ''}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-secondary">
                How far, {firstName}? Ready to eat?
              </p>
              <button
                type="button"
                onClick={() => setIsLocationOpen(true)}
                className="mt-0.5 flex cursor-pointer items-center gap-1.5 text-left text-sm font-bold text-text-primary transition-colors hover:text-primary md:text-base"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{location}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshFeed}
                aria-label="Refresh home food feed"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-text-primary shadow-soft transition-transform duration-150 hover:-translate-y-0.5 active:scale-95"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
                />
              </button>
              {isResponsive && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onNavigateScreen('post')}
                  className="hidden md:inline-flex"
                >
                  Post Food
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onFocus={() => setActiveBottomNav('search')}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Jollof, Egusi, Suya, Akara or kitchen..."
              aria-label="Search food plates or sellers"
              icon={<Search className="h-4 w-4 text-primary" />}
            />
          </div>

          <div
            data-no-swipe="true"
            role="tablist"
            aria-label="Food categories"
            className="no-scrollbar -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          >
            {FEED_CHIPS.map((chip) => {
              const isSelected = activeCategory === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onChangeCategory(chip.key)}
                  className={`min-h-[40px] shrink-0 cursor-pointer rounded-full px-4 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary-soft text-primary-dark ring-1 ring-primary'
                      : 'border border-border-soft bg-surface text-text-secondary hover:bg-primary-soft/50 hover:text-text-primary'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-end justify-between gap-3">
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-text-primary md:text-2xl">
                Fresh homemade plates near you
              </h1>
              <p className="mt-0.5 text-xs text-text-secondary md:text-sm">
                Tap any plate to inspect the kitchen menu or order directly.
              </p>
            </div>
            {(activeCategory !== 'all' || searchQuery.trim()) && (
              <button
                type="button"
                onClick={() => {
                  onChangeCategory('all');
                  setSearchQuery('');
                }}
                className="shrink-0 cursor-pointer text-xs font-semibold text-primary hover:text-primary-dark"
              >
                Clear filters
              </button>
            )}
          </div>

          {isRefreshing ? (
            <div
              className={`mt-4 grid gap-4 ${
                isResponsive
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <FoodCardSkeleton key={n} />
              ))}
            </div>
          ) : feedPlates.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                emoji="🍲"
                title={
                  searchQuery.trim() || activeCategory !== 'all'
                    ? 'No matching plates found'
                    : 'No food posted yet. Be the first! 🍲'
                }
                description={
                  searchQuery.trim() || activeCategory !== 'all'
                    ? 'Try clearing your search or choosing another category chip above.'
                    : 'Neighborhood sellers have not posted in this zone yet. Share a homemade pot!'
                }
                actionLabel={
                  searchQuery.trim() || activeCategory !== 'all'
                    ? 'Show All Plates'
                    : 'Post Food'
                }
                onAction={() => {
                  if (searchQuery.trim() || activeCategory !== 'all') {
                    onChangeCategory('all');
                    setSearchQuery('');
                  } else {
                    onNavigateScreen('post');
                  }
                }}
              />
            </div>
          ) : (
            <div
              className={`mt-4 grid gap-5 ${
                isResponsive
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {feedPlates.map(({ item, restaurant, distanceKm }, index) => {
                const isAvailable = item.isAvailable !== false;
                const ratingValue = item.rating ?? restaurant.rating;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      delay: Math.min(index * 0.03, 0.2),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Card
                      padding="none"
                      interactive
                      className="flex h-full flex-col overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectRestaurant(restaurant)}
                        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-primary-soft text-left"
                      >
                        <PlateImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full transition-transform duration-200 hover:scale-[1.03]"
                        />

                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <Badge variant={isAvailable ? 'mango' : 'error'}>
                            {isAvailable ? (
                              <>
                                <Star className="h-3 w-3 fill-text-primary" />
                                <span className="tabular-nums-clean">
                                  {ratingValue.toFixed(1)}
                                </span>
                                {item.isNew && <span>· New</span>}
                              </>
                            ) : (
                              'Out of stock'
                            )}
                          </Badge>
                        </div>

                        {isAvailable && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="peach">{distanceKm} km</Badge>
                          </div>
                        )}
                      </button>

                      <div className="flex flex-1 flex-col justify-between p-4">
                        <div>
                          <button
                            type="button"
                            onClick={() => onSelectRestaurant(restaurant)}
                            className="cursor-pointer text-left"
                          >
                            <h2 className="font-heading line-clamp-1 text-base font-bold text-text-primary transition-colors hover:text-primary">
                              {item.name}
                            </h2>
                          </button>

                          <p className="mt-0.5 truncate text-xs font-medium text-text-secondary">
                            {restaurant.name} · {restaurant.area}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-soft pt-3">
                          <div>
                            <p className="tabular-nums-clean font-heading text-lg font-bold text-primary">
                              {formatNaira(item.price)}
                            </p>
                            <p className="text-[11px] font-medium text-success">
                              {isAvailable ? 'Available now' : 'Restocking soon'}
                            </p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            disabled={!isAvailable}
                            onClick={() => onOrderPlate(restaurant, item)}
                          >
                            {isAvailable ? 'Order' : 'Sold Out'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav
        activeNav={activeBottomNav}
        onSelect={handleBottomNavSelect}
        orderCount={activeOrderCount}
        className={`absolute right-0 bottom-0 left-0 ${
          isResponsive ? 'md:hidden' : ''
        }`}
      />

      {isLocationOpen && (
        <div className={modalWrapperClass}>
          <div className={modalCardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-text-primary">
                  Select Location in Nigeria
                </h3>
                <p className="text-xs text-text-secondary">
                  All 36 States, FCT &amp; 774 Local Governments
                </p>
              </div>
              <button
                type="button"
                aria-label="Close location picker"
                onClick={() => setIsLocationOpen(false)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-bg text-text-primary"
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

            <div className="mt-4 border-t border-border-soft pt-3">
              <p className="mb-2 text-xs font-semibold text-text-secondary">
                Popular Cities
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
                    className={`min-h-[34px] cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors ${
                      loc === location
                        ? 'bg-primary text-white'
                        : 'bg-primary-soft text-text-primary hover:bg-primary-soft/80'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                fullWidth
                onClick={() => setIsLocationOpen(false)}
              >
                Show Plates Near {location}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
