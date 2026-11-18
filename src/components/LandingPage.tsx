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
import { formatNaira, getDistanceToRestaurant } from '../data/deliveryData';
import { Restaurant, ScreenId } from '../types/delivery';
import { PlateImage } from './PlateImage';
import { Badge, Button, Card } from './ui';

interface LandingPageProps {
  restaurants: Restaurant[];
  location: string;
  isAuthenticated: boolean;
  onEnterApp: (screen?: ScreenId) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenAuth: (role?: 'buyer' | 'seller') => void;
}

const HERO_FEAST_IMAGE =
  '/assets/aistudio/pexels-discountedchef-40262791_428c23ce.jpg';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function LandingPage({
  restaurants,
  location,
  isAuthenticated,
  onEnterApp,
  onSelectRestaurant,
  onOpenAuth,
}: LandingPageProps) {
  const featuredKitchens = restaurants.slice(0, 4);

  return (
    <div className="min-h-dvh bg-bg text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border-soft bg-bg/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-heading shrink-0 cursor-pointer text-xl font-bold tracking-tight whitespace-nowrap text-text-primary"
          >
            Chop<span className="text-primary">BellyFull</span>
          </button>

          <nav
            aria-label="Landing navigation"
            className="hidden items-center gap-6 text-sm font-medium text-text-secondary md:flex"
          >
            <a
              href="#plates"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-primary"
            >
              Fresh Plates
            </a>
            <a
              href="#how-it-works"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-primary"
            >
              How It Works
            </a>
            <a
              href="#sellers"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-primary"
            >
              Sell Food
            </a>
          </nav>

          <Button
            type="button"
            size="sm"
            onClick={() => (isAuthenticated ? onEnterApp('home') : onOpenAuth('buyer'))}
          >
            {isAuthenticated ? 'Open Marketplace' : 'Login / Sign Up'}
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-8 pb-12 md:px-6 md:pt-14 md:pb-16 lg:px-8 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="lg:col-span-6"
            >
              <Badge variant="peach">
                36 States &amp; FCT · Neighborhood Kitchens
              </Badge>

              <h1 className="font-heading mt-4 text-[clamp(2.15rem,4.5vw,3.5rem)] leading-[1.08] font-bold tracking-tight text-balance text-text-primary">
                Warm homemade meals, straight from local pots.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
                Discover fresh Jollof, swallows, suya, and breakfast boxes
                cooked daily by trusted sellers near{' '}
                <span className="font-semibold text-text-primary">{location}</span>.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => onEnterApp('home')}
                >
                  Explore Kitchens Near You
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() =>
                    isAuthenticated ? onEnterApp('post') : onOpenAuth('seller')
                  }
                >
                  <Store className="h-4 w-4" />
                  Post Your Food
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-text-secondary">
                <span>Real kitchen photos</span>
                <span aria-hidden="true">·</span>
                <span>Live order status</span>
                <span aria-hidden="true">·</span>
                <span>Paystack or Cash on Delivery</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.45,
                delay: 0.08,
                ease: EASE_OUT_EXPO,
              }}
              className="lg:col-span-6"
            >
              <Card
                padding="none"
                interactive
                className="relative overflow-hidden"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-soft">
                  <PlateImage
                    src={HERO_FEAST_IMAGE}
                    alt="Spiced Nigerian rice with charred grilled chicken quarter and sautéed bell peppers"
                    className="h-full w-full"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-text-primary/80 via-text-primary/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <Badge variant="mango">
                      <Star className="h-3 w-3 fill-text-primary" />
                      4.9 · New Batch
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-medium text-text-secondary">
                      Mama Put Express · Eti-Osa, Lagos
                    </p>
                    <p className="font-heading mt-0.5 text-lg font-bold text-text-primary">
                      Spiced Rice &amp; Charred Chicken
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="tabular-nums-clean font-heading text-lg font-bold text-primary">
                      ₦4,200
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onEnterApp('menu')}
                    >
                      Order
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-border-soft bg-surface">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-7 md:grid-cols-4 md:px-6 lg:px-8">
            {[
              { value: '36 + FCT', label: 'Nigerian States covered' },
              { value: '774 LGAs', label: 'Local distance matching' },
              { value: '100% Real', label: 'Seller-snapped plate photos' },
              { value: '15–30 min', label: 'Average local delivery ETA' },
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
                <p className="mt-1 text-xs font-medium text-text-secondary">
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
              <p className="text-xs font-semibold text-primary">
                Fresh from nearby kitchens
              </p>
              <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Popular plates ready right now
              </h2>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEnterApp('home')}
            >
              See all kitchens
              <ArrowRight className="h-4 w-4" />
            </Button>
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
                    className="flex h-full flex-col overflow-hidden"
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
                      <div className="absolute top-3 left-3">
                        <Badge variant="mango">
                          <Star className="h-3 w-3 fill-text-primary" />
                          {kitchen.rating.toFixed(1)}
                        </Badge>
                      </div>
                    </button>

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <h3 className="font-heading truncate text-base font-bold text-text-primary">
                          {leadItem ? leadItem.name : kitchen.name}
                        </h3>
                        <p className="mt-0.5 truncate text-xs font-medium text-text-secondary">
                          {kitchen.name} · {dist} km
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
            <p className="text-xs font-semibold text-primary">
              Simple for buyers &amp; local cooks
            </p>
            <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
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
                title: 'See exact seller photos',
                body: 'Every dish card shows real food photos, transparent Naira pricing, and Mango star ratings.',
                icon: ShieldCheck,
                action: () => onEnterApp('menu'),
                cta: 'Open Menu',
              },
              {
                num: '03',
                title: 'Track live order status',
                body: 'Follow your plate from Pending to Accepted to Delivered with direct rider chat and call.',
                icon: Bike,
                action: () => onEnterApp('orders'),
                cta: 'Track Order',
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.num} padding="lg" interactive className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge variant="peach">{step.num}</Badge>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>

                    <h3 className="font-heading mt-5 text-lg font-bold text-text-primary">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {step.body}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={step.action}
                    className="mt-6 inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 self-start text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
                  >
                    {step.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="sellers" className="mx-auto max-w-6xl px-4 pb-16 md:px-6 lg:px-8">
          <div className="coral-glow-shadow relative overflow-hidden rounded-[16px] bg-primary p-7 text-white md:p-10">
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
                  Snap a plate, set your Naira price, and connect with hungry
                  neighbors in seconds.
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

      <footer className="border-t border-border-soft bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:px-6 lg:px-8">
          <div>
            <p className="font-heading text-lg font-bold text-text-primary">
              Chop<span className="text-primary">BellyFull</span>
            </p>
            <p className="text-xs text-text-secondary">
              Warm homemade meals across all 36 Nigerian States &amp; FCT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-text-secondary">
            <button
              type="button"
              onClick={() => onEnterApp('home')}
              className="cursor-pointer transition-colors hover:text-primary"
            >
              Home Feed
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('post')}
              className="cursor-pointer transition-colors hover:text-primary"
            >
              Post Food
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('orders')}
              className="cursor-pointer transition-colors hover:text-primary"
            >
              Orders
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('profile')}
              className="cursor-pointer text-primary transition-colors hover:text-primary-dark"
            >
              Profile
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
