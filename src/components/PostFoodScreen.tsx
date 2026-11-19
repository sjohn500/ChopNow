import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Lock,
  MapPin,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { formatNaira } from '../data/deliveryData';
import { getMyPayoutAccount } from '../lib/payments';
import {
  DishOrderStats,
  fetchSellerDashboardData,
  registerMyKitchenInDb,
  SellerKitchenRow,
  SellerOrderRow,
} from '../lib/seller';
import {
  AuthUser,
  FoodCategoryKey,
  MenuItem,
  ScreenId,
} from '../types/delivery';
import { compressFoodPhoto } from '../utils/image';
import { MobileBottomNav } from './MobileBottomNav';
import { NigeriaLocationPicker } from './NigeriaLocationPicker';
import { PlateImage } from './PlateImage';
import SellerBankForm from './SellerBankForm';
import { Badge, Button, Card, Input, Select, Textarea } from './ui';

interface PostFoodScreenProps {
  user: AuthUser;
  onKitchenReady: () => Promise<void>;
  onPublishDish: (input: {
    name: string;
    description: string;
    price: number;
    category: MenuItem['category'];
    imageUrl: string;
    setAsCover: boolean;
  }) => Promise<void>;
  onUpdateDeliveryFee: (feeNaira: number) => Promise<void>;
  onToggleDishAvailability: (restaurantId: string, itemId: string) => Promise<void>;
  onDeleteDish: (restaurantId: string, itemId: string) => Promise<void>;
  onNavigateScreen: (screen: ScreenId) => void;
  activeOrderCount: number;
  overlayInset?: boolean;
  layoutMode?: 'frame' | 'responsive';
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
  { key: 'swallows', label: 'Swallows & Soups' },
  { key: 'suya', label: 'Suya & Grills' },
  { key: 'small_chops', label: 'Small Chops' },
  { key: 'pepper_soup', label: 'Pepper Soup' },
  { key: 'drinks', label: 'Drinks' },
];

const QUICK_SAMPLE_PHOTOS = [
  {
    label: 'Jollof & Dodo',
    url: '/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg',
  },
  {
    label: 'Rice & Chicken',
    url: '/assets/aistudio/pexels-discountedchef-40262791_428c23ce.jpg',
  },
  {
    label: 'Ponmo & Efo',
    url: '/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37648018_3ef90570.jpg',
  },
  {
    label: 'Akara & Pap',
    url: '/assets/aistudio/pexels-prosper-buka-1289782307-28736731_1eb2145c.jpg',
  },
];

export function PostFoodScreen({
  user,
  onKitchenReady,
  onPublishDish,
  onUpdateDeliveryFee,
  onToggleDishAvailability,
  onDeleteDish,
  onNavigateScreen,
  activeOrderCount,
  overlayInset = false,
  layoutMode = 'frame',
}: PostFoodScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isResponsive = layoutMode === 'responsive';

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [kitchen, setKitchen] = useState<SellerKitchenRow | null>(null);
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SellerOrderRow[]>([]);
  const [dishStats, setDishStats] = useState<Record<string, DishOrderStats>>(
    {}
  );

  // Inline kitchen registration (if account has no seller_profiles row yet)
  const [newKitchenName, setNewKitchenName] = useState('');
  const [newKitchenAddress, setNewKitchenAddress] = useState('');
  const [newKitchenArea, setNewKitchenArea] = useState(
    user.buyerArea || 'Eti-Osa, Lagos'
  );
  const [newKitchenCategory, setNewKitchenCategory] =
    useState<Exclude<FoodCategoryKey, 'all'>>('jollof');
  const [newKitchenFee, setNewKitchenFee] = useState('0');
  const [creatingKitchen, setCreatingKitchen] = useState(false);
  const [kitchenFormError, setKitchenFormError] = useState('');

  // Payout state
  const [payoutLoading, setPayoutLoading] = useState(true);
  const [payoutAccountName, setPayoutAccountName] = useState<string | null>(
    null
  );
  const [payoutError, setPayoutError] = useState('');
  const [showBankEditor, setShowBankEditor] = useState(false);

  // Delivery fee state
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [savingFee, setSavingFee] = useState(false);
  const [feeError, setFeeError] = useState('');

  // Dish form state
  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishCategory, setDishCategory] =
    useState<MenuItem['category']>('Combos');
  const [imageUrl, setImageUrl] = useState('');
  const [setAsCover, setSetAsCover] = useState(true);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [busyDishId, setBusyDishId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadSellerStudio = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardError('');
    try {
      const data = await fetchSellerDashboardData();
      setKitchen(data.kitchen);
      setDishes(data.dishes);
      setSellerOrders(data.orders);
      setDishStats(data.dishStats);
      setDeliveryFee(
        String(Math.round((data.kitchen?.delivery_fee_kobo ?? 0) / 100))
      );

      if (data.kitchen) {
        setPayoutLoading(true);
        setPayoutError('');
        try {
          const payout = await getMyPayoutAccount();
          setPayoutAccountName(payout?.account_name ?? null);
        } catch (pErr) {
          setPayoutError(
            pErr instanceof Error
              ? pErr.message
              : 'Could not check your payout bank details.'
          );
        } finally {
          setPayoutLoading(false);
        }
      } else {
        setPayoutLoading(false);
      }
    } catch (err) {
      setDashboardError(
        err instanceof Error ? err.message : 'Could not load your kitchen.'
      );
      setPayoutLoading(false);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    loadSellerStudio();
  }, [loadSellerStudio]);

  async function handleCreateKitchen(e: FormEvent) {
    e.preventDefault();
    if (creatingKitchen) return;
    setKitchenFormError('');

    if (newKitchenName.trim().length < 3) {
      setKitchenFormError('Enter your kitchen name (at least 3 characters).');
      return;
    }
    if (newKitchenAddress.trim().length < 4) {
      setKitchenFormError('Enter your kitchen street address.');
      return;
    }
    const parsedFee = Number(newKitchenFee.replace(/,/g, '').trim() || '0');
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      setKitchenFormError('Enter a valid delivery fee (0 or more).');
      return;
    }

    setCreatingKitchen(true);
    try {
      await registerMyKitchenInDb({
        business_name: newKitchenName.trim(),
        area: newKitchenArea,
        address: newKitchenAddress.trim(),
        category: newKitchenCategory,
        delivery_fee_kobo: Math.round(parsedFee * 100),
      });
      await onKitchenReady();
      await loadSellerStudio();
    } catch (err) {
      setKitchenFormError(
        err instanceof Error ? err.message : 'Could not create your kitchen.'
      );
    } finally {
      setCreatingKitchen(false);
    }
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressFoodPhoto(file);
      setImageUrl(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not process food photo.'
      );
    } finally {
      setIsProcessingPhoto(false);
    }
  }

  async function handleSaveDeliveryFee() {
    if (savingFee) return;
    setFeeError('');
    const parsed = Number(deliveryFee.replace(/,/g, '').trim() || '0');
    if (!Number.isFinite(parsed) || parsed < 0) {
      setFeeError('Enter a valid Naira delivery fee (0 or more).');
      return;
    }
    setSavingFee(true);
    try {
      await onUpdateDeliveryFee(Math.round(parsed));
      await loadSellerStudio();
    } catch (err) {
      setFeeError(
        err instanceof Error ? err.message : 'Could not save delivery fee.'
      );
    } finally {
      setSavingFee(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isPublishing) return;
    setError('');

    if (!kitchen) {
      setError('Register your kitchen first.');
      return;
    }

    if (!payoutAccountName) {
      setError('Add your bank payout details first before posting dishes.');
      return;
    }

    if (!imageUrl) {
      setError('Upload or snap a real food photo first.');
      return;
    }

    if (dishName.trim().length < 3) {
      setError('Enter the dish name (e.g. Smoky Party Jollof & Chicken).');
      return;
    }

    const parsedPrice = Number(dishPrice.replace(/,/g, '').trim());
    if (!Number.isFinite(parsedPrice) || parsedPrice < 300) {
      setError('Enter a valid Naira price (minimum ₦300).');
      return;
    }

    if (dishDescription.trim().length < 8) {
      setError('Describe what is inside the plate (sides, protein, portion).');
      return;
    }

    setIsPublishing(true);
    try {
      await onPublishDish({
        name: dishName.trim(),
        description: dishDescription.trim(),
        price: Math.round(parsedPrice),
        category: dishCategory,
        imageUrl,
        setAsCover,
      });

      setDishName('');
      setDishPrice('');
      setDishDescription('');
      setImageUrl('');
      await loadSellerStudio();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not publish your dish. Please try again.'
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleToggle(itemId: string) {
    if (!kitchen || busyDishId) return;
    setBusyDishId(itemId);
    try {
      await onToggleDishAvailability(kitchen.id, itemId);
      await loadSellerStudio();
    } finally {
      setBusyDishId(null);
    }
  }

  async function handleDelete(itemId: string) {
    if (!kitchen || busyDishId) return;
    setBusyDishId(itemId);
    try {
      await onDeleteDish(kitchen.id, itemId);
      await loadSellerStudio();
    } finally {
      setBusyDishId(null);
    }
  }

  const previewPrice = Number(dishPrice.replace(/,/g, '').trim());
  const canPublish = Boolean(kitchen && payoutAccountName && !payoutLoading);
  const paidOrders = sellerOrders.filter(
    (o) => o.status !== 'pending_payment' && o.status !== 'cancelled'
  );

  return (
    <div className="relative flex h-full flex-col bg-bg">
      <div
        className={`no-scrollbar flex-1 overflow-y-auto ${
          isResponsive
            ? 'px-4 pt-5 pb-24 md:px-6 md:pt-8 md:pb-12'
            : `px-4 pb-24 ${overlayInset ? 'pt-12' : 'pt-4'}`
        }`}
      >
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="peach">Seller Studio</Badge>
              <h1 className="font-heading mt-2 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Post Fresh Food
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Manage your kitchen, post plates, and see buyer orders in real
                time.
              </p>
            </div>
          </div>

          {loadingDashboard ? (
            <Card padding="md" className="mt-6">
              <p className="text-sm text-text-secondary">
                Loading your Seller Studio...
              </p>
            </Card>
          ) : dashboardError ? (
            <Card padding="md" className="mt-6 space-y-3">
              <p className="text-xs font-semibold text-error">
                {dashboardError}
              </p>
              <Button type="button" size="sm" onClick={loadSellerStudio}>
                Retry
              </Button>
            </Card>
          ) : !kitchen ? (
            <form onSubmit={handleCreateKitchen} className="mt-6 space-y-4">
              <Card padding="md" className="space-y-4">
                <div>
                  <Badge variant="peach">Step 1 of 2</Badge>
                  <h2 className="font-heading mt-2 text-lg font-bold text-text-primary">
                    Open Your Kitchen
                  </h2>
                  <p className="mt-1 text-xs text-text-secondary">
                    We didn&apos;t find a kitchen linked to your account yet.
                    Enter your kitchen details below to start selling.
                  </p>
                </div>

                <Input
                  id="setup-kitchen-name"
                  label="Kitchen Name"
                  type="text"
                  value={newKitchenName}
                  onChange={(e) => setNewKitchenName(e.target.value)}
                  placeholder="e.g. Mama Nkechi Buka"
                />
                <Input
                  id="setup-kitchen-address"
                  label="Kitchen Address"
                  type="text"
                  value={newKitchenAddress}
                  onChange={(e) => setNewKitchenAddress(e.target.value)}
                  placeholder="e.g. 19 Allen Avenue, Ikeja"
                />
                <NigeriaLocationPicker
                  value={newKitchenArea}
                  onChange={setNewKitchenArea}
                  compact
                  label="Kitchen State & LGA"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    id="setup-kitchen-cat"
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
                  <Input
                    id="setup-kitchen-fee"
                    label="Delivery Fee (₦)"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    value={newKitchenFee}
                    onChange={(e) => setNewKitchenFee(e.target.value)}
                    placeholder="0 for free delivery"
                    className="tabular-nums-clean"
                  />
                </div>

                {kitchenFormError && (
                  <div className="rounded-[12px] bg-error/10 px-3.5 py-2.5 text-xs font-semibold text-error">
                    {kitchenFormError}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={creatingKitchen}
                >
                  {creatingKitchen ? 'Saving kitchen...' : 'Open My Kitchen'}
                </Button>
              </Card>
            </form>
          ) : (
            <div className="mt-6 space-y-5">
              {/* Seller summary stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card padding="sm" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Posted Dishes</p>
                    <p className="font-heading text-lg font-bold text-text-primary">
                      {dishes.length}
                    </p>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">
                      Orders Received
                    </p>
                    <p className="font-heading text-lg font-bold text-text-primary">
                      {paidOrders.length}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Seller's own kitchen + delivery fee */}
              <Card padding="md" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Store className="h-3.5 w-3.5" />
                      Your Kitchen
                    </span>
                    <h2 className="font-heading mt-1 text-lg font-bold text-text-primary">
                      {kitchen.business_name}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>
                        {kitchen.address ?? kitchen.area} ·{' '}
                        {kitchen.area ?? 'Lagos'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-border-soft pt-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <Input
                        id="post-delivery-fee"
                        label="Kitchen Delivery Fee (₦)"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={100}
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        placeholder="0 for free delivery"
                        icon={<Truck className="h-4 w-4" />}
                        className="tabular-nums-clean"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      disabled={savingFee}
                      onClick={handleSaveDeliveryFee}
                    >
                      {savingFee ? 'Saving...' : 'Save Fee'}
                    </Button>
                  </div>
                  {feeError && (
                    <p className="mt-2 text-xs font-semibold text-error">
                      {feeError}
                    </p>
                  )}
                </div>
              </Card>

              {/* Payout bank details gate */}
              {payoutLoading ? (
                <Card padding="md">
                  <p className="text-sm text-text-secondary">
                    Checking your payout bank details...
                  </p>
                </Card>
              ) : payoutError ? (
                <Card padding="md">
                  <p className="text-xs font-semibold text-error">
                    {payoutError}
                  </p>
                </Card>
              ) : payoutAccountName && !showBankEditor ? (
                <Card padding="md">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          Payout account ready
                        </p>
                        <p className="text-xs text-text-secondary">
                          Buyer payments go to{' '}
                          <span className="font-semibold text-text-primary">
                            {payoutAccountName}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowBankEditor(true)}
                    >
                      Update Bank
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  <SellerBankForm
                    onSaved={(accountName) => {
                      setPayoutAccountName(accountName);
                      setShowBankEditor(false);
                    }}
                  />
                  {payoutAccountName && showBankEditor && (
                    <button
                      type="button"
                      onClick={() => setShowBankEditor(false)}
                      className="cursor-pointer text-xs font-semibold text-text-secondary hover:text-text-primary hover:underline"
                    >
                      Cancel bank update
                    </button>
                  )}
                </div>
              )}

              {!payoutLoading && !payoutAccountName && (
                <div className="flex items-center gap-2.5 rounded-[14px] bg-primary-soft/70 px-4 py-3 text-xs font-semibold text-primary-dark">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>
                    Save your bank payout details above first to unlock
                    publishing dishes.
                  </span>
                </div>
              )}

              {/* Dish publish form */}
              <form
                onSubmit={handleSubmit}
                className={`space-y-5 ${
                  canPublish ? '' : 'pointer-events-none opacity-55'
                }`}
              >
                <Card padding="md">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      Plate Photo
                    </span>
                    <span className="text-xs text-text-secondary">
                      Camera or Gallery
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelected}
                    className="hidden"
                  />

                  {imageUrl ? (
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px] bg-primary-soft">
                      <PlateImage
                        src={imageUrl}
                        alt={dishName || 'Food preview'}
                        className="h-full w-full"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-3 bottom-3 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full bg-surface px-4 text-xs font-semibold text-text-primary shadow-md transition-colors hover:bg-primary-soft"
                      >
                        <Upload className="h-3.5 w-3.5 text-primary" />
                        Replace Photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessingPhoto || !canPublish}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-border-soft bg-bg px-4 text-center transition-colors hover:border-primary hover:bg-primary-soft/35"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Camera className="h-6 w-6" />
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {isProcessingPhoto
                          ? 'Optimizing photo...'
                          : 'Tap to snap or upload your food photo'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        Real plate photos get more orders
                      </span>
                    </button>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
                      <ImagePlus className="h-3.5 w-3.5 text-primary" />
                      Quick kitchen photos:
                    </span>
                    {QUICK_SAMPLE_PHOTOS.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => {
                          setImageUrl(sample.url);
                          setError('');
                        }}
                        className={`min-h-[34px] cursor-pointer rounded-full px-3 text-xs font-semibold transition-colors ${
                          imageUrl === sample.url
                            ? 'bg-primary text-white'
                            : 'bg-primary-soft text-text-primary hover:bg-primary-soft/80'
                        }`}
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card padding="md" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      id="post-dish-name"
                      label="Dish Name"
                      type="text"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="e.g. Smoky Party Jollof & Chicken"
                    />
                    <Input
                      id="post-dish-price"
                      label="Price (₦)"
                      type="number"
                      inputMode="numeric"
                      min={300}
                      step={100}
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value)}
                      placeholder="3500"
                      className="tabular-nums-clean"
                    />
                  </div>

                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-text-primary">
                      Category
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {DISH_CATEGORIES.map((cat) => {
                        const isSelected = dishCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setDishCategory(cat)}
                            className={`min-h-[38px] cursor-pointer rounded-full px-4 text-xs font-semibold transition-all duration-150 ${
                              isSelected
                                ? 'bg-primary-soft text-primary-dark ring-1 ring-primary'
                                : 'border border-border-soft bg-surface text-text-secondary hover:bg-primary-soft/50'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Textarea
                    id="post-dish-desc"
                    label="Description"
                    rows={3}
                    value={dishDescription}
                    onChange={(e) => setDishDescription(e.target.value)}
                    placeholder="Tell buyers what comes in the pack (protein, sides, spice level)..."
                  />

                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-text-primary">
                    <input
                      type="checkbox"
                      checked={setAsCover}
                      onChange={(e) => setSetAsCover(e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    Use this photo as the kitchen&apos;s featured cover image
                  </label>
                </Card>

                {error && (
                  <div className="rounded-[14px] bg-error/10 px-4 py-3 text-xs font-semibold text-error">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={!canPublish || isPublishing}
                >
                  {isPublishing
                    ? 'Publishing...'
                    : `Post${
                        Number.isFinite(previewPrice) && previewPrice >= 300
                          ? ` · ${formatNaira(previewPrice)}`
                          : ''
                      }`}
                </Button>
              </form>

              {/* Seller's posted dishes + per-dish order count */}
              <div className="space-y-3 pt-2">
                <div>
                  <h2 className="font-heading text-lg font-bold text-text-primary">
                    What You&apos;ve Posted ({dishes.length})
                  </h2>
                  <p className="text-xs text-text-secondary">
                    See your live plates, mark items out of stock, and check how
                    many orders each plate has received.
                  </p>
                </div>

                {dishes.length === 0 ? (
                  <Card padding="md">
                    <p className="text-sm text-text-secondary">
                      You haven&apos;t posted any plates yet. Once you add your
                      bank details and publish a dish above, it will show up
                      here.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {dishes.map((dish) => {
                      const isAvailable = dish.isAvailable !== false;
                      const stats = dishStats[dish.id];
                      const isBusy = busyDishId === dish.id;
                      return (
                        <Card
                          key={dish.id}
                          padding="sm"
                          className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-primary-soft">
                              <PlateImage
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="h-full w-full"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-heading truncate text-sm font-bold text-text-primary">
                                {dish.name}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="tabular-nums-clean text-xs font-bold text-primary">
                                  {formatNaira(dish.price)}
                                </span>
                                <Badge
                                  variant={isAvailable ? 'success' : 'error'}
                                >
                                  {isAvailable ? 'Available' : 'Out of stock'}
                                </Badge>
                                <Badge variant="peach">
                                  {stats
                                    ? `${stats.orderCount} ${
                                        stats.orderCount === 1
                                          ? 'order'
                                          : 'orders'
                                      } (${stats.platesSold} plates)`
                                    : '0 orders yet'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggle(dish.id)}
                              className="min-h-[36px] cursor-pointer rounded-full border border-border-soft bg-bg px-3 text-xs font-semibold text-text-primary transition-colors hover:bg-primary-soft disabled:opacity-50"
                            >
                              {isAvailable ? 'Mark Out' : 'Restock'}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              aria-label={`Delete ${dish.name}`}
                              onClick={() => handleDelete(dish.id)}
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
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

              {/* Recent incoming orders for this kitchen */}
              <div className="space-y-3 pt-2">
                <h2 className="font-heading text-lg font-bold text-text-primary">
                  Orders From Buyers ({paidOrders.length})
                </h2>
                {paidOrders.length === 0 ? (
                  <Card padding="md">
                    <p className="text-sm text-text-secondary">
                      No paid buyer orders yet. Once buyers pay for your dishes,
                      their orders will appear here.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {paidOrders.map((o) => (
                      <Card
                        key={o.id}
                        padding="sm"
                        className="flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-primary">
                            {o.buyer_name || 'Buyer'}{' '}
                            <span className="text-xs font-normal text-text-secondary">
                              {o.buyer_phone ? `· ${o.buyer_phone}` : ''}
                            </span>
                          </p>
                          <p className="truncate text-xs text-text-secondary">
                            {o.delivery_address || 'No address'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums-clean text-sm font-bold text-primary">
                            {formatNaira(Math.round(o.total_kobo / 100))}
                          </span>
                          <Badge variant="peach">{o.status}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav
        activeNav="post"
        onSelect={(nav) => {
          if (nav === 'home' || nav === 'search') onNavigateScreen('home');
          if (nav === 'post') onNavigateScreen('post');
          if (nav === 'orders') onNavigateScreen('orders');
          if (nav === 'profile') onNavigateScreen('profile');
        }}
        orderCount={activeOrderCount}
        className={`absolute right-0 bottom-0 left-0 ${
          isResponsive ? 'md:hidden' : ''
        }`}
      />
    </div>
  );
}