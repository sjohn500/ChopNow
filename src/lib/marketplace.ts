import { getNigeriaLocationCoords } from '../data/nigeriaLocations';
import type {
  AuthUser,
  FoodCategoryKey,
  MenuItem,
  Restaurant,
} from '../types/delivery';
import { apiRequest, getAuthToken } from './api';

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

export type DbFood = {
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

type SessionApiUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  buyer_area: string;
  buyer_landmark: string;
  avatar_url: string | null;
  role: 'buyer' | 'seller';
  kitchen: DbKitchen | null;
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

/** All kitchens (with their dishes) from the Python SQLite database. */
export async function fetchRestaurants(): Promise<Restaurant[]> {
  const res = await apiRequest<{ kitchens: DbKitchen[]; foods: DbFood[] }>(
    '/api/restaurants'
  );

  const foodsBySeller = new Map<string, DbFood[]>();
  for (const food of res.foods ?? []) {
    const list = foodsBySeller.get(food.seller_id) ?? [];
    list.push(food);
    foodsBySeller.set(food.seller_id, list);
  }

  return (res.kitchens ?? []).map((k) =>
    mapKitchen(k, foodsBySeller.get(k.id) ?? [])
  );
}

/** Builds the app's user from the Python backend session, or returns null. */
export async function loadSessionUser(base: AuthUser): Promise<AuthUser | null> {
  if (!getAuthToken()) return null;

  const res = await apiRequest<{ user: SessionApiUser | null }>('/api/auth/session');
  if (!res.user) return null;

  const u = res.user;
  return {
    ...base,
    name: u.full_name?.trim() || u.email.split('@')[0] || base.name,
    phone: u.phone || base.phone,
    email: u.email,
    avatarUrl: u.avatar_url ?? undefined,
    role: u.kitchen ? 'seller' : 'buyer',
    buyerArea: u.kitchen?.area || u.buyer_area || base.buyerArea,
    buyerLandmark: u.buyer_landmark || u.kitchen?.address || base.buyerLandmark,
    sellerRestaurantId: u.kitchen?.id,
  };
}