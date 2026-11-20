import { getDistanceToRestaurant, INITIAL_ACTIVE_ORDER } from '../data/deliveryData';
import type {
  ActiveOrder,
  DbOrderStatus,
  Restaurant,
  TrackingStage,
} from '../types/delivery';
import { apiRequest, getAuthToken } from './api';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type DbOrderItemRow = {
  order_id: string;
  food_id: string | null;
  name: string;
  quantity: number;
};

type DbOrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  total_kobo: number;
  commission_kobo: number;
  delivery_fee_kobo: number;
  status: DbOrderStatus;
  delivery_address: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  payment_reference: string | null;
  created_at?: string;
  items?: DbOrderItemRow[];
};

function mapDbStatusToStage(status: DbOrderStatus): TrackingStage {
  if (status === 'accepted' || status === 'preparing') return 'accepted';
  if (status === 'delivered' || status === 'completed') return 'delivered';
  return 'pending';
}

function etaForStatus(status: DbOrderStatus): string {
  switch (status) {
    case 'pending_payment':
      return 'Confirming payment...';
    case 'paid':
      return '25–30 mins';
    case 'accepted':
      return '18–25 mins';
    case 'preparing':
      return '10–15 mins';
    case 'delivered':
      return 'Arrived';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
  }
}

export async function fetchMyOrders(
  restaurants: Restaurant[],
  buyerLocation: string
): Promise<{ orders: ActiveOrder[]; userId: string | null }> {
  if (!getAuthToken()) {
    return { orders: [], userId: null };
  }

  const res = await apiRequest<{ user_id: string; orders: DbOrderRow[] }>(
    '/api/orders'
  );
  const byId = new Map(restaurants.map((r) => [r.id, r]));

  const orders: ActiveOrder[] = (res.orders ?? []).map((row) => {
    const kitchen = byId.get(row.seller_id);
    const items = row.items ?? [];
    const itemsSummary =
      items.length > 0
        ? items.map((i) => `${i.quantity}x ${i.name}`).join(', ')
        : `Meal order from ${kitchen?.name ?? 'ChopBellyFull Kitchen'}`;

    const firstFoodId = items[0]?.food_id;
    const matchedPlateImage =
      kitchen?.menu.find((m) => m.id === firstFoodId)?.imageUrl ??
      kitchen?.heroImageUrl;

    const dist = kitchen
      ? getDistanceToRestaurant(buyerLocation, kitchen)
      : 2.5;

    return {
      id: row.id,
      buyerId: row.buyer_id,
      sellerId: row.seller_id,
      dbStatus: row.status,
      buyerName: row.buyer_name ?? undefined,
      buyerPhone: row.buyer_phone ?? undefined,
      paymentReference: row.payment_reference ?? undefined,
      createdAt: row.created_at,
      code: row.id.slice(0, 8).toUpperCase(),
      restaurantId: row.seller_id,
      restaurantName: kitchen?.name ?? 'ChopBellyFull Kitchen',
      restaurantArea: kitchen?.area ?? buyerLocation,
      restaurantAddress: kitchen?.address ?? 'Local Kitchen',
      destination: row.delivery_address ?? buyerLocation,
      distanceKm: dist,
      itemsSummary,
      plateImageUrl: matchedPlateImage,
      totalAmount: Math.round(row.total_kobo / 100),
      stage: mapDbStatusToStage(row.status),
      etaMinutes: etaForStatus(row.status),
      arrivalTime: kitchen?.deliveryMinutes ?? '20–30 mins',
      rider: INITIAL_ACTIVE_ORDER.rider,
    };
  });

  return { orders, userId: res.user_id ?? null };
}

export async function updateOrderStatusInDb(
  orderId: string,
  nextStatus: DbOrderStatus
): Promise<void> {
  await apiRequest(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: nextStatus }),
  });
}

export function subscribeToOrderChanges(
  _userId: string,
  onChange: () => void
): () => void {
  const intervalId = window.setInterval(() => {
    if (getAuthToken()) {
      onChange();
    }
  }, 5000);

  return () => {
    window.clearInterval(intervalId);
  };
}