import type { FoodCategoryKey, MenuItem } from '../types/delivery';
import { apiRequest } from './api';
import { type DbFood, mapDbFoodToMenuItem } from './marketplace';

export type SellerKitchenRow = {
  id: string;
  business_name: string;
  area: string | null;
  address: string | null;
  category: string | null;
  cover_image_url: string | null;
  delivery_fee_kobo: number | null;
};

export type SellerOrderRow = {
  id: string;
  status: string;
  total_kobo: number;
  delivery_fee_kobo: number;
  commission_kobo: number;
  buyer_name: string | null;
  buyer_phone: string | null;
  delivery_address: string | null;
};

export type DishOrderStats = {
  orderCount: number;
  platesSold: number;
};

export type SellerDashboardData = {
  kitchen: SellerKitchenRow | null;
  dishes: MenuItem[];
  orders: SellerOrderRow[];
  dishStats: Record<string, DishOrderStats>;
};

export async function fetchSellerDashboardData(): Promise<SellerDashboardData> {
  const res = await apiRequest<{
    kitchen: SellerKitchenRow | null;
    dishes: DbFood[];
    orders: SellerOrderRow[];
    dishStats: Record<string, DishOrderStats>;
  }>('/api/seller/dashboard');

  return {
    kitchen: res.kitchen,
    dishes: (res.dishes ?? []).map(mapDbFoodToMenuItem),
    orders: res.orders ?? [],
    dishStats: res.dishStats ?? {},
  };
}

export async function registerMyKitchenInDb(input: {
  business_name: string;
  area: string;
  address: string;
  category: Exclude<FoodCategoryKey, 'all'>;
  delivery_fee_kobo: number;
}): Promise<void> {
  await apiRequest('/api/seller/kitchen', {
    method: 'PUT',
    body: JSON.stringify({
      business_name: input.business_name.trim(),
      area: input.area,
      address: input.address.trim(),
      category: input.category,
      delivery_fee_kobo: Math.max(0, Math.round(input.delivery_fee_kobo)),
    }),
  });
}

export async function publishDishToDb(input: {
  name: string;
  description: string;
  priceNaira: number;
  category: MenuItem['category'];
  photo: string;
  setAsCover: boolean;
  isFirstDish: boolean;
}): Promise<void> {
  await apiRequest('/api/seller/foods', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name.trim(),
      description: input.description.trim(),
      price_naira: input.priceNaira,
      category: input.category,
      photo: input.photo,
      set_as_cover: input.setAsCover,
      is_first_dish: input.isFirstDish,
    }),
  });
}

export async function updateMyProfileInDb(input: {
  full_name: string;
  phone: string;
  buyer_area?: string;
  buyer_landmark?: string;
  avatar_url?: string;
}): Promise<void> {
  await apiRequest('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      ...(input.buyer_area !== undefined ? { buyer_area: input.buyer_area } : {}),
      ...(input.buyer_landmark !== undefined
        ? { buyer_landmark: input.buyer_landmark }
        : {}),
      ...(input.avatar_url !== undefined ? { avatar_url: input.avatar_url } : {}),
    }),
  });
}

export async function updateMyKitchenInDb(input: {
  business_name: string;
  address: string;
  area: string;
  category: Exclude<FoodCategoryKey, 'all'>;
  delivery_fee_kobo: number;
}): Promise<void> {
  await apiRequest('/api/seller/kitchen', {
    method: 'PUT',
    body: JSON.stringify({
      business_name: input.business_name.trim(),
      address: input.address.trim(),
      area: input.area,
      category: input.category,
      delivery_fee_kobo: Math.max(0, Math.round(input.delivery_fee_kobo)),
    }),
  });
}

export async function updateKitchenDeliveryFeeInDb(
  feeNaira: number
): Promise<void> {
  await apiRequest('/api/seller/kitchen/delivery-fee', {
    method: 'PATCH',
    body: JSON.stringify({ fee_naira: feeNaira }),
  });
}

export async function toggleDishAvailabilityInDb(
  itemId: string,
  nextAvailable: boolean
): Promise<void> {
  await apiRequest(`/api/seller/foods/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_available: nextAvailable }),
  });
}

export async function deleteDishFromDb(itemId: string): Promise<void> {
  await apiRequest(`/api/seller/foods/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}