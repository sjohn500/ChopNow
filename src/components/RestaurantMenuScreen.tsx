import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  Minus,
  Navigation,
  Plus,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatNaira, getDistanceToRestaurant } from '../data/deliveryData';
import { AuthUser, CartEntry, MenuItem, Restaurant } from '../types/delivery';
import { PlateImage } from './PlateImage';

interface RestaurantMenuScreenProps {
  restaurant: Restaurant;
  buyerLocation: string;
  user: AuthUser;
  cart: CartEntry[];
  onBack: () => void;
  onAddItem: (item: MenuItem) => void;
  onDecrementItem: (itemId: string) => void;
  onTrackKitchenLocation: (restaurant: Restaurant) => void;
  onEditBuyerAccount: () => void;
  onCheckoutConfirm: (paymentMethod: string) => void;
  layoutMode?: 'frame' | 'responsive';
}

const MENU_TABS: MenuItem['category'][] = [
  'Combos',
  'Swallows',
  'Proteins',
  'Sides',
];

export function RestaurantMenuScreen({
  restaurant,
  buyerLocation,
  user,
  cart,
  onBack,
  onAddItem,
  onDecrementItem,
  onTrackKitchenLocation,
  onEditBuyerAccount,
  onCheckoutConfirm,
  layoutMode = 'frame',
}: RestaurantMenuScreenProps) {
  const [isFavorite, setIsFavorite] = useState(true);
  const [activeTab, setActiveTab] = useState<MenuItem['category']>('Combos');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(
    'Paystack Card •••• 4242'
  );
  const isResponsive = layoutMode === 'responsive';
  const distanceKm = getDistanceToRestaurant(buyerLocation, restaurant);

  const visibleItems = useMemo(() => {
    return restaurant.menu.filter((item) => item.category === activeTab);
  }, [restaurant.menu, activeTab]);

  const totalItems = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const subtotal = cart.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );
  const finalTotal = subtotal + restaurant.deliveryFee;

  function getQuantity(itemId: string): number {
    return cart.find((c) => c.item.id === itemId)?.quantity ?? 0;
  }

  const trayBreakdownContent = (closeOnChange?: () => void) => (
    <>
      {cart.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E6DDD3] bg-[#FAF6F1] p-5 text-center">
          <ShoppingBag className="mx-auto h-6 w-6 text-[#D9232E]" />
          <p className="mt-2 font-display text-sm font-bold text-[#1E1916]">
            Your tray is empty
          </p>
          <p className="mt-1 text-xs text-[#5C5049]">
            Tap + on any dish to build your plate from {restaurant.name}.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {cart.map(({ item, quantity }) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-2xl bg-[#FAF6F1] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1E1916]">
                    {quantity}x {item.name}
                  </p>
                  <p className="tabular-nums-clean text-xs text-[#5C5049]">
                    {formatNaira(item.price * quantity)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Remove one ${item.name}`}
                    onClick={() => onDecrementItem(item.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#1E1916]"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    aria-label={`Add one more ${item.name}`}
                    onClick={() => onAddItem(item)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D9232E] text-xs font-bold text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#5C5049]">
                Delivering to ({user.name})
              </span>
              <button
                type="button"
                onClick={() => {
                  closeOnChange?.();
                  onEditBuyerAccount();
                }}
                className="text-xs font-bold text-[#D9232E]"
              >
                Change
              </button>
            </div>
            <p className="mt-1 text-xs font-bold text-[#1E1916]">
              {user.buyerLandmark} · {buyerLocation}
            </p>
            <p className="tabular-nums-clean mt-0.5 text-[11px] text-[#5C5049]">
              {user.phone} · {distanceKm} km from {restaurant.name}
            </p>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold text-[#5C5049]">
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Paystack Card •••• 4242', 'Cash on Delivery'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`min-h-[42px] rounded-xl px-2.5 text-xs font-semibold ${
                    paymentMethod === m
                      ? 'bg-[#F4E8D6] text-[#D9232E] ring-1 ring-[#D9232E]'
                      : 'bg-[#FAF6F1] text-[#1E1916]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-[#E6DDD3] pt-3 text-xs">
            <div className="flex justify-between text-[#5C5049]">
              <span>Subtotal</span>
              <span className="tabular-nums-clean">
                {formatNaira(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#5C5049]">
              <span>Delivery fee</span>
              <span
                className={`tabular-nums-clean font-semibold ${
                  restaurant.deliveryFee === 0 ? 'text-[#C85A32]' : ''
                }`}
              >
                {restaurant.deliveryFee === 0
                  ? 'Free'
                  : formatNaira(restaurant.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-bold text-[#1E1916]">
              <span>Total</span>
              <span className="tabular-nums-clean">
                {formatNaira(finalTotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              closeOnChange?.();
              onCheckoutConfirm(paymentMethod);
            }}
            className="mt-4 min-h-[48px] w-full rounded-2xl bg-[#D9232E] text-sm font-bold text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
          >
            Chop Now · {formatNaira(finalTotal)}
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="relative flex h-full flex-col bg-[#FAF6F1]">
      <div
        className={`no-scrollbar flex-1 overflow-y-auto ${
          isResponsive ? 'pb-28 lg:pb-12' : 'pb-28'
        }`}
      >
        <div
          className={
            isResponsive
              ? 'mx-auto max-w-6xl md:px-6 md:py-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6 lg:px-8'
              : ''
          }
        >
          <div className={isResponsive ? 'lg:col-span-8' : ''}>
            <div
              className={`relative w-full overflow-hidden bg-[#E8D5B7] ${
                isResponsive ? 'h-56 md:h-64 md:rounded-t-[24px]' : 'h-56'
              }`}
            >
              <PlateImage
                src={restaurant.heroImageUrl}
                alt={restaurant.name}
                className="h-full w-full"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1916]/60 via-[#1E1916]/20 to-[#1E1916]/45" />

              <div
                className={`absolute right-4 left-4 flex items-center justify-between ${
                  isResponsive ? 'top-4' : 'top-12'
                }`}
              >
                <button
                  type="button"
                  aria-label="Back to discovery"
                  onClick={onBack}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#1E1916] shadow-md backdrop-blur-md transition-transform active:scale-95"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  aria-label={
                    isFavorite ? 'Remove favorite' : 'Favorite restaurant'
                  }
                  onClick={() => setIsFavorite((f) => !f)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#1E1916] shadow-md backdrop-blur-md transition-transform active:scale-95"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      isFavorite
                        ? 'fill-[#D9232E] text-[#D9232E]'
                        : 'text-[#1E1916]'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="relative z-10 -mt-6 rounded-t-[24px] bg-white px-5 pt-5 pb-4 shadow-[0_-8px_24px_rgba(30,25,22,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <h1
                  className={`font-display font-extrabold tracking-tight text-[#1E1916] ${
                    isResponsive ? 'text-xl md:text-2xl' : 'text-xl'
                  }`}
                >
                  {restaurant.name}
                </h1>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#F4E8D6] px-2.5 py-1 text-xs font-bold text-[#1E1916]">
                  <Star className="h-3.5 w-3.5 fill-[#D99B26] text-[#D99B26]" />
                  <span className="tabular-nums-clean">
                    {restaurant.rating.toFixed(1)}
                  </span>
                  <span className="font-normal text-[#5C5049]">
                    ({restaurant.reviewCount}+)
                  </span>
                </div>
              </div>

              <p className="mt-1.5 text-xs font-medium text-[#5C5049] md:text-sm">
                {restaurant.cuisineTags.join(' • ')}
              </p>

              <div className="mt-2.5 flex items-center gap-2.5 text-xs font-semibold">
                <span className="tabular-nums-clean inline-flex items-center gap-1 text-[#1E1916]">
                  <Clock className="h-3.5 w-3.5 text-[#D9232E]" />
                  {restaurant.deliveryMinutes}
                </span>
                <span className="text-[#5C5049]">·</span>
                <span
                  className={`tabular-nums-clean ${
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

              <div className="mt-3.5 flex items-center justify-between gap-2 rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#1E1916]">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D9232E]" />
                    <span className="truncate">{restaurant.address}</span>
                  </p>
                  <p className="tabular-nums-clean mt-0.5 text-[11px] font-medium text-[#5C5049]">
                    {distanceKm} km from {buyerLocation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onTrackKitchenLocation(restaurant)}
                  className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-full bg-[#F4E8D6] px-3 text-[11px] font-bold text-[#1E1916] transition-colors hover:bg-[#E8D5B7]"
                >
                  <Navigation className="h-3 w-3 text-[#D9232E]" />
                  Map
                </button>
              </div>
            </div>

            <div className="sticky top-0 z-20 border-b border-[#E6DDD3] bg-white/95 px-5 backdrop-blur-md md:rounded-b-[20px]">
              <div className="no-scrollbar flex justify-between gap-4 overflow-x-auto md:justify-start md:gap-8">
                {MENU_TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`relative min-h-[44px] shrink-0 text-xs whitespace-nowrap transition-colors md:text-sm ${
                        isActive
                          ? 'font-bold text-[#D9232E]'
                          : 'font-medium text-[#5C5049] hover:text-[#1E1916]'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <span className="absolute right-0 bottom-0 left-0 h-[2.5px] rounded-full bg-[#D9232E]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={isResponsive ? 'px-5 pt-4 md:px-0' : 'px-5 pt-4'}>
              {visibleItems.length === 0 ? (
                <div className="soft-card-shadow rounded-[20px] bg-white p-6 text-center">
                  <p className="font-display text-sm font-bold text-[#1E1916]">
                    No dishes in {activeTab} yet
                  </p>
                  <p className="mt-1 text-xs text-[#5C5049]">
                    Check another category tab or post a plate from Seller
                    Login.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    isResponsive
                      ? 'soft-card-shadow divide-y divide-[#E6DDD3] overflow-hidden rounded-[20px] bg-white md:grid md:grid-cols-2 md:gap-4 md:divide-y-0 md:overflow-visible md:bg-transparent md:shadow-none'
                      : 'soft-card-shadow divide-y divide-[#E6DDD3] overflow-hidden rounded-[20px] bg-white'
                  }
                >
                  {visibleItems.map((item) => {
                    const qty = getQuantity(item.id);
                    return (
                      <article
                        key={item.id}
                        className={`flex items-center gap-3.5 p-4 ${
                          isResponsive
                            ? 'md:soft-card-shadow md:rounded-[20px] md:bg-white'
                            : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h2 className="font-display text-sm font-bold text-[#1E1916]">
                            {item.name}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5C5049]">
                            {item.description}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="tabular-nums-clean text-sm font-extrabold text-[#1E1916]">
                              {formatNaira(item.price)}
                            </span>

                            {qty === 0 ? (
                              <button
                                type="button"
                                aria-label={`Add ${item.name} to plate`}
                                onClick={() => onAddItem(item)}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D9232E] text-white shadow-xs transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
                              >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 rounded-full bg-[#F4E8D6] px-1.5 py-1">
                                <button
                                  type="button"
                                  aria-label={`Remove one ${item.name}`}
                                  onClick={() => onDecrementItem(item.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#1E1916]"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="tabular-nums-clean min-w-[16px] text-center text-xs font-bold text-[#D9232E]">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Add one more ${item.name}`}
                                  onClick={() => onAddItem(item)}
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D9232E] text-white active:bg-[#9E141D]"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="h-22 w-22 shrink-0 overflow-hidden rounded-2xl bg-[#F4E8D6]">
                          <PlateImage
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full"
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {isResponsive && (
            <aside className="hidden lg:col-span-4 lg:sticky lg:top-6 lg:block">
              <div className="soft-card-shadow rounded-[24px] bg-white p-5">
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#E6DDD3] pb-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#1E1916]">
                      Your Tray ({totalItems})
                    </h3>
                    <p className="text-xs text-[#5C5049]">{restaurant.name}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4E8D6] text-[#D9232E]">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                </div>

                {trayBreakdownContent()}
              </div>
            </aside>
          )}
        </div>
      </div>

      {totalItems > 0 && (
        <div
          className={`absolute right-4 bottom-5 left-4 z-20 ${
            isResponsive ? 'lg:hidden' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="floating-bar-shadow tabular-nums-clean mx-auto flex min-h-[52px] w-full max-w-md items-center justify-between rounded-[18px] bg-[#D9232E] px-4 text-sm font-bold text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              View Your Tray ({totalItems}{' '}
              {totalItems === 1 ? 'item' : 'items'})
            </span>
            <span>• {formatNaira(subtotal)}</span>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div
          className={
            isResponsive
              ? 'fixed inset-0 z-50 flex items-end justify-center bg-[#1E1916]/45 backdrop-blur-[1px] md:items-center md:p-4'
              : 'absolute inset-0 z-30 flex items-end bg-[#1E1916]/45 backdrop-blur-[1px]'
          }
        >
          <div
            className={
              isResponsive
                ? 'max-h-[85dvh] w-full overflow-y-auto rounded-t-[24px] bg-white p-5 pb-8 shadow-2xl md:max-w-lg md:rounded-[24px] md:pb-6'
                : 'max-h-[85%] w-full overflow-y-auto rounded-t-[24px] bg-white p-5 pb-8'
            }
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-[#1E1916]">
                  Your Tray Summary
                </h3>
                <p className="text-xs text-[#5C5049]">{restaurant.name}</p>
              </div>
              <button
                type="button"
                aria-label="Close tray"
                onClick={() => setIsCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF6F1] text-[#1E1916]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {trayBreakdownContent(() => setIsCartOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
}
