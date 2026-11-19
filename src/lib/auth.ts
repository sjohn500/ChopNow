import { supabase } from './supabase';

export type SignUpInput = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

/** Create an account. Returns whether the person must confirm their email first. */
export async function signUpWithEmail(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { full_name: input.fullName.trim() } },
  });
  if (error) throw new Error(error.message);

  // With "Confirm email" on, there is no session until the link is clicked.
  if (!data.session || !data.user) return { needsEmailConfirmation: true };

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: input.fullName.trim(), phone: input.phone.trim() })
    .eq('id', data.user.id);
  if (profileError) throw new Error('Account created, but we could not save your phone number.');

  return { needsEmailConfirmation: false };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export type Kitchen = {
  id: string;
  business_name: string;
  area: string | null;
  address: string | null;
  category: string | null;
  cover_image_url: string | null;
};

/** The signed-in person's kitchen, or null if they have not registered one. */
export async function getMyKitchen(userId: string): Promise<Kitchen | null> {
  const { data, error } = await supabase
    .from('seller_profiles')
    .select('id, business_name, area, address, category, cover_image_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Register (or update) the signed-in person's own kitchen. */
export async function saveMyKitchen(
  userId: string,
  input: { business_name: string; area: string; address: string; category: string },
) {
  const { error } = await supabase
    .from('seller_profiles')
    .upsert({ id: userId, ...input });
  if (error) throw new Error(error.message);
}