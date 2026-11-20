import { apiRequest, getAuthToken } from './api';

export type VerifySellerBankInput = {
  bank_code: string;
  account_number: string;
};

export type SaveSellerBankInput = {
  business_name: string;
  bank_code: string;
  account_number: string;
};

export type SaveSellerBankResult = {
  account_name: string;
  subaccount_code?: string;
};

export type PayoutAccountSummary = {
  account_name: string;
  bank_code: string;
  account_number: string;
};

export type CheckoutItemInput = {
  food_id: string;
  quantity: number;
};

export type CheckoutBuyerInput = {
  name: string;
  phone: string;
  deliveryAddress: string;
};

export type StartCheckoutResult = {
  authorization_url: string;
  reference: string;
  order_id: string;
  total_kobo: number;
};

export async function getMyPayoutAccount(): Promise<PayoutAccountSummary | null> {
  if (!getAuthToken()) return null;
  const res = await apiRequest<{ payout: PayoutAccountSummary | null }>(
    '/api/seller/payout'
  );
  return res.payout;
}

export async function verifySellerBank(
  input: VerifySellerBankInput
): Promise<{ account_name: string }> {
  const res = await apiRequest<{ ok: boolean; account_name: string }>(
    '/api/payments/verify-bank',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return { account_name: res.account_name };
}

export async function saveSellerBank(
  input: SaveSellerBankInput
): Promise<SaveSellerBankResult> {
  return apiRequest<SaveSellerBankResult>('/api/payments/save-bank', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function startCheckout(
  items: CheckoutItemInput[],
  buyer: CheckoutBuyerInput
): Promise<StartCheckoutResult> {
  return apiRequest<StartCheckoutResult>('/api/payments/initialize', {
    method: 'POST',
    body: JSON.stringify({
      items,
      buyer_name: buyer.name,
      buyer_phone: buyer.phone,
      delivery_address: buyer.deliveryAddress,
    }),
  });
}