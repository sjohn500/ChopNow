import { supabase } from './supabase';

async function invoke<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    let message = 'Something went wrong. Please try again.';
    try {
      // The Edge Function sends { error: "..." }; read it from the response.
      const response = (error as { context?: Response }).context;
      if (response && typeof response.json === 'function') {
        const payload = await response.json();
        if (payload?.error) message = payload.error;
      }
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }

  return data as T;
}

export type CartLine = { food_id: string; quantity: number };

/** Seller saves bank details. Creates their Paystack subaccount. */
export function saveSellerBank(input: {
  business_name: string;
  bank_code: string;
  account_number: string;
}) {
  return invoke<{ ok: true; account_name: string; business_name: string }>(
    'create-subaccount',
    input,
  );
}

/** Buyer pays. Creates the order, then opens the Paystack checkout page. */
export async function startCheckout(items: CartLine[], deliveryAddress: string) {
  const data = await invoke<{ authorization_url: string; order_id: string }>(
    'initialize-payment',
    { items, delivery_address: deliveryAddress },
  );
  window.location.href = data.authorization_url;
}