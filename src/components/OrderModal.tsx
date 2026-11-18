import { MapPin, Minus, Phone, Plus, User, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { FoodPost, UserSession } from '../types/chopnow';
import { formatNaira, validateNigerianPhone } from '../utils/format';
import { PlateImage } from './PlateImage';

interface OrderModalProps {
  post: FoodPost | null;
  session: UserSession;
  onClose: () => void;
  onPlaceOrder: (input: {
    post: FoodPost;
    quantity: number;
    buyerName: string;
    buyerPhone: string;
    deliveryLandmark: string;
  }) => void;
}

export function OrderModal({
  post,
  session,
  onClose,
  onPlaceOrder,
}: OrderModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState(session.fullName);
  const [buyerPhone, setBuyerPhone] = useState(session.phone);
  const [landmark, setLandmark] = useState(session.landmark);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setQuantity(1);
      setBuyerName(session.fullName);
      setBuyerPhone(session.phone);
      setLandmark(session.landmark);
      setError('');
    }
  }, [post, session]);

  if (!post) return null;

  const totalPrice = post.price * quantity;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!post) return;
    setError('');

    if (!post.isAvailable) {
      setError('This plate is currently sold out.');
      return;
    }

    if (buyerName.trim().length < 2) {
      setError('Enter your name for the rider and kitchen.');
      return;
    }

    if (!validateNigerianPhone(buyerPhone)) {
      setError('Enter a valid Nigerian phone number (e.g. 0805 112 9087).');
      return;
    }

    if (landmark.trim().length < 4) {
      setError('Add a clear delivery landmark or gate (e.g. Unilag Main Gate).');
      return;
    }

    onPlaceOrder({
      post,
      quantity,
      buyerName,
      buyerPhone,
      deliveryLandmark: landmark,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-xs md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-xl md:max-w-lg md:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500">
              {post.kitchenName} · {post.area}
            </p>
            <h2
              id="order-modal-title"
              className="font-display truncate text-base font-bold text-slate-900"
            >
              {post.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order sheet"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="aspect-[4/3] w-full bg-slate-100">
          <PlateImage
            src={post.imageUrl}
            alt={post.title}
            className="h-full w-full"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-slate-600">
            {post.description}
          </p>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Plates</p>
              <p className="font-mono-num text-sm font-semibold text-slate-900">
                {formatNaira(post.price)} each
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-mono-num w-8 text-center text-base font-bold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="order-buyer-name"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Your Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="order-buyer-name"
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="order-buyer-phone"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="order-buyer-phone"
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="font-mono-num min-h-[44px] w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="order-landmark"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Delivery Landmark / Hostel / Street
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="order-landmark"
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Unilag Main Gate, Akoka"
                className="min-h-[44px] w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
            <span className="text-slate-600">
              Pay on delivery · Est. {post.prepMinutes} mins
            </span>
            <span className="font-mono-num text-lg font-bold text-slate-900">
              {formatNaira(totalPrice)}
            </span>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!post.isAvailable}
            className="min-h-[48px] w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-500"
          >
            Place Order · {formatNaira(totalPrice)}
          </button>
        </form>
      </div>
    </div>
  );
}
