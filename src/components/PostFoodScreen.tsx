import { Camera, ImagePlus, Store, Upload } from 'lucide-react';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import {
  AuthUser,
  FoodCategoryKey,
  MenuItem,
  Restaurant,
  ScreenId,
} from '../types/delivery';
import { compressFoodPhoto } from '../utils/image';
import { formatNaira } from '../data/deliveryData';
import { MobileBottomNav } from './MobileBottomNav';
import { NigeriaLocationPicker } from './NigeriaLocationPicker';
import { PlateImage } from './PlateImage';
import { Badge, Button, Card, Input, Select, Textarea } from './ui';

interface PostFoodScreenProps {
  user: AuthUser;
  restaurants: Restaurant[];
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
  restaurants,
  onCreateRestaurant,
  onPublishDish,
  onNavigateScreen,
  activeOrderCount,
  overlayInset = false,
  layoutMode = 'frame',
}: PostFoodScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isResponsive = layoutMode === 'responsive';

  const [selectedKitchenId, setSelectedKitchenId] = useState(
    user.sellerRestaurantId ?? restaurants[0]?.id ?? ''
  );
  const [isNewKitchen, setIsNewKitchen] = useState(false);
  const [newKitchenName, setNewKitchenName] = useState('');
  const [newKitchenAddress, setNewKitchenAddress] = useState('');
  const [newKitchenArea, setNewKitchenArea] = useState(
    user.buyerArea || 'Eti-Osa, Lagos'
  );

  const [dishName, setDishName] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishCategory, setDishCategory] =
    useState<MenuItem['category']>('Combos');
  const [imageUrl, setImageUrl] = useState('');
  const [setAsCover, setSetAsCover] = useState(true);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState('');

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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

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

    let targetKitchenId = selectedKitchenId;

    if (isNewKitchen) {
      if (newKitchenName.trim().length < 3) {
        setError('Enter your kitchen name (at least 3 characters).');
        return;
      }
      if (newKitchenAddress.trim().length < 4) {
        setError('Enter your kitchen street address.');
        return;
      }

      const categoryMap: Record<MenuItem['category'], Exclude<FoodCategoryKey, 'all'>> = {
        Combos: 'jollof',
        Swallows: 'swallows',
        Proteins: 'suya',
        Sides: 'small_chops',
      };

      const created = onCreateRestaurant({
        kitchenName: newKitchenName.trim(),
        area: newKitchenArea,
        address: newKitchenAddress.trim(),
        categoryKey: categoryMap[dishCategory],
        coverImageUrl: imageUrl,
      });
      targetKitchenId = created.id;
      setSelectedKitchenId(created.id);
      setIsNewKitchen(false);
    }

    if (!targetKitchenId) {
      setError('Select or register a kitchen first.');
      return;
    }

    onPublishDish({
      restaurantId: targetKitchenId,
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
  }

  const previewPrice = Number(dishPrice.replace(/,/g, '').trim());

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
                Upload a photo of your plate, set your Naira price, and publish to ChopBellyFull buyers.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                  disabled={isProcessingPhoto}
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
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                  <Store className="h-4 w-4 text-primary" />
                  Posting Kitchen
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewKitchen((prev) => !prev)}
                  className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
                >
                  {isNewKitchen ? 'Choose existing kitchen' : '+ New kitchen'}
                </button>
              </div>

              {!isNewKitchen ? (
                <Select
                  aria-label="Posting kitchen"
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
                <div className="space-y-3 rounded-[14px] bg-bg p-3.5">
                  <Input
                    id="post-kitchen-name"
                    label="Kitchen Name"
                    type="text"
                    value={newKitchenName}
                    onChange={(e) => setNewKitchenName(e.target.value)}
                    placeholder="e.g. Mama Nkechi Buka"
                  />
                  <Input
                    id="post-kitchen-address"
                    label="Kitchen Street Address"
                    type="text"
                    value={newKitchenAddress}
                    onChange={(e) => setNewKitchenAddress(e.target.value)}
                    placeholder="e.g. 14 Admiralty Way, Lekki"
                  />
                  <NigeriaLocationPicker
                    value={newKitchenArea}
                    onChange={setNewKitchenArea}
                    compact
                    label="Kitchen State & LGA"
                  />
                </div>
              )}

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

            <Button type="submit" size="lg" fullWidth>
              Post
              {Number.isFinite(previewPrice) && previewPrice >= 300
                ? ` · ${formatNaira(previewPrice)}`
                : ''}
            </Button>
          </form>
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
