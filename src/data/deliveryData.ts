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
    heroImageUrl: '/src/assets/images/plate_jollof_chicken_1795003763904.jpg',
    menu: [
      {
        id: 'mp-jollof',
        restaurantId: 'mama-put-express',
        name: 'Smoky Party Jollof & Chicken',
        description:
          'Firewood party jollof rice, crispy spiced chicken leg, sweet dodo plantains, and creamy coleslaw.',
        price: 3500,
        category: 'Combos',
        imageUrl: '/src/assets/images/plate_jollof_chicken_1795003763904.jpg',
      },
      {
        id: 'mp-ofada',
        restaurantId: 'mama-put-express',
        name: 'Ofada Rice & Ayamase Combo',
        description:
          'Local unpolished Ofada rice wrapped in uma leaf with spicy green ayamase stew, assorted meat, and egg.',
        price: 4000,
        category: 'Combos',
        imageUrl: '/src/assets/images/local_ofada_ayamase_1795006179378.jpg',
      },
      {
        id: 'mp-fried-turkey',
        restaurantId: 'mama-put-express',
        name: 'Festive Fried Rice, Turkey & Moi-Moi',
        description:
          'Classic Nigerian fried rice paired with peppered grilled turkey and leaf-steamed moi-moi.',
        price: 4200,
        category: 'Combos',
        imageUrl: '/src/assets/images/local_fried_rice_turkey_1795006182196.jpg',
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
        name: 'Peppered Assorted Beef & Turkey',
        description:
          'Flame-seared peppered beef and grilled turkey chunks tossed in rich ata-dindin pepper sauce.',
        price: 3200,
        category: 'Proteins',
        imageUrl: '/src/assets/images/plate_suya_platter_1795003765134.jpg',
      },
      {
        id: 'mp-beans',
        restaurantId: 'mama-put-express',
        name: 'Ewa Agoyin & Sweet Dodo',
        description:
          'Creamy honey beans finished with caramelized Agoyin pepper sauce and golden ripe plantain slices.',
        price: 2200,
        category: 'Sides',
        imageUrl: '/src/assets/images/plate_beans_dodo_1795003766399.jpg',
      },
      {
        id: 'mp-zobo',
        restaurantId: 'mama-put-express',
        name: 'Chilled Pineapple Zobo',
        description:
          'Spiced hibiscus cooler brewed with fresh pineapple, ginger root, and garden mint.',
        price: 1000,
        category: 'Sides',
        imageUrl: '/src/assets/images/food_hibiscus_zobo_drink_1795004109645.jpg',
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
    heroImageUrl: '/src/assets/images/plate_efo_riro_amala_1795003765371.jpg',
    menu: [
      {
        id: 'ib-amala',
        restaurantId: 'iya-basira-kitchen',
        name: 'Efo Riro & Hot Amala Bowl',
        description:
          'Rich palm-oil spinach stew with slow-braised goat meat, locust beans, and silky hot amala.',
        price: 4200,
        category: 'Swallows',
        imageUrl: '/src/assets/images/plate_efo_riro_amala_1795003765371.jpg',
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
        name: 'Buka Jollof & Fried Rice Duo',
        description:
          'Half firewood jollof, half festive fried rice with peppered turkey and moi-moi.',
        price: 4100,
        category: 'Combos',
        imageUrl: '/src/assets/images/local_fried_rice_turkey_1795006182196.jpg',
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
        name: 'Small Chops & Puff-Puff Box',
        description:
          'Golden Nigerian puff-puff balls, peppered gizzard bites, and crispy samosa.',
        price: 2000,
        category: 'Sides',
        imageUrl: '/src/assets/images/food_puff_puff_dessert_1795004109126.jpg',
      },
    ],
  },
  {
    id: 'auntie-ngozi-pot',
    name: 'Auntie Ngozi Pepper Soup Spot',
    cuisineTags: ['Pepper Soup', 'Boli & Fish'],
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
    heroImageUrl: '/src/assets/images/local_pepper_soup_1795006181565.jpg',
    menu: [
      {
        id: 'an-peppersoup',
        restaurantId: 'auntie-ngozi-pot',
        name: 'Goat Meat Pepper Soup & Boiled Yam',
        description:
          'Steaming aromatic Nigerian pepper soup simmered with scent leaves, uziza, and soft white yam.',
        price: 3800,
        category: 'Combos',
        imageUrl: '/src/assets/images/local_pepper_soup_1795006181565.jpg',
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
        id: 'an-ofada',
        restaurantId: 'auntie-ngozi-pot',
        name: 'Ofada Special & Boiled Egg',
        description:
          'Authentic leaf-wrapped Ofada rice with rich green designer stew and assorted meats.',
        price: 3900,
        category: 'Combos',
        imageUrl: '/src/assets/images/local_ofada_ayamase_1795006179378.jpg',
      },
      {
        id: 'an-zobo',
        restaurantId: 'auntie-ngozi-pot',
        name: 'Fresh Palm & Hibiscus Cooler',
        description:
          'Chilled hibiscus and pineapple drink spiced with cloves and ginger.',
        price: 1000,
        category: 'Sides',
        imageUrl: '/src/assets/images/food_hibiscus_zobo_drink_1795004109645.jpg',
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
    heroImageUrl: '/src/assets/images/plate_suya_platter_1795003765134.jpg',
    menu: [
      {
        id: 'sw-suya',
        restaurantId: 'sultan-suya-grills',
        name: 'Yaji Beef Suya Skewers Platter',
        description:
          'Tender flame-seared sirloin suya strips dusted with roasted peanut yaji, red onions, and tomatoes.',
        price: 3600,
        category: 'Proteins',
        imageUrl: '/src/assets/images/plate_suya_platter_1795003765134.jpg',
      },
      {
        id: 'sw-chicken',
        restaurantId: 'sultan-suya-grills',
        name: 'Loaded Suya Chicken Shawarma',
        description:
          'Char-grilled marinated chicken wrap with crunchy cabbage, pickles, and roasted garlic sauce.',
        price: 3200,
        category: 'Combos',
        imageUrl: '/src/assets/images/food_chicken_shawarma_1795004108793.jpg',
      },
      {
        id: 'sw-zobo',
        restaurantId: 'sultan-suya-grills',
        name: 'Chilled Zobo Splash',
        description:
          'Cold-pressed hibiscus drink infused with ginger and pineapple.',
        price: 1000,
        category: 'Sides',
        imageUrl: '/src/assets/images/food_hibiscus_zobo_drink_1795004109645.jpg',
      },
    ],
  },
  {
    id: 'chef-tunde-chops',
    name: 'Chef Tunde Small Chops & Grill',
    cuisineTags: ['Small Chops', 'Party Grill'],
    categoryKey: 'small_chops',
    rating: 4.7,
    reviewCount: 215,
    deliveryMinutes: '20–28 min',
    deliveryFee: 500,
    area: 'Port Harcourt, Rivers',
    address: '8 GRA Phase 2, Port Harcourt',
    lat: 4.8211,
    lng: 7.0184,
    heroImageUrl: '/src/assets/images/food_puff_puff_dessert_1795004109126.jpg',
    menu: [
      {
        id: 'ct-puff',
        restaurantId: 'chef-tunde-chops',
        name: 'Owambe Small Chops & Puff-Puff Tray',
        description:
          'Warm golden puff-puff bites, crispy spring rolls, samosas, and peppered stick meat.',
        price: 3500,
        category: 'Combos',
        imageUrl: '/src/assets/images/food_puff_puff_dessert_1795004109126.jpg',
      },
      {
        id: 'ct-boli',
        restaurantId: 'chef-tunde-chops',
        name: 'Grilled Boli & Tilapia Combo',
        description:
          'Charcoal-grilled tilapia with sweet roasted plantains and pepper sauce.',
        price: 4800,
        category: 'Proteins',
        imageUrl: '/src/assets/images/local_boli_fish_1795006182721.jpg',
      },
      {
        id: 'ct-burger',
        restaurantId: 'chef-tunde-chops',
        name: 'Double Suya Smash Burger',
        description:
          'Two seared beef patties, melted cheddar, yaji spice mayo, and toasted brioche bun.',
        price: 4500,
        category: 'Combos',
        imageUrl: '/src/assets/images/food_smash_burger_1795004108289.jpg',
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
  itemsSummary: '1x Smoky Party Jollof & Chicken, 1x Chilled Pineapple Zobo',
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
