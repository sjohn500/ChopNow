import {
  Camera,
  CheckCircle2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Store,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import {
  findNearestDeliveryArea,
  formatNaira,
} from '../data/deliveryData';
import {
  ActiveOrder,
  AuthUser,
  FoodCategoryKey,
  MenuItem,
  Restaurant,
  TrackingStage,
} from '../types/delivery';
import { compressFoodPhoto, isValidNigerianPhone } from '../utils/image';
import { NigeriaLocationPicker } from './NigeriaLocationPicker';
import { PlateImage } from './PlateImage';

export type AccountPortalTab = 'buyer' | 'seller' | 'profile';

interface AccountPortalModalProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  initialTab?: AccountPortalTab;
  user: AuthUser;
  restaurants: Restaurant[];
  activeOrder: ActiveOrder;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
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
  onCreateRestaurant: (input: {
    kitchenName: string;
    area: string;
    address: string;
    categoryKey: Exclude<FoodCategoryKey, 'all'>;
    coverImageUrl: string;
  }) => Restaurant;
  onPublishDish: (input: {
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    category: MenuItem['category'];
    imageUrl: string;
    setAsCover: boolean;
  }) => void;
  onUpdateOrderStage: (stage: TrackingStage) => void;
  onGoToFeed?: () => void;
  onResetDemo: () => void;
}

const DISH_CATEGORIES: MenuItem['category'][] = [
  'Combos',
  'Swallows',
  'Proteins',
  'Sides',
];

const KITCHEN_CATEGORIES: {
  key: Exclude<FoodCategoryKey, 'all'>;
  label: string;
}[] = [
  { key: 'jollof', label: 'Jollof & Rice' },
  { key: 'swallows', label: 'Swallows & Soup' },
  { key: 'suya', label: 'Suya & Grills' },
  { key: 'small_chops', label: 'Small Chops' },
  { key: 'pepper_soup', label: 'Pepper Soup' },
  { key: 'drinks', label: 'Palm Wine/Drinks' },
];

export function AccountPortalModal({
  isOpen,
  isAuthenticated,
  initialTab,
  user,
  restaurants,
  activeOrder,
  onClose,
  onLogin,
  onUpdateProfile,
  onCreateRestaurant,
  onPublishDish,
  onUpdateOrderStage,
  onGoToFeed,
  onResetDemo,
}: AccountPortalModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const resolvedInitialTab: AccountPortalTab =
    !isAuthenticated && initialTab === 'profile'
      ? 'buyer'
      : (initialTab ?? user.role);

  const [tab, setTab] = useState<AccountPortalTab>(resolvedInitialTab);

  const [buyerName, setBuyerName] = useState(
    isAuthenticated ? user.name : ''
  );
  const [buyerPhone, setBuyerPhone] = useState(
    isAuthenticated ? user.phone : ''
  );
  const [buyerArea, setBuyerArea] = useState(user.buyerArea);
  const [buyerLandmark, setBuyerLandmark] = useState(
    isAuthenticated ? user.buyerLandmark : ''
  );
  const [isLocating, setIsLocating] = useState(false);

  const isSellerLoggedIn =
    isAuthenticated &&
    user.role === 'seller' &&
    Boolean(user.sellerRestaurantId);
  const activeSellerKitchen = restaurants.find(
    (r) => r.id === user.sellerRestaurantId
  );

  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone);
  const [profileEmail, setProfileEmail] = useState(user.email ?? '');
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl ?? '');
  const [profileArea, setProfileArea] = useState(user.buyerArea);
  const [profileLandmark, setProfileLandmark] = useState(user.buyerLandmark);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);

  const [editKitchenName, setEditKitchenName] = useState(
    activeSellerKitchen?.name ?? ''
  );
  const [editKitchenAddress, setEditKitchenAddress] = useState(
    activeSellerKitchen?.address ?? ''
  );
  const [editKitchenArea, setEditKitchenArea] = useState(
    activeSellerKitchen?.area ?? user.buyerArea
  );
  const [editKitchenCategory, setEditKitchenCategory] = useState<
    Exclude<FoodCategoryKey, 'all'>
  >(activeSellerKitchen?.categoryKey ?? 'jollof');

  const [sellerName, setSellerName] = useState(
    user.role === 'seller' ? user.name : 'Mrs. Folake Adeyemi'
  );
  const [sellerPhone, setSellerPhone] = useState(
    user.role === 'seller' ? user.phone : '0803 412 8890'
  );
  const [selectedKitchenId, setSelectedKitchenId] = useState(
    user.sellerRestaurantId ?? restaurants[0]?.id ?? ''
  );
  const [isNewKitchen, setIsNewKitchen] = useState(false);
  const [newKitchenName, setNewKitchenName] = useState('');
  const [newKitchenArea, setNewKitchenArea] =
    useState<string>('Eti-Osa, Lagos');
  const [newKitchenAddress, setNewKitchenAddress] = useState('');
  const [newKitchenType, setNewKitchenType] =
    useState<Exclude<FoodCategoryKey, 'all'>>('jollof');

  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishCategory, setDishCategory] =
    useState<MenuItem['category']>('Combos');
  const [dishPhotoUrl, setDishPhotoUrl] = useState('');
  const [setAsCover, setSetAsCover] = useState(true);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [successNote, setSuccessNote] = useState('');

  if (!isOpen) return null;

  function handleUseGps(target: 'buyer' | 'profile' = 'buyer') {
    setError('');
    if (!('geolocation' in navigator)) {
      setError('GPS is unavailable on this browser. Choose your area manually.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestDeliveryArea(
          pos.coords.latitude,
          pos.coords.longitude
        );
        if (target === 'profile') {
          setProfileArea(nearest);
        } else {
          setBuyerArea(nearest);
        }
        setIsLocating(false);
        setSuccessNote(`Matched your closest delivery zone: ${nearest}`);
      },
      () => {
        setIsLocating(false);
        setError('Could not access GPS permission. Pick your delivery area below.');
      },
      { timeout: 6000 }
    );
  }

  async function handleAvatarSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsProcessingAvatar(true);
    try {
      const compressed = await compressFoodPhoto(file);
      setProfileAvatar(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not process profile photo.'
      );
    } finally {
      setIsProcessingAvatar(false);
    }
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessNote('');

    if (profileName.trim().length < 2) {
      setError('Enter your full name (at least 2 characters).');
      return;
    }
    if (!isValidNigerianPhone(profilePhone)) {
      setError('Enter a valid Nigerian phone number (e.g. 0805 112 9087).');
      return;
    }
    if (
      profileEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim())
    ) {
      setError('Enter a valid email address or leave it blank.');
      return;
    }
    if (profileLandmark.trim().length < 4) {
      setError('Enter your street or nearby delivery landmark.');
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

    if (isSellerLoggedIn && activeSellerKitchen) {
      if (editKitchenName.trim().length < 3) {
        setError('Enter your kitchen name (at least 3 characters).');
        return;
      }
      if (editKitchenAddress.trim().length < 4) {
        setError('Enter your kitchen street address.');
        return;
      }
      kitchenPatch = {
        id: activeSellerKitchen.id,
        name: editKitchenName.trim(),
        address: editKitchenAddress.trim(),
        area: editKitchenArea,
        categoryKey: editKitchenCategory,
      };
    }

    const updatedUser: AuthUser = {
      ...user,
      name: profileName.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim() || undefined,
      avatarUrl: profileAvatar || undefined,
      buyerArea: profileArea,
      buyerLandmark: profileLandmark.trim(),
    };

    onUpdateProfile(updatedUser, kitchenPatch);
    setBuyerName(updatedUser.name);
    setBuyerPhone(updatedUser.phone);
    setBuyerArea(updatedUser.buyerArea);
    setBuyerLandmark(updatedUser.buyerLandmark);
    setSuccessNote('Profile changes saved!');
  }

  function handleBuyerSignIn(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessNote('');

    if (buyerName.trim().length < 2) {
      setError('Enter your name so kitchens know who is ordering.');
      return;
    }
    if (!isValidNigerianPhone(buyerPhone)) {
      setError('Enter a valid Nigerian phone number (e.g. 0805 112 9087).');
      return;
    }
    if (buyerLandmark.trim().length < 4) {
      setError('Enter your street or nearby landmark for delivery.');
      return;
    }

    onLogin({
      ...user,
      name: buyerName.trim(),
      phone: buyerPhone.trim(),
      role: 'buyer',
      buyerArea,
      buyerLandmark: buyerLandmark.trim(),
      sellerRestaurantId: undefined,
    });
    onClose();
  }

  function handleSellerLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessNote('');

    if (sellerName.trim().length < 2) {
      setError('Enter your name (e.g. Mrs. Folake Adeyemi).');
      return;
    }

    if (!isValidNigerianPhone(sellerPhone)) {
      setError('Enter a valid Nigerian phone number (e.g. 0803 412 8890).');
      return;
    }

    if (isNewKitchen) {
      if (newKitchenName.trim().length < 3) {
        setError('Enter your kitchen name (at least 3 characters).');
        return;
      }
      if (newKitchenAddress.trim().length < 4) {
        setError('Enter your kitchen street address so buyers can find it.');
        return;
      }

      const created = onCreateRestaurant({
        kitchenName: newKitchenName.trim(),
        area: newKitchenArea,
        address: newKitchenAddress.trim(),
        categoryKey: newKitchenType,
        coverImageUrl:
          restaurants[0]?.heroImageUrl ??
          '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
      });

      onLogin({
        ...user,
        name: sellerName.trim(),
        phone: sellerPhone.trim(),
        role: 'seller',
        buyerArea: newKitchenArea,
        buyerLandmark: newKitchenAddress.trim(),
        sellerRestaurantId: created.id,
      });
      setSelectedKitchenId(created.id);
      setIsNewKitchen(false);
      setSuccessNote(
        `Signed in to ${created.name}. Upload your first real food photo below!`
      );
      return;
    }

    const chosen = restaurants.find((r) => r.id === selectedKitchenId);
    onLogin({
      ...user,
      name: sellerName.trim(),
      phone: sellerPhone.trim(),
      role: 'seller',
      buyerArea: chosen?.area ?? user.buyerArea,
      buyerLandmark: user.buyerLandmark,
      sellerRestaurantId: selectedKitchenId,
    });
    setSuccessNote(
      `Signed in to ${chosen?.name ?? 'your kitchen'}. Post your food photo below.`
    );
  }

  async function handlePhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressFoodPhoto(file);
      setDishPhotoUrl(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not process food photo.'
      );
    } finally {
      setIsProcessingPhoto(false);
    }
  }

  function handlePublishDish(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessNote('');

    if (!activeSellerKitchen) {
      setError('Sign in to a kitchen first.');
      return;
    }

    if (!dishPhotoUrl) {
      setError('Take or upload a real photo of your food plate first.');
      return;
    }

    if (dishName.trim().length < 3) {
      setError('Enter the dish name (e.g. Special Fried Rice & Turkey).');
      return;
    }

    const parsedPrice = Number(dishPrice.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedPrice) || parsedPrice < 300) {
      setError('Enter a valid Naira price (at least ₦300).');
      return;
    }

    if (dishDescription.trim().length < 8) {
      setError('Add a short description (sides, protein, or portion size).');
      return;
    }

    onPublishDish({
      restaurantId: activeSellerKitchen.id,
      name: dishName.trim(),
      description: dishDescription.trim(),
      price: Math.round(parsedPrice),
      category: dishCategory,
      imageUrl: dishPhotoUrl,
      setAsCover,
    });

    setDishName('');
    setDishPrice('');
    setDishDescription('');
    setDishPhotoUrl('');
    setSuccessNote(
      `Published! Buyers near ${activeSellerKitchen.area} can now see and order this dish.`
    );
  }

  function handleSwitchToBuyer() {
    onLogin({
      ...user,
      role: 'buyer',
      sellerRestaurantId: undefined,
    });
    setTab('buyer');
    setError('');
    setSuccessNote('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1E1916]/50 backdrop-blur-xs md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-portal-title"
    >
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#FAF6F1] p-5 pb-8 shadow-2xl md:max-w-xl md:rounded-[24px] md:p-6">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E6DDD3] md:hidden" />

        <div className="flex items-start justify-between gap-4 border-b border-[#E6DDD3] pb-4">
          <div>
            <h2
              id="account-portal-title"
              className="font-display text-xl font-extrabold text-[#1E1916]"
            >
              {isAuthenticated
                ? 'ChopBellyFull Account'
                : 'Sign In or Sign Up'}
            </h2>
            <p className="mt-0.5 text-xs text-[#635850]">
              {isAuthenticated
                ? 'Switch between Buyer & Seller or update your profile.'
                : 'Sign in or create a free Buyer or Seller account first before exploring kitchens.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1E1916] shadow-xs"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`mt-4 grid gap-1 rounded-2xl bg-[#F3E7D3] p-1 ${
            isAuthenticated ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setTab('buyer');
              setError('');
              setSuccessNote('');
            }}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm ${
              tab === 'buyer'
                ? 'bg-white text-[#1E1916] shadow-xs'
                : 'text-[#635850] hover:text-[#1E1916]'
            }`}
          >
            <User className="h-4 w-4 shrink-0 text-[#D9232E]" />
            {isAuthenticated ? 'Buyer' : 'Buyer Sign Up / Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('seller');
              setError('');
              setSuccessNote('');
            }}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm ${
              tab === 'seller'
                ? 'bg-white text-[#1E1916] shadow-xs'
                : 'text-[#635850] hover:text-[#1E1916]'
            }`}
          >
            <Store className="h-4 w-4 shrink-0 text-[#D9232E]" />
            {isAuthenticated ? 'Seller & Post' : 'Seller Login / Sign Up'}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setTab('profile');
                setError('');
                setSuccessNote('');
              }}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold whitespace-nowrap transition-colors sm:text-sm ${
                tab === 'profile'
                  ? 'bg-white text-[#1E1916] shadow-xs'
                  : 'text-[#635850] hover:text-[#1E1916]'
              }`}
            >
              <Pencil className="h-3.5 w-3.5 shrink-0 text-[#D9232E]" />
              Edit Profile
            </button>
          )}
        </div>

        {successNote && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#F3E7D3] px-4 py-3 text-xs font-semibold text-[#1E1916]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D9232E]" />
            <span>{successNote}</span>
          </div>
        )}

        {tab === 'profile' ? (
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
            <div className="soft-card-shadow space-y-4 rounded-[20px] bg-white p-4">
              <div className="flex items-center gap-4">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelected}
                  className="hidden"
                />
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#F3E7D3] ring-2 ring-[#E6DDD3]">
                  {profileAvatar ? (
                    <PlateImage
                      src={profileAvatar}
                      alt={profileName || 'Profile avatar'}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#D9232E]">
                      <User className="h-7 w-7" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display truncate text-sm font-bold text-[#1E1916]">
                    {profileName || user.name}
                  </p>
                  <p className="text-[11px] font-medium text-[#5C5049]">
                    {user.role === 'seller'
                      ? 'Seller & Kitchen Profile'
                      : 'Buyer Profile'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#F3E7D3] px-3 text-xs font-bold text-[#1E1916] hover:bg-[#E8D5B7]"
                    >
                      <Camera className="h-3.5 w-3.5 text-[#D9232E]" />
                      {isProcessingAvatar
                        ? 'Uploading...'
                        : profileAvatar
                          ? 'Change Photo'
                          : 'Upload Photo'}
                    </button>
                    {profileAvatar && (
                      <button
                        type="button"
                        onClick={() => setProfileAvatar('')}
                        aria-label="Remove profile photo"
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-[#FAF6F1] px-2.5 text-xs font-semibold text-[#5C5049] hover:text-[#D9232E]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="profile-name"
                  className="mb-1 block text-xs font-semibold text-[#1E1916]"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                  <input
                    id="profile-name"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your full name"
                    className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-phone"
                    className="mb-1 block text-xs font-semibold text-[#1E1916]"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                    <input
                      id="profile-phone"
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="0805 112 9087"
                      className="tabular-nums-clean min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-1 block text-xs font-semibold text-[#1E1916]"
                  >
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                    <input
                      id="profile-email"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <NigeriaLocationPicker
                value={profileArea}
                onChange={setProfileArea}
                onUseGps={() => handleUseGps('profile')}
                isLocating={isLocating}
                label="Default Delivery State & LGA"
              />

              <div>
                <label
                  htmlFor="profile-landmark"
                  className="mb-1 block text-xs font-semibold text-[#1E1916]"
                >
                  Street / Delivery Landmark
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                  <input
                    id="profile-landmark"
                    type="text"
                    value={profileLandmark}
                    onChange={(e) => setProfileLandmark(e.target.value)}
                    placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                    className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {isSellerLoggedIn && activeSellerKitchen && (
              <div className="soft-card-shadow space-y-3 rounded-[20px] bg-white p-4">
                <p className="font-display text-sm font-bold text-[#1E1916]">
                  Edit Kitchen Details
                </p>
                <div>
                  <label
                    htmlFor="edit-kitchen-name"
                    className="mb-1 block text-xs font-semibold text-[#1E1916]"
                  >
                    Kitchen Name
                  </label>
                  <input
                    id="edit-kitchen-name"
                    type="text"
                    value={editKitchenName}
                    onChange={(e) => setEditKitchenName(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-[#E6DDD3] bg-[#FAF6F1] px-3.5 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-kitchen-address"
                    className="mb-1 block text-xs font-semibold text-[#1E1916]"
                  >
                    Kitchen Street Address
                  </label>
                  <input
                    id="edit-kitchen-address"
                    type="text"
                    value={editKitchenAddress}
                    onChange={(e) => setEditKitchenAddress(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-[#E6DDD3] bg-[#FAF6F1] px-3.5 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>

                <NigeriaLocationPicker
                  value={editKitchenArea}
                  onChange={setEditKitchenArea}
                  compact
                  label="Kitchen State & LGA"
                />

                <div>
                  <label
                    htmlFor="edit-kitchen-cat"
                    className="mb-1 block text-xs font-semibold text-[#1E1916]"
                  >
                    Kitchen Specialty
                  </label>
                  <select
                    id="edit-kitchen-cat"
                    value={editKitchenCategory}
                    onChange={(e) =>
                      setEditKitchenCategory(
                        e.target.value as Exclude<FoodCategoryKey, 'all'>
                      )
                    }
                    className="min-h-[44px] w-full rounded-xl border border-[#E6DDD3] bg-[#FAF6F1] px-3 text-xs font-medium text-[#1E1916] focus:outline-none"
                  >
                    {KITCHEN_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-2xl bg-[#D9232E]/10 px-4 py-2.5 text-xs font-semibold text-[#9E141D]">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="min-h-[50px] w-full rounded-2xl bg-[#D9232E] text-sm font-bold text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
            >
              Save Profile Changes
            </button>
          </form>
        ) : tab === 'buyer' ? (
          <form onSubmit={handleBuyerSignIn} className="mt-4 space-y-4">
            <div className="soft-card-shadow space-y-3.5 rounded-[20px] bg-white p-4">
              <div>
                <label
                  htmlFor="buyer-name"
                  className="mb-1 block text-xs font-semibold text-[#1E1916]"
                >
                  Your Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                  <input
                    id="buyer-name"
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Chidi Okafor"
                    className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="buyer-phone"
                  className="mb-1 block text-xs font-semibold text-[#1E1916]"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                  <input
                    id="buyer-phone"
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="0805 112 9087"
                    className="tabular-nums-clean min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>
              </div>

              <NigeriaLocationPicker
                value={buyerArea}
                onChange={setBuyerArea}
                onUseGps={() => handleUseGps('buyer')}
                isLocating={isLocating}
                label="Your State & LGA (All 36 States + FCT)"
              />

              <div>
                <label
                  htmlFor="buyer-landmark"
                  className="mb-1 block text-xs font-semibold text-[#1E1916]"
                >
                  Street / Delivery Landmark
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                  <input
                    id="buyer-landmark"
                    type="text"
                    value={buyerLandmark}
                    onChange={(e) => setBuyerLandmark(e.target.value)}
                    placeholder="e.g. 14 Commercial Ave, Sabo Yaba"
                    className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl bg-[#D9232E]/10 px-4 py-2.5 text-xs font-semibold text-[#9E141D]">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="min-h-[50px] w-full rounded-2xl bg-[#D9232E] text-sm font-bold text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
            >
              {isAuthenticated
                ? 'Update Buyer Location & Continue'
                : 'Sign Up / Login & Explore Kitchens'}
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setBuyerName(user.name);
                  setBuyerPhone(user.phone);
                  setBuyerArea(user.buyerArea);
                  setBuyerLandmark(user.buyerLandmark);
                  setError('');
                }}
                className="min-h-[40px] w-full rounded-xl text-xs font-semibold text-[#5C5049] transition-colors hover:text-[#1E1916]"
              >
                Use sample details ({user.name} · {user.buyerArea})
              </button>
            )}
          </form>
        ) : !isSellerLoggedIn ? (
          <form onSubmit={handleSellerLogin} className="mt-4 space-y-4">
            <div className="soft-card-shadow space-y-3.5 rounded-[20px] bg-white p-4">
              <div>
                <label
                  htmlFor="seller-name"
                  className="mb-1 block text-xs font-semibold text-[#1E1916]"
                >
                  Seller Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                  <input
                    id="seller-name"
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="e.g. Mrs. Folake Adeyemi"
                    className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="seller-phone"
                  className="mb-1 block text-xs font-semibold text-[#1E1916]"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#635850]" />
                  <input
                    id="seller-phone"
                    type="tel"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    placeholder="0803 412 8890"
                    className="tabular-nums-clean min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] pr-3.5 pl-10 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1E1916]">
                    Your Kitchen &amp; Location
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewKitchen((prev) => !prev)}
                    className="text-xs font-bold text-[#D9232E] hover:underline"
                  >
                    {isNewKitchen
                      ? 'Pick an existing kitchen'
                      : '+ Register new kitchen'}
                  </button>
                </div>

                {!isNewKitchen ? (
                  <select
                    value={selectedKitchenId}
                    onChange={(e) => setSelectedKitchenId(e.target.value)}
                    className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] px-3.5 text-sm font-medium text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  >
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} · {r.area}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={newKitchenName}
                      onChange={(e) => setNewKitchenName(e.target.value)}
                      placeholder="Kitchen name (e.g. Auntie Ngozi Pot)"
                      className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] px-3.5 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newKitchenAddress}
                      onChange={(e) => setNewKitchenAddress(e.target.value)}
                      placeholder="Street address (e.g. 19 Allen Ave)"
                      className="min-h-[46px] w-full rounded-2xl border border-[#E6DDD3] bg-[#FAF6F1] px-3.5 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                    />
                    <NigeriaLocationPicker
                      value={newKitchenArea}
                      onChange={setNewKitchenArea}
                      compact
                      label="Kitchen State & LGA (Anywhere in Nigeria)"
                    />
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-[#5C5049]">
                        Kitchen Specialty
                      </label>
                      <select
                        value={newKitchenType}
                        onChange={(e) =>
                          setNewKitchenType(
                            e.target.value as Exclude<FoodCategoryKey, 'all'>
                          )
                        }
                        className="min-h-[44px] w-full rounded-xl border border-[#E6DDD3] bg-[#FAF6F1] px-3 text-xs font-medium text-[#1E1916] focus:outline-none"
                      >
                        {KITCHEN_CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="rounded-2xl bg-[#D9232E]/10 px-4 py-2.5 text-xs font-semibold text-[#9E141D]">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#D9232E] text-sm font-bold text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
            >
              <Store className="h-4 w-4" />
              Sign In as Seller &amp; Post Food
            </button>
          </form>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="soft-card-shadow flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1E1916]">
                  {activeSellerKitchen?.name}
                </p>
                <p className="truncate text-xs text-[#635850]">
                  {activeSellerKitchen?.address} · {activeSellerKitchen?.area}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {onGoToFeed && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToFeed();
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-[#D9232E] px-3 text-xs font-semibold text-white"
                  >
                    Live Feed
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setTab('profile');
                    setError('');
                    setSuccessNote('');
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-full border border-[#E6DDD3] bg-[#FAF6F1] px-3 text-xs font-semibold text-[#1E1916]"
                >
                  <Pencil className="h-3 w-3 text-[#D9232E]" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToBuyer}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-[#F3E7D3] px-3 text-xs font-semibold text-[#1E1916]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Buyer View
                </button>
              </div>
            </div>

            <form onSubmit={handlePublishDish} className="space-y-4">
              <div className="soft-card-shadow rounded-[20px] bg-white p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E1916]">
                    Upload Real Food Photo
                  </span>
                  <span className="text-[11px] text-[#635850]">
                    Camera or Phone Gallery
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelected}
                  className="hidden"
                />

                {dishPhotoUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#F3E7D3]">
                    <PlateImage
                      src={dishPhotoUrl}
                      alt={dishName || 'Food preview'}
                      className="h-full w-full"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-3 bottom-3 flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#1E1916]/85 px-3.5 text-xs font-semibold text-white backdrop-blur-xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Replace Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E6DDD3] bg-[#FAF6F1] px-4 text-center transition-colors hover:border-[#D9232E]/50 hover:bg-[#F3E7D3]/50"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3E7D3] text-[#D9232E]">
                      <Camera className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-[#1E1916]">
                      {isProcessingPhoto
                        ? 'Compressing photo...'
                        : 'Tap to snap or choose your dish photo'}
                    </span>
                    <span className="text-xs text-[#635850]">
                      Buyers nearby will see this plate immediately
                    </span>
                  </button>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#5C5049]">
                    Or quick-pick a kitchen photo:
                  </span>
                  {[
                    {
                      label: 'Jollof & Dodo',
                      url: '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
                    },
                    {
                      label: 'Ponmo & Efo',
                      url: '/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37648018_3ef90570.jpg',
                    },
                    {
                      label: 'Akara & Pap',
                      url: '/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37324436_10d34b52.jpg',
                    },
                    {
                      label: 'Dodo Skewers',
                      url: '/assets/aistudio/pexels-ndagi-idris-2159907004-36458103_fd393f46.jpg',
                    },
                  ].map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        setDishPhotoUrl(sample.url);
                        setError('');
                      }}
                      className={`min-h-[32px] rounded-full px-2.5 text-[11px] font-semibold transition-colors ${
                        dishPhotoUrl === sample.url
                          ? 'bg-[#1E1916] text-white'
                          : 'bg-[#F3E7D3] text-[#1E1916] hover:bg-[#E8D5B7]'
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>

                <label className="mt-3 flex items-center gap-2 text-xs font-medium text-[#1E1916]">
                  <input
                    type="checkbox"
                    checked={setAsCover}
                    onChange={(e) => setSetAsCover(e.target.checked)}
                    className="h-4 w-4 accent-[#D9232E]"
                  />
                  Update {activeSellerKitchen?.name}&apos;s Home card cover photo
                </label>
              </div>

              <div className="soft-card-shadow space-y-3 rounded-[20px] bg-white p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="dish-name"
                      className="mb-1 block text-xs font-semibold text-[#1E1916]"
                    >
                      Dish Name
                    </label>
                    <input
                      id="dish-name"
                      type="text"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="e.g. Ofada Rice & Ayamase"
                      className="min-h-[44px] w-full rounded-xl border border-[#E6DDD3] bg-[#FAF6F1] px-3 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dish-price"
                      className="mb-1 block text-xs font-semibold text-[#1E1916]"
                    >
                      Price (₦)
                    </label>
                    <input
                      id="dish-price"
                      type="number"
                      inputMode="numeric"
                      min={300}
                      step={100}
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value)}
                      placeholder="3800"
                      className="tabular-nums-clean min-h-[44px] w-full rounded-xl border border-[#E6DDD3] bg-[#FAF6F1] px-3 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-[#1E1916]">
                    Menu Tab
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DISH_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDishCategory(cat)}
                        className={`min-h-[36px] rounded-full px-3.5 text-xs font-semibold ${
                          dishCategory === cat
                            ? 'bg-[#1E1916] text-white'
                            : 'bg-[#F3E7D3] text-[#635850]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="dish-desc"
                    className="mb-1 block text-xs font-semibold text-[#1E1916]"
                  >
                    Description
                  </label>
                  <textarea
                    id="dish-desc"
                    rows={2}
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    placeholder="What's inside the pack?"
                    className="w-full rounded-xl border border-[#E6DDD3] bg-[#FAF6F1] p-3 text-sm text-[#1E1916] focus:ring-2 focus:ring-[#D9232E] focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-2xl bg-[#D9232E]/10 px-4 py-2.5 text-xs font-semibold text-[#9E141D]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="min-h-[50px] w-full rounded-2xl bg-[#D9232E] text-sm font-bold text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
              >
                Post Plate Live
                {Number(dishPrice) >= 300
                  ? ` · ${formatNaira(Number(dishPrice))}`
                  : ''}
              </button>
            </form>

            <div className="soft-card-shadow rounded-[20px] bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#1E1916]">
                  Incoming Order Status (#{activeOrder.code})
                </p>
                <span className="tabular-nums-clean text-xs font-bold text-[#D9232E]">
                  {formatNaira(activeOrder.totalAmount)}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#635850]">
                {activeOrder.itemsSummary}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'confirmed', label: 'Order Received' },
                    { id: 'preparing', label: 'Inside Kitchen' },
                    { id: 'on_the_way', label: 'Rider Don Dey Come' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onUpdateOrderStage(s.id)}
                    className={`min-h-[38px] rounded-xl text-xs font-semibold ${
                      activeOrder.stage === s.id
                        ? 'bg-[#D9232E] text-white'
                        : 'bg-[#F3E7D3] text-[#1E1916]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onResetDemo();
                  setSuccessNote('Demo photos & restaurants restored.');
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-[#635850] shadow-xs hover:text-[#1E1916]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore Demo Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
