import type { FoodCategoryKey, MenuItem } from '../types/delivery';
import { mapDbFoodToMenuItem } from './marketplace';
import { uploadFoodPhoto } from './storage';
import { supabase } from './supabase';

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

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Please sign in first.');
  }
  return user.id;
}

export async function fetchSellerDashboardData(): Promise<SellerDashboardData> {
  const uid = await requireUserId();

  const [kitchenRes, dishesRes, ordersRes] = await Promise.all([
    supabase
      .from('seller_profiles')
      .select(
        'id, business_name, area, address, category, cover_image_url, delivery_fee_kobo'
      )
      .eq('id', uid)
      .maybeSingle(),
    supabase
      .from('foods')
      .select(
        'id, seller_id, name, description, price_kobo, image_url, is_available, category'
      )
      .eq('seller_id', uid),
    supabase
      .from('orders')
      .select(
        'id, status, total_kobo, delivery_fee_kobo, commission_kobo, buyer_name, buyer_phone, delivery_address'
      )
      .eq('seller_id', uid),
  ]);

  if (kitchenRes.error) {
    throw new Error(kitchenRes.error.message);
  }

  const dishes = (dishesRes.data ?? []).map(mapDbFoodToMenuItem);
  const orders = (ordersRes.data ?? []) as SellerOrderRow[];

  const dishStats: Record<string, DishOrderStats> = {};
  const activeOrderIds = orders
    .filter((o) => o.status !== 'pending_payment' && o.status !== 'cancelled')
    .map((o) => o.id);

  if (activeOrderIds.length > 0) {
    try {
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('order_id, food_id, quantity')
        .in('order_id', activeOrderIds);

      if (itemsData) {
        const seenOrderByFood = new Map<string, Set<string>>();
        for (const row of itemsData as {
          order_id: string;
          food_id: string | null;
          quantity: number;
        }[]) {
          if (!row.food_id) continue;
          const prev = dishStats[row.food_id] ?? {
            orderCount: 0,
            platesSold: 0,
          };
          const orderSet = seenOrderByFood.get(row.food_id) ?? new Set<string>();
          orderSet.add(row.order_id);
          seenOrderByFood.set(row.food_id, orderSet);
          dishStats[row.food_id] = {
            orderCount: orderSet.size,
            platesSold: prev.platesSold + Number(row.quantity ?? 0),
          };
        }
      }
    } catch {
      // order_items may be restricted by RLS; fall back cleanly to order totals
    }
  }

  return {
    kitchen: (kitchenRes.data as SellerKitchenRow | null) ?? null,
    dishes,
    orders,
    dishStats,
  };
}

export async function registerMyKitchenInDb(input: {
  business_name: string;
  area: string;
  address: string;
  category: Exclude<FoodCategoryKey, 'all'>;
  delivery_fee_kobo: number;
}): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase.from('seller_profiles').upsert({
    id: uid,
    business_name: input.business_name.trim(),
    area: input.area,
    address: input.address.trim(),
    category: input.category,
    delivery_fee_kobo: Math.max(0, Math.round(input.delivery_fee_kobo)),
  });

  if (error) {
    throw new Error(error.message || 'Could not save your kitchen.');
  }
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
  const uid = await requireUserId();
  const imageUrl = await uploadFoodPhoto(uid, input.photo);
  const priceKobo = Math.round(input.priceNaira * 100);

  const { error: insertError } = await supabase.from('foods').insert({
    seller_id: uid,
    name: input.name.trim(),
    description: input.description.trim(),
    price_kobo: priceKobo,
    image_url: imageUrl,
    is_available: true,
    category: input.category,
    prep_minutes: 25,
  });

  if (insertError) {
    throw new Error(insertError.message || 'Could not publish your dish.');
  }

  if (input.setAsCover || input.isFirstDish) {
    const { error: coverError } = await supabase
      .from('seller_profiles')
      .update({ cover_image_url: imageUrl })
      .eq('id', uid);

    if (coverError) {
      throw new Error(
        coverError.message || 'Dish saved, but cover image update failed.'
      );
    }
  }
}

export async function updateMyProfileInDb(input: {
  full_name: string;
  phone: string;
}): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
    })
    .eq('id', uid);

  if (error) {
    throw new Error(error.message || 'Could not update your profile.');
  }
}

export async function updateMyKitchenInDb(input: {
  business_name: string;
  address: string;
  area: string;
  category: Exclude<FoodCategoryKey, 'all'>;
  delivery_fee_kobo: number;
}): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from('seller_profiles')
    .update({
      business_name: input.business_name.trim(),
      address: input.address.trim(),
      area: input.area,
      category: input.category,
      delivery_fee_kobo: Math.max(0, Math.round(input.delivery_fee_kobo)),
    })
    .eq('id', uid);

  if (error) {
    throw new Error(error.message || 'Could not update kitchen details.');
  }
}

export async function updateKitchenDeliveryFeeInDb(
  feeNaira: number
): Promise<void> {
  const uid = await requireUserId();
  const feeKobo = Math.max(0, Math.round(feeNaira * 100));
  const { error } = await supabase
    .from('seller_profiles')
    .update({ delivery_fee_kobo: feeKobo })
    .eq('id', uid);

  if (error) {
    throw new Error(error.message || 'Could not save delivery fee.');
  }
}

export async function toggleDishAvailabilityInDb(
  itemId: string,
  nextAvailable: boolean
): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from('foods')
    .update({ is_available: nextAvailable })
    .eq('id', itemId)
    .eq('seller_id', uid);

  if (error) {
    throw new Error(error.message || 'Could not update dish availability.');
  }
}

export async function deleteDishFromDb(itemId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await supabase
    .from('foods')
    .delete()
    .eq('id', itemId)
    .eq('seller_id', uid);

  if (error) {
    throw new Error(error.message || 'Could not delete dish.');
  }
}