import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const COMMISSION_PERCENT = Number(Deno.env.get("COMMISSION_PERCENT") ?? "10");

async function paystack(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.status === true, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Please sign in first" }, 401);

    const body = await req.json();
    const verifyOnly = body.verify_only === true;
    const businessName = String(body.business_name ?? "").trim();
    const bankCode = String(body.bank_code ?? "").trim();
    const accountNumber = String(body.account_number ?? "").trim();

    if (!verifyOnly && (businessName.length < 2 || businessName.length > 80)) {
      return json({ error: "Business name must be 2-80 characters" }, 400);
    }
    if (!/^\d{3,6}$/.test(bankCode)) return json({ error: "Invalid bank" }, 400);
    if (!/^\d{10}$/.test(accountNumber)) {
      return json({ error: "Account number must be 10 digits" }, 400);
    }

    const resolved = await paystack(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    );
    if (!resolved.ok) {
      return json(
        { error: resolved.data?.message || "Could not verify that bank account" },
        400,
      );
    }
    const accountName: string = resolved.data.data.account_name;

    if (verifyOnly) {
      return json({ ok: true, account_name: accountName });
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    await admin.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
    const { error: sellerErr } = await admin
      .from("seller_profiles")
      .upsert({ id: user.id, business_name: businessName });
    if (sellerErr) return json({ error: "Could not save seller profile" }, 500);

    const { data: existing } = await admin
      .from("seller_payout")
      .select("paystack_subaccount_code")
      .eq("seller_id", user.id)
      .maybeSingle();

    let subaccountCode = existing?.paystack_subaccount_code as string | undefined;

    if (subaccountCode) {
      const updated = await paystack(`/subaccount/${subaccountCode}`, {
        method: "PUT",
        body: JSON.stringify({
          business_name: businessName,
          settlement_bank: bankCode,
          account_number: accountNumber,
        }),
      });
      if (!updated.ok) return json({ error: updated.data?.message ?? "Paystack update failed" }, 400);
    } else {
      const created = await paystack("/subaccount", {
        method: "POST",
        body: JSON.stringify({
          business_name: businessName,
          settlement_bank: bankCode,
          account_number: accountNumber,
          percentage_charge: COMMISSION_PERCENT,
        }),
      });
      if (!created.ok) return json({ error: created.data?.message ?? "Paystack error" }, 400);
      subaccountCode = created.data.data.subaccount_code;
    }

    const { error: payoutErr } = await admin.from("seller_payout").upsert({
      seller_id: user.id,
      bank_code: bankCode,
      account_number: accountNumber,
      account_name: accountName,
      paystack_subaccount_code: subaccountCode,
    });
    if (payoutErr) return json({ error: "Could not save payout details" }, 500);

    return json({ ok: true, account_name: accountName, business_name: businessName });
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong" }, 500);
  }
});
