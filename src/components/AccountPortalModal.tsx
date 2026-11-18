import {
  Camera,
  CheckCircle2,
  LogOut,
  MapPin,
  Phone,
  RotateCcw,
  Store,
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

interface AccountPortalModalProps {
  isOpen: boolean;
  initialTab?: 'buyer' | 'seller';
  user: AuthUser;
  restaurants: Restaurant[];
  activeOrder: ActiveOrder;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
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
  initialTab,
  user,
  restaurants,
  activeOrder,
  onClose,
  onLogin,
  onCreateRestaurant,
  onPublishDish,
  onUpdateOrderStage,
  onResetDemo,
}: AccountPortalModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'buyer' | 'seller'>(
    initialTab ?? user.role
  );

  const [buyerName, setBuyerName] = useState(user.name);
  const [buyerPhone, setBuyerPhone] = useState(user.phone);
  const [buyerArea, setBuyerArea] = useState(user.buyerArea);
  const [buyerLandmark, setBuyerLandmark] = useState(user.buyerLandmark);
  const [isLocating, setIsLocating] = useState(false);

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

  const isSellerLoggedIn =
    user.role === 'seller' && Boolean(user.sellerRestaurantId);
  const activeSellerKitchen = restaurants.find(
    (r) => r.id === user.sellerRestaurantId
  );

  function handleUseGps() {
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
        setBuyerArea(nearest);
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
          '/src/assets/images/plate_jollof_chicken_1795003763904.jpg',
      });

      onLogin({
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
              ChopNow Account
            </h2>
            <p className="mt-0.5 text-xs text-[#635850]">
              Sign in as a Buyer to find kitchens close to you, or as a Seller to post food.
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

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-[#F3E7D3] p-1">
          <button
            type="button"
            onClick={() => {
              setTab('buyer');
              setError('');
              setSuccessNote('');
            }}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
              tab === 'buyer'
                ? 'bg-white text-[#1E1916] shadow-xs'
                : 'text-[#635850] hover:text-[#1E1916]'
            }`}
          >
            <User className="h-4 w-4 text-[#D9232E]" />
            Buyer Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('seller');
              setError('');
              setSuccessNote('');
            }}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
              tab === 'seller'
                ? 'bg-white text-[#1E1916] shadow-xs'
                : 'text-[#635850] hover:text-[#1E1916]'
            }`}
          >
            <Store className="h-4 w-4 text-[#D9232E]" />
            Seller Login &amp; Post
          </button>
        </div>

        {successNote && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#F3E7D3] px-4 py-3 text-xs font-semibold text-[#1E1916]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D9232E]" />
            <span>{successNote}</span>
          </div>
        )}

        {tab === 'buyer' ? (
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
                onUseGps={handleUseGps}
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
              Continue as Buyer · Show Nearby Kitchens
            </button>
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
            <div className="soft-card-shadow flex items-center justify-between rounded-2xl bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1E1916]">
                  {activeSellerKitchen?.name}
                </p>
                <p className="truncate text-xs text-[#635850]">
                  {activeSellerKitchen?.address} · {activeSellerKitchen?.area}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSwitchToBuyer}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1 rounded-full bg-[#F3E7D3] px-3 text-xs font-semibold text-[#1E1916]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Buyer View
              </button>
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
