import { ActiveOrder, AuthUser, CartEntry, Restaurant } from '../types/delivery';
import {
  formatNigeriaLocation,
  getNigeriaLocationCoords,
  NIGERIA_STATES,
} from './nigeriaLocations';

export const DELIVERY_LOCATIONS = [
  'Eti-Osa, Lagos',
  'Abuja Municipal, FCT',
  'Lagos Mainland, Lagos',
  'Surulere, Lagos',
  'Ikeja, Lagos',
  'Port Harcourt, Rivers',
  'Ibadan North, Oyo',
  'Kano Municipal, Kano',
  'Enugu North, Enugu',
] as const;

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.4, Number((R * c).toFixed(1)));
}

export function getDistanceToRestaurant(
  buyerArea: string,
  restaurant: Restaurant
): number {
  const buyerCoords = getNigeriaLocationCoords(buyerArea);
  return calculateDistanceKm(
    buyerCoords.lat,
    buyerCoords.lng,
    restaurant.lat,
    restaurant.lng
  );
}

export function findNearestDeliveryArea(lat: number, lng: number): string {
  let closestState = NIGERIA_STATES[24];
  let minDistance = Infinity;
  for (const s of NIGERIA_STATES) {
    const dist = calculateDistanceKm(lat, lng, s.lat, s.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestState = s;
    }
  }
  return formatNigeriaLocation(closestState.capitalLga, closestState.state);
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'mama-put-express',
    name: 'Mama Put Express',
    cuisineTags: ['Authentic Local', 'Quick Prep'],
    categoryKey: 'jollof',
    rating: 4.9,
    reviewCount: 420,
    deliveryMinutes: '16–22 min',
    deliveryFee: 0,
    area: 'Eti-Osa, Lagos',
    address: '14 Admiralty Way, Lekki Phase 1',
    lat: 6.4494,
    lng: 3.4692,
    promoLabel: 'Hot & Fresh',
    heroImageUrl: '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
    menu: [
      {
        id: 'mp-jollof',
        restaurantId: 'mama-put-express',
        name: 'Smoky Party Jollof & Sweet Dodo',
        description:
          'Firewood party jollof rice topped with peppered meat sauce and golden caramelized plantain cubes.',
        price: 3500,
        category: 'Combos',
        imageUrl: '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
      },
      {
        id: 'mp-fried-turkey',
        restaurantId: 'mama-put-express',
        name: 'Spiced Rice & Charred Grilled Chicken',
        description:
          'Seasoned Nigerian rice served with flame-charred chicken quarter and sautéed green peppers.',
        price: 4200,
        category: 'Combos',
        imageUrl: '/assets/aistudio/pexels-discountedchef-40262791_428c23ce.jpg',
      },
      {
        id: 'mp-ofada',
        restaurantId: 'mama-put-express',
        name: 'Owambe Party Feast Spread',
        description:
          'Party jollof, stir-fry noodles, grilled chicken, curried meat rice, flatbread, and hot pepper sauces.',
        price: 6500,
        category: 'Combos',
        imageUrl: '/assets/aistudio/pexels-picswithjer-30246915_e571c980.jpg',
      },
      {
        id: 'mp-egusi',
        restaurantId: 'mama-put-express',
        name: 'Egusi Soup & Pounded Yam',
        description:
          'Hand-ground melon soup simmered with stockfish, tender beef cuts, ugwu leaves, and smooth pounded yam.',
        price: 4200,
        category: 'Swallows',
        imageUrl: '/src/assets/images/plate_egusi_pounded_yam_1795003764805.jpg',
      },
      {
        id: 'mp-suya-plate',
        restaurantId: 'mama-put-express',
        name: 'Peppered Ponmo & Vegetable Stew',
        description:
          'Tender stewed cow skin (ponmo) and assorted beef in rich ata-dindin pepper sauce over green efo.',
        price: 3400,
        category: 'Proteins',
        imageUrl:
          '/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37648018_3ef90570.jpg',
      },
      {
        id: 'mp-beans',
        restaurantId: 'mama-put-express',
        name: 'Sweet Dodo & Plantain Skewers',
        description:
          'Golden fried ripe plantain slices and seasoned pepper-onion dodo skewers served hot.',
        price: 2200,
        category: 'Sides',
        imageUrl:
          '/assets/aistudio/pexels-ndagi-idris-2159907004-36458103_fd393f46.jpg',
      },
      {
        id: 'mp-zobo',
        restaurantId: 'mama-put-express',
        name: 'Chilled Pineapple Zobo & Fruit Press',
        description:
          'Spiced hibiscus cooler brewed with fresh market pineapple, ginger root, and garden mint.',
        price: 1000,
        category: 'Sides',
        imageUrl: '/assets/aistudio/pexels-jagaba-37126238_22267ce8.jpg',
      },
    ],
  },
  {
    id: 'iya-basira-kitchen',
    name: 'Iya Basira’s Kitchen',
    cuisineTags: ['Authentic Local', 'Amala & Buka'],
    categoryKey: 'swallows',
    rating: 4.9,
    reviewCount: 486,
    deliveryMinutes: '18–25 min',
    deliveryFee: 300,
    area: 'Lagos Mainland, Lagos',
    address: '28 Herbert Macaulay Way, Sabo Yaba',
    lat: 6.5121,
    lng: 3.3752,
    promoLabel: 'Hot & Fresh',
    heroImageUrl:
      '/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37648018_3ef90570.jpg',
    menu: [
      {
        id: 'ib-amala',
        restaurantId: 'iya-basira-kitchen',
        name: 'Efo, Ponmo & Assorted Stew Bowl',
        description:
          'Rich green spinach & ewedu base topped with slow-simmered red pepper stew and tender ponmo.',
        price: 4200,
        category: 'Swallows',
        imageUrl:
          '/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37648018_3ef90570.jpg',
      },
      {
        id: 'ib-egusi',
        restaurantId: 'iya-basira-kitchen',
        name: 'Egusi Special & Pounded Yam',
        description:
          'Rich melon seed soup loaded with dry fish, ponmo, and beef beside fluffy pounded yam.',
        price: 4400,
        category: 'Swallows',
        imageUrl: '/src/assets/images/plate_egusi_pounded_yam_1795003764805.jpg',
      },
      {
        id: 'ib-fried-rice',
        restaurantId: 'iya-basira-kitchen',
        name: 'Buka Jollof & Fried Chicken Plate',
        description:
          'Spiced rice paired with smoky flame-grilled chicken quarter and sautéed bell peppers.',
        price: 4100,
        category: 'Combos',
        imageUrl: '/assets/aistudio/pexels-discountedchef-40262791_428c23ce.jpg',
      },
      {
        id: 'ib-peppersoup',
        restaurantId: 'iya-basira-kitchen',
        name: 'Goat Meat Pepper Soup Bowl',
        description:
          'Steaming aromatic pepper soup simmered with scent leaves and calabash nutmeg.',
        price: 3600,
        category: 'Proteins',
        imageUrl: '/src/assets/images/local_pepper_soup_1795006181565.jpg',
      },
      {
        id: 'ib-puff',
        restaurantId: 'iya-basira-kitchen',
        name: 'Hot Akara & Fried Yam Tray',
        description:
          'Freshly fried golden akara bean cakes and crisp fried yam slices straight from the pan.',
        price: 2000,
        category: 'Sides',
        imageUrl:
          '/assets/aistudio/pexels-finalchoice-147015110-40786356_312d796e.jpg',
      },
    ],
  },
  {
    id: 'auntie-ngozi-pot',
    name: 'Auntie Ngozi Pepper Soup Spot',
    cuisineTags: ['Pepper Soup', 'Breakfast & Rice'],
    categoryKey: 'pepper_soup',
    rating: 4.8,
    reviewCount: 286,
    deliveryMinutes: '16–22 min',
    deliveryFee: 0,
    area: 'Abuja Municipal, FCT',
    address: '19 Aminu Kano Crescent, Wuse 2',
    lat: 9.0782,
    lng: 7.4721,
    promoLabel: 'Hot & Fresh',
    heroImageUrl:
      '/assets/aistudio/pexels-discountedchef-40262791_428c23ce.jpg',
    menu: [
      {
        id: 'an-peppersoup',
        restaurantId: 'auntie-ngozi-pot',
        name: 'Spiced Rice & Charred Chicken Quarter',
        description:
          'Aromatic Nigerian rice served with herb-marinated grilled chicken and sautéed veggies.',
        price: 3800,
        category: 'Combos',
        imageUrl:
          '/assets/aistudio/pexels-discountedchef-40262791_428c23ce.jpg',
      },
      {
        id: 'an-akara-box',
        restaurantId: 'auntie-ngozi-pot',
        name: 'Akara, Agege Toast & Creamy Pap Box',
        description:
          'Hot crispy akara balls, toasted bread, omelet egg, and warm milk-swirl pap.',
        price: 3200,
        category: 'Combos',
        imageUrl:
          '/assets/aistudio/pexels-prosper-buka-1289782307-28736731_1eb2145c.jpg',
      },
      {
        id: 'an-boli-fish',
        restaurantId: 'auntie-ngozi-pot',
        name: 'Roasted Boli & Peppered Tilapia',
        description:
          'Charcoal-roasted sweet plantains served with whole grilled tilapia coated in spicy red pepper sauce.',
        price: 4500,
        category: 'Proteins',
        imageUrl: '/src/assets/images/local_boli_fish_1795006182721.jpg',
      },
      {
        id: 'an-zobo',
        restaurantId: 'auntie-ngozi-pot',
        name: 'Fresh Pineapple & Fruit Cooler',
        description:
          'Chilled market-fresh pineapple and citrus press blended with ginger.',
        price: 1200,
        category: 'Sides',
        imageUrl: '/assets/aistudio/pexels-jagaba-37126238_22267ce8.jpg',
      },
    ],
  },
  {
    id: 'sultan-suya-grills',
    name: 'Sultan Suya & Grills',
    cuisineTags: ['Suya & Grills', 'Quick Prep'],
    categoryKey: 'suya',
    rating: 4.8,
    reviewCount: 318,
    deliveryMinutes: '15–20 min',
    deliveryFee: 0,
    area: 'Surulere, Lagos',
    address: '45 Bode Thomas St, Surulere',
    lat: 6.4945,
    lng: 3.3568,
    heroImageUrl: '/assets/aistudio/pexels-jessicairoh-20419328_715fe24a.jpg',
    menu: [
      {
        id: 'sw-suya',
        restaurantId: 'sultan-suya-grills',
        name: 'Yaji Beef Suya Skewers Platter',
        description:
          'Charcoal-seared sirloin suya skewers fresh off the grill dusted with roasted peanut yaji.',
        price: 3600,
        category: 'Proteins',
        imageUrl: '/assets/aistudio/pexels-jessicairoh-20419328_715fe24a.jpg',
      },
      {
        id: 'sw-chicken',
        restaurantId: 'sultan-suya-grills',
        name: 'Smoky Jollof & Dodo Grill Pack',
        description:
          'Firewood jollof rice paired with sweet fried plantain and peppered suya meat.',
        price: 3900,
        category: 'Combos',
        imageUrl: '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
      },
      {
        id: 'sw-dodo',
        restaurantId: 'sultan-suya-grills',
        name: 'Peppered Plantain & Dodo Skewers',
        description:
          'Sweet golden plantain cubes skewered with crisp red onions and bell peppers.',
        price: 1800,
        category: 'Sides',
        imageUrl:
          '/assets/aistudio/pexels-ndagi-idris-2159907004-36458103_fd393f46.jpg',
      },
    ],
  },
  {
    id: 'chef-tunde-chops',
    name: 'Chef Tunde Breakfast & Small Chops',
    cuisineTags: ['Small Chops', 'Akara & Pap'],
    categoryKey: 'small_chops',
    rating: 4.8,
    reviewCount: 245,
    deliveryMinutes: '18–26 min',
    deliveryFee: 400,
    area: 'Port Harcourt, Rivers',
    address: '8 GRA Phase 2, Port Harcourt',
    lat: 4.8211,
    lng: 7.0184,
    heroImageUrl:
      '/assets/aistudio/pexels-prosper-buka-1289782307-28736731_1eb2145c.jpg',
    menu: [
      {
        id: 'ct-breakfast',
        restaurantId: 'chef-tunde-chops',
        name: 'The Big Breakfast Box (Akara, Toast & Pap)',
        description:
          'Crispy golden akara, buttered toast, fluffy omelet egg, and rich milk-swirl pap.',
        price: 3800,
        category: 'Combos',
        imageUrl:
          '/assets/aistudio/pexels-prosper-buka-1289782307-28736731_1eb2145c.jpg',
      },
      {
        id: 'ct-akara-pap',
        restaurantId: 'chef-tunde-chops',
        name: 'Hot Akara Box & Creamy Ogi Bowl',
        description:
          'Fresh bean cakes packed warm beside velvety yellow pap topped with evaporated milk.',
        price: 2800,
        category: 'Combos',
        imageUrl:
          '/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37324436_10d34b52.jpg',
      },
      {
        id: 'ct-puff',
        restaurantId: 'chef-tunde-chops',
        name: 'Owambe Akara, Puff-Puff & Fried Yam',
        description:
          'Warm crispy akara balls and golden fried yam slices ready for sharing.',
        price: 2400,
        category: 'Sides',
        imageUrl:
          '/assets/aistudio/pexels-finalchoice-147015110-40786356_312d796e.jpg',
      },
      {
        id: 'ct-feast',
        restaurantId: 'chef-tunde-chops',
        name: 'Chef Tunde Party Feast Spread',
        description:
          'Jollof rice, stir-fry noodles, grilled chicken, curried meat rice, and dipping sauces.',
        price: 6800,
        category: 'Combos',
        imageUrl: '/assets/aistudio/pexels-picswithjer-30246915_e571c980.jpg',
      },
      {
        id: 'ct-tigernut',
        restaurantId: 'chef-tunde-chops',
        name: 'Roasted Tiger Nuts (Aya) Snack Pack',
        description:
          'Crunchy sweet Nigerian tiger nuts packed fresh for snacking or blending kunu aya.',
        price: 1200,
        category: 'Sides',
        imageUrl:
          '/assets/aistudio/pexels-muhammad-shehu-1718177362-28752786_40c90821.jpg',
      },
    ],
  },
];

export const INITIAL_CART: CartEntry[] = [
  {
    item: RESTAURANTS[0].menu[0],
    quantity: 1,
  },
  {
    item: RESTAURANTS[0].menu[6],
    quantity: 1,
  },
];

export const INITIAL_ACTIVE_ORDER: ActiveOrder = {
  code: 'CN-4082',
  restaurantId: 'mama-put-express',
  restaurantName: 'Mama Put Express',
  restaurantArea: 'Eti-Osa, Lagos',
  restaurantAddress: '14 Admiralty Way, Lekki Phase 1',
  destination: '22 Admiralty Way, Eti-Osa, Lagos',
  distanceKm: 0.9,
  itemsSummary: '1x Smoky Party Jollof & Sweet Dodo, 1x Chilled Pineapple Zobo & Fruit Press',
  totalAmount: 4500,
  stage: 'on_the_way',
  etaMinutes: '12–16 mins',
  arrivalTime: '1:24 PM',
  rider: {
    name: 'Emeka Nwosu',
    phone: '0803 771 4290',
    vehicle: 'Honda Dispatch · Plate KJA-482',
    rating: 4.9,
    avatarUrl: '/src/assets/images/rider_portrait_avatar_1795004110734.jpg',
  },
};

export const INITIAL_USER: AuthUser = {
  name: 'Tunde Adewale',
  phone: '0805 112 9087',
  role: 'buyer',
  buyerArea: 'Eti-Osa, Lagos',
  buyerLandmark: '22 Admiralty Way, Lekki Phase 1',
};

export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}
