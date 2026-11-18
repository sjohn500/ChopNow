import {
  ArrowLeft,
  Bike,
  Check,
  Clock,
  LocateFixed,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Star,
  Store,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import { formatNaira } from '../data/deliveryData';
import { ActiveOrder, ScreenId, TrackingStage } from '../types/delivery';
import { MobileBottomNav } from './MobileBottomNav';
import { PlateImage } from './PlateImage';
import { Badge, BadgeVariant, Button, Card, EmptyState, Input } from './ui';

interface OrderTrackingScreenProps {
  order: ActiveOrder;
  orders: ActiveOrder[];
  onChangeStage: (stage: TrackingStage) => void;
  onSelectOrder?: (order: ActiveOrder) => void;
  onNavigateScreen: (screen: ScreenId) => void;
  onBackHome: () => void;
  layoutMode?: 'frame' | 'responsive';
}

const STAGES: {
  key: TrackingStage;
  label: string;
  badgeVariant: BadgeVariant;
  description: string;
}[] = [
  {
    key: 'pending',
    label: 'Pending',
    badgeVariant: 'pending',
    description: 'Waiting for kitchen confirmation',
  },
  {
    key: 'accepted',
    label: 'Accepted',
    badgeVariant: 'accepted',
    description: 'Kitchen accepted & preparing your food',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    badgeVariant: 'delivered',
    description: 'Order delivered to your landmark',
  },
];

type MapFocus = 'route' | 'kitchen' | 'dropoff';

export function getOrderBadge(stage: TrackingStage): {
  label: string;
  variant: BadgeVariant;
} {
  if (stage === 'pending') return { label: 'Pending', variant: 'pending' };
  if (stage === 'accepted') return { label: 'Accepted', variant: 'accepted' };
  return { label: 'Delivered', variant: 'delivered' };
}

export function OrderTrackingScreen({
  order,
  orders,
  onChangeStage,
  onSelectOrder,
  onNavigateScreen,
  onBackHome,
  layoutMode = 'frame',
}: OrderTrackingScreenProps) {
  const [mapFocus, setMapFocus] = useState<MapFocus>('route');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'rider',
      text: `How far! I don pick your food from ${order.restaurantName}. I dey come ${order.destination}.`,
      time: '1:14 PM',
    },
  ]);

  const isResponsive = layoutMode === 'responsive';
  const stageIndex = Math.max(
    0,
    STAGES.findIndex((s) => s.key === order.stage)
  );
  const currentBadge = getOrderBadge(order.stage);

  const riderCoords =
    order.stage === 'pending'
      ? { x: 82, y: 175 }
      : order.stage === 'accepted'
        ? { x: 185, y: 130 }
        : { x: 294, y: 86 };

  const mapTransform =
    mapFocus === 'kitchen'
      ? 'scale-125 origin-bottom-left'
      : mapFocus === 'dropoff'
        ? 'scale-125 origin-top-right'
        : 'scale-100 origin-center';

  function handleSendChat(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: 'buyer', text: chatInput.trim(), time: 'Just now' },
    ]);
    setChatInput('');
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
                Order summary, live kitchen route, and status badges
              </p>
            </div>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={onBackHome}>
            Order Another Plate
          </Button>
        </div>

        <div className={isResponsive ? 'grid grid-cols-1 gap-6 lg:grid-cols-12' : 'space-y-5'}>
          <div className={isResponsive ? 'space-y-5 lg:col-span-6' : 'space-y-4'}>
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
                      Estimated Arrival
                    </p>
                    <p className="font-heading tabular-nums-clean text-xl font-bold text-text-primary">
                      {order.stage === 'delivered' ? 'Delivered' : order.etaMinutes}
                    </p>
                  </div>

                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={order.stage}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.18 }}
                      >
                        {order.stage === 'pending' ? (
                          <Clock className="h-5 w-5" />
                        ) : order.stage === 'accepted' ? (
                          <Bike className="h-5 w-5" />
                        ) : (
                          <Check className="h-5 w-5 text-success" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {STAGES.map((step, idx) => {
                    const reached = idx <= stageIndex;
                    const activeColor =
                      order.stage === 'delivered'
                        ? 'bg-success'
                        : order.stage === 'accepted'
                          ? 'bg-primary'
                          : 'bg-accent';
                    return (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => onChangeStage(step.key)}
                        className="cursor-pointer text-left focus:outline-none"
                      >
                        <div
                          className={`h-2 w-full rounded-full transition-colors duration-200 ${
                            reached ? activeColor : 'bg-border-soft'
                          }`}
                        />
                        <span
                          className={`mt-1.5 block text-xs font-semibold ${
                            reached ? 'text-text-primary' : 'text-text-secondary/65'
                          }`}
                        >
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
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
                    Drop-off: {order.destination} ({order.distanceKm} km)
                  </span>
                </p>
              </div>
            </Card>

            <Card padding="sm" className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary-soft">
                  <PlateImage
                    src={order.rider.avatarUrl}
                    alt={order.rider.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-heading truncate text-sm font-bold text-text-primary">
                      {order.rider.name}
                    </p>
                    <span className="tabular-nums-clean inline-flex items-center gap-0.5 text-xs font-bold text-text-primary">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {order.rider.rating}
                    </span>
                  </div>
                  <p className="truncate text-xs text-text-secondary">
                    {order.rider.vehicle}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="Message rider"
                  onClick={() => setIsChatOpen(true)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary-soft text-primary transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Call rider"
                  onClick={() => setIsCallActive(true)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-soft transition-colors hover:bg-primary-dark active:scale-95"
                >
                  <Phone className="h-4 w-4" />
                </button>
              </div>
            </Card>

            {orders.length > 0 ? (
              <div className="space-y-2.5">
                <h3 className="font-heading text-sm font-bold text-text-primary">
                  Recent Order History ({orders.length})
                </h3>
                {orders.map((item) => {
                  const badge = getOrderBadge(item.stage);
                  const isCurrent = item.code === order.code;
                  return (
                    <Card
                      key={item.code}
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
            ) : (
              <EmptyState
                emoji="🛍️"
                title="No orders placed yet"
                description="Explore fresh local plates on ChopBellyFull and place your first order."
                actionLabel="Browse Food"
                onAction={onBackHome}
              />
            )}
          </div>

          <div className={isResponsive ? 'lg:col-span-6' : ''}>
            <Card padding="none" className="relative h-[320px] overflow-hidden md:h-[460px]">
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

      {isCallActive && (
        <div
          className={`${
            isResponsive ? 'fixed' : 'absolute'
          } inset-0 z-50 flex flex-col items-center justify-between bg-text-primary/95 px-6 py-16 text-white backdrop-blur-md`}
        >
          <div className="text-center">
            <Badge variant="mango">Connecting Masked Call</Badge>
            <div className="mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full ring-4 ring-primary/40">
              <PlateImage
                src={order.rider.avatarUrl}
                alt={order.rider.name}
                className="h-full w-full"
              />
            </div>
            <h3 className="font-heading mt-4 text-xl font-bold">
              {order.rider.name}
            </h3>
            <p className="tabular-nums-clean mt-1 text-sm text-primary-soft">
              {order.rider.phone}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCallActive(false)}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-error text-white shadow-lg"
            aria-label="End call"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {isChatOpen && (
        <div
          className={
            isResponsive
              ? 'fixed inset-0 z-50 flex items-end justify-center bg-text-primary/45 backdrop-blur-[2px] md:items-center md:p-4'
              : 'absolute inset-0 z-40 flex items-end bg-text-primary/45 backdrop-blur-[2px]'
          }
        >
          <div
            className={
              isResponsive
                ? 'flex h-[68dvh] w-full flex-col rounded-t-[20px] bg-surface p-4 pb-6 shadow-2xl md:h-[500px] md:max-w-md md:rounded-[16px]'
                : 'flex h-[68%] w-full flex-col rounded-t-[20px] bg-surface p-4 pb-6'
            }
          >
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <div>
                <h3 className="font-heading text-sm font-bold text-text-primary">
                  Chat with {order.rider.name}
                </h3>
                <p className="text-xs font-semibold text-primary">
                  Order #{order.code}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setIsChatOpen(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-bg text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto py-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`max-w-[82%] rounded-[14px] px-3.5 py-2.5 text-xs ${
                    m.sender === 'buyer'
                      ? 'ml-auto bg-primary text-white'
                      : 'bg-bg text-text-primary'
                  }`}
                >
                  <p>{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2">
              <Input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message rider (e.g. Call at the gate)..."
              />
              <Button
                type="submit"
                size="md"
                aria-label="Send message"
                className="px-3.5"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
