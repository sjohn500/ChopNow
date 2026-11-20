import { apiRequest, setAuthToken } from './api';

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  buyerArea?: string;
  buyerLandmark?: string;
};

type AuthResponse = {
  needs_email_confirmation?: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
  };
};

export async function signUpWithEmail(input: SignUpInput) {
  const res = await apiRequest<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      buyer_area: input.buyerArea ?? 'Eti-Osa, Lagos',
      buyer_landmark: input.buyerLandmark ?? '',
    }),
  });

  setAuthToken(res.token);
  return { needsEmailConfirmation: Boolean(res.needs_email_confirmation) };
}

export async function signInWithEmail(email: string, password: string) {
  const res = await apiRequest<AuthResponse>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });
  setAuthToken(res.token);
}

export async function signOut() {
  try {
    await apiRequest('/api/auth/signout', { method: 'POST' });
  } finally {
    setAuthToken(null);
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const res = await apiRequest<{ user: { id: string } | null }>('/api/auth/session');
  return res.user?.id ?? null;
}

export type Kitchen = {
  id: string;
  business_name: string;
  area: string | null;
  address: string | null;
  category: string | null;
  cover_image_url: string | null;
};

export async function getMyKitchen(_userId?: string): Promise<Kitchen | null> {
  const res = await apiRequest<{ kitchen: Kitchen | null }>('/api/seller/kitchen');
  return res.kitchen;
}

export async function saveMyKitchen(
  _userId: string,
  input: { business_name: string; area: string; address: string; category: string }
) {
  await apiRequest('/api/seller/kitchen', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}