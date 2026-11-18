import {
  Camera,
  CheckCircle2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
  User,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { findNearestDeliveryArea, formatNaira } from '../data/deliveryData';
import {
  ActiveOrder,
  AuthUser,
  FoodCategoryKey,
  Restaurant,
  ScreenId,
} from '../types/delivery';
import { compressFoodPhoto, isValidNigerianPhone } from '../utils/image';
import { MobileBottomNav } from './MobileBottomNav';
import { NigeriaLocationPicker } from './NigeriaLocationPicker';
import { getOrderBadge } from './OrderTrackingScreen';
import { PlateImage } from './PlateImage';
import { Badge, Button, Card, EmptyState, Input, Select } from './ui';

interface ProfileScreenProps {
  user: AuthUser;
  restaurants: Restaurant[];
  orders: ActiveOrder[];
  onUpdateProfile: (
    nextUser: AuthUser,
    kitchenPatch?: {
      id: string;
      name: string;
      address: string;
      area: string;
      categoryKey: Exclude<FoodCategoryKey, 'all'>;
    }
  ) => void;
  onToggleDishAvailability: (restaurantId: string, itemId: string) => void;
  onDeleteDish: (restaurantId: string, itemId: string) => void;
  onSelectOrder: (order: ActiveOrder) => void;
  onNavigateScreen: (screen: ScreenId) => void;
  onLogout: () => void;
  onResetDemo: () => void;
  overlayInset?: boolean;
  layoutMode?: 'frame' | 'responsive';
}

type ProfileSectionTab = 'posts' | 'orders' | 'edit';

const KITCHEN_CATEGORIES: {
  key: Exclude<FoodCategoryKey, 'all'>;
  label: string;
}[] = [
  { key: 'jollof', label: 'Rice & Jollof' },
  { key: 'swallows', label: 'Soups & Swallows' },
  { key: 'suya', label: 'Suya & Grills' },
  { key: 'small_chops', label: 'Snacks & Small Chops' },
  { key: 'pepper_soup', label: 'Pepper Soup' },
  { key: 'drinks', label: 'Drinks' },
];

export function ProfileScreen({
  user,
  restaurants,
  orders,
  onUpdateProfile,
  onToggleDishAvailability,
  onDeleteDish,
  onSelectOrder,
  onNavigateScreen,
  onLogout,
  onResetDemo,
  overlayInset = false,
  layoutMode = 'frame',
}: ProfileScreenProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const isResponsive = layoutMode === 'responsive';

  const myKitchen =
    restaurants.find((r) => r.id === user.sellerRestaurantId) ??
    (user.role === 'seller' ? restaurants[0] : undefined);
  const myPosts = myKitchen?.menu ?? [];

  const [section, setSection] = useState<ProfileSectionTab>(
    user.role === 'seller' ? 'posts' : 'orders'
  );

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [area, setArea] = useState(user.buyerArea);
  const [landmark, setLandmark] = useState(user.buyerLandmark);
  const [isLocating, setIsLocating] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);

  const [kitchenName, setKitchenName] = useState(myKitchen?.name ?? '');
  const [kitchenAddress, setKitchenAddress] = useState(myKitchen?.address ?? '');
  const [kitchenArea, setKitchenArea] = useState(
    myKitchen?.area ?? user.buyerArea
  );
  const [kitchenCategory, setKitchenCategory] = useState<
    Exclude<FoodCategoryKey, 'all'>
  >(myKitchen?.categoryKey ?? 'jollof');

  const [error, setError] = useState('');
  const [savedNote, setSavedNote] = useState('');

  async function handleAvatarSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsProcessingAvatar(true);
    try {
      const compressed = await compressFoodPhoto(file);
      setAvatarUrl(compressed);
      onUpdateProfile({
        ...user,
        avatarUrl: compressed,
      });
      setSavedNote('Profile photo updated.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not process profile photo.'
      );
    } finally {
      setIsProcessingAvatar(false);
    }
  }

  function handleUseGps() {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setArea(
          findNearestDeliveryArea(pos.coords.latitude, pos.coords.longitude)
        );
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 6000 }
    );
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSavedNote('');

    if (name.trim().length < 2) {
      setError('Enter your full name (at least 2 characters).');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setError('Enter a valid Nigerian phone number (e.g. 0805 112 9087).');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address or leave it blank.');
      return;
    }
    if (landmark.trim().length < 4) {
      setError('Enter your delivery street or landmark.');
      return;
    }

    let kitchenPatch:
      | {
          id: string;
          name: string;
          address: string;
          area: string;
          categoryKey: Exclude<FoodCategoryKey, 'all'>;
        }
      | undefined;

    if (myKitchen) {
      if (kitchenName.trim().length < 3) {
        setError('Enter your kitchen name (at least 3 characters).');
        return;
      }
      if (kitchenAddress.trim().length < 4) {
        setError('Enter your kitchen street address.');
        return;
      }
      kitchenPatch = {
        id: myKitchen.id,
        name: kitchenName.trim(),
        address: kitchenAddress.trim(),
        area: kitchenArea,
        categoryKey: kitchenCategory,
      };
    }

    onUpdateProfile(
      {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
        buyerArea: area,
        buyerLandmark: landmark.trim(),
      },
      kitchenPatch
    );
    setSavedNote('Profile saved successfully!');
  }

  return (
    <div className="relative flex h-full flex-col bg-bg">
      <div
        className={`no-scrollbar flex-1 overflow-y-auto ${
          isResponsive
            ? 'px-4 pt-5 pb-24 md:px-6 md:pt-8 md:pb-12'
            : `px-4 pb-24 ${overlayInset ? 'pt-12' : 'pt-4'}`
        }`}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          <Card padding="md">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelected}
                  className="hidden"
                />
                <div className="relative h-18 w-18 shrink-0">
                  <div className="h-full w-full overflow-hidden rounded-full bg-primary-soft ring-2 ring-primary/30">
                    {avatarUrl ? (
                      <PlateImage
                        src={avatarUrl}
                        alt={user.name}
                        className="h-full w-full"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-primary">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isProcessingAvatar}
                    aria-label="Upload profile photo"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -right-1 -bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-soft transition-colors hover:bg-primary-dark"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-heading truncate text-xl font-bold text-text-primary">
                      {user.name}
                    </h1>
                    <Badge variant="peach">
                      {user.role === 'seller' ? 'Seller' : 'Buyer'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {user.phone}
                    {user.email ? ` · ${user.email}` : ''}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-primary">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {user.buyerLandmark} · {user.buyerArea}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSection('edit')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  onClick={onLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(
              [
                { id: 'posts', label: `My Posts (${myPosts.length})` },
                { id: 'orders', label: `My Orders (${orders.length})` },
                { id: 'edit', label: 'Edit Profile' },
              ] as const
            ).map((tab) => {
              const isSelected = section === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSection(tab.id)}
                  className={`min-h-[40px] shrink-0 cursor-pointer rounded-full px-5 text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isSelected
                      ? 'bg-primary text-white shadow-soft'
                      : 'border border-border-soft bg-surface text-text-secondary hover:bg-primary-soft/50 hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {section === 'posts' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-heading text-lg font-bold text-text-primary">
                    My Food Posts
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {myKitchen
                      ? `Manage plates listed under ${myKitchen.name}`
                      : 'Switch to Seller or post a plate to see your dishes here.'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onNavigateScreen('post')}
                >
                  + Post New Food
                </Button>
              </div>

              {myPosts.length === 0 || !myKitchen ? (
                <EmptyState
                  emoji="🍲"
                  title="No food posted yet. Be the first! 🍲"
                  description="Snap a plate from your kitchen and share it with nearby ChopBellyFull buyers."
                  actionLabel="Post Food"
                  onAction={() => onNavigateScreen('post')}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {myPosts.map((post) => {
                    const isAvailable = post.isAvailable !== false;
                    return (
                      <Card
                        key={post.id}
                        padding="sm"
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-primary-soft">
                            <PlateImage
                              src={post.imageUrl}
                              alt={post.name}
                              className="h-full w-full"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-heading truncate text-sm font-bold text-text-primary">
                              {post.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="tabular-nums-clean text-xs font-bold text-primary">
                                {formatNaira(post.price)}
                              </span>
                              <Badge variant={isAvailable ? 'success' : 'error'}>
                                {isAvailable ? 'Available' : 'Out of stock'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onToggleDishAvailability(myKitchen.id, post.id)
                            }
                            className="min-h-[36px] cursor-pointer rounded-full border border-border-soft bg-bg px-3 text-xs font-semibold text-text-primary transition-colors hover:bg-primary-soft"
                          >
                            {isAvailable ? 'Mark Out' : 'Restock'}
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${post.name}`}
                            onClick={() => onDeleteDish(myKitchen.id, post.id)}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {section === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-bold text-text-primary">
                  My Orders
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigateScreen('home')}
                >
                  Browse Plates
                </Button>
              </div>

              {orders.length === 0 ? (
                <EmptyState
                  emoji="🛍️"
                  title="No orders yet"
                  description="Your active and past ChopBellyFull orders will show up right here."
                  actionLabel="Explore Food"
                  onAction={() => onNavigateScreen('home')}
                />
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const badge = getOrderBadge(order.stage);
                    return (
                      <Card
                        key={order.code}
                        padding="md"
                        interactive
                        className="cursor-pointer"
                        onClick={() => {
                          onSelectOrder(order);
                          onNavigateScreen('orders');
                        }}
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-primary-soft">
                              <PlateImage
                                src={
                                  order.plateImageUrl ??
                                  '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg'
                                }
                                alt={order.itemsSummary}
                                className="h-full w-full"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="tabular-nums-clean text-xs font-bold text-text-secondary">
                                  #{order.code}
                                </span>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </div>
                              <p className="font-heading mt-1 truncate text-sm font-bold text-text-primary">
                                {order.restaurantName}
                              </p>
                              <p className="truncate text-xs text-text-secondary">
                                {order.itemsSummary}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                            <span className="tabular-nums-clean font-heading text-base font-bold text-primary">
                              {formatNaira(order.totalAmount)}
                            </span>
                            <span className="text-xs font-semibold text-primary">
                              Track order →
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {section === 'edit' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <Card padding="md" className="space-y-4">
                <h2 className="font-heading text-lg font-bold text-text-primary">
                  Edit Your Profile
                </h2>

                {savedNote && (
                  <div className="flex items-center gap-2 rounded-[14px] bg-success/12 px-4 py-3 text-xs font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{savedNote}</span>
                  </div>
                )}

                <Input
                  id="profile-edit-name"
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User className="h-4 w-4" />}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    id="profile-edit-phone"
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    icon={<Phone className="h-4 w-4" />}
                    className="tabular-nums-clean"
                  />
                  <Input
                    id="profile-edit-email"
                    label="Email Address (Optional)"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    icon={<Mail className="h-4 w-4" />}
                  />
                </div>

                <NigeriaLocationPicker
                  value={area}
                  onChange={setArea}
                  onUseGps={handleUseGps}
                  isLocating={isLocating}
                  label="Default Delivery State & LGA"
                />

                <Input
                  id="profile-edit-landmark"
                  label="Street / Delivery Landmark"
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </Card>

              {myKitchen && (
                <Card padding="md" className="space-y-4">
                  <h3 className="font-heading text-base font-bold text-text-primary">
                    Edit Kitchen Details
                  </h3>
                  <Input
                    id="profile-kitchen-name"
                    label="Kitchen Name"
                    type="text"
                    value={kitchenName}
                    onChange={(e) => setKitchenName(e.target.value)}
                  />
                  <Input
                    id="profile-kitchen-address"
                    label="Kitchen Address"
                    type="text"
                    value={kitchenAddress}
                    onChange={(e) => setKitchenAddress(e.target.value)}
                  />
                  <NigeriaLocationPicker
                    value={kitchenArea}
                    onChange={setKitchenArea}
                    compact
                    label="Kitchen State & LGA"
                  />
                  <Select
                    id="profile-kitchen-cat"
                    label="Kitchen Specialty"
                    value={kitchenCategory}
                    onChange={(e) =>
                      setKitchenCategory(
                        e.target.value as Exclude<FoodCategoryKey, 'all'>
                      )
                    }
                  >
                    {KITCHEN_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Card>
              )}

              {error && (
                <div className="rounded-[14px] bg-error/10 px-4 py-3 text-xs font-semibold text-error">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="submit" size="lg">
                  Save Profile Changes
                </Button>

                <button
                  type="button"
                  onClick={onResetDemo}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-text-secondary transition-colors hover:bg-primary-soft/60 hover:text-text-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Demo Data
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <MobileBottomNav
        activeNav="profile"
        onSelect={(nav) => {
          if (nav === 'home' || nav === 'search') onNavigateScreen('home');
          if (nav === 'post') onNavigateScreen('post');
          if (nav === 'orders') onNavigateScreen('orders');
          if (nav === 'profile') onNavigateScreen('profile');
        }}
        orderCount={orders.length}
        className={`absolute right-0 bottom-0 left-0 ${
          isResponsive ? 'md:hidden' : ''
        }`}
      />
    </div>
  );
}
