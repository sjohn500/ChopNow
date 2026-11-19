export type FoodCategoryKey =
  | 'all'
  | 'jollof'
  | 'swallows'
  | 'suya'
  | 'small_chops'
  | 'pepper_soup'
  | 'drinks';

export type ScreenId = 'home' | 'menu' | 'post' | 'orders' | 'profile';

export type TrackingStage = 'pending' | 'accepted' | 'delivered';

export type DbOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'accepted'
  | 'preparing'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type UserRole = 'buyer' | 'seller';

export interface AuthUser {
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  buyerArea: string;
  buyerLandmark: string;
  sellerRestaurantId?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: 'Combos' | 'Swallows' | 'Proteins' | 'Sides';
  imageUrl: string;
  isAvailable?: boolean;
  isNew?: boolean;
  rating?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisineTags: string[];
  categoryKey: Exclude<FoodCategoryKey, 'all'>;
  rating: number;
  reviewCount: number;
  deliveryMinutes: string;
  deliveryFee: number;
  area: string;
  address: string;
  lat: number;
  lng: number;
  promoLabel?: string;
  heroImageUrl: string;
  menu: MenuItem[];
}

export interface CartEntry {
  item: MenuItem;
  quantity: number;
}

export interface ActiveOrder {
  id?: string;
  buyerId?: string;
  sellerId?: string;
  dbStatus?: DbOrderStatus;
  buyerName?: string;
  buyerPhone?: string;
  paymentReference?: string;
  code: string;
  restaurantId: string;
  restaurantName: string;
  restaurantArea: string;
  restaurantAddress: string;
  destination: string;
  distanceKm: number;
  itemsSummary: string;
  plateImageUrl?: string;
  totalAmount: number;
  stage: TrackingStage;
  etaMinutes: string;
  arrivalTime: string;
  createdAt?: string;
  rider: {
    name: string;
    phone: string;
    vehicle: string;
    rating: number;
    avatarUrl: string;
  };
}