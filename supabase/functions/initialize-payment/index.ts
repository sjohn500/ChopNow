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

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ---- validate the request ----
    const body = await req.json();
    const items = body.items;
    const deliveryAddress = String(body.delivery_address ?? "").trim();

    if (!Array.isArray(items) || items.length < 1 || items.length > 30)
      return json({ error: "Your cart is empty" }, 400);
    if (deliveryAddress.length < 5) return json({ error: "Please enter a delivery address" }, 400);

    const qtyById = new Map<string, number>();
    for (const it of items) {
      const id = String(it?.food_id ?? "");
      const qty = Number(it?.quantity);
      if (!id || !Number.isInteger(qty) || qty < 1 || qty > 50)
        return json({ error: "Invalid item in cart" }, 400);
      qtyById.set(id, (qtyById.get(id) ?? 0) + qty);
    }

    // ---- load real prices from the database ----
    const { data: foods, error: foodsErr } = await admin
      .from("foods")
      .select("id, seller_id, name, price_kobo, is_available")
      .in("id", [...qtyById.keys()]);
    if (foodsErr || !foods || foods.length !== qtyById.size)
      return json({ error: "Some items no longer exist" }, 400);
    if (foods.some((f) => !f.is_available))
      return json({ error: "Some items are no longer available" }, 400);

    const sellerIds = new Set(foods.map((f) => f.seller_id));
    if (sellerIds.size !== 1) return json({ error: "Please order from one seller at a time" }, 400);
    const sellerId = foods[0].seller_id as string;
    if (sellerId === user.id) return json({ error: "You can't order your own food" }, 400);

    const { data: payout } = await admin
      .from("seller_payout")
      .select("paystack_subaccount_code")
      .eq("seller_id", sellerId)
      .maybeSingle();
    if (!payout?.paystack_subaccount_code)
      return json({ error: "This seller can't receive payments yet" }, 400);

    // ---- totals (all in kobo) ----
    const total = foods.reduce((sum, f) => sum + f.price_kobo * qtyById.get(f.id)!, 0);
    const commission = Math.round((total * COMMISSION_PERCENT) / 100);

    const orderId = crypto.randomUUID();
    const reference = `cb_${orderId.replaceAll("-", "")}`;

    // ---- create order, items, payment record ----
    const { error: orderErr } = await admin.from("orders").insert({
      id: orderId,
      buyer_id: user.id,
      seller_id: sellerId,
      total_kobo: total,
      commission_kobo: commission,
      status: "pending_payment",
      delivery_address: deliveryAddress,
      payment_reference: reference,
    });
    if (orderErr) {
      console.error(orderErr);
      return json({ error: "Could not create order" }, 500);
    }

    const cancelOrder = () =>
      admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);

    const { error: itemsErr } = await admin.from("order_items").insert(
      foods.map((f) => ({
        order_id: orderId,
        food_id: f.id,
        name: f.name,
        unit_price_kobo: f.price_kobo,
        quantity: qtyById.get(f.id)!,
      })),
    );
    if (itemsErr) {
      console.error(itemsErr);
      await cancelOrder();
      return json({ error: "Could not save order items" }, 500);
    }

    await admin.from("payments").insert({
      order_id: orderId,
      reference,
      amount_kobo: total,
      status: "initialized",
    });

    // ---- ask Paystack for the checkout link ----
    const siteUrl = Deno.env.get("SITE_URL");
    const init = await paystack("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        // Paystack needs an email. Phone-only users get a placeholder.
        email: user.email ?? `${user.id}@users.chopbelly.app`,
        amount: total,
        currency: "NGN",
        reference,
        subaccount: payout.paystack_subaccount_code,
        transaction_charge: commission, // Chopbelly's cut, in kobo
        bearer: "account", // Chopbelly pays Paystack's fee out of the commission
        metadata: { order_id: orderId },
        ...(siteUrl ? { callback_url: `${siteUrl}/orders?order=${orderId}` } : {}),
      }),
    });

    if (!init.ok) {
      console.error(init.data);
      await cancelOrder();
      return json({ error: "Could not start payment" }, 502);
    }

    return json({
      authorization_url: init.data.data.authorization_url,
      reference,
      order_id: orderId,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "Something went wrong" }, 500);
  }
});