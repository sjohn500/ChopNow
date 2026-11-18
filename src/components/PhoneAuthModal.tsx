import { Phone, Store, User, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { SellerProfile, UserRole, UserSession } from '../types/chopnow';
import { validateNigerianPhone } from '../utils/format';

interface PhoneAuthModalProps {
  isOpen: boolean;
  session: UserSession;
  sellers: SellerProfile[];
  onClose: () => void;
  onSaveSession: (patch: Partial<UserSession>) => void;
  onRegisterSeller: (input: Omit<SellerProfile, 'id'>) => SellerProfile;
}

export function PhoneAuthModal({
  isOpen,
  session,
  sellers,
  onClose,
  onSaveSession,
  onRegisterSeller,
}: PhoneAuthModalProps) {
  const [phone, setPhone] = useState(session.phone);
  const [fullName, setFullName] = useState(session.fullName);
  const [role, setRole] = useState<UserRole>(session.role);
  const [selectedSellerId, setSelectedSellerId] = useState(
    session.activeSellerId
  );
  const [landmark, setLandmark] = useState(session.landmark);
  const [newKitchenName, setNewKitchenName] = useState('');
  const [newKitchenArea, setNewKitchenArea] = useState('');
  const [isAddingKitchen, setIsAddingKitchen] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function applyTestAccount(presetRole: UserRole) {
    if (presetRole === 'buyer') {
      setFullName('Chidi Okafor');
      setPhone('0805 112 9087');
      setLandmark('Unilag Main Gate, Akoka');
      setRole('buyer');
      setError('');
    } else {
      const seller = sellers[0];
      setFullName(seller.ownerName);
      setPhone(seller.phone);
      setRole('seller');
      setSelectedSellerId(seller.id);
      setError('');
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Enter your name so buyers or sellers know who is ordering.');
      return;
    }

    if (!validateNigerianPhone(phone)) {
      setError('Enter a valid Nigerian phone number (e.g. 0803 412 8890).');
      return;
    }

    let finalSellerId = selectedSellerId;

    if (role === 'seller' && isAddingKitchen) {
      if (newKitchenName.trim().length < 3) {
        setError('Enter your kitchen name (at least 3 characters).');
        return;
      }
      if (newKitchenArea.trim().length < 2) {
        setError('Enter your neighborhood or area (e.g. Yaba, Lagos).');
        return;
      }
      const created = onRegisterSeller({
        kitchenName: newKitchenName.trim(),
        ownerName: fullName.trim(),
        phone: phone.trim(),
        area: newKitchenArea.trim(),
        prepTime: '15–25 mins',
      });
      finalSellerId = created.id;
    }

    onSaveSession({
      fullName: fullName.trim(),
      phone: phone.trim(),
      role,
      activeSellerId: finalSellerId,
      landmark: landmark.trim() || 'Yaba Tech Gate',
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-xs md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl md:max-w-lg md:rounded-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 md:hidden" />

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="auth-modal-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              Phone Sign-In &amp; Role
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Switch between Buyer and Seller views to test the full flow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyTestAccount('buyer')}
            className="min-h-[40px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Fill Test Buyer
          </button>
          <button
            type="button"
            onClick={() => applyTestAccount('seller')}
            className="min-h-[40px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Fill Test Seller
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Account Role
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${
                  role === 'buyer'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="h-4 w-4" />
                Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ${
                  role === 'seller'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="h-4 w-4" />
                Seller
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-name"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Full Name
            </label>
            <input
              id="auth-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Chidi Okafor"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="auth-phone"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0803 412 8890"
                className="font-mono-num min-h-[44px] w-full rounded-xl border border-slate-200 pr-3.5 pl-10 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {role === 'buyer' ? (
            <div>
              <label
                htmlFor="auth-landmark"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Default Delivery Landmark
              </label>
              <input
                id="auth-landmark"
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Unilag Main Gate, Akoka"
                className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Active Test Kitchen
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingKitchen((prev) => !prev)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  {isAddingKitchen ? 'Pick existing kitchen' : '+ Add new kitchen'}
                </button>
              </div>

              {!isAddingKitchen ? (
                <select
                  value={selectedSellerId}
                  onChange={(e) => setSelectedSellerId(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.kitchenName} — {s.area}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={newKitchenName}
                    onChange={(e) => setNewKitchenName(e.target.value)}
                    placeholder="Kitchen name (e.g. Mama Tee Buka)"
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newKitchenArea}
                    onChange={(e) => setNewKitchenArea(e.target.value)}
                    placeholder="Area (e.g. Victoria Island, Lagos)"
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
          >
            Save &amp; Continue as {role === 'seller' ? 'Seller' : 'Buyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
