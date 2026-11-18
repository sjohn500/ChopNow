import {
  ArrowLeft,
  Bike,
  Check,
  ChefHat,
  LocateFixed,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Star,
  Store,
  X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { formatNaira } from '../data/deliveryData';
import { ActiveOrder, TrackingStage } from '../types/delivery';
import { PlateImage } from './PlateImage';

interface OrderTrackingScreenProps {
  order: ActiveOrder;
  onChangeStage: (stage: TrackingStage) => void;
  onBackHome: () => void;
  layoutMode?: 'frame' | 'responsive';
}

const STAGES: {
  key: TrackingStage;
  label: string;
}[] = [
  { key: 'confirmed', label: 'Order Received' },
  { key: 'preparing', label: 'Inside Kitchen' },
  { key: 'on_the_way', label: 'Rider Don Dey Come' },
];

type MapFocus = 'route' | 'kitchen' | 'dropoff';

export function OrderTrackingScreen({
  order,
  onChangeStage,
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
  const stageIndex = STAGES.findIndex((s) => s.key === order.stage);

  const riderCoords =
    order.stage === 'confirmed'
      ? { x: 82, y: 175 }
      : order.stage === 'preparing'
        ? { x: 145, y: 145 }
        : { x: 238, y: 108 };

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
      className={`relative flex h-full flex-col bg-[#FAF6F1] ${
        isResponsive ? 'overflow-y-auto md:block' : ''
      }`}
    >
      <div
        className={
          isResponsive
            ? 'mx-auto flex h-full w-full max-w-6xl flex-col md:h-auto md:px-6 md:py-6 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-6 lg:px-8'
            : 'flex h-full flex-col'
        }
      >
        <div
          className={`relative w-full overflow-hidden bg-[#F4E8D6] ${
            isResponsive
              ? 'h-[44%] shrink-0 md:h-[360px] md:rounded-[24px] md:shadow-[0px_8px_24px_rgba(30,25,22,0.06)] lg:col-span-7 lg:h-auto lg:min-h-[500px]'
              : 'h-[44%]'
          }`}
        >
          <svg
            viewBox="0 0 375 290"
            preserveAspectRatio="xMidYMid slice"
            className={`h-full w-full transition-transform duration-300 ${mapTransform}`}
            aria-label="Live seller location and delivery route map"
          >
            <rect width="375" height="290" fill="#F4E8D6" />

            <rect x="22" y="25" width="76" height="58" rx="10" fill="#E8D5B7" />
            <rect
              x="115"
              y="18"
              width="98"
              height="65"
              rx="10"
              fill="#E8D5B7"
            />
            <rect
              x="230"
              y="26"
              width="115"
              height="54"
              rx="10"
              fill="#E8D5B7"
            />
            <rect
              x="26"
              y="102"
              width="82"
              height="72"
              rx="10"
              fill="#EADAC0"
            />
            <rect
              x="132"
              y="102"
              width="88"
              height="68"
              rx="10"
              fill="#E5D8C1"
            />
            <rect
              x="242"
              y="98"
              width="102"
              height="76"
              rx="10"
              fill="#E8D5B7"
            />
            <rect
              x="34"
              y="192"
              width="115"
              height="70"
              rx="10"
              fill="#E8D5B7"
            />
            <rect
              x="172"
              y="192"
              width="165"
              height="68"
              rx="10"
              fill="#E8D5B7"
            />

            <path
              d="M0 92 H375 M0 182 H375 M108 0 V290 M222 0 V290"
              stroke="#FAF6F1"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M0 92 H375 M0 182 H375 M108 0 V290 M222 0 V290"
              stroke="#E6DDD3"
              strokeWidth="1"
            />

            <text
              x="120"
              y="88"
              fill="#5C5049"
              fontSize="8"
              fontWeight="600"
              letterSpacing="0.5"
            >
              {order.restaurantArea.toUpperCase()}
            </text>

            <path
              d="M 82 175 C 122 172, 136 135, 185 130 C 228 125, 250 96, 294 86"
              fill="none"
              stroke="#D9232E"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="7 6"
            />

            <g transform="translate(82, 175)">
              <circle r="13" fill="#1E1916" />
              <circle r="5" fill="#FAF6F1" />
              <rect
                x="-38"
                y="18"
                width="98"
                height="18"
                rx="9"
                fill="#FFFFFF"
                fillOpacity="0.96"
              />
              <text
                x="11"
                y="30"
                textAnchor="middle"
                fill="#1E1916"
                fontSize="8.5"
                fontWeight="700"
              >
                {order.restaurantName.slice(0, 16)}
              </text>
            </g>

            <g transform="translate(294, 86)">
              <circle r="15" fill="#9E141D" fillOpacity="0.18" />
              <circle r="9" fill="#9E141D" />
              <circle r="3.5" fill="#FAF6F1" />
              <rect
                x="-44"
                y="-32"
                width="76"
                height="18"
                rx="9"
                fill="#1E1916"
              />
              <text
                x="-6"
                y="-20"
                textAnchor="middle"
                fill="#FAF6F1"
                fontSize="8.5"
                fontWeight="700"
              >
                Your Drop-off
              </text>
            </g>

            <g
              transform={`translate(${riderCoords.x}, ${riderCoords.y})`}
              className="transition-transform duration-500"
            >
              <circle r="17" fill="#D9232E" fillOpacity="0.2" />
              <circle
                r="12"
                fill="#D9232E"
                stroke="#FAF6F1"
                strokeWidth="2.5"
              />
            </g>
          </svg>

          <div
            className={`pointer-events-none absolute right-4 left-4 flex items-center justify-between ${
              isResponsive ? 'top-4' : 'top-11'
            }`}
          >
            <button
              type="button"
              onClick={onBackHome}
              aria-label="Back to home"
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1E1916] shadow-md transition-transform active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="pointer-events-auto rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#1E1916] shadow-md backdrop-blur-xs">
              <span className="tabular-nums-clean">
                #{order.code} · {order.distanceKm} km route
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMapFocus('route')}
              aria-label="Recenter full route"
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1E1916] shadow-md transition-transform active:scale-95"
            >
              <LocateFixed className="h-4 w-4 text-[#D9232E]" />
            </button>
          </div>

          <div
            className={`absolute right-4 left-4 flex justify-center gap-1.5 ${
              isResponsive ? 'bottom-7 md:bottom-4' : 'bottom-7'
            }`}
          >
            {(
              [
                { id: 'route', label: 'Full Route' },
                { id: 'kitchen', label: 'Seller Kitchen' },
                { id: 'dropoff', label: 'Drop-off' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setMapFocus(btn.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold shadow-xs transition-colors ${
                  mapFocus === btn.id
                    ? 'bg-[#1E1916] text-[#FAF6F1]'
                    : 'bg-white/95 text-[#1E1916]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`relative z-10 flex flex-1 flex-col justify-between bg-white px-5 pt-4 pb-6 ${
            isResponsive
              ? '-mt-5 rounded-t-[24px] shadow-[0_-8px_24px_rgba(30,25,22,0.08)] md:mt-5 md:rounded-[24px] md:p-6 md:shadow-[0px_8px_24px_rgba(30,25,22,0.06)] lg:col-span-5 lg:mt-0'
              : '-mt-5 rounded-t-[24px] shadow-[0_-8px_24px_rgba(30,25,22,0.08)]'
          }`}
        >
          <div>
            <div
              className={`mx-auto mb-2.5 h-1 w-10 rounded-full bg-[#E6DDD3] ${
                isResponsive ? 'md:hidden' : ''
              }`}
            />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#D9232E]">
                  {STAGES[stageIndex]?.label}
                </p>
                <h2 className="font-display tabular-nums-clean mt-0.5 text-2xl font-extrabold tracking-tight text-[#1E1916] md:text-3xl">
                  {order.etaMinutes}
                </h2>
                <p className="tabular-nums-clean text-xs text-[#5C5049]">
                  Arriving by {order.arrivalTime}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F4E8D6] text-[#D9232E]">
                {order.stage === 'preparing' ? (
                  <ChefHat className="h-5 w-5" />
                ) : order.stage === 'confirmed' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Bike className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {STAGES.map((step, idx) => {
                const reached = idx <= stageIndex;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => onChangeStage(step.key)}
                    className="text-left focus:outline-none"
                  >
                    <div
                      className={`h-2 w-full rounded-full transition-colors ${
                        reached ? 'bg-[#D9232E]' : 'bg-[#E8D5B7]'
                      }`}
                    />
                    <span
                      className={`mt-1.5 block text-[10px] leading-tight font-semibold md:text-[11px] ${
                        reached ? 'text-[#1E1916]' : 'text-[#5C5049]/65'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] p-3.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[#1E1916]">
                  <Store className="h-3.5 w-3.5 shrink-0 text-[#D9232E]" />
                  <span className="truncate">
                    {order.restaurantName} · {order.restaurantAddress}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[#5C5049]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#C85A32]" />
                  <span className="truncate">{order.destination}</span>
                </span>
                <span className="tabular-nums-clean shrink-0 font-bold text-[#1E1916]">
                  {formatNaira(order.totalAmount)}
                </span>
              </div>
              {order.itemsSummary && (
                <p className="border-t border-[#E6DDD3] pt-2 text-[11px] text-[#5C5049]">
                  {order.itemsSummary}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-[#F4E8D6]/70 p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#E8D5B7]">
                <PlateImage
                  src={order.rider.avatarUrl}
                  alt={order.rider.name}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-display truncate text-sm font-bold text-[#1E1916]">
                    {order.rider.name}
                  </p>
                  <span className="tabular-nums-clean inline-flex items-center gap-0.5 text-[11px] font-bold text-[#1E1916]">
                    <Star className="h-3 w-3 fill-[#D99B26] text-[#D99B26]" />
                    {order.rider.rating}
                  </span>
                </div>
                <p className="truncate text-[11px] text-[#5C5049]">
                  {order.rider.vehicle}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="WhatsApp or in-app chat with rider"
                onClick={() => setIsChatOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6DDD3] bg-white text-[#1E1916] shadow-xs transition-transform active:scale-95"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
              </button>
              <button
                type="button"
                aria-label="Call rider"
                onClick={() => setIsCallActive(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D9232E] text-white shadow-xs transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
              >
                <Phone className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCallActive && (
        <div
          className={`${
            isResponsive ? 'fixed' : 'absolute'
          } inset-0 z-50 flex flex-col items-center justify-between bg-[#1E1916]/95 px-6 py-16 text-[#FAF6F1] backdrop-blur-md`}
        >
          <div className="text-center">
            <p className="text-xs font-semibold tracking-wide text-[#D99B26]">
              Connecting Masked Call
            </p>
            <div className="mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full ring-4 ring-[#F4E8D6]/20">
              <PlateImage
                src={order.rider.avatarUrl}
                alt={order.rider.name}
                className="h-full w-full"
              />
            </div>
            <h3 className="font-display mt-4 text-xl font-bold">
              {order.rider.name}
            </h3>
            <p className="tabular-nums-clean mt-1 text-sm text-[#E8D5B7]">
              {order.rider.phone}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCallActive(false)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D9232E] text-white shadow-lg active:bg-[#9E141D]"
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
              ? 'fixed inset-0 z-50 flex items-end justify-center bg-[#1E1916]/45 backdrop-blur-[1px] md:items-center md:p-4'
              : 'absolute inset-0 z-30 flex items-end bg-[#1E1916]/45 backdrop-blur-[1px]'
          }
        >
          <div
            className={
              isResponsive
                ? 'flex h-[68dvh] w-full flex-col rounded-t-[24px] bg-white p-4 pb-6 shadow-2xl md:h-[500px] md:max-w-md md:rounded-[24px]'
                : 'flex h-[68%] w-full flex-col rounded-t-[24px] bg-white p-4 pb-6'
            }
          >
            <div className="flex items-center justify-between border-b border-[#E6DDD3] pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-[#1E1916]">
                  Chat with {order.rider.name}
                </h3>
                <p className="text-[11px] font-semibold text-[#C85A32]">
                  Rider Don Dey Come · #{order.code}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setIsChatOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF6F1] text-[#1E1916]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto py-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.sender === 'buyer'
                      ? 'ml-auto bg-[#D9232E] text-white'
                      : 'bg-[#FAF6F1] text-[#1E1916]'
                  }`}
                >
                  <p>{m.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message rider (e.g. Call at the gate)..."
                className="min-h-[42px] flex-1 rounded-xl border border-[#E6DDD3] bg-[#FAF6F1] px-3 text-xs text-[#1E1916] focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#D9232E] text-white active:bg-[#9E141D]"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
