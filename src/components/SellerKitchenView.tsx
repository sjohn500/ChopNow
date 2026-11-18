import { Check, MapPin, Phone, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { FoodPost, Order, OrderStatus, SellerProfile } from '../types/chopnow';
import { formatNaira, formatTimeAgo } from '../utils/format';
import { PlateImage } from './PlateImage';

interface SellerKitchenViewProps {
  sellers: SellerProfile[];
  activeSellerId: string;
  onChangeSeller: (sellerId: string) => void;
  posts: FoodPost[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onTogglePostAvailability: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onGoToPost: () => void;
  onResetDemo: () => void;
}

const NEXT_STATUS_ACTION: Record<
  OrderStatus,
  { next: OrderStatus; label: string } | null
> = {
  placed: { next: 'accepted', label: 'Accept Order' },
  accepted: { next: 'ready', label: 'Mark Ready' },
  ready: { next: 'completed', label: 'Complete Handover' },
  completed: null,
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'New Order',
  accepted: 'Cooking',
  ready: 'Ready for Pickup',
  completed: 'Completed',
};

export function SellerKitchenView({
  sellers,
  activeSellerId,
  onChangeSeller,
  posts,
  orders,
  onUpdateOrderStatus,
  onTogglePostAvailability,
  onDeletePost,
  onGoToPost,
  onResetDemo,
}: SellerKitchenViewProps) {
  const activeSeller =
    sellers.find((s) => s.id === activeSellerId) ?? sellers[0];

  const kitchenOrders = orders.filter((o) => o.sellerId === activeSeller.id);
  const kitchenPosts = posts.filter((p) => p.sellerId === activeSeller.id);

  const openOrderCount = kitchenOrders.filter(
    (o) => o.status !== 'completed'
  ).length;
  const totalRevenue = kitchenOrders.reduce(
    (sum, o) => sum + o.totalPrice,
    0
  );

  return (
    <section className="mx-auto max-w-5xl px-4 pt-6 pb-24 md:px-6 md:pt-8 md:pb-12">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Seller Kitchen
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage incoming customer orders and toggle availability for {activeSeller.kitchenName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select active seller kitchen"
            value={activeSeller.id}
            onChange={(e) => onChangeSeller(e.target.value)}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none"
          >
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.kitchenName} ({s.area})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onGoToPost}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Post Plate
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Active Queue</p>
          <p className="font-mono-num mt-1 text-2xl font-bold text-slate-900">
            {openOrderCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Live Menu Plates</p>
          <p className="font-mono-num mt-1 text-2xl font-bold text-slate-900">
            {kitchenPosts.filter((p) => p.isAvailable).length} / {kitchenPosts.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Kitchen Sales</p>
          <p className="font-mono-num mt-1 text-2xl font-bold text-emerald-700">
            {formatNaira(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-slate-900">
          Incoming Orders
        </h2>

        {kitchenOrders.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              No orders for {activeSeller.kitchenName} yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Place an order on one of this kitchen&apos;s plates in the Feed to see it appear here instantly.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {kitchenOrders.map((order) => {
              const action = NEXT_STATUS_ACTION[order.status];
              return (
                <article
                  key={order.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex gap-3.5">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <PlateImage
                        src={order.plateImageUrl}
                        alt={order.plateTitle}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-mono-num font-semibold text-slate-900">
                          #{order.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-700">
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatTimeAgo(order.createdAt)}</span>
                      </div>

                      <h3 className="font-display mt-0.5 text-sm font-bold text-slate-900">
                        {order.quantity}x {order.plateTitle}
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span>{order.buyerName}</span>
                        <a
                          href={`tel:${order.buyerPhone.replace(/\s+/g, '')}`}
                          className="font-mono-num inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {order.buyerPhone}
                        </a>
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <MapPin className="h-3 w-3" />
                          {order.deliveryLandmark}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    <span className="font-mono-num text-sm font-bold text-slate-900">
                      {formatNaira(order.totalPrice)}
                    </span>

                    {action ? (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, action.next)}
                        className="min-h-[44px] shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white hover:bg-emerald-700 active:scale-[0.98]"
                      >
                        {action.label}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <Check className="h-4 w-4 text-emerald-600" />
                        Handed Over
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Kitchen Menu Plates
          </h2>
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Demo Data
          </button>
        </div>

        {kitchenPosts.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            No plates posted for this kitchen yet.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {kitchenPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <PlateImage
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {post.title}
                    </p>
                    <p className="font-mono-num text-xs text-slate-600">
                      {formatNaira(post.price)} ·{' '}
                      {post.isAvailable ? 'Available' : 'Sold Out'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onTogglePostAvailability(post.id)}
                    className={`min-h-[40px] rounded-xl border px-3 text-xs font-semibold transition-colors ${
                      post.isAvailable
                        ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {post.isAvailable ? 'Mark Sold Out' : 'Restock'}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${post.title}`}
                    onClick={() => onDeletePost(post.id)}
                    className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
