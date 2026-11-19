import { getNigeriaLocationCoords } from '../data/nigeriaLocations';
import type {
  AuthUser,
  FoodCategoryKey,
  MenuItem,
  Restaurant,
} from '../types/delivery';
import { supabase } from './supabase';

type CategoryKey = Exclude<FoodCategoryKey, 'all'>;

const CUISINE_TAGS: Record<CategoryKey, string[]> = {
  jollof: ['Jollof & Rice', 'Authentic Local'],
  swallows: ['Swallows & Soup', 'Local Buka'],
  suya: ['Suya & Grills', 'Charcoal'],
  small_chops: ['Small Chops', 'Party Bites'],
  pepper_soup: ['Pepper Soup', 'Hot Pot'],
  drinks: ['Palm Wine/Drinks', 'Chilled'],
};

const DISH_CATEGORIES: MenuItem['category'][] = [
  'Combos',
  'Swallows',
  'Proteins',
  'Sides',
];

const FALLBACK_COVER =
  '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg';
const DEFAULT_AREA = 'Eti-Osa, Lagos';

type DbFood = {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  price_kobo: number;
  image_url: string | null;
  is_available: boolean;
  category: string | null;
};

type DbKitchen = {
  id: string;
  business_name: string;
  area: string | null;
  address: string | null;
  category: string | null;
  cover_image_url: string | null;
  delivery_fee_kobo: number | null;
};

function isCategoryKey(value: string | null): value is CategoryKey {
  return value !== null && value in CUISINE_TAGS;
}

export function mapDbFoodToMenuItem(f: DbFood): MenuItem {
  const category = DISH_CATEGORIES.find((c) => c === f.category) ?? 'Combos';
  return {
    id: f.id,
    restaurantId: f.seller_id,
    name: f.name,
    description: f.description ?? '',
    price: Math.round(f.price_kobo / 100),
    category,
    imageUrl: f.image_url ?? FALLBACK_COVER,
    isAvailable: f.is_available,
    isNew: true,
    rating: 5.0,
  };
}

function mapKitchen(k: DbKitchen, foods: DbFood[]): Restaurant {
  const menu = foods.map(mapDbFoodToMenuItem);
  const area = k.area ?? DEFAULT_AREA;
  const coords = getNigeriaLocationCoords(area);
  const categoryKey: CategoryKey = isCategoryKey(k.category)
    ? k.category
    : 'jollof';

  return {
    id: k.id,
    name: k.business_name,
    cuisineTags: CUISINE_TAGS[categoryKey],
    categoryKey,
    rating: 5.0,
    reviewCount: 0,
    deliveryMinutes: '15–25 min',
    deliveryFee: Math.round((k.delivery_fee_kobo ?? 0) / 100),
    area,
    address: k.address ?? area,
    lat: coords.lat + 0.002,
    lng: coords.lng + 0.002,
    promoLabel: 'New',
    heroImageUrl: k.cover_image_url ?? menu[0]?.imageUrl ?? FALLBACK_COVER,
    menu,
  };
}

/** All real kitchens (with their dishes) from the database. */
export async function fetchRestaurants(): Promise<Restaurant[]> {
  const [kitchensRes, foodsRes] = await Promise.all([
    supabase
      .from('seller_profiles')
      .select(
        'id, business_name, area, address, category, cover_image_url, delivery_fee_kobo'
      ),
    supabase
      .from('foods')
      .select(
        'id, seller_id, name, description, price_kobo, image_url, is_available, category'
      ),
  ]);

  if (kitchensRes.error) throw new Error(kitchensRes.error.message);
  if (foodsRes.error) throw new Error(foodsRes.error.message);

  const foodsBySeller = new Map<string, DbFood[]>();
  for (const food of (foodsRes.data ?? []) as DbFood[]) {
    const list = foodsBySeller.get(food.seller_id) ?? [];
    list.push(food);
    foodsBySeller.set(food.seller_id, list);
  }

  return ((kitchensRes.data ?? []) as DbKitchen[]).map((k) =>
    mapKitchen(k, foodsBySeller.get(k.id) ?? [])
  );
}

/**
 * Builds the app's user from the real Supabase session.
 * Returns null when nobody is signed in.
 * Anyone with a registered kitchen is a seller; everyone else is a buyer.
 */
export async function loadSessionUser(base: AuthUser): Promise<AuthUser | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const uid = session.user.id;
  const [profileResult, kitchenResult] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', uid).maybeSingle(),
    supabase.from('seller_profiles').select('id, area, address').eq('id', uid).maybeSingle(),
  ]);

  const profile = profileResult.data;
  const kitchen = kitchenResult.data;

  return {
    ...base,
    name:
      profile?.full_name?.trim() ||
      session.user.email?.split('@')[0] ||
      base.name,
    phone: profile?.phone ?? base.phone,
    role: kitchen ? 'seller' : 'buyer',
    buyerArea: kitchen?.area ?? base.buyerArea,
    sellerRestaurantId: kitchen?.id,
  };
}