import {
  ArrowRight,
  Bike,
  ChefHat,
  Clock,
  Compass,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
  Store,
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatNaira, getDistanceToRestaurant } from '../data/deliveryData';
import { Restaurant, ScreenId } from '../types/delivery';
import { AccountPortalTab } from './AccountPortalModal';
import { PlateImage } from './PlateImage';

interface LandingPageProps {
  restaurants: Restaurant[];
  location: string;
  isAuthenticated: boolean;
  onEnterApp: (screen?: ScreenId) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenPortal: (tab: AccountPortalTab) => void;
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
  onOpenPortal,
}: LandingPageProps) {
  const featuredKitchens = restaurants.slice(0, 4);

  return (
    <div className="min-h-dvh bg-[#FAF6F1] text-[#1E1916]">
      <header className="sticky top-0 z-30 border-b border-[#E6DDD3] bg-[#FAF6F1]/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-display shrink-0 text-xl font-extrabold tracking-tight whitespace-nowrap text-[#1E1916]"
          >
            ChopBellyFull
          </button>

          <nav
            aria-label="Landing navigation"
            className="hidden items-center gap-6 text-sm font-medium text-[#5C5049] md:flex"
          >
            <a
              href="#plates"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#1E1916]"
            >
              Local Plates
            </a>
            <a
              href="#how-it-works"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#1E1916]"
            >
              How It Works
            </a>
            <a
              href="#coverage"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#1E1916]"
            >
              Nigeria Coverage
            </a>
            <a
              href="#sellers"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-[#1E1916]"
            >
              For Sellers
            </a>
          </nav>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onEnterApp('home')}
            className="min-h-[42px] shrink-0 rounded-full bg-[#D9232E] px-5 text-sm font-bold whitespace-nowrap text-[#FAF6F1] transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
          >
            {isAuthenticated ? 'Order Food' : 'Login / Sign Up'}
          </motion.button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-8 pb-12 md:px-6 md:pt-14 md:pb-16 lg:px-8 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              className="lg:col-span-6"
            >
              <p className="text-xs font-semibold tracking-wide text-[#C85A32]">
                All 36 States &amp; FCT · 774 Local Governments
              </p>

              <h1 className="font-display mt-3 text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.06] font-extrabold tracking-tight text-balance text-[#1E1916]">
                Real Nigerian food. You get what you order.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5C5049] md:text-lg">
                Browse fresh plates posted straight from neighborhood bukas,
                grills, and home kitchens near{' '}
                <span className="font-semibold text-[#1E1916]">{location}</span>
                —with distance in km and live rider route tracking.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                  onClick={() => onEnterApp('home')}
                  className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-[#D9232E] px-6 text-sm font-bold whitespace-nowrap text-[#FAF6F1] shadow-sm transition-colors hover:bg-[#b81c26] active:bg-[#9E141D]"
                >
                  Explore Kitchens Near You
                  <ArrowRight className="h-4 w-4" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                  onClick={() => onOpenPortal('seller')}
                  className="inline-flex min-h-[50px] items-center gap-2 rounded-full border border-[#E6DDD3] bg-white px-5 text-sm font-bold whitespace-nowrap text-[#1E1916] transition-colors hover:bg-[#F4E8D6]"
                >
                  <Store className="h-4 w-4 text-[#D9232E]" />
                  Post Your Kitchen
                </motion.button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#5C5049]">
                <span>Actual seller-snapped photos</span>
                <span aria-hidden="true">·</span>
                <span>Swipeable mobile + full desktop view</span>
                <span aria-hidden="true">·</span>
                <span>Paystack or Cash on Delivery</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.55,
                delay: 0.08,
                ease: EASE_OUT_EXPO,
              }}
              className="lg:col-span-6"
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="soft-card-shadow relative aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-[#E8D5B7]"
              >
                <PlateImage
                  src={HERO_FEAST_IMAGE}
                  alt="Spiced Nigerian rice with charred grilled chicken quarter and sautéed bell peppers"
                  className="h-full w-full"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1916]/80 via-[#1E1916]/15 to-transparent" />

                <div className="absolute right-5 bottom-5 left-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-semibold text-[#F4E8D6]">
                      Mama Put Express · Eti-Osa, Lagos
                    </p>
                    <p className="font-display text-lg font-extrabold text-white">
                      Spiced Rice &amp; Charred Grilled Chicken
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterApp('menu')}
                    className="tabular-nums-clean min-h-[40px] shrink-0 self-start rounded-full bg-white px-4 text-xs font-bold whitespace-nowrap text-[#1E1916] shadow-md transition-colors hover:bg-[#F4E8D6] sm:self-auto"
                  >
                    View Menu · ₦4,200
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-[#E6DDD3] bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-7 md:grid-cols-4 md:px-6 lg:px-8">
            {[
              { value: '36 + FCT', label: 'Nigerian States covered' },
              { value: '774 LGAs', label: 'Local area distance matching' },
              { value: '100% Real', label: 'Kitchen-snapped plate photos' },
              { value: '15–30 min', label: 'Average local delivery ETA' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.06,
                  ease: EASE_OUT_EXPO,
                }}
              >
                <p className="font-display tabular-nums-clean text-2xl font-extrabold tracking-tight text-[#1E1916]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium text-[#5C5049]">
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
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
          >
            <div>
              <p className="text-xs font-semibold text-[#C85A32]">
                Fresh from nearby kitchens
              </p>
              <h2 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-[#1E1916] md:text-3xl">
                Popular local plates ready right now
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onEnterApp('home')}
              className="inline-flex min-h-[42px] shrink-0 items-center gap-1.5 self-start text-sm font-bold whitespace-nowrap text-[#D9232E] transition-colors hover:text-[#9E141D] sm:self-auto"
            >
              See all kitchens
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {featuredKitchens.map((kitchen, idx) => {
              const dist = getDistanceToRestaurant(location, kitchen);
              const leadItem = kitchen.menu[0];

              return (
                <motion.article
                  key={kitchen.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.38,
                    delay: idx * 0.06,
                    ease: EASE_OUT_EXPO,
                  }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  className="soft-card-shadow flex flex-col overflow-hidden rounded-[22px] bg-white"
                >
                  <button
                    type="button"
                    onClick={() => onSelectRestaurant(kitchen)}
                    className="flex flex-1 flex-col text-left focus:outline-none"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-[#F4E8D6]">
                      <PlateImage
                        src={kitchen.heroImageUrl}
                        alt={kitchen.name}
                        className="h-full w-full transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display truncate text-base font-bold text-[#1E1916]">
                            {kitchen.name}
                          </h3>
                          <span className="tabular-nums-clean inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#1E1916]">
                            <Star className="h-3.5 w-3.5 fill-[#D99B26] text-[#D99B26]" />
                            {kitchen.rating.toFixed(1)}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-[#5C5049]">
                          {leadItem ? leadItem.name : kitchen.cuisineTags[0]}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#E6DDD3] pt-3 text-xs">
                        <span className="tabular-nums-clean flex items-center gap-1 font-medium text-[#5C5049]">
                          <Clock className="h-3.5 w-3.5 text-[#D9232E]" />
                          {kitchen.deliveryMinutes} · {dist} km
                        </span>
                        <span className="tabular-nums-clean font-extrabold text-[#1E1916]">
                          {leadItem ? formatNaira(leadItem.price) : 'Menu'}
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-6xl px-4 pb-14 md:px-6 lg:px-8 lg:pb-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          >
            <p className="text-xs font-semibold text-[#C85A32]">
              Built for buyers and local kitchens
            </p>
            <h2 className="font-display mt-1 text-2xl font-extrabold tracking-tight text-[#1E1916] md:text-3xl">
              From local pot to your gate in three steps
            </h2>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {[
              {
                num: '01',
                title: 'Pick your State & Local Government',
                body: 'Search any of Nigeria’s 36 States, FCT Abuja, and 774 LGAs—or tap GPS to automatically match kitchens closest to you.',
                icon: Compass,
                span: 'lg:col-span-5',
                action: () => onOpenPortal('buyer'),
                cta: 'Set Buyer Location',
              },
              {
                num: '02',
                title: 'Order exact plates posted by sellers',
                body: 'Sellers upload real food photos and Naira prices straight from their kitchen. Zero stock-photo guesswork.',
                icon: ShieldCheck,
                span: 'lg:col-span-4',
                action: () => onEnterApp('menu'),
                cta: 'Browse Live Menu',
              },
              {
                num: '03',
                title: 'Track the kitchen & rider route',
                body: 'Swipe or click into the live map to see kitchen location, rider ETA, and call or message on arrival.',
                icon: Bike,
                span: 'lg:col-span-3',
                action: () => onEnterApp('tracking'),
                cta: 'View Live Map',
              },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.38,
                    delay: idx * 0.08,
                    ease: EASE_OUT_EXPO,
                  }}
                  whileHover={{ y: -3 }}
                  className={`flex flex-col justify-between rounded-[24px] border border-[#E6DDD3] bg-white p-6 ${step.span}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-display tabular-nums-clean text-sm font-extrabold text-[#D9232E]">
                        {step.num}.
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4E8D6] text-[#1E1916]">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>

                    <h3 className="font-display mt-5 text-lg font-bold text-[#1E1916]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#5C5049]">
                      {step.body}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={step.action}
                    className="mt-6 inline-flex min-h-[40px] items-center gap-1.5 self-start text-xs font-bold text-[#D9232E] transition-colors hover:text-[#9E141D]"
                  >
                    {step.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section
          id="coverage"
          className="mx-auto max-w-6xl px-4 pb-16 md:px-6 lg:px-8"
        >
          <motion.div
            id="sellers"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="relative overflow-hidden rounded-[28px] bg-[#D9232E] p-7 text-[#FAF6F1] md:p-10"
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="landing-aso-oke"
                  width="32"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M0 16 L16 0 L32 16 L16 32 Z M8 16 L16 8 L24 16 L16 24 Z"
                    fill="none"
                    stroke="#FAF6F1"
                    strokeWidth="1.2"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#landing-aso-oke)" />
            </svg>

            <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F4E8D6]">
                  <MapPin className="h-3.5 w-3.5" />
                  Nationwide Nigerian Directory
                </p>
                <h2 className="font-display mt-2 text-2xl leading-tight font-extrabold text-balance text-white md:text-4xl">
                  Ready to eat—or ready to sell your pots across Nigeria?
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#FAF6F1]/90 md:text-base">
                  Whether you are ordering smoky Jollof in Lekki, Wuse 2,
                  Ibadan, Port Harcourt, or Kano—or publishing fresh plates from
                  your own kitchen—ChopBellyFull connects buyers and sellers in
                  seconds.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onEnterApp('home')}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#FAF6F1] px-6 text-sm font-bold whitespace-nowrap text-[#1E1916] shadow-md transition-colors hover:bg-[#F4E8D6]"
                >
                  <Navigation className="h-4 w-4 text-[#D9232E]" />
                  Start Ordering
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenPortal('seller')}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#9E141D] px-6 text-sm font-bold whitespace-nowrap text-[#FAF6F1] ring-1 ring-[#FAF6F1]/30 transition-colors hover:bg-[#1E1916]"
                >
                  <ChefHat className="h-4 w-4" />
                  Seller Login
                </motion.button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-[#E6DDD3] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:px-6 lg:px-8">
          <div>
            <p className="font-display text-lg font-extrabold text-[#1E1916]">
              ChopBellyFull
            </p>
            <p className="text-xs text-[#5C5049]">
              You get what you order · All 36 Nigerian States &amp; FCT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-[#5C5049]">
            <button
              type="button"
              onClick={() => onEnterApp('home')}
              className="hover:text-[#1E1916]"
            >
              Home Discovery
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('menu')}
              className="hover:text-[#1E1916]"
            >
              Menus &amp; Tray
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('tracking')}
              className="hover:text-[#1E1916]"
            >
              Live Tracking
            </button>
            <button
              type="button"
              onClick={() => onOpenPortal('buyer')}
              className="text-[#D9232E] hover:text-[#9E141D]"
            >
              Buyer / Seller Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
