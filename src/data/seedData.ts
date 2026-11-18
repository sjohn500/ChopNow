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
    imageUrl: '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
    prepMinutes: 20,
    isAvailable: true,
    createdAt: new Date(now - 18 * 60000).toISOString(),
  },
  {
    id: 'post-egusi-2',
    sellerId: 'seller-auntie-ngozi',
    kitchenName: 'Auntie Ngozi Pot',
    area: 'Ikeja GRA',
    title: 'Spiced Rice & Charred Grilled Chicken',
    description:
      'Seasoned Nigerian rice served with flame-charred chicken quarter and sautéed green peppers.',
    category: 'Rice & Mains',
    price: 4500,
    imageUrl: '/assets/aistudio/pexels-discountedchef-40262791_428c23ce.jpg',
    prepMinutes: 25,
    isAvailable: true,
    createdAt: new Date(now - 34 * 60000).toISOString(),
  },
  {
    id: 'post-suya-3',
    sellerId: 'seller-chef-tunde',
    kitchenName: 'Chef Tunde Grill',
    area: 'Lekki Phase 1',
    title: 'Spiced Beef Suya Skewers',
    description:
      'Charcoal-seared beef skewers generously coated in house-roasted yaji peanut spice fresh off the grill.',
    category: 'Grill & Suya',
    price: 3200,
    imageUrl: '/assets/aistudio/pexels-jessicairoh-20419328_715fe24a.jpg',
    prepMinutes: 15,
    isAvailable: true,
    createdAt: new Date(now - 52 * 60000).toISOString(),
  },
  {
    id: 'post-amala-4',
    sellerId: 'seller-iya-basira',
    kitchenName: 'Iya Basira Buka',
    area: 'Surulere, Lagos',
    title: 'Efo, Ponmo & Assorted Stew',
    description:
      'Rich green spinach & ewedu base topped with slow-simmered red pepper stew and tender ponmo.',
    category: 'Swallow & Soup',
    price: 4200,
    imageUrl: '/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37648018_3ef90570.jpg',
    prepMinutes: 25,
    isAvailable: true,
    createdAt: new Date(now - 85 * 60000).toISOString(),
  },
  {
    id: 'post-ewa-5',
    sellerId: 'seller-mama-put',
    kitchenName: 'Mama Put Kitchen',
    area: 'Yaba, Lagos',
    title: 'Akara, Agege Toast & Creamy Pap Box',
    description:
      'Hot crispy akara bean cakes, toasted bread, omelet egg, and warm milk-swirl pap.',
    category: 'Quick Bites',
    price: 2500,
    imageUrl: '/assets/aistudio/pexels-prosper-buka-1289782307-28736731_1eb2145c.jpg',
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
    plateImageUrl: '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
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
