import { CheckCircle2, Menu } from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import {
  AccountPortalModal,
  AccountPortalTab,
} from './components/AccountPortalModal';
import { AppViewMode, SidebarContent } from './components/AppSidebar';
import { HomeDiscoveryScreen } from './components/HomeDiscoveryScreen';
import { IPhoneFrame } from './components/IPhoneFrame';
import { LandingPage } from './components/LandingPage';
import { OrderTrackingScreen } from './components/OrderTrackingScreen';
import { RestaurantMenuScreen } from './components/RestaurantMenuScreen';
import { SwipeableScreenDeck } from './components/SwipeableScreenDeck';
import {
  getDistanceToRestaurant,
  INITIAL_ACTIVE_ORDER,
  INITIAL_CART,
  INITIAL_USER,
  RESTAURANTS,
} from './data/deliveryData';
import { getNigeriaLocationCoords } from './data/nigeriaLocations';
import {
  ActiveOrder,
  AuthUser,
  CartEntry,
  FoodCategoryKey,
  MenuItem,
  Restaurant,
  ScreenId,
  TrackingStage,
} from './types/delivery';

const KEYS = {
  restaurants: 'chopbellyfull_restaurants_v7',
  user: 'chopnow_ios_user_v6',
  order: 'chopbellyfull_order_v7',
  auth: 'chopbellyfull_auth_v1',
} as const;

const SYNC_CHANNEL = 'chopnow_ios_marketplace_sync_v6';

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues cleanly
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    readStored(KEYS.auth, false)
  );
  const [showLanding, setShowLanding] = useState(true);
  const [pendingTarget, setPendingTarget] = useState<{
    screen: ScreenId;
    restaurantId?: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<AppViewMode>('responsive');
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [activeCategory, setActiveCategory] = useState<FoodCategoryKey>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>(() =>
    readStored(KEYS.restaurants, RESTAURANTS)
  );
  const [user, setUser] = useState<AuthUser>(() =>
    readStored(KEYS.user, INITIAL_USER)
  );
  const [location, setLocation] = useState<string>(
    () => readStored(KEYS.user, INITIAL_USER).buyerArea || 'Eti-Osa, Lagos'
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(
    () => RESTAURANTS[0].id
  );
  const [cart, setCart] = useState<CartEntry[]>(INITIAL_CART);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder>(() =>
    readStored(KEYS.order, INITIAL_ACTIVE_ORDER)
  );
  const [portalOpen, setPortalOpen] = useState(false);
  const [portalTab, setPortalTab] = useState<AccountPortalTab>('buyer');
  const [toast, setToast] = useState<string | null>(null);

  const broadcastUpdate = useCallback(() => {
    try {
      const ch = new BroadcastChannel(SYNC_CHANNEL);
      ch.postMessage({ at: Date.now() });
      ch.close();
    } catch {
      // Ignore if unsupported
    }
  }, []);

  useEffect(() => {
    const reload = () => {
      setRestaurants(readStored(KEYS.restaurants, RESTAURANTS));
      setActiveOrder(readStored(KEYS.order, INITIAL_ACTIVE_ORDER));
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.restaurants || e.key === KEYS.order) reload();
    };

    window.addEventListener('storage', onStorage);
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(SYNC_CHANNEL);
      ch.onmessage = reload;
    } catch {
      ch = null;
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      ch?.close();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedRestaurant =
    restaurants.find((r) => r.id === selectedRestaurantId) ?? restaurants[0];

  const cartSubtotal = cart.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  function openPortal(tab: AccountPortalTab) {
    setPortalTab(tab);
    setPortalOpen(true);
  }

  function handleChangeLocation(nextLocation: string) {
    setLocation(nextLocation);
    setUser((prev) => {
      const next = { ...prev, buyerArea: nextLocation };
      writeStored(KEYS.user, next);
      return next;
    });
  }

  function handleEnterApp(screen: ScreenId = 'home') {
    if (!isAuthenticated) {
      setPendingTarget({ screen });
      openPortal('buyer');
      setToast('Please sign in or sign up first to explore kitchens near you.');
      return;
    }
    setActiveScreen(screen);
    if (viewMode === 'grid') setViewMode('responsive');
    setShowLanding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectRestaurant(restaurant: Restaurant) {
    if (!isAuthenticated) {
      setPendingTarget({ screen: 'menu', restaurantId: restaurant.id });
      openPortal('buyer');
      setToast(`Sign in or sign up to view ${restaurant.name}'s menu.`);
      return;
    }
    setSelectedRestaurantId(restaurant.id);
    setShowLanding(false);
    if (viewMode !== 'grid') {
      setActiveScreen('menu');
    }
  }

  function handleTrackKitchenLocation(restaurant: Restaurant) {
    const dist = getDistanceToRestaurant(location, restaurant);
    const previewOrder: ActiveOrder = {
      ...activeOrder,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantArea: restaurant.area,
      restaurantAddress: restaurant.address,
      destination: `${user.buyerLandmark} · ${location}`,
      distanceKm: dist,
    };
    setActiveOrder(previewOrder);
    writeStored(KEYS.order, previewOrder);
    if (viewMode !== 'grid') {
      setActiveScreen('tracking');
    }
    setToast(`Showing ${restaurant.name} (${dist} km from ${location}) on map.`);
  }

  function handleAddItem(item: MenuItem) {
    setCart((prev) => {
      const sameRestaurant =
        prev.length === 0 || prev[0].item.restaurantId === item.restaurantId;
      const base = sameRestaurant ? prev : [];
      const existing = base.find((c) => c.item.id === item.id);
      if (existing) {
        return base.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...base, { item, quantity: 1 }];
    });
  }

  function handleDecrementItem(itemId: string) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  function handleCheckoutConfirm() {
    if (cart.length === 0) return;
    const total = cartSubtotal + selectedRestaurant.deliveryFee;
    const summary = cart
      .map((c) => `${c.quantity}x ${c.item.name}`)
      .join(', ');
    const code = `CN-${Math.floor(1000 + Math.random() * 9000)}`;
    const dist = getDistanceToRestaurant(location, selectedRestaurant);

    const nextOrder: ActiveOrder = {
      ...activeOrder,
      code,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
      restaurantArea: selectedRestaurant.area,
      restaurantAddress: selectedRestaurant.address,
      destination: `${user.buyerLandmark}, ${location}`,
      distanceKm: dist,
      itemsSummary: summary,
      totalAmount: total,
      stage: 'confirmed',
      etaMinutes: selectedRestaurant.deliveryMinutes.replace('min', 'mins'),
    };

    setActiveOrder(nextOrder);
    writeStored(KEYS.order, nextOrder);
    broadcastUpdate();
    setCart([]);
    setToast(`Order #${code} sent to ${selectedRestaurant.name}.`);
    if (viewMode !== 'grid') {
      setActiveScreen('tracking');
    }
  }

  function handleStageChange(stage: TrackingStage) {
    const nextOrder: ActiveOrder = {
      ...activeOrder,
      stage,
      etaMinutes:
        stage === 'confirmed'
          ? '22–28 mins'
          : stage === 'preparing'
            ? '16–22 mins'
            : '12–16 mins',
    };
    setActiveOrder(nextOrder);
    writeStored(KEYS.order, nextOrder);
    broadcastUpdate();
  }

  function handleLogin(nextUser: AuthUser) {
    setIsAuthenticated(true);
    writeStored(KEYS.auth, true);
    setUser(nextUser);
    writeStored(KEYS.user, nextUser);
    if (nextUser.buyerArea) {
      setLocation(nextUser.buyerArea);
    }
    if (nextUser.role === 'seller' && nextUser.sellerRestaurantId) {
      setSelectedRestaurantId(nextUser.sellerRestaurantId);
    }
    if (nextUser.role === 'buyer') {
      const targetScreen = pendingTarget?.screen ?? 'home';
      if (pendingTarget?.restaurantId) {
        setSelectedRestaurantId(pendingTarget.restaurantId);
      }
      setPendingTarget(null);
      setShowLanding(false);
      setActiveScreen(targetScreen);
      setToast(
        `Signed in as ${nextUser.name}. Showing kitchens near ${nextUser.buyerArea}.`
      );
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    writeStored(KEYS.auth, false);
    setPendingTarget(null);
    setShowLanding(true);
    setPortalOpen(false);
    setIsDrawerOpen(false);
    setToast('Signed out. Sign in or sign up anytime to access kitchens.');
  }

  function handleUpdateProfile(
    nextUser: AuthUser,
    kitchenPatch?: {
      id: string;
      name: string;
      address: string;
      area: string;
      categoryKey: Exclude<FoodCategoryKey, 'all'>;
    }
  ) {
    setUser(nextUser);
    writeStored(KEYS.user, nextUser);
    setLocation(nextUser.buyerArea);

    if (kitchenPatch) {
      const tagMap: Record<Exclude<FoodCategoryKey, 'all'>, string[]> = {
        jollof: ['Jollof & Rice', 'Authentic Local'],
        swallows: ['Swallows & Soup', 'Local Buka'],
        suya: ['Suya & Grills', 'Charcoal'],
        small_chops: ['Small Chops', 'Party Bites'],
        pepper_soup: ['Pepper Soup', 'Hot Pot'],
        drinks: ['Palm Wine/Drinks', 'Chilled'],
      };
      const coords = getNigeriaLocationCoords(kitchenPatch.area);

      setRestaurants((prev) => {
        const next = prev.map((r) =>
          r.id === kitchenPatch.id
            ? {
                ...r,
                name: kitchenPatch.name,
                address: kitchenPatch.address,
                area: kitchenPatch.area,
                categoryKey: kitchenPatch.categoryKey,
                cuisineTags: tagMap[kitchenPatch.categoryKey],
                lat: coords.lat + 0.002,
                lng: coords.lng + 0.002,
              }
            : r
        );
        writeStored(KEYS.restaurants, next);
        return next;
      });

      if (activeOrder.restaurantId === kitchenPatch.id) {
        const updatedOrder: ActiveOrder = {
          ...activeOrder,
          restaurantName: kitchenPatch.name,
          restaurantAddress: kitchenPatch.address,
          restaurantArea: kitchenPatch.area,
        };
        setActiveOrder(updatedOrder);
        writeStored(KEYS.order, updatedOrder);
      }
    }

    broadcastUpdate();
    setToast('Profile updated and saved.');
  }

  function handleCreateRestaurant(input: {
    kitchenName: string;
    area: string;
    address: string;
    categoryKey: Exclude<FoodCategoryKey, 'all'>;
    coverImageUrl: string;
  }): Restaurant {
    const tagMap: Record<Exclude<FoodCategoryKey, 'all'>, string[]> = {
      jollof: ['Jollof & Rice', 'Authentic Local'],
      swallows: ['Swallows & Soup', 'Local Buka'],
      suya: ['Suya & Grills', 'Charcoal'],
      small_chops: ['Small Chops', 'Party Bites'],
      pepper_soup: ['Pepper Soup', 'Hot Pot'],
      drinks: ['Palm Wine/Drinks', 'Chilled'],
    };

    const coords = getNigeriaLocationCoords(input.area);

    const newRestaurant: Restaurant = {
      id: `kitchen-${Date.now()}`,
      name: input.kitchenName,
      cuisineTags: tagMap[input.categoryKey],
      categoryKey: input.categoryKey,
      rating: 5.0,
      reviewCount: 1,
      deliveryMinutes: '15–25 min',
      deliveryFee: 0,
      area: input.area,
      address: input.address,
      lat: coords.lat + 0.002,
      lng: coords.lng + 0.002,
      promoLabel: 'New Kitchen',
      heroImageUrl: input.coverImageUrl,
      menu: [],
    };

    setRestaurants((prev) => {
      const next = [newRestaurant, ...prev];
      writeStored(KEYS.restaurants, next);
      return next;
    });
    setSelectedRestaurantId(newRestaurant.id);
    broadcastUpdate();
    return newRestaurant;
  }

  function handlePublishDish(input: {
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    category: MenuItem['category'];
    imageUrl: string;
    setAsCover: boolean;
  }) {
    const newItem: MenuItem = {
      id: `dish-${Date.now()}`,
      restaurantId: input.restaurantId,
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      imageUrl: input.imageUrl,
    };

    setRestaurants((prev) => {
      const next = prev.map((r) => {
        if (r.id !== input.restaurantId) return r;
        const shouldReplaceCover = input.setAsCover || r.menu.length === 0;
        return {
          ...r,
          heroImageUrl: shouldReplaceCover ? input.imageUrl : r.heroImageUrl,
          menu: [newItem, ...r.menu],
        };
      });
      writeStored(KEYS.restaurants, next);
      return next;
    });

    setSelectedRestaurantId(input.restaurantId);
    setShowLanding(false);
    setActiveScreen('menu');
    broadcastUpdate();
    setToast(`${input.name} is now live on ChopBellyFull.`);
  }

  function handleResetDemo() {
    setRestaurants(RESTAURANTS);
    setUser(INITIAL_USER);
    setSelectedRestaurantId(RESTAURANTS[0].id);
    setCart(INITIAL_CART);
    setActiveOrder(INITIAL_ACTIVE_ORDER);
    setLocation('Eti-Osa, Lagos');
    setActiveCategory('all');
    writeStored(KEYS.restaurants, RESTAURANTS);
    writeStored(KEYS.user, INITIAL_USER);
    writeStored(KEYS.order, INITIAL_ACTIVE_ORDER);
    broadcastUpdate();
    setToast('Demo photos and local kitchens restored.');
  }

  const screenLayoutMode = viewMode === 'responsive' ? 'responsive' : 'frame';

  const homeScreenNode = (
    <HomeDiscoveryScreen
      restaurants={restaurants}
      user={user}
      location={location}
      activeCategory={activeCategory}
      onChangeCategory={setActiveCategory}
      onChangeLocation={handleChangeLocation}
      selectedRestaurantId={selectedRestaurant.id}
      onSelectRestaurant={handleSelectRestaurant}
      onOpenOrders={() => setActiveScreen('tracking')}
      onOpenAccountPortal={openPortal}
      onOpenSidebar={() => setIsDrawerOpen(true)}
      activeOrderCount={1}
      overlayInset={viewMode === 'phone'}
      layoutMode={screenLayoutMode}
    />
  );

  const menuScreenNode = (
    <RestaurantMenuScreen
      restaurant={selectedRestaurant}
      buyerLocation={location}
      user={user}
      cart={cart}
      onBack={() => setActiveScreen('home')}
      onAddItem={handleAddItem}
      onDecrementItem={handleDecrementItem}
      onTrackKitchenLocation={handleTrackKitchenLocation}
      onEditBuyerAccount={() => openPortal('buyer')}
      onCheckoutConfirm={handleCheckoutConfirm}
      layoutMode={screenLayoutMode}
    />
  );

  const trackingScreenNode = (
    <OrderTrackingScreen
      order={activeOrder}
      onChangeStage={handleStageChange}
      onBackHome={() => setActiveScreen('home')}
      layoutMode={screenLayoutMode}
    />
  );

  const firstName = user.name.split(' ')[0] || 'Account';

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {showLanding || !isAuthenticated ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <LandingPage
              restaurants={restaurants}
              location={location}
              isAuthenticated={isAuthenticated}
              onEnterApp={handleEnterApp}
              onSelectRestaurant={handleSelectRestaurant}
              onOpenPortal={openPortal}
            />
          </motion.div>
        ) : (
          <motion.div
            key="marketplace"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-dvh bg-[#FAF6F1] text-[#1E1916]"
          >
            <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 border-r border-[#E6DDD3] bg-white lg:block">
              <SidebarContent
                user={user}
                location={location}
                activeScreen={activeScreen}
                viewMode={viewMode}
                onSelectScreen={(screen) => {
                  setActiveScreen(screen);
                  if (viewMode === 'grid') setViewMode('responsive');
                }}
                onChangeViewMode={setViewMode}
                onFilterLocalFood={() => {
                  setActiveCategory('jollof');
                  setActiveScreen('home');
                  if (viewMode === 'grid') setViewMode('responsive');
                }}
                onOpenPortal={openPortal}
                onOpenLanding={() => setShowLanding(true)}
                onLogout={handleLogout}
                onResetDemo={handleResetDemo}
              />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 border-b border-[#E6DDD3] bg-[#FAF6F1]/90 backdrop-blur-md lg:hidden">
                <div className="flex h-14 items-center justify-between gap-4 px-4">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open navigation sidebar"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1E1916] shadow-xs"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLanding(true)}
                    className="font-display text-lg font-extrabold tracking-tight text-[#1E1916]"
                  >
                    ChopBellyFull
                  </button>

                  <button
                    type="button"
                    onClick={() => openPortal(user.role)}
                    className="min-h-[40px] shrink-0 rounded-full bg-[#D9232E] px-3.5 text-xs font-bold whitespace-nowrap text-[#FAF6F1] active:bg-[#9E141D]"
                  >
                    {user.role === 'seller'
                      ? 'Post Food'
                      : `${firstName} · Sign In`}
                  </button>
                </div>
                {viewMode === 'responsive' && (
                  <div className="hidden items-center gap-2 border-t border-[#E6DDD3] px-4 py-2 md:flex lg:hidden">
                    {(
                      [
                        { id: 'home', label: 'Home Discovery' },
                        { id: 'menu', label: 'Restaurant & Menu' },
                        { id: 'tracking', label: 'Live Tracking' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveScreen(tab.id)}
                        className={`min-h-[38px] rounded-full px-4 text-xs font-bold whitespace-nowrap transition-colors ${
                          activeScreen === tab.id
                            ? 'bg-[#D9232E] text-white'
                            : 'bg-white text-[#5C5049] hover:text-[#1E1916]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </header>

              {viewMode === 'responsive' ? (
                <main className="flex-1">
                  <div className="h-[calc(100dvh-3.5rem)] w-full md:hidden">
                    <SwipeableScreenDeck
                      activeScreen={activeScreen}
                      onChangeScreen={setActiveScreen}
                      screens={[
                        { id: 'home', label: 'Home', node: homeScreenNode },
                        { id: 'menu', label: 'Menu', node: menuScreenNode },
                        {
                          id: 'tracking',
                          label: 'Track',
                          node: trackingScreenNode,
                        },
                      ]}
                    />
                  </div>

                  <div className="hidden min-h-full md:block">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeScreen}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{
                          duration: 0.2,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        {activeScreen === 'home'
                          ? homeScreenNode
                          : activeScreen === 'menu'
                            ? menuScreenNode
                            : trackingScreenNode}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </main>
        ) : (
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-[#1E1916] md:text-3xl">
                    {viewMode === 'phone'
                      ? 'Mobile frame preview — swipe between screens.'
                      : 'All three ChopBellyFull screens side by side.'}
                  </h1>
                  <p className="mt-1 text-sm text-[#635850]">
                    Switch back to Full mode in the sidebar anytime to use ChopBellyFull across phone, laptop, and desktop widths.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openPortal(user.role)}
                  className="hidden min-h-[44px] shrink-0 items-center justify-center rounded-full bg-[#D9232E] px-5 text-sm font-bold whitespace-nowrap text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D] lg:inline-flex"
                >
                  {user.role === 'seller'
                    ? 'Seller · Post Food'
                    : `${firstName} · Buyer / Seller Login`}
                </button>
              </div>

              {viewMode === 'phone' ? (
                <div className="flex flex-col items-center">
                  <IPhoneFrame
                    overlayStatusBar
                    statusBarTone={activeScreen === 'menu' ? 'light' : 'dark'}
                    isHighlighted
                  >
                    <SwipeableScreenDeck
                      activeScreen={activeScreen}
                      onChangeScreen={setActiveScreen}
                      screens={[
                        { id: 'home', label: 'Home', node: homeScreenNode },
                        { id: 'menu', label: 'Menu', node: menuScreenNode },
                        {
                          id: 'tracking',
                          label: 'Track',
                          node: trackingScreenNode,
                        },
                      ]}
                    />
                  </IPhoneFrame>
                  <p className="mt-3 text-center text-xs font-medium text-[#635850]">
                    Tip: Swipe left or right inside the phone screen to move between Home, Menu, and Live Tracking.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 items-start justify-items-center gap-8 xl:grid-cols-3">
                  <IPhoneFrame
                    title="01. Home Discovery"
                    subtitle="Local food & closest kitchens"
                  >
                    {homeScreenNode}
                  </IPhoneFrame>

                  <IPhoneFrame
                    title="02. Restaurant & Menu"
                    subtitle="Kitchen location, menu & cart"
                    overlayStatusBar
                    statusBarTone="light"
                  >
                    {menuScreenNode}
                  </IPhoneFrame>

                  <IPhoneFrame
                    title="03. Live Tracking"
                    subtitle="Kitchen pin, route & rider"
                    overlayStatusBar
                    statusBarTone="dark"
                  >
                    {trackingScreenNode}
                  </IPhoneFrame>
                </div>
              )}
            </div>
          </main>
        )}
      </div>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/45 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="ChopBellyFull sidebar navigation"
        >
          <div className="h-full w-72 max-w-[82vw] shadow-2xl">
            <SidebarContent
              user={user}
              location={location}
              activeScreen={activeScreen}
              viewMode={viewMode}
              onSelectScreen={(screen) => {
                setActiveScreen(screen);
                if (viewMode === 'grid') setViewMode('responsive');
              }}
              onChangeViewMode={setViewMode}
              onFilterLocalFood={() => {
                setActiveCategory('jollof');
                setActiveScreen('home');
                if (viewMode === 'grid') setViewMode('responsive');
              }}
              onOpenPortal={openPortal}
              onOpenLanding={() => setShowLanding(true)}
              onLogout={handleLogout}
              onResetDemo={handleResetDemo}
              onClose={() => setIsDrawerOpen(false)}
              isMobileDrawer
            />
          </div>
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setIsDrawerOpen(false)}
            className="flex-1"
          />
        </div>
      )}
          </motion.div>
        )}
      </AnimatePresence>

      <AccountPortalModal
        key={`${portalTab}-${portalOpen}-${isAuthenticated}`}
        isOpen={portalOpen}
        isAuthenticated={isAuthenticated}
        initialTab={portalTab}
        user={user}
        restaurants={restaurants}
        activeOrder={activeOrder}
        onClose={() => setPortalOpen(false)}
        onLogin={handleLogin}
        onUpdateProfile={handleUpdateProfile}
        onCreateRestaurant={handleCreateRestaurant}
        onPublishDish={handlePublishDish}
        onUpdateOrderStage={handleStageChange}
        onGoToFeed={() => {
          setShowLanding(false);
          setActiveScreen('home');
        }}
        onResetDemo={handleResetDemo}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-4 bottom-5 left-4 z-50 mx-auto flex max-w-md items-center gap-2.5 rounded-2xl bg-[#1E1916] px-4 py-3 text-sm font-medium text-[#FAF6F1] shadow-xl md:right-6 md:left-auto"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D9232E]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
