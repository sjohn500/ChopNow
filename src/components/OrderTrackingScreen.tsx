import {
  ArrowLeft,
  Bike,
  Check,
  Clock,
  LocateFixed,
  MapPin,
  RefreshCw,
  Store,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { formatNaira } from '../data/deliveryData';
import {
  ActiveOrder,
  DbOrderStatus,
  ScreenId,
  TrackingStage,
} from '../types/delivery';
import { MobileBottomNav } from './MobileBottomNav';
import { PlateImage } from './PlateImage';
import { Badge, BadgeVariant, Button, Card, EmptyState } from './ui';

interface OrderTrackingScreenProps {
  order?: ActiveOrder;
  orders: ActiveOrder[];
  currentUserId: string | null;
  onAdvanceStatus: (orderId: string, nextStatus: DbOrderStatus) => Promise<void>;
  onRefreshOrders: () => Promise<void>;
  onSelectOrder?: (order: ActiveOrder) => void;
  onNavigateScreen: (screen: ScreenId) => void;
  onBackHome: () => void;
  layoutMode?: 'frame' | 'responsive';
}

const PROGRESS_STEPS: {
  key: DbOrderStatus;
  label: string;
}[] = [
  { key: 'paid', label: 'Paid' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'delivered', label: 'Delivered' },
];

type MapFocus = 'route' | 'kitchen' | 'dropoff';

export function getOrderBadge(
  status: TrackingStage | DbOrderStatus
): {
  label: string;
  variant: BadgeVariant;
} {
  switch (status) {
    case 'pending_payment':
      return { label: 'Confirming Payment', variant: 'pending' };
    case 'paid':
    case 'pending':
      return { label: 'Paid · Waiting', variant: 'pending' };
    case 'accepted':
      return { label: 'Accepted', variant: 'accepted' };
    case 'preparing':
      return { label: 'Preparing', variant: 'accepted' };
    case 'delivered':
      return { label: 'Delivered', variant: 'delivered' };
    case 'completed':
      return { label: 'Completed', variant: 'success' };
    case 'cancelled':
      return { label: 'Cancelled', variant: 'error' };
    case 'refunded':
      return { label: 'Refunded', variant: 'error' };
  }
}

function stepIndexForStatus(status: DbOrderStatus): number {
  switch (status) {
    case 'paid':
      return 0;
    case 'accepted':
      return 1;
    case 'preparing':
      return 2;
    case 'delivered':
    case 'completed':
      return 3;
    default:
      return -1;
  }
}

export function OrderTrackingScreen({
  order,
  orders,
  currentUserId,
  onAdvanceStatus,
  onRefreshOrders,
  onSelectOrder,
  onNavigateScreen,
  onBackHome,
  layoutMode = 'frame',
}: OrderTrackingScreenProps) {
  const [mapFocus, setMapFocus] = useState<MapFocus>('route');
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState('');

  const isResponsive = layoutMode === 'responsive';

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onRefreshOrders();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleNextStatus(orderId: string, nextStatus: DbOrderStatus) {
    if (updatingStatus) return;
    setActionError('');
    setUpdatingStatus(true);
    try {
      await onAdvanceStatus(orderId, nextStatus);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not update order status.'
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (!order) {
    return (
      <div className="relative flex h-full flex-col bg-bg">
        <div
          className={`no-scrollbar flex-1 overflow-y-auto ${
            isResponsive
              ? 'mx-auto w-full max-w-4xl px-4 pt-5 pb-24 md:px-6 md:pt-8 md:pb-12'
              : 'px-4 pt-12 pb-24'
          }`}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBackHome}
                aria-label="Back to home feed"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-text-primary shadow-soft"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="font-heading text-xl font-bold text-text-primary md:text-2xl">
                  My Orders
                </h1>
                <p className="text-xs text-text-secondary">
                  Live order status updates automatically
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh orders"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-text-primary shadow-soft"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : ''}`}
              />
            </button>
          </div>

          <EmptyState
            emoji="🛍️"
            title="No orders placed yet"
            description="Explore fresh local plates on ChopBellyFull and pay securely with Paystack."
            actionLabel="Browse Food"
            onAction={onBackHome}
          />
        </div>

        <MobileBottomNav
          activeNav="orders"
          onSelect={(nav) => {
            if (nav === 'home' || nav === 'search') onNavigateScreen('home');
            if (nav === 'post') onNavigateScreen('post');
            if (nav === 'orders') onNavigateScreen('orders');
            if (nav === 'profile') onNavigateScreen('profile');
          }}
          orderCount={orders.length}
          className={`absolute right-0 bottom-0 left-0 ${
            isResponsive ? 'md:hidden' : ''
          }`}
        />
      </div>
    );
  }

  const dbStatus: DbOrderStatus = order.dbStatus ?? 'paid';
  const stepIndex = stepIndexForStatus(dbStatus);
  const currentBadge = getOrderBadge(dbStatus);
  const isSeller = Boolean(currentUserId && order.sellerId === currentUserId);
  const isBuyer = Boolean(currentUserId && order.buyerId === currentUserId);

  const riderCoords =
    dbStatus === 'pending_payment' || dbStatus === 'paid'
      ? { x: 82, y: 175 }
      : dbStatus === 'accepted' || dbStatus === 'preparing'
        ? { x: 185, y: 130 }
        : { x: 294, y: 86 };

  const mapTransform =
    mapFocus === 'kitchen'
      ? 'scale-125 origin-bottom-left'
      : mapFocus === 'dropoff'
        ? 'scale-125 origin-top-right'
        : 'scale-100 origin-center';

  let nextAction: { label: string; status: DbOrderStatus } | null = null;
  if (isSeller) {
    if (dbStatus === 'paid') nextAction = { label: 'Accept Order', status: 'accepted' };
    else if (dbStatus === 'accepted')
      nextAction = { label: 'Start Preparing', status: 'preparing' };
    else if (dbStatus === 'preparing')
      nextAction = { label: 'Mark as Delivered', status: 'delivered' };
  } else if (isBuyer && dbStatus === 'delivered') {
    nextAction = { label: 'Confirm Order Completed', status: 'completed' };
  }

  return (
    <div
      className={`relative flex h-full flex-col bg-bg ${
        isResponsive ? 'overflow-y-auto' : ''
      }`}
    >
      <div
        className={`no-scrollbar flex-1 overflow-y-auto ${
          isResponsive
            ? 'mx-auto w-full max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-8 md:pb-12 lg:px-8'
            : 'px-4 pt-12 pb-24'
        }`}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              aria-label="Back to home feed"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-text-primary shadow-soft transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-heading text-xl font-bold text-text-primary md:text-2xl">
                My Orders
              </h1>
              <p className="text-xs text-text-secondary">
                Live order tracking · updates automatically
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh orders"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-text-primary shadow-soft"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : ''}`}
              />
            </button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onBackHome}
            >
              Order Another Plate
            </Button>
          </div>
        </div>

        <div
          className={
            isResponsive ? 'grid grid-cols-1 gap-6 lg:grid-cols-12' : 'space-y-5'
          }
        >
          <div
            className={
              isResponsive ? 'space-y-5 lg:col-span-6' : 'space-y-4'
            }
          >
            <Card padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3.5">
                  <div className="h-18 w-18 shrink-0 overflow-hidden rounded-[12px] bg-primary-soft">
                    <PlateImage
                      src={
                        order.plateImageUrl ??
                        '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg'
                      }
                      alt={order.itemsSummary}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tabular-nums-clean text-xs font-bold text-text-secondary">
                        #{order.code}
                      </span>
                      <Badge variant={currentBadge.variant}>
                        {currentBadge.label}
                      </Badge>
                      {isSeller && <Badge variant="peach">Incoming Order</Badge>}
                    </div>
                    <h2 className="font-heading mt-1 truncate text-base font-bold text-text-primary">
                      {order.restaurantName}
                    </h2>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
                      {order.itemsSummary}
                    </p>
                  </div>
                </div>

                <span className="tabular-nums-clean font-heading shrink-0 text-base font-bold text-primary">
                  {formatNaira(order.totalAmount)}
                </span>
              </div>

              <div className="mt-4 rounded-[14px] bg-bg p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-text-secondary">
                      Order Status
                    </p>
                    <p className="font-heading tabular-nums-clean text-xl font-bold text-text-primary">
                      {order.etaMinutes}
                    </p>
                  </div>

                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={dbStatus}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.18 }}
                      >
                        {dbStatus === 'pending_payment' || dbStatus === 'paid' ? (
                          <Clock className="h-5 w-5" />
                        ) : dbStatus === 'accepted' || dbStatus === 'preparing' ? (
                          <Bike className="h-5 w-5" />
                        ) : (
                          <Check className="h-5 w-5 text-success" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {PROGRESS_STEPS.map((step, idx) => {
                    const reached = stepIndex >= idx;
                    const activeColor =
                      dbStatus === 'completed' || dbStatus === 'delivered'
                        ? 'bg-success'
                        : 'bg-primary';
                    return (
                      <div key={step.key}>
                        <div
                          className={`h-2 w-full rounded-full transition-colors duration-200 ${
                            reached ? activeColor : 'bg-border-soft'
                          }`}
                        />
                        <span
                          className={`mt-1.5 block text-[11px] font-semibold ${
                            reached
                              ? 'text-text-primary'
                              : 'text-text-secondary/65'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {dbStatus === 'pending_payment' && (
                  <p className="mt-3 text-xs text-text-secondary">
                    Waiting for Paystack to confirm your payment. This screen
                    updates automatically once confirmed.
                  </p>
                )}

                {actionError && (
                  <p className="mt-3 rounded-[10px] bg-error/10 px-3 py-2 text-xs font-semibold text-error">
                    {actionError}
                  </p>
                )}

                {nextAction && order.id && (
                  <Button
                    type="button"
                    fullWidth
                    size="md"
                    className="mt-3"
                    disabled={updatingStatus}
                    onClick={() =>
                      handleNextStatus(order.id!, nextAction!.status)
                    }
                  >
                    {updatingStatus ? 'Updating...' : nextAction.label}
                  </Button>
                )}
              </div>

              <div className="mt-4 space-y-2 border-t border-border-soft pt-3 text-xs">
                <p className="flex items-center gap-2 font-medium text-text-primary">
                  <Store className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">
                    {order.restaurantName} · {order.restaurantAddress}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-text-secondary">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">
                    Drop-off: {order.destination}
                    {order.buyerName ? ` (${order.buyerName})` : ''}
                  </span>
                </p>
              </div>
            </Card>

            <div className="space-y-2.5">
              <h3 className="font-heading text-sm font-bold text-text-primary">
                Order History ({orders.length})
              </h3>
              {orders.map((item) => {
                const badge = getOrderBadge(item.dbStatus ?? item.stage);
                const isCurrent = item.id === order.id;
                return (
                  <Card
                    key={item.id ?? item.code}
                    padding="sm"
                    className={`cursor-pointer transition-all duration-150 ${
                      isCurrent ? 'ring-2 ring-primary/40' : ''
                    }`}
                    onClick={() => onSelectOrder?.(item)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums-clean text-xs font-bold text-text-secondary">
                            #{item.code}
                          </span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-text-primary">
                          {item.restaurantName}
                        </p>
                        <p className="truncate text-xs text-text-secondary">
                          {item.itemsSummary}
                        </p>
                      </div>
                      <span className="tabular-nums-clean font-heading shrink-0 text-sm font-bold text-primary">
                        {formatNaira(item.totalAmount)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className={isResponsive ? 'lg:col-span-6' : ''}>
            <Card
              padding="none"
              className="relative h-[320px] overflow-hidden md:h-[460px]"
            >
              <svg
                viewBox="0 0 375 290"
                preserveAspectRatio="xMidYMid slice"
                className={`h-full w-full transition-transform duration-300 ${mapTransform}`}
                aria-label="Live seller location and delivery route map"
              >
                <rect width="375" height="290" fill="#FFF8F3" />

                <rect x="22" y="25" width="76" height="58" rx="10" fill="#FFE3DA" />
                <rect x="115" y="18" width="98" height="65" rx="10" fill="#FFE3DA" />
                <rect x="230" y="26" width="115" height="54" rx="10" fill="#FFE3DA" />
                <rect x="26" y="102" width="82" height="72" rx="10" fill="#F1E4DC" />
                <rect x="132" y="102" width="88" height="68" rx="10" fill="#FFE3DA" />
                <rect x="242" y="98" width="102" height="76" rx="10" fill="#F1E4DC" />
                <rect x="34" y="192" width="115" height="70" rx="10" fill="#FFE3DA" />
                <rect x="172" y="192" width="165" height="68" rx="10" fill="#FFE3DA" />

                <path
                  d="M0 92 H375 M0 182 H375 M108 0 V290 M222 0 V290"
                  stroke="#FFFFFF"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M0 92 H375 M0 182 H375 M108 0 V290 M222 0 V290"
                  stroke="#F1E4DC"
                  strokeWidth="1"
                />

                <text
                  x="118"
                  y="88"
                  fill="#6B6B6B"
                  fontSize="8"
                  fontWeight="600"
                  letterSpacing="0.5"
                >
                  {order.restaurantArea.toUpperCase()}
                </text>

                <path
                  d="M 82 175 C 122 172, 136 135, 185 130 C 228 125, 250 96, 294 86"
                  fill="none"
                  stroke="#FF6F61"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="7 6"
                />

                <g transform="translate(82, 175)">
                  <circle r="13" fill="#2B2B2B" />
                  <circle r="5" fill="#FFFFFF" />
                  <rect
                    x="-38"
                    y="18"
                    width="98"
                    height="18"
                    rx="9"
                    fill="#FFFFFF"
                  />
                  <text
                    x="11"
                    y="30"
                    textAnchor="middle"
                    fill="#2B2B2B"
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    {order.restaurantName.slice(0, 16)}
                  </text>
                </g>

                <g transform="translate(294, 86)">
                  <circle r="15" fill="#2E9E6B" fillOpacity="0.18" />
                  <circle r="9" fill="#2E9E6B" />
                  <circle r="3.5" fill="#FFFFFF" />
                  <rect
                    x="-44"
                    y="-32"
                    width="76"
                    height="18"
                    rx="9"
                    fill="#2B2B2B"
                  />
                  <text
                    x="-6"
                    y="-20"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    Your Drop-off
                  </text>
                </g>

                <motion.g
                  initial={false}
                  animate={{ x: riderCoords.x, y: riderCoords.y }}
                  transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                >
                  <circle
                    r="12"
                    fill="#FF6F61"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                </motion.g>
              </svg>

              <div className="pointer-events-none absolute top-3.5 right-3.5 left-3.5 flex items-center justify-between">
                <div className="pointer-events-auto rounded-full bg-surface/95 px-3 py-1.5 text-xs font-bold text-text-primary shadow-soft backdrop-blur-xs">
                  <span className="tabular-nums-clean">
                    {order.distanceKm} km route
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMapFocus('route')}
                  aria-label="Recenter map"
                  className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface text-primary shadow-soft"
                >
                  <LocateFixed className="h-4 w-4" />
                </button>
              </div>

              <div className="absolute right-3.5 bottom-3.5 left-3.5 flex justify-center gap-1.5">
                {(
                  [
                    { id: 'route', label: 'Full Route' },
                    { id: 'kitchen', label: 'Kitchen' },
                    { id: 'dropoff', label: 'Drop-off' },
                  ] as const
                ).map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setMapFocus(btn.id)}
                    className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                      mapFocus === btn.id
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-primary hover:bg-primary-soft'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <MobileBottomNav
        activeNav="orders"
        onSelect={(nav) => {
          if (nav === 'home' || nav === 'search') onNavigateScreen('home');
          if (nav === 'post') onNavigateScreen('post');
          if (nav === 'orders') onNavigateScreen('orders');
          if (nav === 'profile') onNavigateScreen('profile');
        }}
        orderCount={orders.length}
        className={`absolute right-0 bottom-0 left-0 ${
          isResponsive ? 'md:hidden' : ''
        }`}
      />
    </div>
  );
}