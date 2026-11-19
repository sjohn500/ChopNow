import { createClient } from "npm:@supabase/supabase-js@2.49.4";

async function hmacSha512Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Use POST", { status: 405 });

  // 1. Verify the request really came from Paystack
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = await hmacSha512Hex(Deno.env.get("PAYSTACK_SECRET_KEY")!, rawBody);
  if (!signature || signature !== expected) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);

    // We only act on successful charges; acknowledge everything else
    if (event.event !== "charge.success") return new Response("ignored", { status: 200 });

    const reference: string = event.data?.reference;
    const amount: number = event.data?.amount;
    const currency: string = event.data?.currency;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: payment } = await admin
      .from("payments")
      .select("order_id")
      .eq("reference", reference)
      .maybeSingle();
    if (!payment) return new Response("unknown reference", { status: 200 });

    const { data: order } = await admin
      .from("orders")
      .select("id, total_kobo, status")
      .eq("id", payment.order_id)
      .maybeSingle();
    if (!order) return new Response("unknown order", { status: 200 });

    // 2. Amount and currency must match what we expected
    if (amount !== order.total_kobo || currency !== "NGN") {
      console.error("Amount mismatch", { reference, amount, expected: order.total_kobo });
      await admin
        .from("payments")
        .update({ status: "amount_mismatch", raw: event })
        .eq("reference", reference);
      return new Response("mismatch", { status: 200 });
    }

    // 3. Mark paid (only if still pending, so retries are harmless)
    await admin.from("payments").update({ status: "success", raw: event }).eq("reference", reference);
    await admin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", order.id)
      .eq("status", "pending_payment");

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
});