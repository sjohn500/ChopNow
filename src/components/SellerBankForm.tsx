import { useState } from 'react';
import { saveSellerBank, verifySellerBank } from '../lib/payments';

// Bank codes come from Paystack's Nigerian bank list. Double-check any bank your
// sellers use against Paystack's live /bank API before going live.
const ONLINE_BANKS = [
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
];

const COMMERCIAL_BANKS = [
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
  const [verifiedName, setVerifiedName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedName, setSavedName] = useState('');

  const canVerify = bankCode !== '' && accountNumber.length === 10 && !verifying && !saving;
  const canSave =
    businessName.trim().length >= 2 &&
    verifiedName !== '' &&
    bankCode !== '' &&
    accountNumber.length === 10 &&
    !saving;

  async function handleVerify() {
    if (!canVerify) return;
    setVerifying(true);
    setError('');
    setVerifiedName('');
    try {
      const result = await verifySellerBank({
        bank_code: bankCode,
        account_number: accountNumber,
      });
      setVerifiedName(result.account_name);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not verify that bank account.'
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit() {
    if (!canSave) return;
    setSaving(true);
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
      setError(
        e instanceof Error ? e.message : 'Could not save your bank details.'
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-2xl border border-[#F1E4DC] bg-white px-4 py-3 text-[#2B2B2B] outline-none transition focus:border-[#FF6F61] focus:ring-2 focus:ring-[#FF6F61]/30';

  if (savedName) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0_4px_14px_rgba(255,111,97,0.15)]">
        <p className="text-lg font-semibold text-[#2E9E6B]">
          Payout account saved ✅
        </p>
        <p className="mt-2 text-[#6B6B6B]">
          Payments for your food will go to{' '}
          <span className="font-semibold text-[#2B2B2B]">{savedName}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_4px_14px_rgba(255,111,97,0.15)]">
      <h2 className="text-xl font-bold text-[#2B2B2B]">
        Where should we send your money?
      </h2>
      <p className="mt-1 text-sm text-[#6B6B6B]">
        Step 1: Verify your account name. Step 2: Confirm and save.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#2B2B2B]">
            Business name
          </label>
          <input
            className={inputClass}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Mama Ada's Kitchen"
            maxLength={80}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#2B2B2B]">
            Bank / Online Bank
          </label>
          <select
            className={inputClass}
            value={bankCode}
            onChange={(e) => {
              setBankCode(e.target.value);
              setVerifiedName('');
              setError('');
            }}
          >
            <option value="">Select your bank</option>
            <optgroup label="Online / Digital Banks">
              {ONLINE_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Commercial Banks">
              {COMMERCIAL_BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[#2B2B2B]">
            Account number
          </label>
          <input
            className={inputClass}
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
              setVerifiedName('');
              setError('');
            }}
            placeholder="10-digit account number"
            inputMode="numeric"
          />
        </div>

        {verifiedName && (
          <div className="rounded-xl border border-[#2E9E6B]/30 bg-[#2E9E6B]/10 px-4 py-3 text-sm">
            <p className="font-semibold text-[#2E9E6B]">Account verified ✅</p>
            <p className="mt-0.5 font-bold text-[#2B2B2B]">{verifiedName}</p>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-[#FFE3DA] px-4 py-3 text-sm font-medium text-[#D62839]">
            {error}
          </p>
        )}

        {!verifiedName ? (
          <button
            type="button"
            onClick={handleVerify}
            disabled={!canVerify}
            className="w-full rounded-full bg-[#FF6F61] px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(255,111,97,0.35)] transition hover:bg-[#E8504A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? 'Verifying account name...' : 'Verify Account Name'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave}
            className="w-full rounded-full bg-[#2E9E6B] px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(46,158,107,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving payout account...' : 'Confirm & Save Bank Details'}
          </button>
        )}
      </div>
    </div>
  );
}