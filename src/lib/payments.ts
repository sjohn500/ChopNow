import { supabase } from './supabase';

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

async function extractFunctionError(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const res = (error as { context?: Response }).context;
    if (res && typeof res.json === 'function') {
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) return body.error;
      } catch {
        // Ignore JSON parse errors and fall back
      }
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function getMyPayoutAccount(): Promise<PayoutAccountSummary | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('seller_payout')
    .select('account_name, bank_code, account_number')
    .eq('seller_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function verifySellerBank(
  input: VerifySellerBankInput
): Promise<{ account_name: string }> {
  const { data, error } = await supabase.functions.invoke('create-subaccount', {
    body: {
      verify_only: true,
      bank_code: input.bank_code,
      account_number: input.account_number,
    },
  });

  if (error) {
    throw new Error(
      await extractFunctionError(error, 'Could not verify that bank account.')
    );
  }

  if (!data?.account_name) {
    throw new Error(
      (data as { error?: string } | null)?.error ??
        'Could not verify that bank account.'
    );
  }

  return { account_name: data.account_name as string };
}

export async function saveSellerBank(
  input: SaveSellerBankInput
): Promise<SaveSellerBankResult> {
  const { data, error } = await supabase.functions.invoke('create-subaccount', {
    body: input,
  });

  if (error) {
    throw new Error(
      await extractFunctionError(error, 'Could not save your bank details.')
    );
  }

  if (!data?.account_name) {
    throw new Error(
      (data as { error?: string } | null)?.error ??
        'Could not verify your bank account.'
    );
  }

  return data as SaveSellerBankResult;
}

export async function startCheckout(
  items: CheckoutItemInput[],
  buyer: CheckoutBuyerInput
): Promise<StartCheckoutResult> {
  const { data, error } = await supabase.functions.invoke('initialize-payment', {
    body: {
      items,
      buyer_name: buyer.name,
      buyer_phone: buyer.phone,
      delivery_address: buyer.deliveryAddress,
    },
  });

  if (error) {
    throw new Error(
      await extractFunctionError(error, 'Could not start Paystack checkout.')
    );
  }

  if (!data?.authorization_url) {
    throw new Error(
      (data as { error?: string } | null)?.error ??
        'Could not get a payment link.'
    );
  }

  return data as StartCheckoutResult;
}