import { RefreshCw, Search, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FoodCategory, FoodPost } from '../types/chopnow';
import { formatNaira, formatTimeAgo } from '../utils/format';
import { PlateImage } from './PlateImage';

interface FeedViewProps {
  posts: FoodPost[];
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  onSelectPost: (post: FoodPost) => void;
  onGoToPost: () => void;
}

const CATEGORIES: ('All' | FoodCategory)[] = [
  'All',
  'Rice & Mains',
  'Swallow & Soup',
  'Grill & Suya',
  'Quick Bites',
];

export function FeedView({
  posts,
  isRefreshing,
  onRefresh,
  onSelectPost,
  onGoToPost,
}: FeedViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | FoodCategory>(
    'All'
  );
  const [feedError, setFeedError] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' || post.category === selectedCategory;
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.kitchenName.toLowerCase().includes(q) ||
        post.area.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [posts, searchQuery, selectedCategory]);

  async function handleRefresh() {
    setFeedError(null);
    try {
      await onRefresh();
    } catch {
      setFeedError('Could not refresh the feed. Check your connection and try again.');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 pb-24 md:px-6 md:pt-8 md:pb-12">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-slate-900 md:text-4xl">
            Fresh plates cooked nearby today.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">
            Browse hot homemade meals posted directly by local neighborhood kitchens. Pick a plate, choose your landmark, and pay on delivery.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`}
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh Feed'}
          </button>
          <button
            type="button"
            onClick={onGoToPost}
            className="min-h-[44px] shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-slate-800"
          >
            Sell a Plate
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jollof, suya, Yaba..."
            aria-label="Search plates or neighborhoods"
            className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div
          role="tablist"
          aria-label="Food categories"
          className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1"
        >
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(category)}
                className={`min-h-[38px] shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {feedError && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-red-800">{feedError}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="min-h-[40px] shrink-0 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {isRefreshing && filteredPosts.length === 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <Utensils className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="font-display mt-3 text-lg font-bold text-slate-900">
            No matching plates right now
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Try clearing your search filter or check back shortly as local kitchens post fresh batches.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-4 min-h-[44px] rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Show All Plates
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <button
                type="button"
                onClick={() => onSelectPost(post)}
                className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                <PlateImage
                  src={post.imageUrl}
                  alt={post.title}
                  className="h-full w-full transition-transform duration-200 group-hover:scale-[1.02]"
                />
                {!post.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                    <span className="text-sm font-semibold tracking-wide text-white">
                      Sold Out Today
                    </span>
                  </div>
                )}
              </button>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="truncate font-medium text-slate-700">
                    {post.kitchenName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{post.area}</span>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">{formatTimeAgo(post.createdAt)}</span>
                </div>

                <h2 className="font-display mt-1.5 text-base font-bold text-slate-900">
                  {post.title}
                </h2>

                <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {post.description}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <p className="font-mono-num text-base font-semibold text-slate-900">
                      {formatNaira(post.price)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Ready in {post.prepMinutes} mins
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!post.isAvailable}
                    onClick={() => onSelectPost(post)}
                    className="min-h-[44px] shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {post.isAvailable ? 'Order Plate' : 'Unavailable'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
