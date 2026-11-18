import {
  ArrowLeft,
  MapPin,
  Phone,
  Store,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import { findNearestDeliveryArea } from '../data/deliveryData';
import { AuthUser, FoodCategoryKey, Restaurant, UserRole } from '../types/delivery';
import { isValidNigerianPhone } from '../utils/image';
import { NigeriaLocationPicker } from './NigeriaLocationPicker';
import { Badge, Button, Card, Input, Select } from './ui';

interface AuthScreenProps {
  initialRole?: UserRole;
  user: AuthUser;
  restaurants: Restaurant[];
  promptMessage?: string | null;
  onLogin: (nextUser: AuthUser) => void;
  onCreateRestaurant: (input: {
    kitchenName: string;
    area: string;
    address: string;
    categoryKey: Exclude<FoodCategoryKey, 'all'>;
    coverImageUrl: string;
  }) => Restaurant;
  onBackToLanding?: () => void;
}

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

export function AuthScreen({
  initialRole = 'buyer',
  user,
  restaurants,
  promptMessage,
  onLogin,
  onCreateRestaurant,
  onBackToLanding,
}: AuthScreenProps) {
  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState(user.buyerArea || 'Eti-Osa, Lagos');
  const [landmark, setLandmark] = useState('');
  const [selectedKitchenId, setSelectedKitchenId] = useState(
    user.sellerRestaurantId ?? restaurants[0]?.id ?? ''
  );
  const [isNewKitchen, setIsNewKitchen] = useState(false);
  const [newKitchenName, setNewKitchenName] = useState('');
  const [newKitchenAddress, setNewKitchenAddress] = useState('');
  const [newKitchenCategory, setNewKitchenCategory] =
    useState<Exclude<FoodCategoryKey, 'all'>>('jollof');
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');

  function handleUseGps() {
    setError('');
    if (!('geolocation' in navigator)) {
      setError('GPS is unavailable on this browser. Pick your area below.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestDeliveryArea(
          pos.coords.latitude,
          pos.coords.longitude
        );
        setArea(nearest);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError('Could not access GPS permission. Pick your delivery area below.');
      },
      { timeout: 6000 }
    );
  }

  function handleFillSample() {
    setError('');
    if (role === 'buyer') {
      setName(user.name || 'Tunde Adewale');
      setPhone(user.phone || '0805 112 9087');
      setArea(user.buyerArea || 'Eti-Osa, Lagos');
      setLandmark(user.buyerLandmark || '22 Admiralty Way, Lekki Phase 1');
    } else {
      setName('Mrs. Folake Adeyemi');
      setPhone('0803 412 8890');
      setArea('Eti-Osa, Lagos');
      setLandmark('14 Admiralty Way, Lekki Phase 1');
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setError('Enter a valid Nigerian phone number (e.g. 0805 112 9087).');
      return;
    }

    if (role === 'buyer') {
      if (landmark.trim().length < 4) {
        setError('Enter your street or nearby delivery landmark.');
        return;
      }
      onLogin({
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        role: 'buyer',
        buyerArea: area,
        buyerLandmark: landmark.trim(),
        sellerRestaurantId: undefined,
      });
      return;
    }

    if (isNewKitchen) {
      if (newKitchenName.trim().length < 3) {
        setError('Enter your kitchen name (at least 3 characters).');
        return;
      }
      if (newKitchenAddress.trim().length < 4) {
        setError('Enter your kitchen street address.');
        return;
      }
      const created = onCreateRestaurant({
        kitchenName: newKitchenName.trim(),
        area,
        address: newKitchenAddress.trim(),
        categoryKey: newKitchenCategory,
        coverImageUrl:
          restaurants[0]?.heroImageUrl ??
          '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
      });
      onLogin({
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        role: 'seller',
        buyerArea: area,
        buyerLandmark: newKitchenAddress.trim(),
        sellerRestaurantId: created.id,
      });
      return;
    }

    const chosen = restaurants.find((r) => r.id === selectedKitchenId);
    onLogin({
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      role: 'seller',
      buyerArea: chosen?.area ?? area,
      buyerLandmark: chosen?.address ?? (landmark.trim() || 'Main Kitchen Pickup'),
      sellerRestaurantId: selectedKitchenId,
    });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-md">
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="mb-4 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-primary-soft/60 hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ChopBellyFull
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card padding="lg">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <UtensilsCrossed className="h-6 w-6" />
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <h1 className="font-heading text-2xl font-bold text-text-primary">
                  Welcome to ChopBellyFull
                </h1>
              </div>

              <p className="mt-1.5 text-sm text-text-secondary">
                {promptMessage ||
                  'Sign in or create a free account to order homemade meals or sell from your kitchen.'}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-full bg-bg p-1.5">
              <button
                type="button"
                onClick={() => {
                  setRole('buyer');
                  setError('');
                }}
                className={`flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  role === 'buyer'
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                I&apos;m a Buyer
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('seller');
                  setError('');
                }}
                className={`flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  role === 'seller'
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Store className="h-4 w-4 shrink-0" />
                I&apos;m a Seller
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Input
                id="auth-name"
                label={role === 'seller' ? 'Seller Name' : 'Full Name'}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  role === 'seller' ? 'e.g. Mrs. Folake Adeyemi' : 'e.g. Tunde Adewale'
                }
                icon={<User className="h-4 w-4" />}
              />

              <Input
                id="auth-phone"
                label="Nigerian Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0805 112 9087"
                icon={<Phone className="h-4 w-4" />}
                className="tabular-nums-clean"
              />

              {role === 'buyer' ? (
                <>
                  <NigeriaLocationPicker
                    value={area}
                    onChange={setArea}
                    onUseGps={handleUseGps}
                    isLocating={isLocating}
                    label="Your State & LGA"
                    compact
                  />
                  <Input
                    id="auth-landmark"
                    label="Delivery Street / Landmark"
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. 22 Admiralty Way, Lekki Phase 1"
                    icon={<MapPin className="h-4 w-4" />}
                  />
                </>
              ) : (
                <div className="space-y-3 rounded-[14px] bg-bg p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text-primary">
                      Select or Register Kitchen
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNewKitchen((prev) => !prev)}
                      className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
                    >
                      {isNewKitchen ? 'Use existing kitchen' : '+ New kitchen'}
                    </button>
                  </div>

                  {!isNewKitchen ? (
                    <Select
                      aria-label="Choose your kitchen"
                      value={selectedKitchenId}
                      onChange={(e) => setSelectedKitchenId(e.target.value)}
                    >
                      {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} · {r.area}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        id="auth-kitchen-name"
                        label="Kitchen Name"
                        type="text"
                        value={newKitchenName}
                        onChange={(e) => setNewKitchenName(e.target.value)}
                        placeholder="e.g. Mama Nkechi Buka"
                      />
                      <Input
                        id="auth-kitchen-address"
                        label="Kitchen Address"
                        type="text"
                        value={newKitchenAddress}
                        onChange={(e) => setNewKitchenAddress(e.target.value)}
                        placeholder="e.g. 19 Allen Avenue, Ikeja"
                      />
                      <NigeriaLocationPicker
                        value={area}
                        onChange={setArea}
                        compact
                        label="Kitchen State & LGA"
                      />
                      <Select
                        id="auth-kitchen-cat"
                        label="Specialty"
                        value={newKitchenCategory}
                        onChange={(e) =>
                          setNewKitchenCategory(
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
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-[12px] bg-error/10 px-3.5 py-2.5 text-xs font-semibold text-error">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" fullWidth>
                {role === 'seller'
                  ? 'Sign In & Start Selling'
                  : 'Login / Sign Up & Explore'}
              </Button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
                >
                  Use sample details
                </button>
                <Badge variant="peach">Free · No password needed</Badge>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
