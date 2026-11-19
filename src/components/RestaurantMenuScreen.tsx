import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  Minus,
  Navigation,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { formatNaira, getDistanceToRestaurant } from '../data/deliveryData';
import { isUuid } from '../lib/orders';
import { AuthUser, CartEntry, MenuItem, Restaurant } from '../types/delivery';
import { PlateImage } from './PlateImage';
import { Badge, Button, Card, EmptyState, Input } from './ui';

interface RestaurantMenuScreenProps {
  restaurant: Restaurant;
  buyerLocation: string;
  user: AuthUser;
  cart: CartEntry[];
  onBack: () => void;
  onAddItem: (item: MenuItem) => void;
  onDecrementItem: (itemId: string) => void;
  onTrackKitchenLocation: (restaurant: Restaurant) => void;
  onEditProfile: () => void;
  onStartPaystackCheckout: (buyer: {
    name: string;
    phone: string;
    deliveryAddress: string;
  }) => Promise<void>;
  layoutMode?: 'frame' | 'responsive';
}

type MenuTab = 'All' | MenuItem['category'];

const MENU_TABS: MenuTab[] = ['All', 'Combos', 'Swallows', 'Proteins', 'Sides'];

export function RestaurantMenuScreen({
  restaurant,
  buyerLocation,
  user,
  cart,
  onBack,
  onAddItem,
  onDecrementItem,
  onTrackKitchenLocation,
  onEditProfile,
  onStartPaystackCheckout,
  layoutMode = 'frame',
}: RestaurantMenuScreenProps) {
  const [isFavorite, setIsFavorite] = useState(true);
  const [activeTab, setActiveTab] = useState<MenuTab>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [buyerName, setBuyerName] = useState(user.name);
  const [buyerPhone, setBuyerPhone] = useState(user.phone);
  const [deliveryAddress, setDeliveryAddress] = useState(
    user.buyerLandmark ? `${user.buyerLandmark}, ${buyerLocation}` : buyerLocation
  );
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    setBuyerName(user.name);
    setBuyerPhone(user.phone);
    setDeliveryAddress(
      user.buyerLandmark
        ? `${user.buyerLandmark}, ${buyerLocation}`
        : buyerLocation
    );
  }, [user.name, user.phone, user.buyerLandmark, buyerLocation]);

  const isResponsive = layoutMode === 'responsive';
  const distanceKm = getDistanceToRestaurant(buyerLocation, restaurant);
  const isRealKitchen = isUuid(restaurant.id);
  const isOwnKitchen =
    Boolean(user.sellerRestaurantId) &&
    user.sellerRestaurantId === restaurant.id;

  const visibleItems = useMemo(() => {
    if (activeTab === 'All') return restaurant.menu;
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

  async function handleCheckoutClick() {
    if (checkoutLoading) return;
    setCheckoutError('');

    if (!isRealKitchen) {
      setCheckoutError('Sample kitchens cannot receive real orders.');
      return;
    }
    if (isOwnKitchen) {
      setCheckoutError(
        "You can't order your own food. Sign in as a Buyer in another window to test checkout."
      );
      return;
    }
    if (buyerName.trim().length < 2) {
      setCheckoutError('Enter your name (at least 2 characters).');
      return;
    }
    if (!/^(\+?234|0)\d{10}$/.test(buyerPhone.replace(/[\s-]/g, ''))) {
      setCheckoutError('Enter a valid Nigerian phone number (e.g. 0805 112 9087).');
      return;
    }
    if (deliveryAddress.trim().length < 5) {
      setCheckoutError('Enter a full delivery street address or landmark.');
      return;
    }

    setCheckoutLoading(true);
    try {
      await onStartPaystackCheckout({
        name: buyerName.trim(),
        phone: buyerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
      });
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : 'Could not start Paystack payment.'
      );
      setCheckoutLoading(false);
    }
  }

  const trayBreakdownContent = (closeOnChange?: () => void) => (
    <>
      {cart.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-border-soft bg-bg p-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <p className="font-heading mt-2.5 text-sm font-bold text-text-primary">
            Your tray is empty
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Tap + on any dish to build your plate from {restaurant.name}.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {cart.map(({ item, quantity }) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-[14px] bg-bg px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {quantity}x {item.name}
                  </p>
                  <p className="tabular-nums-clean text-xs font-semibold text-primary">
                    {formatNaira(item.price * quantity)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Remove one ${item.name}`}
                    onClick={() => onDecrementItem(item.id)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-surface text-text-primary transition-colors hover:bg-primary-soft"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    aria-label={`Add one more ${item.name}`}
                    onClick={() => onAddItem(item)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-xs font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2.5 rounded-[14px] border border-border-soft bg-bg p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-secondary">
                Delivery Details · {distanceKm} km away
              </span>
              <button
                type="button"
                onClick={() => {
                  closeOnChange?.();
                  onEditProfile();
                }}
                className="cursor-pointer text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                Edit Profile
              </button>
            </div>

            <Input
              id="tray-buyer-name"
              label="Your Name"
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="e.g. Tunde Adewale"
            />
            <Input
              id="tray-buyer-phone"
              label="Phone Number"
              type="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="0805 112 9087"
              className="tabular-nums-clean"
            />
            <Input
              id="tray-delivery-address"
              label="Delivery Street / Landmark"
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Street address & landmark"
            />
          </div>

          <div className="mt-4 rounded-[12px] bg-primary-soft/60 px-3.5 py-2.5 text-xs font-medium text-text-primary">
            <p className="flex items-center gap-1.5 font-semibold text-primary-dark">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              Pay securely with Paystack
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              Supports Card, Bank Transfer, OPay, PalmPay &amp; USSD.
            </p>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-border-soft pt-3 text-xs">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="tabular-nums-clean font-medium text-text-primary">
                {formatNaira(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Delivery fee</span>
              <span
                className={`tabular-nums-clean font-semibold ${
                  restaurant.deliveryFee === 0
                    ? 'text-success'
                    : 'text-text-primary'
                }`}
              >
                {restaurant.deliveryFee === 0
                  ? 'Free'
                  : formatNaira(restaurant.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 text-sm font-bold text-text-primary">
              <span>Total</span>
              <span className="tabular-nums-clean text-primary">
                {formatNaira(finalTotal)}
              </span>
            </div>
          </div>

          {checkoutError && (
            <div className="mt-3 rounded-[12px] bg-error/10 px-3.5 py-2.5 text-xs font-semibold text-error">
              {checkoutError}
            </div>
          )}

          <Button
            type="button"
            fullWidth
            size="lg"
            className="mt-4"
            disabled={checkoutLoading || isOwnKitchen || !isRealKitchen}
            onClick={handleCheckoutClick}
          >
            {checkoutLoading
              ? 'Opening Paystack...'
              : isOwnKitchen
                ? 'Your Own Kitchen'
                : `Pay with Paystack · ${formatNaira(finalTotal)}`}
          </Button>
        </>
      )}
    </>
  );

  return (
    <div className="relative flex h-full flex-col bg-bg">
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
              className={`relative w-full overflow-hidden bg-primary-soft ${
                isResponsive ? 'h-56 md:h-64 md:rounded-t-[16px]' : 'h-56'
              }`}
            >
              <PlateImage
                src={restaurant.heroImageUrl}
                alt={restaurant.name}
                className="h-full w-full"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-text-primary/65 via-text-primary/15 to-text-primary/40" />

              <div
                className={`absolute right-4 left-4 flex items-center justify-between ${
                  isResponsive ? 'top-4' : 'top-12'
                }`}
              >
                <button
                  type="button"
                  aria-label="Back to home feed"
                  onClick={onBack}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface/95 text-text-primary shadow-md backdrop-blur-md transition-transform duration-150 hover:scale-105 active:scale-95"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  aria-label={
                    isFavorite ? 'Remove favorite' : 'Favorite kitchen'
                  }
                  onClick={() => setIsFavorite((f) => !f)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface/95 text-text-primary shadow-md backdrop-blur-md transition-transform duration-150 hover:scale-105 active:scale-95"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      isFavorite
                        ? 'fill-primary text-primary'
                        : 'text-text-primary'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="soft-card-shadow relative z-10 -mt-6 rounded-t-[20px] bg-surface px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <h1
                  className={`font-heading font-bold tracking-tight text-text-primary ${
                    isResponsive ? 'text-xl md:text-2xl' : 'text-xl'
                  }`}
                >
                  {restaurant.name}
                </h1>
                <Badge variant="peach" className="shrink-0">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span className="tabular-nums-clean">
                    {restaurant.rating.toFixed(1)}
                  </span>
                </Badge>
              </div>

              <p className="mt-1.5 text-xs font-medium text-text-secondary md:text-sm">
                {restaurant.cuisineTags.join(' • ')}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-xs font-semibold">
                <span className="tabular-nums-clean inline-flex items-center gap-1 text-text-primary">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {restaurant.deliveryMinutes}
                </span>
                <span className="text-text-secondary">·</span>
                <span
                  className={`tabular-nums-clean ${
                    restaurant.deliveryFee === 0
                      ? 'text-success'
                      : 'text-text-primary'
                  }`}
                >
                  {restaurant.deliveryFee === 0
                    ? 'Free delivery'
                    : `${formatNaira(restaurant.deliveryFee)} delivery`}
                </span>
                <Badge variant="success">Available</Badge>
              </div>

              {isOwnKitchen && (
                <div className="mt-3 rounded-[12px] bg-primary-soft/70 px-3.5 py-2 text-xs font-semibold text-primary-dark">
                  This is your kitchen. Open an Incognito window with a Buyer
                  account to test ordering from it.
                </div>
              )}

              <div className="mt-3.5 flex items-center justify-between gap-2 rounded-[14px] border border-border-soft bg-bg px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{restaurant.address}</span>
                  </p>
                  <p className="tabular-nums-clean mt-0.5 text-xs text-text-secondary">
                    {distanceKm} km from {buyerLocation}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  onClick={() => onTrackKitchenLocation(restaurant)}
                >
                  <Navigation className="h-3.5 w-3.5 text-primary" />
                  Orders
                </Button>
              </div>
            </div>

            <div className="sticky top-0 z-20 border-b border-border-soft bg-surface/95 px-5 backdrop-blur-md md:rounded-b-[16px]">
              <div className="no-scrollbar flex justify-between gap-4 overflow-x-auto md:justify-start md:gap-8">
                {MENU_TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`relative min-h-[44px] shrink-0 cursor-pointer text-xs whitespace-nowrap transition-colors duration-150 md:text-sm ${
                        isActive
                          ? 'font-bold text-primary'
                          : 'font-medium text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tab}
                      {isActive && (
                        <motion.span
                          layoutId={
                            isResponsive
                              ? 'menuTabUnderlineResponsive'
                              : 'menuTabUnderlineFrame'
                          }
                          transition={{
                            type: 'spring',
                            stiffness: 420,
                            damping: 32,
                          }}
                          className="absolute right-0 bottom-0 left-0 h-[2.5px] rounded-full bg-primary"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={isResponsive ? 'px-5 pt-4 md:px-0' : 'px-5 pt-4'}>
              {visibleItems.length === 0 ? (
                <EmptyState
                  emoji="🍲"
                  title={
                    activeTab === 'All'
                      ? 'No dishes posted in this kitchen yet'
                      : `No dishes in ${activeTab} yet`
                  }
                  description="Switch to All or another category tab to see available plates."
                />
              ) : (
                <div
                  className={
                    isResponsive
                      ? 'grid grid-cols-1 gap-4 md:grid-cols-2'
                      : 'space-y-3'
                  }
                >
                  {visibleItems.map((item) => {
                    const qty = getQuantity(item.id);
                    const isUnavailable = item.isAvailable === false;
                    const isRealItem = isUuid(item.id) && isRealKitchen;
                    return (
                      <Card
                        key={item.id}
                        padding="none"
                        interactive={!isUnavailable}
                        className={`flex items-center gap-3.5 p-4 ${
                          isUnavailable ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h2 className="font-heading text-sm font-bold text-text-primary">
                              {item.name}
                            </h2>
                            {item.isNew && !isUnavailable && (
                              <Badge variant="mango">New</Badge>
                            )}
                            {isUnavailable && (
                              <Badge variant="error">Out of stock</Badge>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                            {item.description}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="tabular-nums-clean font-heading text-sm font-bold text-primary">
                              {formatNaira(item.price)}
                            </span>

                            {isUnavailable ? (
                              <span className="text-xs font-semibold text-error">
                                Unavailable
                              </span>
                            ) : !isRealItem ? (
                              <span className="text-xs font-semibold text-text-secondary">
                                Sample
                              </span>
                            ) : qty === 0 ? (
                              <button
                                type="button"
                                aria-label={`Add ${item.name} to tray`}
                                onClick={() => onAddItem(item)}
                                className="coral-glow-shadow flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary text-white transition-all duration-150 hover:bg-primary-dark active:scale-95"
                              >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 rounded-full bg-primary-soft px-1.5 py-1">
                                <button
                                  type="button"
                                  aria-label={`Remove one ${item.name}`}
                                  onClick={() => onDecrementItem(item.id)}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-surface text-text-primary transition-colors hover:bg-bg"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="tabular-nums-clean min-w-[16px] text-center text-xs font-bold text-primary">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Add one more ${item.name}`}
                                  onClick={() => onAddItem(item)}
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="h-22 w-22 shrink-0 overflow-hidden rounded-[14px] bg-primary-soft">
                          <PlateImage
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full"
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {isResponsive && (
            <aside className="hidden lg:col-span-4 lg:sticky lg:top-6 lg:block">
              <Card padding="md">
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-border-soft pb-3">
                  <div>
                    <h3 className="font-heading text-base font-bold text-text-primary">
                      Your Tray ({totalItems})
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {restaurant.name}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                </div>

                {trayBreakdownContent()}
              </Card>
            </aside>
          )}
        </div>
      </div>

      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute right-4 bottom-5 left-4 z-20 ${
              isResponsive ? 'lg:hidden' : ''
            }`}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCartOpen(true)}
              className="coral-glow-shadow tabular-nums-clean mx-auto flex min-h-[52px] w-full max-w-md cursor-pointer items-center justify-between rounded-full bg-primary px-5 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-dark"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                View Your Tray ({totalItems}{' '}
                {totalItems === 1 ? 'item' : 'items'})
              </span>
              <span>• {formatNaira(subtotal)}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {isCartOpen && (
        <div
          className={
            isResponsive
              ? 'fixed inset-0 z-50 flex items-end justify-center bg-text-primary/45 backdrop-blur-[1px] md:items-center md:p-4'
              : 'absolute inset-0 z-30 flex items-end bg-text-primary/45 backdrop-blur-[1px]'
          }
        >
          <div
            className={
              isResponsive
                ? 'max-h-[85dvh] w-full overflow-y-auto rounded-t-[20px] bg-surface p-5 pb-8 shadow-2xl md:max-w-lg md:rounded-[20px] md:pb-6'
                : 'max-h-[85%] w-full overflow-y-auto rounded-t-[20px] bg-surface p-5 pb-8'
            }
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-text-primary">
                  Your Tray Summary
                </h3>
                <p className="text-xs text-text-secondary">{restaurant.name}</p>
              </div>
              <button
                type="button"
                aria-label="Close tray"
                onClick={() => setIsCartOpen(false)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-bg text-text-primary transition-colors hover:bg-primary-soft"
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