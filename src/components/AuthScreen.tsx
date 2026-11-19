import {
  ArrowLeft,
  Lock,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import { saveMyKitchen, signInWithEmail, signUpWithEmail } from '../lib/auth';
import { loadSessionUser } from '../lib/marketplace';
import { supabase } from '../lib/supabase';
import { AuthUser, FoodCategoryKey, UserRole } from '../types/delivery';
import { NigeriaLocationPicker } from './NigeriaLocationPicker';
import { Button, Card, Input, Select } from './ui';

interface AuthScreenProps {
  initialRole: UserRole;
  user: AuthUser;
  promptMessage: string | null;
  onLogin: (user: AuthUser) => void;
  onBackToLanding?: () => void;
}

type CategoryKey = Exclude<FoodCategoryKey, 'all'>;

const KITCHEN_CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'jollof', label: 'Jollof & Rice' },
  { key: 'swallows', label: 'Swallows & Soups' },
  { key: 'suya', label: 'Suya & Grills' },
  { key: 'small_chops', label: 'Small Chops' },
  { key: 'pepper_soup', label: 'Pepper Soup' },
  { key: 'drinks', label: 'Drinks' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidNigerianPhone(value: string) {
  return /^(\+?234|0)\d{10}$/.test(value.replace(/[\s-]/g, ''));
}

export function AuthScreen({
  initialRole,
  user,
  promptMessage,
  onLogin,
  onBackToLanding,
}: AuthScreenProps) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState(user.buyerArea || 'Eti-Osa, Lagos');
  const [landmark, setLandmark] = useState('');
  const [kitchenName, setKitchenName] = useState('');
  const [kitchenAddress, setKitchenAddress] = useState('');
  const [kitchenCategory, setKitchenCategory] = useState<CategoryKey>('jollof');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setInfo('');

    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }

    if (mode === 'signup') {
      if (name.trim().length < 2) {
        setError('Please enter your name (at least 2 characters).');
        return;
      }
      if (!isValidNigerianPhone(phone)) {
        setError('Enter a valid Nigerian phone number (e.g. 0805 112 9087).');
        return;
      }
      if (role === 'buyer' && landmark.trim().length < 4) {
        setError('Enter your street or nearby delivery landmark.');
        return;
      }
      if (role === 'seller') {
        if (kitchenName.trim().length < 3) {
          setError('Enter your kitchen name (at least 3 characters).');
          return;
        }
        if (kitchenAddress.trim().length < 4) {
          setError('Enter your kitchen street address.');
          return;
        }
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        const result = await signUpWithEmail({
          email,
          password,
          fullName: name,
          phone,
        });

        if (result.needsEmailConfirmation) {
          setMode('signin');
          setInfo(
            'Account created! Open the confirmation link we emailed you, then sign in here.'
          );
          return;
        }

        if (role === 'seller') {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();
          if (!authUser) {
            throw new Error(
              'Account created, but we could not set up your kitchen. Please sign in and try again.'
            );
          }
          try {
            await saveMyKitchen(authUser.id, {
              business_name: kitchenName.trim(),
              area,
              address: kitchenAddress.trim(),
              category: kitchenCategory,
            });
          } catch (kitchenErr) {
            const reason =
              kitchenErr instanceof Error ? kitchenErr.message : 'unknown error';
            throw new Error(
              `Your account was created, but your kitchen could not be saved (${reason}).`
            );
          }
        }
      }

      const base: AuthUser =
        mode === 'signup'
          ? {
              ...user,
              buyerArea: area,
              buyerLandmark:
                role === 'buyer' ? landmark.trim() : kitchenAddress.trim(),
            }
          : user;

      const sessionUser = await loadSessionUser(base);
      if (!sessionUser) {
        throw new Error('Could not sign you in. Please try again.');
      }
      onLogin(sessionUser);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === 'signup';

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
              <h1 className="font-heading mt-3 text-2xl font-bold text-text-primary">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                {promptMessage ||
                  (isSignup
                    ? 'Order homemade meals or sell from your kitchen.'
                    : 'Sign in to order or manage your kitchen.')}
              </p>
            </div>

            {isSignup && (
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
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {isSignup && (
                <>
                  <Input
                    id="auth-name"
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tunde Adewale"
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
                </>
              )}

              <Input
                id="auth-email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={<Mail className="h-4 w-4" />}
              />
              <Input
                id="auth-password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                icon={<Lock className="h-4 w-4" />}
              />

              {isSignup && role === 'buyer' && (
                <>
                  <NigeriaLocationPicker
                    value={area}
                    onChange={setArea}
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
              )}

              {isSignup && role === 'seller' && (
                <div className="space-y-3 rounded-[14px] bg-bg p-3.5">
                  <span className="text-xs font-semibold text-text-primary">
                    Your Kitchen
                  </span>
                  <Input
                    id="auth-kitchen-name"
                    label="Kitchen Name"
                    type="text"
                    value={kitchenName}
                    onChange={(e) => setKitchenName(e.target.value)}
                    placeholder="e.g. Mama Nkechi Buka"
                  />
                  <Input
                    id="auth-kitchen-address"
                    label="Kitchen Address"
                    type="text"
                    value={kitchenAddress}
                    onChange={(e) => setKitchenAddress(e.target.value)}
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
                    value={kitchenCategory}
                    onChange={(e) =>
                      setKitchenCategory(e.target.value as CategoryKey)
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

              {info && (
                <div className="rounded-[12px] bg-success/10 px-3.5 py-2.5 text-xs font-semibold text-success">
                  {info}
                </div>
              )}
              {error && (
                <div className="rounded-[12px] bg-error/10 px-3.5 py-2.5 text-xs font-semibold text-error">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" fullWidth disabled={loading}>
                {loading
                  ? 'Please wait...'
                  : isSignup
                    ? role === 'seller'
                      ? 'Create Account & Kitchen'
                      : 'Create Account'
                    : 'Sign In'}
              </Button>

              <p className="pt-1 text-center text-xs text-text-secondary">
                {isSignup ? 'Already have an account?' : 'New to ChopBellyFull?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(isSignup ? 'signin' : 'signup');
                    setError('');
                    setInfo('');
                  }}
                  className="cursor-pointer font-semibold text-primary hover:text-primary-dark hover:underline"
                >
                  {isSignup ? 'Sign in' : 'Create an account'}
                </button>
              </p>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}