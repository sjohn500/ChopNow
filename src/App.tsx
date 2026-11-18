import { CheckCircle2, Menu } from 'lucide-react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { AppViewMode, SidebarContent } from './components/AppSidebar';
import { AuthScreen } from './components/AuthScreen';
import { HomeDiscoveryScreen } from './components/HomeDiscoveryScreen';
import { IPhoneFrame } from './components/IPhoneFrame';
import { LandingPage } from './components/LandingPage';
import { OrderTrackingScreen } from './components/OrderTrackingScreen';
import { PostFoodScreen } from './components/PostFoodScreen';
import { ProfileScreen } from './components/ProfileScreen';
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
  UserRole,
} from './types/delivery';

const KEYS = {
  restaurants: 'chopbelly_restaurants_v8',
  user: 'chopbelly_user_v8',
  orders: 'chopbelly_orders_v8',
  auth: 'chopbelly_auth_v8',
} as const;

const SYNC_CHANNEL = 'chopbelly_marketplace_sync_v8';

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

function normalizeStage(stage: string): TrackingStage {
  if (stage === 'pending' || stage === 'accepted' || stage === 'delivered') {
    return stage;
  }
  if (stage === 'confirmed') return 'pending';
  return 'accepted';
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    readStored(KEYS.auth, false)
  );
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('buyer');
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(
    null
  );
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
  const [orders, setOrders] = useState<ActiveOrder[]>(() => {
    const stored = readStored<ActiveOrder[]>(KEYS.orders, [
      INITIAL_ACTIVE_ORDER,
    ]);
    return stored.map((o) => ({ ...o, stage: normalizeStage(o.stage) }));
  });
  const [activeOrderCode, setActiveOrderCode] = useState<string>(
    () => orders[0]?.code ?? INITIAL_ACTIVE_ORDER.code
  );
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
      const storedOrders = readStored<ActiveOrder[]>(KEYS.orders, [
        INITIAL_ACTIVE_ORDER,
      ]);
      setOrders(
        storedOrders.map((o) => ({ ...o, stage: normalizeStage(o.stage) }))
      );
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.restaurants || e.key === KEYS.orders) reload();
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

  const activeOrder =
    orders.find((o) => o.code === activeOrderCode) ??
    orders[0] ??
    INITIAL_ACTIVE_ORDER;

  const activeOrderCount = orders.filter(
    (o) => o.stage !== 'delivered'
  ).length;

  const cartSubtotal = cart.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  function openAuthScreen(role: UserRole = 'buyer', message?: string) {
    setAuthInitialRole(role);
    setAuthPromptMessage(message ?? null);
    setShowLanding(false);
    setShowAuth(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      openAuthScreen(
        screen === 'post' ? 'seller' : 'buyer',
        screen === 'post'
          ? 'Sign in or create an account before posting a plate on ChopBellyFull.'
          : 'Sign in or create an account first to explore local kitchens near you.'
      );
      return;
    }
    setActiveScreen(screen);
    if (viewMode === 'grid') setViewMode('responsive');
    setShowAuth(false);
    setShowLanding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectRestaurant(restaurant: Restaurant) {
    if (!isAuthenticated) {
      setPendingTarget({ screen: 'menu', restaurantId: restaurant.id });
      openAuthScreen(
        'buyer',
        `Sign in or sign up first to browse dishes from ${restaurant.name}.`
      );
      return;
    }
    setSelectedRestaurantId(restaurant.id);
    setShowAuth(false);
    setShowLanding(false);
    if (viewMode !== 'grid') {
      setActiveScreen('menu');
    }
  }

  function handleOrderPlate(restaurant: Restaurant, item: MenuItem) {
    if (item.isAvailable === false) {
      setToast(`${item.name} is currently out of stock.`);
      return;
    }
    setSelectedRestaurantId(restaurant.id);
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
    if (viewMode !== 'grid') {
      setActiveScreen('menu');
    }
    setToast(`Added ${item.name} from ${restaurant.name} to your tray.`);
  }

  function handleTrackKitchenLocation(restaurant: Restaurant) {
    const dist = getDistanceToRestaurant(location, restaurant);
    const updatedOrder: ActiveOrder = {
      ...activeOrder,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantArea: restaurant.area,
      restaurantAddress: restaurant.address,
      destination: `${user.buyerLandmark} · ${location}`,
      distanceKm: dist,
    };
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.code === activeOrder.code ? updatedOrder : o
      );
      writeStored(KEYS.orders, next);
      return next;
    });
    if (viewMode !== 'grid') {
      setActiveScreen('orders');
    }
    setToast(`Showing ${restaurant.name} (${dist} km from ${location}) on map.`);
  }

  function handleAddItem(item: MenuItem) {
    if (item.isAvailable === false) {
      setToast(`${item.name} is currently out of stock.`);
      return;
    }
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
    const code = `CB-${Math.floor(1000 + Math.random() * 9000)}`;
    const dist = getDistanceToRestaurant(location, selectedRestaurant);

    const nextOrder: ActiveOrder = {
      ...INITIAL_ACTIVE_ORDER,
      code,
      restaurantId: selectedRestaurant.id,
      restaurantName: selectedRestaurant.name,
      restaurantArea: selectedRestaurant.area,
      restaurantAddress: selectedRestaurant.address,
      destination: `${user.buyerLandmark}, ${location}`,
      distanceKm: dist,
      itemsSummary: summary,
      plateImageUrl:
        cart[0]?.item.imageUrl ?? selectedRestaurant.heroImageUrl,
      totalAmount: total,
      stage: 'pending',
      etaMinutes: selectedRestaurant.deliveryMinutes.replace('min', 'mins'),
      arrivalTime: '22–28 mins',
      createdAt: 'Just now',
    };

    setOrders((prev) => {
      const next = [nextOrder, ...prev];
      writeStored(KEYS.orders, next);
      return next;
    });
    setActiveOrderCode(code);
    broadcastUpdate();
    setCart([]);
    setToast(`Order #${code} placed with ${selectedRestaurant.name}!`);
    if (viewMode !== 'grid') {
      setActiveScreen('orders');
    }
  }

  function handleStageChange(stage: TrackingStage) {
    const nextEta =
      stage === 'pending'
        ? '25–30 mins'
        : stage === 'accepted'
          ? '14–20 mins'
          : 'Arrived';
    setOrders((prev) => {
      const next = prev.map((o) =>
        o.code === activeOrder.code
          ? { ...o, stage, etaMinutes: nextEta }
          : o
      );
      writeStored(KEYS.orders, next);
      return next;
    });
    broadcastUpdate();
    const label =
      stage === 'pending'
        ? 'Pending'
        : stage === 'accepted'
          ? 'Accepted'
          : 'Delivered';
    setToast(`Order #${activeOrder.code} marked as ${label}.`);
  }

  function handleSelectOrder(order: ActiveOrder) {
    setActiveOrderCode(order.code);
    if (viewMode !== 'grid') {
      setActiveScreen('orders');
    }
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

    const fallbackScreen: ScreenId =
      nextUser.role === 'seller' ? 'post' : 'home';
    const targetScreen = pendingTarget?.screen ?? fallbackScreen;
    if (pendingTarget?.restaurantId) {
      setSelectedRestaurantId(pendingTarget.restaurantId);
    }
    setPendingTarget(null);
    setAuthPromptMessage(null);
    setShowAuth(false);
    setShowLanding(false);
    setActiveScreen(targetScreen);
    setToast(
      `Welcome, ${nextUser.name}! Showing warm plates near ${nextUser.buyerArea}.`
    );
  }

  function handleLogout() {
    setIsAuthenticated(false);
    writeStored(KEYS.auth, false);
    setPendingTarget(null);
    setShowAuth(false);
    setShowLanding(true);
    setIsDrawerOpen(false);
    setToast('Signed out. Sign in anytime to order or post food.');
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

      setOrders((prev) => {
        const next = prev.map((o) =>
          o.restaurantId === kitchenPatch.id
            ? {
                ...o,
                restaurantName: kitchenPatch.name,
                restaurantAddress: kitchenPatch.address,
                restaurantArea: kitchenPatch.area,
              }
            : o
        );
        writeStored(KEYS.orders, next);
        return next;
      });
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
      promoLabel: 'New',
      heroImageUrl: input.coverImageUrl,
      menu: [],
    };

    setRestaurants((prev) => {
      const next = [newRestaurant, ...prev];
      writeStored(KEYS.restaurants, next);
      return next;
    });
    setUser((prev) => {
      const next = { ...prev, sellerRestaurantId: newRestaurant.id };
      writeStored(KEYS.user, next);
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
      isAvailable: true,
      isNew: true,
      rating: 5.0,
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

    setUser((prev) => {
      const next = { ...prev, sellerRestaurantId: input.restaurantId };
      writeStored(KEYS.user, next);
      return next;
    });

    setSelectedRestaurantId(input.restaurantId);
    setShowLanding(false);
    setActiveScreen('home');
    broadcastUpdate();
    setToast(`${input.name} is now live on ChopBellyFull!`);
  }

  function handleToggleDishAvailability(restaurantId: string, itemId: string) {
    let nextLabel = 'Available';
    setRestaurants((prev) => {
      const next = prev.map((r) => {
        if (r.id !== restaurantId) return r;
        return {
          ...r,
          menu: r.menu.map((item) => {
            if (item.id !== itemId) return item;
            const nextAvailable = item.isAvailable === false;
            nextLabel = nextAvailable ? 'Available' : 'Out of stock';
            return { ...item, isAvailable: nextAvailable };
          }),
        };
      });
      writeStored(KEYS.restaurants, next);
      return next;
    });
    broadcastUpdate();
    setToast(`Dish marked as ${nextLabel}.`);
  }

  function handleDeleteDish(restaurantId: string, itemId: string) {
    setRestaurants((prev) => {
      const next = prev.map((r) =>
        r.id === restaurantId
          ? { ...r, menu: r.menu.filter((item) => item.id !== itemId) }
          : r
      );
      writeStored(KEYS.restaurants, next);
      return next;
    });
    broadcastUpdate();
    setToast('Dish removed from your posts.');
  }

  function handleResetDemo() {
    setRestaurants(RESTAURANTS);
    setUser(INITIAL_USER);
    setSelectedRestaurantId(RESTAURANTS[0].id);
    setCart(INITIAL_CART);
    setOrders([INITIAL_ACTIVE_ORDER]);
    setActiveOrderCode(INITIAL_ACTIVE_ORDER.code);
    setLocation('Eti-Osa, Lagos');
    setActiveCategory('all');
    writeStored(KEYS.restaurants, RESTAURANTS);
    writeStored(KEYS.user, INITIAL_USER);
    writeStored(KEYS.orders, [INITIAL_ACTIVE_ORDER]);
    broadcastUpdate();
    setToast('ChopBellyFull kitchens and sample plates restored.');
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
      onSelectRestaurant={handleSelectRestaurant}
      onOrderPlate={handleOrderPlate}
      onNavigateScreen={setActiveScreen}
      activeOrderCount={activeOrderCount}
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
      onEditProfile={() => setActiveScreen('profile')}
      onCheckoutConfirm={handleCheckoutConfirm}
      layoutMode={screenLayoutMode}
    />
  );

  const postScreenNode = (
    <PostFoodScreen
      user={user}
      restaurants={restaurants}
      onCreateRestaurant={handleCreateRestaurant}
      onPublishDish={handlePublishDish}
      onNavigateScreen={setActiveScreen}
      activeOrderCount={activeOrderCount}
      overlayInset={viewMode === 'phone'}
      layoutMode={screenLayoutMode}
    />
  );

  const ordersScreenNode = (
    <OrderTrackingScreen
      order={activeOrder}
      orders={orders}
      onChangeStage={handleStageChange}
      onSelectOrder={handleSelectOrder}
      onNavigateScreen={setActiveScreen}
      onBackHome={() => setActiveScreen('home')}
      layoutMode={screenLayoutMode}
    />
  );

  const profileScreenNode = (
    <ProfileScreen
      user={user}
      restaurants={restaurants}
      orders={orders}
      onUpdateProfile={handleUpdateProfile}
      onToggleDishAvailability={handleToggleDishAvailability}
      onDeleteDish={handleDeleteDish}
      onSelectOrder={handleSelectOrder}
      onNavigateScreen={setActiveScreen}
      onLogout={handleLogout}
      onResetDemo={handleResetDemo}
      overlayInset={viewMode === 'phone'}
      layoutMode={screenLayoutMode}
    />
  );

  function renderActiveScreenNode() {
    switch (activeScreen) {
      case 'menu':
        return menuScreenNode;
      case 'post':
        return postScreenNode;
      case 'orders':
        return ordersScreenNode;
      case 'profile':
        return profileScreenNode;
      case 'home':
      default:
        return homeScreenNode;
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {showLanding ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <LandingPage
              restaurants={restaurants}
              location={location}
              isAuthenticated={isAuthenticated}
              onEnterApp={handleEnterApp}
              onSelectRestaurant={handleSelectRestaurant}
              onOpenAuth={(role) => openAuthScreen(role ?? 'buyer')}
            />
          </motion.div>
        ) : !isAuthenticated || showAuth ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <AuthScreen
              initialRole={authInitialRole}
              user={user}
              restaurants={restaurants}
              promptMessage={authPromptMessage}
              onLogin={handleLogin}
              onCreateRestaurant={handleCreateRestaurant}
              onBackToLanding={() => {
                setShowAuth(false);
                setShowLanding(true);
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="marketplace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-dvh bg-bg text-text-primary"
          >
            <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 border-r border-border-soft bg-surface lg:block">
              <SidebarContent
                user={user}
                location={location}
                activeScreen={activeScreen}
                viewMode={viewMode}
                activeOrderCount={activeOrderCount}
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
                onOpenLanding={() => setShowLanding(true)}
                onLogout={handleLogout}
                onResetDemo={handleResetDemo}
              />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 border-b border-border-soft bg-bg/92 backdrop-blur-md lg:hidden">
                <div className="flex h-14 items-center justify-between gap-4 px-4">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open navigation sidebar"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-text-primary shadow-xs transition-colors hover:bg-primary-soft"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLanding(true)}
                    className="font-heading cursor-pointer text-lg font-bold tracking-tight text-text-primary"
                  >
                    Chop<span className="text-primary">BellyFull</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveScreen('post')}
                    className="min-h-[38px] shrink-0 cursor-pointer rounded-full bg-primary px-4 text-xs font-semibold whitespace-nowrap text-white shadow-xs transition-colors duration-200 hover:bg-primary-dark"
                  >
                    + Post Food
                  </button>
                </div>

                {viewMode === 'responsive' && (
                  <div className="hidden items-center gap-2 border-t border-border-soft px-4 py-2 md:flex lg:hidden">
                    {(
                      [
                        { id: 'home', label: 'Home' },
                        { id: 'menu', label: 'Kitchen' },
                        { id: 'post', label: 'Post Food' },
                        { id: 'orders', label: 'Orders' },
                        { id: 'profile', label: 'Profile' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveScreen(tab.id)}
                        className={`min-h-[36px] cursor-pointer rounded-full px-4 text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                          activeScreen === tab.id
                            ? 'bg-primary text-white'
                            : 'bg-surface text-text-secondary hover:text-text-primary'
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
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeScreen}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{
                        duration: 0.18,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="h-full"
                    >
                      {renderActiveScreenNode()}
                    </motion.div>
                  </AnimatePresence>
                </main>
              ) : (
                <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
                  <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                      <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight text-balance text-text-primary md:text-3xl">
                          {viewMode === 'phone'
                            ? 'Mobile frame preview — swipe between screens.'
                            : 'ChopBellyFull mobile showcase — three key screens.'}
                        </h1>
                        <p className="mt-1 text-sm text-text-secondary">
                          Switch back to Full mode in the sidebar anytime to use
                          ChopBellyFull across phone, tablet, and desktop widths.
                        </p>
                      </div>
                    </div>

                    {viewMode === 'phone' ? (
                      <div className="flex flex-col items-center">
                        <IPhoneFrame
                          overlayStatusBar
                          statusBarTone={
                            activeScreen === 'menu' ? 'light' : 'dark'
                          }
                          isHighlighted
                        >
                          <SwipeableScreenDeck
                            activeScreen={activeScreen}
                            onChangeScreen={setActiveScreen}
                            screens={[
                              {
                                id: 'home',
                                label: 'Home',
                                node: homeScreenNode,
                              },
                              {
                                id: 'menu',
                                label: 'Menu',
                                node: menuScreenNode,
                              },
                              {
                                id: 'post',
                                label: 'Post',
                                node: postScreenNode,
                              },
                              {
                                id: 'orders',
                                label: 'Orders',
                                node: ordersScreenNode,
                              },
                              {
                                id: 'profile',
                                label: 'Profile',
                                node: profileScreenNode,
                              },
                            ]}
                          />
                        </IPhoneFrame>
                        <p className="mt-3 text-center text-xs font-medium text-text-secondary">
                          Tip: Swipe left or right inside the phone frame to
                          preview all 5 ChopBellyFull screens.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 items-start justify-items-center gap-8 xl:grid-cols-3">
                        <IPhoneFrame
                          title="01. Home Feed"
                          subtitle="Search, categories & food cards"
                        >
                          {homeScreenNode}
                        </IPhoneFrame>

                        <IPhoneFrame
                          title="02. Post Food"
                          subtitle="Photo upload, price & description"
                        >
                          {postScreenNode}
                        </IPhoneFrame>

                        <IPhoneFrame
                          title="03. Orders & Map"
                          subtitle="Pending, Accepted & Delivered"
                          overlayStatusBar
                          statusBarTone="dark"
                        >
                          {ordersScreenNode}
                        </IPhoneFrame>
                      </div>
                    )}
                  </div>
                </main>
              )}
            </div>

            {isDrawerOpen && (
              <div
                className="fixed inset-0 z-50 flex bg-text-primary/45 backdrop-blur-xs"
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
                    activeOrderCount={activeOrderCount}
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

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-4 bottom-20 left-4 z-50 mx-auto flex max-w-md items-center gap-2.5 rounded-[14px] bg-text-primary px-4 py-3 text-sm font-medium text-surface shadow-xl md:right-6 md:bottom-6 md:left-auto"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
