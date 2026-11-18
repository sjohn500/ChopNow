import { Camera, ImagePlus, Upload } from 'lucide-react';
import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { CreatePostInput } from '../hooks/useChopNowStore';
import { FoodCategory, SellerProfile } from '../types/chopnow';
import { compressImageFile, formatNaira } from '../utils/format';
import { PlateImage } from './PlateImage';

interface PostFoodViewProps {
  sellers: SellerProfile[];
  activeSellerId: string;
  onPublishPost: (input: CreatePostInput) => void;
}

const CATEGORIES: FoodCategory[] = [
  'Rice & Mains',
  'Swallow & Soup',
  'Grill & Suya',
  'Quick Bites',
];

const QUICK_SAMPLE_PHOTOS = [
  {
    label: 'Jollof Rice',
    url: '/src/assets/images/plate_jollof_chicken_1795003763904.jpg',
  },
  {
    label: 'Egusi & Yam',
    url: '/src/assets/images/plate_egusi_pounded_yam_1795003764805.jpg',
  },
  {
    label: 'Beef Suya',
    url: '/src/assets/images/plate_suya_platter_1795003765134.jpg',
  },
];

export function PostFoodView({
  sellers,
  activeSellerId,
  onPublishPost,
}: PostFoodViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sellerId, setSellerId] = useState(activeSellerId);
  const [title, setTitle] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [prepMinutes, setPrepMinutes] = useState('20');
  const [category, setCategory] = useState<FoodCategory>('Rice & Mains');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImageFile(file);
      setImageUrl(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to process photo.'
      );
    } finally {
      setIsProcessingPhoto(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const parsedPrice = Number(priceInput.replace(/,/g, '').trim());
    const parsedPrep = Number(prepMinutes);

    if (!imageUrl) {
      setError('Add a real photo of the plate before posting to the feed.');
      return;
    }

    if (title.trim().length < 3) {
      setError('Enter a clear plate name (e.g. Fried Rice & Peppered Turkey).');
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 300) {
      setError('Enter a valid price in Naira (at least ₦300).');
      return;
    }

    if (description.trim().length < 10) {
      setError('Add a short description (portion size, protein, or sides).');
      return;
    }

    onPublishPost({
      sellerId,
      title,
      description,
      category,
      price: parsedPrice,
      prepMinutes: Number.isFinite(parsedPrep) && parsedPrep > 0 ? parsedPrep : 20,
      imageUrl,
    });
  }

  const parsedPreviewPrice = Number(priceInput.replace(/,/g, '').trim());

  return (
    <section className="mx-auto max-w-3xl px-4 pt-6 pb-24 md:px-6 md:pt-8 md:pb-12">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
          Post a Plate
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Snap a fresh plate photo, set your Naira price, and publish directly to the live ChopNow feed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-900">
              Plate Photo
            </span>
            <span className="text-xs text-slate-500">
              Uses phone camera or gallery
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {imageUrl ? (
              <div className="relative aspect-[4/3] w-full">
                <PlateImage
                  src={imageUrl}
                  alt={title || 'Selected plate preview'}
                  className="h-full w-full"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-3 bottom-3 flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900/85 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs hover:bg-slate-900"
                >
                  <Upload className="h-4 w-4" />
                  Change Photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 px-6 text-center transition-colors hover:bg-slate-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {isProcessingPhoto
                    ? 'Optimizing photo...'
                    : 'Tap to snap or upload food photo'}
                </p>
                <p className="text-xs text-slate-500">
                  Clear daylight photos sell 3x faster
                </p>
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <ImagePlus className="h-3.5 w-3.5" />
              Quick test photos:
            </span>
            {QUICK_SAMPLE_PHOTOS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setImageUrl(sample.url);
                  setError('');
                }}
                className="min-h-[36px] rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <label
              htmlFor="post-seller"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Posting Kitchen
            </label>
            <select
              id="post-seller"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            >
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.kitchenName} · {s.area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="post-title"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Plate Name
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ofada Rice & Ayamase Sauce"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="post-price"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Price (₦)
              </label>
              <input
                id="post-price"
                type="number"
                inputMode="numeric"
                min={300}
                step={100}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="3500"
                className="font-mono-num min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="post-prep"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Ready Time (Minutes)
              </label>
              <input
                id="post-prep"
                type="number"
                inputMode="numeric"
                min={5}
                max={120}
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(e.target.value)}
                className="font-mono-num min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Category
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((cat) => {
                const isActive = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="post-description"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Description (Portion, Protein &amp; Sides)
            </label>
            <textarea
              id="post-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what comes in the pack, spice level, and protein..."
              className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="min-h-[48px] w-full rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
        >
          Publish Plate to Feed
          {Number.isFinite(parsedPreviewPrice) && parsedPreviewPrice >= 300
            ? ` · ${formatNaira(parsedPreviewPrice)}`
            : ''}
        </button>
      </form>
    </section>
  );
}
