import { useState } from 'react';
import { saveSellerBank } from '../lib/payments';

// Bank codes come from Paystack's bank list. Double-check any bank your
// sellers use against Paystack's list before going live.
const BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'FCMB', code: '214' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank', code: '032' },
  { name: 'United Bank for Africa (UBA)', code: '033' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

type Props = {
  onSaved?: (accountName: string) => void;
};

export default function SellerBankForm({ onSaved }: Props) {
  const [businessName, setBusinessName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedName, setSavedName] = useState('');

  const canSubmit =
    businessName.trim().length >= 2 && bankCode !== '' && accountNumber.length === 10 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const result = await saveSellerBank({
        business_name: businessName.trim(),
        bank_code: bankCode,
        account_number: accountNumber,
      });
      setSavedName(result.account_name);
      onSaved?.(result.account_name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your bank details.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-2xl border border-[#F1E4DC] bg-white px-4 py-3 text-[#2B2B2B] outline-none transition focus:border-[#FF6F61] focus:ring-2 focus:ring-[#FF6F61]/30';

  if (savedName) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0_4px_14px_rgba(255,111,97,0.15)]">
        <p className="text-lg font-semibold text-[#2E9E6B]">Payout account saved ✅</p>
        <p className="mt-2 text-[#6B6B6B]">
          Payments for your food will go to <span className="font-semibold text-[#2B2B2B]">{savedName}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_4px_14px_rgba(255,111,97,0.15)]">
      <h2 className="text-xl font-bold text-[#2B2B2B]">Where should we send your money?</h2>
      <p className="mt-1 text-sm text-[#6B6B6B]">
        Add your bank details once. Buyers pay in the app and the money goes to your account.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2B2B2B]">Business name</label>
          <input
            className={inputClass}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Mama Ada's Kitchen"
            maxLength={80}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#2B2B2B]">Bank</label>
          <select className={inputClass} value={bankCode} onChange={(e) => setBankCode(e.target.value)}>
            <option value="">Select your bank</option>
            {BANKS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#2B2B2B]">Account number</label>
          <input
            className={inputClass}
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit account number"
            inputMode="numeric"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-[#FFE3DA] px-4 py-3 text-sm font-medium text-[#D62839]">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-full bg-[#FF6F61] px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(255,111,97,0.35)] transition hover:bg-[#E8504A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Checking your account...' : 'Save bank details'}
        </button>
      </div>
    </div>
  );
}