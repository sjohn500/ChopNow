import { CheckCircle2, Clock, MapPin, PackageCheck, Phone, Utensils } from 'lucide-react';
import { Order, OrderStatus } from '../types/chopnow';
import { formatNaira, formatTimeAgo } from '../utils/format';
import { PlateImage } from './PlateImage';

interface BuyerOrdersViewProps {
  orders: Order[];
  onBrowseFeed: () => void;
}

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

function getStatusText(status: OrderStatus): string {
  switch (status) {
    case 'placed':
      return 'Order sent — waiting for kitchen confirmation';
    case 'accepted':
      return 'Kitchen accepted — preparing your plate';
    case 'ready':
      return 'Plate is packed and ready for dispatch';
    case 'completed':
      return 'Delivered and completed';
  }
}

export function BuyerOrdersView({
  orders,
  onBrowseFeed,
}: BuyerOrdersViewProps) {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-6 pb-24 md:px-6 md:pt-8 md:pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            My Orders
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track live status updates from local kitchens as your food is prepared.
          </p>
        </div>

        <button
          type="button"
          onClick={onBrowseFeed}
          className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Order Another Plate
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <Utensils className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="font-display mt-3 text-lg font-bold text-slate-900">
            No orders placed yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
            Pick a fresh plate from the marketplace feed and your live order receipt will appear here.
          </p>
          <button
            type="button"
            onClick={onBrowseFeed}
            className="mt-5 min-h-[44px] rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Browse Fresh Plates
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {orders.map((order) => {
            const currentIndex = STEPS.findIndex((s) => s.key === order.status);
            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3.5">
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
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
                        <span>{order.kitchenName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatTimeAgo(order.createdAt)}</span>
                      </div>
                      <h2 className="font-display mt-1 text-base font-bold text-slate-900">
                        {order.plateTitle}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Qty {order.quantity} ·{' '}
                        <span className="font-mono-num font-semibold text-slate-900">
                          {formatNaira(order.totalPrice)}
                        </span>{' '}
                        (Pay on delivery)
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${order.sellerPhone.replace(/\s+/g, '')}`}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-700" />
                    Call Kitchen
                  </a>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    {order.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : order.status === 'ready' ? (
                      <PackageCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-emerald-600" />
                    )}
                    <span>{getStatusText(order.status)}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {STEPS.map((step, index) => {
                      const reached = index <= currentIndex;
                      return (
                        <div key={step.key} className="space-y-1.5">
                          <div
                            className={`h-1.5 w-full rounded-full ${
                              reached ? 'bg-emerald-600' : 'bg-slate-200'
                            }`}
                          />
                          <p
                            className={`text-xs font-medium ${
                              reached ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">
                      Deliver to: {order.deliveryLandmark}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
