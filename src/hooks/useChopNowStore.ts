import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_SESSION,
  SEED_FOOD_POSTS,
  SEED_ORDERS,
  SEED_SELLERS,
} from '../data/seedData';
import {
  FoodCategory,
  FoodPost,
  Order,
  OrderStatus,
  SellerProfile,
  UserSession,
} from '../types/chopnow';

const STORAGE_KEYS = {
  posts: 'chopnow_v1_posts',
  orders: 'chopnow_v1_orders',
  sellers: 'chopnow_v1_sellers',
  session: 'chopnow_v1_session',
} as const;

const SYNC_CHANNEL = 'chopnow_marketplace_sync';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors cleanly
  }
}

export interface CreatePostInput {
  sellerId: string;
  title: string;
  description: string;
  category: FoodCategory;
  price: number;
  prepMinutes: number;
  imageUrl: string;
}

export interface CreateOrderInput {
  post: FoodPost;
  quantity: number;
  buyerName: string;
  buyerPhone: string;
  deliveryLandmark: string;
}

export function useChopNowStore() {
  const [sellers, setSellers] = useState<SellerProfile[]>(() =>
    readStorage(STORAGE_KEYS.sellers, SEED_SELLERS)
  );
  const [posts, setPosts] = useState<FoodPost[]>(() =>
    readStorage(STORAGE_KEYS.posts, SEED_FOOD_POSTS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    readStorage(STORAGE_KEYS.orders, SEED_ORDERS)
  );
  const [session, setSession] = useState<UserSession>(() =>
    readStorage(STORAGE_KEYS.session, DEFAULT_SESSION)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const broadcastSync = useCallback(() => {
    try {
      const channel = new BroadcastChannel(SYNC_CHANNEL);
      channel.postMessage({ type: 'sync', at: Date.now() });
      channel.close();
    } catch {
      // BroadcastChannel not supported in older browsers
    }
  }, []);

  const reloadFromStorage = useCallback(() => {
    setSellers(readStorage(STORAGE_KEYS.sellers, SEED_SELLERS));
    setPosts(readStorage(STORAGE_KEYS.posts, SEED_FOOD_POSTS));
    setOrders(readStorage(STORAGE_KEYS.orders, SEED_ORDERS));
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === STORAGE_KEYS.posts ||
        event.key === STORAGE_KEYS.orders ||
        event.key === STORAGE_KEYS.sellers
      ) {
        reloadFromStorage();
      }
    };

    window.addEventListener('storage', onStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SYNC_CHANNEL);
      channel.onmessage = () => reloadFromStorage();
    } catch {
      channel = null;
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.close();
    };
  }, [reloadFromStorage]);

  const updateSession = useCallback((patch: Partial<UserSession>) => {
    setSession((prev) => {
      const next = { ...prev, ...patch };
      writeStorage(STORAGE_KEYS.session, next);
      return next;
    });
  }, []);

  const registerSeller = useCallback(
    (input: Omit<SellerProfile, 'id'>): SellerProfile => {
      const created: SellerProfile = {
        ...input,
        id: `seller-${Date.now()}`,
      };
      setSellers((prev) => {
        const next = [created, ...prev];
        writeStorage(STORAGE_KEYS.sellers, next);
        return next;
      });
      broadcastSync();
      return created;
    },
    [broadcastSync]
  );

  const addFoodPost = useCallback(
    (input: CreatePostInput): FoodPost => {
      const seller =
        sellers.find((s) => s.id === input.sellerId) ?? sellers[0];

      const newPost: FoodPost = {
        id: `post-${Date.now()}`,
        sellerId: seller.id,
        kitchenName: seller.kitchenName,
        area: seller.area,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        price: Math.round(input.price),
        prepMinutes: Math.max(5, Math.round(input.prepMinutes)),
        imageUrl: input.imageUrl,
        isAvailable: true,
        createdAt: new Date().toISOString(),
      };

      setPosts((prev) => {
        const next = [newPost, ...prev];
        writeStorage(STORAGE_KEYS.posts, next);
        return next;
      });
      broadcastSync();
      return newPost;
    },
    [sellers, broadcastSync]
  );

  const togglePostAvailability = useCallback(
    (postId: string) => {
      setPosts((prev) => {
        const next = prev.map((post) =>
          post.id === postId
            ? { ...post, isAvailable: !post.isAvailable }
            : post
        );
        writeStorage(STORAGE_KEYS.posts, next);
        return next;
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const deleteFoodPost = useCallback(
    (postId: string) => {
      setPosts((prev) => {
        const next = prev.filter((post) => post.id !== postId);
        writeStorage(STORAGE_KEYS.posts, next);
        return next;
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const placeOrder = useCallback(
    (input: CreateOrderInput): Order => {
      const seller = sellers.find((s) => s.id === input.post.sellerId);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const nowIso = new Date().toISOString();

      const newOrder: Order = {
        id: `order-${Date.now()}`,
        code: `CN-${randomNum}`,
        foodPostId: input.post.id,
        plateTitle: input.post.title,
        plateImageUrl: input.post.imageUrl,
        unitPrice: input.post.price,
        quantity: input.quantity,
        totalPrice: input.post.price * input.quantity,
        buyerName: input.buyerName.trim(),
        buyerPhone: input.buyerPhone.trim(),
        deliveryLandmark: input.deliveryLandmark.trim(),
        sellerId: input.post.sellerId,
        kitchenName: input.post.kitchenName,
        sellerPhone: seller?.phone ?? '0803 000 0000',
        status: 'placed',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setOrders((prev) => {
        const next = [newOrder, ...prev];
        writeStorage(STORAGE_KEYS.orders, next);
        return next;
      });
      broadcastSync();
      return newOrder;
    },
    [sellers, broadcastSync]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) => {
        const next = prev.map((order) =>
          order.id === orderId
            ? { ...order, status, updatedAt: new Date().toISOString() }
            : order
        );
        writeStorage(STORAGE_KEYS.orders, next);
        return next;
      });
      broadcastSync();
    },
    [broadcastSync]
  );

  const refreshFeed = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    reloadFromStorage();
    setIsRefreshing(false);
  }, [reloadFromStorage]);

  const resetDemoData = useCallback(() => {
    writeStorage(STORAGE_KEYS.sellers, SEED_SELLERS);
    writeStorage(STORAGE_KEYS.posts, SEED_FOOD_POSTS);
    writeStorage(STORAGE_KEYS.orders, SEED_ORDERS);
    setSellers(SEED_SELLERS);
    setPosts(SEED_FOOD_POSTS);
    setOrders(SEED_ORDERS);
    broadcastSync();
  }, [broadcastSync]);

  return {
    sellers,
    posts,
    orders,
    session,
    isRefreshing,
    updateSession,
    registerSeller,
    addFoodPost,
    togglePostAvailability,
    deleteFoodPost,
    placeOrder,
    updateOrderStatus,
    refreshFeed,
    resetDemoData,
  };
}
