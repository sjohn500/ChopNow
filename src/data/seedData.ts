import { FoodPost, Order, SellerProfile, UserSession } from '../types/chopnow';

export const SEED_SELLERS: SellerProfile[] = [
  {
    id: 'seller-mama-put',
    kitchenName: 'Mama Put Kitchen',
    ownerName: 'Mrs. Folake Adeyemi',
    phone: '0803 412 8890',
    area: 'Yaba, Lagos',
    prepTime: '15–25 mins',
  },
  {
    id: 'seller-iya-basira',
    kitchenName: 'Iya Basira Buka',
    ownerName: 'Alhaja Basira Lawal',
    phone: '0809 551 2034',
    area: 'Surulere, Lagos',
    prepTime: '20–30 mins',
  },
  {
    id: 'seller-chef-tunde',
    kitchenName: 'Chef Tunde Grill',
    ownerName: 'Tunde Bakare',
    phone: '0812 908 4411',
    area: 'Lekki Phase 1',
    prepTime: '15–20 mins',
  },
  {
    id: 'seller-auntie-ngozi',
    kitchenName: 'Auntie Ngozi Pot',
    ownerName: 'Ngozi Okafor',
    phone: '0706 334 7712',
    area: 'Ikeja GRA',
    prepTime: '20–35 mins',
  },
];

const now = Date.now();

export const SEED_FOOD_POSTS: FoodPost[] = [
  {
    id: 'post-jollof-1',
    sellerId: 'seller-mama-put',
    kitchenName: 'Mama Put Kitchen',
    area: 'Yaba, Lagos',
    title: 'Smoky Party Jollof & Grilled Chicken',
    description:
      'Firewood-kissed party jollof rice with peppered grilled chicken quarter, sweet fried dodo, and fresh creamy coleslaw.',
    category: 'Rice & Mains',
    price: 3800,
    imageUrl: '/src/assets/images/plate_jollof_chicken_1795003763904.jpg',
    prepMinutes: 20,
    isAvailable: true,
    createdAt: new Date(now - 18 * 60000).toISOString(),
  },
  {
    id: 'post-egusi-2',
    sellerId: 'seller-auntie-ngozi',
    kitchenName: 'Auntie Ngozi Pot',
    area: 'Ikeja GRA',
    title: 'Egusi Soup & Pounded Yam',
    description:
      'Thick hand-ground melon seed soup simmered with stockfish, tender beef cuts, and fresh ugwu leaves. Served with smooth pounded yam.',
    category: 'Swallow & Soup',
    price: 4500,
    imageUrl: '/src/assets/images/plate_egusi_pounded_yam_1795003764805.jpg',
    prepMinutes: 25,
    isAvailable: true,
    createdAt: new Date(now - 34 * 60000).toISOString(),
  },
  {
    id: 'post-suya-3',
    sellerId: 'seller-chef-tunde',
    kitchenName: 'Chef Tunde Grill',
    area: 'Lekki Phase 1',
    title: 'Spiced Beef Suya Platter',
    description:
      'Charcoal-seared beef skewers generously coated in house-roasted yaji peanut spice, packed with crisp red onions, tomatoes, and cabbage.',
    category: 'Grill & Suya',
    price: 3200,
    imageUrl: '/src/assets/images/plate_suya_platter_1795003765134.jpg',
    prepMinutes: 15,
    isAvailable: true,
    createdAt: new Date(now - 52 * 60000).toISOString(),
  },
  {
    id: 'post-amala-4',
    sellerId: 'seller-iya-basira',
    kitchenName: 'Iya Basira Buka',
    area: 'Surulere, Lagos',
    title: 'Efo Riro & Hot Amala',
    description:
      'Rich palm-oil spinach stew loaded with slow-braised goat meat, locust beans (iru), and diced tatashe alongside silky amala.',
    category: 'Swallow & Soup',
    price: 4200,
    imageUrl: '/src/assets/images/plate_efo_riro_amala_1795003765371.jpg',
    prepMinutes: 25,
    isAvailable: true,
    createdAt: new Date(now - 85 * 60000).toISOString(),
  },
  {
    id: 'post-ewa-5',
    sellerId: 'seller-mama-put',
    kitchenName: 'Mama Put Kitchen',
    area: 'Yaba, Lagos',
    title: 'Ewa Agoyin & Sweet Plantain',
    description:
      'Creamy mashed honey beans topped with authentic dark caramelized pepper sauce and a generous side of golden ripe dodo.',
    category: 'Quick Bites',
    price: 2500,
    imageUrl: '/src/assets/images/plate_beans_dodo_1795003766399.jpg',
    prepMinutes: 15,
    isAvailable: true,
    createdAt: new Date(now - 130 * 60000).toISOString(),
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'order-seed-1',
    code: 'CN-4082',
    foodPostId: 'post-jollof-1',
    plateTitle: 'Smoky Party Jollof & Grilled Chicken',
    plateImageUrl: '/src/assets/images/plate_jollof_chicken_1795003763904.jpg',
    unitPrice: 3800,
    quantity: 1,
    totalPrice: 3800,
    buyerName: 'Chidi Okafor',
    buyerPhone: '0805 112 9087',
    deliveryLandmark: 'Unilag Main Gate, Akoka',
    sellerId: 'seller-mama-put',
    kitchenName: 'Mama Put Kitchen',
    sellerPhone: '0803 412 8890',
    status: 'accepted',
    createdAt: new Date(now - 12 * 60000).toISOString(),
    updatedAt: new Date(now - 8 * 60000).toISOString(),
  },
];

export const DEFAULT_SESSION: UserSession = {
  phone: '0805 112 9087',
  fullName: 'Chidi Okafor',
  role: 'buyer',
  activeSellerId: 'seller-mama-put',
  landmark: 'Unilag Main Gate, Akoka',
};
