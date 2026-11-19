import {
  ArrowRight,
  Bike,
  ChefHat,
  Clock,
  Compass,
  MapPin,
  ShieldCheck,
  Star,
  Store,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { formatNaira, getDistanceToRestaurant } from '../data/deliveryData';
import { Restaurant, ScreenId } from '../types/delivery';
import { PlateImage } from './PlateImage';
import { Button, Card } from './ui';

interface LandingPageProps {
  restaurants: Restaurant[];
  location: string;
  isAuthenticated: boolean;
  onEnterApp: (screen?: ScreenId) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenAuth: (role?: 'buyer' | 'seller') => void;
}

const LANDING_WALLPAPER_IMAGE = '/images/landing-hero.jpeg';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function LandingPage({
  restaurants,
  location,
  isAuthenticated,
  onEnterApp,
  onSelectRestaurant,
  onOpenAuth,
}: LandingPageProps) {
  const [wallpaperFailed, setWallpaperFailed] = useState(false);
  const featuredKitchens = restaurants.slice(0, 4);

  return (
    <div className="relative min-h-dvh bg-[#111111] text-white">
      {/* Full-page fixed landing wallpaper behind every section */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#111111]"
      >
        {!wallpaperFailed && (
          <img
            src={LANDING_WALLPAPER_IMAGE}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setWallpaperFailed(true)}
            className="h-full w-full object-cover object-center opacity-75"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E0E0E]/72 via-[#0E0E0E]/62 to-[#0E0E0E]/86" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#121212]/80 text-white backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-heading shrink-0 cursor-pointer text-xl font-bold tracking-tight whitespace-nowrap text-white"
          >
            Chop<span className="text-primary">BellyFull</span>
          </button>

          <nav
            aria-label="Landing navigation"
            className="hidden items-center gap-6 text-sm font-medium text-white/75 md:flex"
          >
            <a
              href="#plates"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-white"
            >
              Fresh Plates
            </a>
            <a
              href="#how-it-works"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#sellers"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-white"
            >
              Sell Food
            </a>
          </nav>

          <Button
            type="button"
            size="sm"
            onClick={() =>
              isAuthenticated ? onEnterApp('home') : onOpenAuth('buyer')
            }
          >
            {isAuthenticated ? 'Open Marketplace' : 'Login / Sign Up'}
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="flex min-h-[520px] items-center md:min-h-[600px]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-24 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="mx-auto max-w-2xl text-center"
            >
              <p className="text-xs font-semibold tracking-wide text-accent">
                36 States &amp; FCT · Neighborhood Kitchens
              </p>

              <h1 className="font-heading mt-3 text-[clamp(2.25rem,5vw,3.85rem)] leading-[1.08] font-bold tracking-tight text-balance text-white">
                Warm homemade meals, straight from local pots.
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                Discover fresh Jollof, swallows, suya, and grilled dishes cooked
                daily by trusted sellers near{' '}
                <span className="font-semibold text-white">{location}</span>.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => onEnterApp('home')}
                >
                  Explore Kitchens Near You
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <button
                  type="button"
                  onClick={() =>
                    isAuthenticated ? onEnterApp('post') : onOpenAuth('seller')
                  }
                  className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-white/30 bg-black/45 px-6 text-sm font-semibold whitespace-nowrap text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/65"
                >
                  <Store className="h-4 w-4 text-accent" />
                  Post Your Food
                </button>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-white/75">
                <span>Real kitchen photos</span>
                <span aria-hidden="true">·</span>
                <span>Live order status</span>
                <span aria-hidden="true">·</span>
                <span>Secure Paystack checkout</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#141414]/70 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-7 md:grid-cols-4 md:px-6 lg:px-8">
            {[
              { value: '36 + FCT', label: 'Nigerian States covered' },
              { value: '774 LGAs', label: 'Local distance matching' },
              { value: '100% Real', label: 'Seller-snapped plate photos' },
              { value: 'Paystack', label: 'Direct verified seller payouts' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.3,
                  delay: idx * 0.05,
                  ease: EASE_OUT_EXPO,
                }}
              >
                <p className="font-heading tabular-nums-clean text-2xl font-bold tracking-tight text-primary">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium text-white/75">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section
          id="plates"
          className="mx-auto max-w-6xl px-4 py-14 md:px-6 lg:px-8 lg:py-16"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold text-accent">
                Fresh from nearby kitchens
              </p>
              <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                Popular plates ready right now
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onEnterApp('home')}
              className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-2 self-start rounded-[14px] border border-white/25 bg-black/45 px-4 text-xs font-semibold whitespace-nowrap text-white backdrop-blur-sm transition-colors hover:bg-black/65"
            >
              See all kitchens
              <ArrowRight className="h-4 w-4 text-accent" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredKitchens.map((kitchen, idx) => {
              const dist = getDistanceToRestaurant(location, kitchen);
              const leadItem = kitchen.menu[0];

              return (
                <motion.div
                  key={kitchen.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.3,
                    delay: idx * 0.05,
                    ease: EASE_OUT_EXPO,
                  }}
                >
                  <Card
                    padding="none"
                    interactive
                    className="flex h-full flex-col overflow-hidden bg-surface text-text-primary shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRestaurant(kitchen)}
                      className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-primary-soft text-left"
                    >
                      <PlateImage
                        src={kitchen.heroImageUrl}
                        alt={leadItem ? leadItem.name : kitchen.name}
                        className="h-full w-full transition-transform duration-200 hover:scale-105"
                      />
                    </button>

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          <span className="tabular-nums-clean font-semibold text-text-primary">
                            {kitchen.rating.toFixed(1)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{dist} km away</span>
                        </div>

                        <h3 className="font-heading mt-1 truncate text-base font-bold text-text-primary">
                          {leadItem ? leadItem.name : kitchen.name}
                        </h3>
                        <p className="mt-0.5 truncate text-xs font-medium text-text-secondary">
                          {kitchen.name} · {kitchen.area}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-soft pt-3">
                        <div>
                          <p className="tabular-nums-clean font-heading text-base font-bold text-primary">
                            {leadItem ? formatNaira(leadItem.price) : 'Menu'}
                          </p>
                          <p className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                            <Clock className="h-3 w-3 text-primary" />
                            {kitchen.deliveryMinutes}
                          </p>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onSelectRestaurant(kitchen)}
                        >
                          Order
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-6xl px-4 pb-14 md:px-6 lg:px-8 lg:pb-16"
        >
          <div>
            <p className="text-xs font-semibold text-accent">
              Simple for buyers &amp; local cooks
            </p>
            <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
              From neighborhood kitchen to your table
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Pick your Nigerian LGA',
                body: 'Match with neighborhood cooks and bukas across all 36 States, FCT Abuja, and 774 LGAs.',
                icon: Compass,
                action: () => onEnterApp('home'),
                cta: 'Browse Feed',
              },
              {
                num: '02',
                title: 'See real seller photos',
                body: 'Every dish card shows real kitchen food photos, transparent Naira pricing, and delivery fees upfront.',
                icon: ShieldCheck,
                action: () => onEnterApp('menu'),
                cta: 'Open Menu',
              },
              {
                num: '03',
                title: 'Track live order status',
                body: 'Follow your meal in real time from Paid to Accepted to Preparing to Delivered.',
                icon: Bike,
                action: () => onEnterApp('orders'),
                cta: 'Track Order',
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="flex flex-col justify-between rounded-[16px] border border-white/15 bg-[#161616]/78 p-6 backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-sm font-bold text-accent">
                        {step.num}.
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>

                    <h3 className="font-heading mt-5 text-lg font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      {step.body}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={step.action}
                    className="mt-6 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 self-start text-xs font-semibold text-accent transition-colors hover:text-white"
                  >
                    {step.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section
          id="sellers"
          className="mx-auto max-w-6xl px-4 pb-16 md:px-6 lg:px-8"
        >
          <div className="coral-glow-shadow relative overflow-hidden rounded-[16px] bg-primary/95 p-7 text-white backdrop-blur-sm md:p-10">
            <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-soft">
                  <MapPin className="h-3.5 w-3.5" />
                  Built for Nigerian Neighborhood Kitchens
                </p>
                <h2 className="font-heading mt-2 text-2xl leading-tight font-bold text-balance text-white md:text-4xl">
                  Ready to eat or share what&apos;s cooking in your pot today?
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/95 md:text-base">
                  Snap a plate, set your Naira price, and receive direct payouts
                  into your bank or online bank account.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
                <button
                  type="button"
                  onClick={() => onEnterApp('home')}
                  className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-full bg-surface px-6 text-sm font-semibold whitespace-nowrap text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-soft"
                >
                  Start Ordering
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    isAuthenticated ? onEnterApp('post') : onOpenAuth('seller')
                  }
                  className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-full border border-white/60 bg-primary-dark px-6 text-sm font-semibold whitespace-nowrap text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-text-primary"
                >
                  <ChefHat className="h-4 w-4" />
                  Post Food
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-[#121212]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:px-6 lg:px-8">
          <div>
            <p className="font-heading text-lg font-bold text-white">
              Chop<span className="text-primary">BellyFull</span>
            </p>
            <p className="text-xs text-white/65">
              Warm homemade meals across all 36 Nigerian States &amp; FCT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-white/75">
            <button
              type="button"
              onClick={() => onEnterApp('home')}
              className="cursor-pointer transition-colors hover:text-white"
            >
              Home Feed
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('post')}
              className="cursor-pointer transition-colors hover:text-white"
            >
              Post Food
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('orders')}
              className="cursor-pointer transition-colors hover:text-white"
            >
              Orders
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('profile')}
              className="cursor-pointer text-accent transition-colors hover:text-white"
            >
              Profile
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}