export type UserRole = 'buyer' | 'seller';

export type OrderStatus = 'placed' | 'accepted' | 'ready' | 'completed';

export type FoodCategory =
  | 'Rice & Mains'
  | 'Swallow & Soup'
  | 'Grill & Suya'
  | 'Quick Bites';

export type AppTab = 'feed' | 'orders' | 'post' | 'kitchen';

export interface SellerProfile {
  id: string;
  kitchenName: string;
  ownerName: string;
  phone: string;
  area: string;
  prepTime: string;
}

export interface FoodPost {
  id: string;
  sellerId: string;
  kitchenName: string;
  area: string;
  title: string;
  description: string;
  category: FoodCategory;
  price: number;
  imageUrl: string;
  prepMinutes: number;
  isAvailable: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  code: string;
  foodPostId: string;
  plateTitle: string;
  plateImageUrl: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  buyerName: string;
  buyerPhone: string;
  deliveryLandmark: string;
  sellerId: string;
  kitchenName: string;
  sellerPhone: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  phone: string;
  fullName: string;
  role: UserRole;
  activeSellerId: string;
  landmark: string;
}
