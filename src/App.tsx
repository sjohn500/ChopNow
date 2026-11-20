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
import { EmptyState } from './components/ui';
import { INITIAL_USER, RESTAURANTS } from './data/deliveryData';
import { signOut } from './lib/auth';
import { fetchRestaurants, loadSessionUser } from './lib/marketplace';
import {
  fetchMyOrders,
  isUuid,
  subscribeToOrderChanges,
  updateOrderStatusInDb,
} from './lib/orders';
import { startCheckout } from './lib/payments';
import {
  deleteDishFromDb,
  publishDishToDb,
  toggleDishAvailabilityInDb,
  updateKitchenDeliveryFeeInDb,
  updateMyKitchenInDb,
  updateMyProfileInDb,
} from './lib/seller';
import {
  ActiveOrder,
  AuthUser,
  CartEntry,
  DbOrderStatus,
  FoodCategoryKey,
  MenuItem,
  Restaurant,
  ScreenId,
  UserRole,
} from './types/delivery';

export default function App() {
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [user, setUser] = useState<AuthUser>(INITIAL_USER);
  const [location, setLocation] = useState<string>(
    INITIAL_USER.buyerArea || 'Eti-Osa, Lagos'
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const refreshOrders = useCallback(
    async (kitchenList: Restaurant[], buyerArea: string) => {
      try {
        const { orders: dbOrders, userId } = await fetchMyOrders(
          kitchenList,
          buyerArea
        );
        setCurrentUserId(userId);
        setOrders(dbOrders);
        setActiveOrderId((prev) =>
          prev && dbOrders.some((o) => o.id === prev)
            ? prev
            : (dbOrders[0]?.id ?? '')
        );
      } catch (err) {
        console.error('Failed to load orders:', err);
      }
    },
    []
  );

  const refreshRestaurants = useCallback(async () => {
    try {
      const realKitchens = await fetchRestaurants();
      setRestaurants(realKitchens);
      setSelectedRestaurantId((prev) =>
        realKitchens.some((r) => r.id === prev)
          ? prev
          : (realKitchens[0]?.id ?? '')
      );
      return realKitchens;
    } catch (err) {
      console.error('Failed to load kitchens:', err);
      setToast(
        err instanceof Error ? err.message : 'Could not load kitchens.'
      );
      return [] as Restaurant[];
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      const params = new URLSearchParams(window.location.search);
      const returnedOrderId = params.get('order');
      if (returnedOrderId) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      try {
        const [sessionUser, realKitchens] = await Promise.all([
          loadSessionUser(INITIAL_USER),
          fetchRestaurants().catch((err) => {
            console.error('Failed to load kitchens:', err);
            return [] as Restaurant[];
          }),
        ]);

        if (!active) return;

        setRestaurants(realKitchens);

        if (sessionUser) {
          const area = sessionUser.buyerArea || INITIAL_USER.buyerArea;
          setUser(sessionUser);
          setIsAuthenticated(true);
          setShowLanding(false);
          setShowAuth(false);
          setLocation(area);

          await refreshOrders(realKitchens, area);

          if (returnedOrderId) {
            setCart([]);
            setActiveOrderId(returnedOrderId);
            setActiveScreen('orders');
            setToast('Payment submitted! Watching your order status live.');
          } else if (
            sessionUser.role === 'seller' &&
            sessionUser.sellerRestaurantId
          ) {
            setSelectedRestaurantId(sessionUser.sellerRestaurantId);
            setActiveScreen('post');
          } else if (realKitchens[0]) {
            setSelectedRestaurantId(realKitchens[0].id);
          }
        } else if (realKitchens[0]) {
          setSelectedRestaurantId(realKitchens[0].id);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        if (active) setIsRestoringSession(false);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [refreshOrders]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;
    return subscribeToOrderChanges(currentUserId, () => {
      refreshOrders(restaurants, location);
    });
  }, [isAuthenticated, currentUserId, restaurants, location, refreshOrders]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedRestaurant =
    restaurants.find((r) => r.id === selectedRestaurantId) ?? restaurants[0];

  const activeOrder =
    orders.find((o) => o.id === activeOrderId) ?? orders[0];

  const activeOrderCount = orders.filter(
    (o) =>
      o.dbStatus !== 'completed' &&
      o.dbStatus !== 'cancelled' &&
      o.dbStatus !== 'refunded'
  ).length;

  function openAuthScreen(role: UserRole = 'buyer', message?: string) {
    setAuthInitialRole(role);
    setAuthPromptMessage(message ?? null);
    setShowLanding(false);
    setShowAuth(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleChangeLocation(nextLocation: string) {
    setLocation(nextLocation);
    setUser((prev) => ({ ...prev, buyerArea: nextLocation }));
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
    if (!isUuid(item.id) || !isUuid(restaurant.id)) {
      setToast('Sample kitchens cannot be ordered. Choose a real kitchen.');
      return;
    }
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

  function handleTrackKitchenLocation(_restaurant: Restaurant) {
    if (viewMode !== 'grid') {
      setActiveScreen('orders');
    }
  }

  function handleAddItem(item: MenuItem) {
    if (!isUuid(item.id)) {
      setToast('Sample dishes cannot be added to cart.');
      return;
    }
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

  async function handleStartPaystackCheckout(buyer: {
    name: string;
    phone: string;
    deliveryAddress: string;
  }) {
    if (cart.length === 0) return;

    const result = await startCheckout(
      cart.map((c) => ({ food_id: c.item.id, quantity: c.quantity })),
      buyer
    );

    window.location.href = result.authorization_url;
  }

  async function handleAdvanceOrderStatus(
    orderId: string,
    nextStatus: DbOrderStatus
  ) {
    await updateOrderStatusInDb(orderId, nextStatus);
    await refreshOrders(restaurants, location);
    setToast(`Order updated to ${nextStatus}.`);
  }

  function handleSelectOrder(order: ActiveOrder) {
    if (order.id) setActiveOrderId(order.id);
    if (viewMode !== 'grid') {
      setActiveScreen('orders');
    }
  }

  async function handleLogin(nextUser: AuthUser) {
    setIsAuthenticated(true);
    setUser(nextUser);
    const area = nextUser.buyerArea || location;
    if (nextUser.buyerArea) {
      setLocation(nextUser.buyerArea);
    }

    const realKitchens = await refreshRestaurants();
    await refreshOrders(realKitchens, area);

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
      `Welcome, ${nextUser.name}! Showing warm plates near ${area}.`
    );
  }

  async function handleLogout() {
    try {
      await signOut();
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : 'Could not sign out cleanly.'
      );
      return;
    }
    setIsAuthenticated(false);
    setCurrentUserId(null);
    setUser(INITIAL_USER);
    setCart([]);
    setOrders([]);
    setActiveOrderId('');
    setPendingTarget(null);
    setShowAuth(false);
    setShowLanding(true);
    setIsDrawerOpen(false);
    setToast('Signed out. Sign in anytime to order or post food.');
  }

  async function handleKitchenReady() {
    const refreshedUser = await loadSessionUser(user);
    if (refreshedUser) {
      setUser(refreshedUser);
      if (refreshedUser.sellerRestaurantId) {
        setSelectedRestaurantId(refreshedUser.sellerRestaurantId);
      }
    }
    await refreshRestaurants();
    setToast('Kitchen opened! Add your bank details next.');
  }

  async function handleUpdateProfile(
    nextUser: AuthUser,
    kitchenPatch?: {
      id: string;
      name: string;
      address: string;
      area: string;
      categoryKey: Exclude<FoodCategoryKey, 'all'>;
      deliveryFee: number;
    }
  ) {
    await updateMyProfileInDb({
      full_name: nextUser.name,
      phone: nextUser.phone,
      buyer_area: nextUser.buyerArea,
      buyer_landmark: nextUser.buyerLandmark,
      avatar_url: nextUser.avatarUrl,
    });

    if (kitchenPatch) {
      await updateMyKitchenInDb({
        business_name: kitchenPatch.name,
        address: kitchenPatch.address,
        area: kitchenPatch.area,
        category: kitchenPatch.categoryKey,
        delivery_fee_kobo: Math.round(kitchenPatch.deliveryFee * 100),
      });
    }

    setUser(nextUser);
    setLocation(nextUser.buyerArea);
    await refreshRestaurants();
    setToast('Profile and kitchen updated in database.');
  }

  async function handleUpdateDeliveryFee(feeNaira: number) {
    await updateKitchenDeliveryFeeInDb(feeNaira);
    await refreshRestaurants();
    setToast(
      feeNaira === 0
        ? 'Delivery fee set to Free.'
        : `Delivery fee updated to ₦${feeNaira.toLocaleString()}.`
    );
  }

  async function handlePublishDish(input: {
    name: string;
    description: string;
    price: number;
    category: MenuItem['category'];
    imageUrl: string;
    setAsCover: boolean;
  }) {
    const myKitchen = restaurants.find((r) => r.id === user.sellerRestaurantId);
    await publishDishToDb({
      name: input.name,
      description: input.description,
      priceNaira: input.price,
      category: input.category,
      photo: input.imageUrl,
      setAsCover: input.setAsCover,
      isFirstDish: (myKitchen?.menu.length ?? 0) === 0,
    });

    await refreshRestaurants();
    if (user.sellerRestaurantId) {
      setSelectedRestaurantId(user.sellerRestaurantId);
    }
    setToast(`${input.name} is now live on ChopBellyFull!`);
  }

  async function handleToggleDishAvailability(
    restaurantId: string,
    itemId: string
  ) {
    const restaurant = restaurants.find((r) => r.id === restaurantId);
    const dish = restaurant?.menu.find((m) => m.id === itemId);
    const nextAvailable = dish ? dish.isAvailable === false : false;
    try {
      await toggleDishAvailabilityInDb(itemId, nextAvailable);
      await refreshRestaurants();
      setToast(
        `Dish marked as ${nextAvailable ? 'Available' : 'Out of stock'}.`
      );
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : 'Could not update dish status.'
      );
    }
  }

  async function handleDeleteDish(_restaurantId: string, itemId: string) {
    try {
      await deleteDishFromDb(itemId);
      await refreshRestaurants();
      setToast('Dish removed from your kitchen.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not delete dish.');
    }
  }

  async function handleRefreshAll() {
    const latest = await refreshRestaurants();
    await refreshOrders(latest, location);
    setToast('Kitchens and orders refreshed.');
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
      onRefresh={handleRefreshAll}
      onNavigateScreen={setActiveScreen}
      activeOrderCount={activeOrderCount}
      overlayInset={viewMode === 'phone'}
      layoutMode={screenLayoutMode}
    />
  );

  const menuScreenNode = selectedRestaurant ? (
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
      onStartPaystackCheckout={handleStartPaystackCheckout}
      layoutMode={screenLayoutMode}
    />
  ) : (
    <div className="mx-auto max-w-xl px-4 py-12">
      <EmptyState
        emoji="🍲"
        title="No kitchen selected yet"
        description="Explore kitchens on the Home feed or post a dish from your kitchen."
        actionLabel="Browse Food"
        onAction={() => setActiveScreen('home')}
      />
    </div>
  );

  const postScreenNode = (
    <PostFoodScreen
      user={user}
      onKitchenReady={handleKitchenReady}
      onPublishDish={handlePublishDish}
      onUpdateDeliveryFee={handleUpdateDeliveryFee}
      onToggleDishAvailability={handleToggleDishAvailability}
      onDeleteDish={handleDeleteDish}
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
      currentUserId={currentUserId}
      onAdvanceStatus={handleAdvanceOrderStatus}
      onRefreshOrders={() => refreshOrders(restaurants, location)}
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
      onResetDemo={handleRefreshAll}
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

  if (isRestoringSession) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-sm font-medium text-text-secondary">
        Loading ChopBellyFull...
      </div>
    );
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
              restaurants={restaurants.length > 0 ? restaurants : RESTAURANTS}
              location={location}
              isAuthenticated={isAuthenticated}
              onEnterApp={handleEnterApp}
              onSelectRestaurant={(r) => {
                if (!isUuid(r.id)) {
                  handleEnterApp('home');
                } else {
                  handleSelectRestaurant(r);
                }
              }}
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
              promptMessage={authPromptMessage}
              onLogin={handleLogin}
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
            <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 border-r border-border-soft bg-bg lg:block">
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
                onResetDemo={handleRefreshAll}
              />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-30 border-b border-border-soft bg-bg/92 backdrop-blur-md lg:hidden">
                <div className="flex h-14 items-center justify-between gap-4 px-4">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open navigation sidebar"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary-soft text-text-primary shadow-xs transition-colors hover:bg-primary"
                  >
                    <Menu className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLanding(true)}
                    className="font-heading cursor-pointer text-lg font-bold tracking-tight text-text-primary"
                  >
                    Chop<span className="underline decoration-primary decoration-3 underline-offset-4">BellyFull</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveScreen('post')}
                    className="min-h-[38px] shrink-0 cursor-pointer rounded-full bg-primary px-4 text-xs font-semibold whitespace-nowrap text-text-primary shadow-xs transition-colors duration-200 hover:bg-primary-dark"
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
                            ? 'bg-primary text-text-primary shadow-xs'
                            : 'bg-primary-soft text-text-primary hover:bg-primary/35'
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
                          subtitle="Live Paystack & kitchen status"
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
                    onResetDemo={handleRefreshAll}
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
            className="fixed right-4 bottom-20 left-4 z-50 mx-auto flex max-w-md items-center gap-2.5 rounded-[14px] bg-text-primary px-4 py-3 text-sm font-medium text-bg shadow-xl md:right-6 md:bottom-6 md:left-auto"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}