import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Current server-side price catalog. Only ₹499 orders are valid.
const PSYCHOMETRIC_PRICE = 499;
const CURRENT_PRICE_IN_PAISE = PSYCHOMETRIC_PRICE * 100;
const PRICE_CATALOG: Record<string, { amount: number; currency: string }> = {
  psychometric: { amount: CURRENT_PRICE_IN_PAISE, currency: 'INR' },
  college: { amount: CURRENT_PRICE_IN_PAISE, currency: 'INR' },
  school: { amount: CURRENT_PRICE_IN_PAISE, currency: 'INR' },
};

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

const signRazorpayPayload = async (payload: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!keyId || !keySecret || !supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ success: false, error: 'Payment verification is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const flowType = String(body?.flow_type || 'psychometric');
    const expectedAmount = Number(body?.expected_amount || CURRENT_PRICE_IN_PAISE);
    const pricing = PRICE_CATALOG[flowType];
    const razorpayOrderId = String(body?.razorpay_order_id || '');
    const razorpayPaymentId = String(body?.razorpay_payment_id || '');
    const razorpaySignature = String(body?.razorpay_signature || '');

    if (!pricing || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payment details' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (expectedAmount !== CURRENT_PRICE_IN_PAISE) {
      console.error('[Payment] Client/server price mismatch before verification', {
        flowType,
        frontendAmount: expectedAmount,
        verificationAmount: CURRENT_PRICE_IN_PAISE,
      });
      return new Response(JSON.stringify({ success: false, error: 'Payment price changed. Please refresh and try again.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const expectedSignature = await signRazorpayPayload(`${razorpayOrderId}|${razorpayPaymentId}`, keySecret);
    if (expectedSignature !== razorpaySignature) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid payment signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
      headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` },
    });
    const order = await orderRes.json();
    const orderAmount = Number(order?.amount);
    if (!orderRes.ok || orderAmount !== pricing.amount || order?.currency !== pricing.currency) {
      console.error('[Payment] Verification amount mismatch', {
        flowType,
        frontendAmount: expectedAmount,
        verificationAmount: pricing.amount,
        razorpayOrderAmount: orderAmount,
        currency: order?.currency,
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment verification failed. Please contact support if money was deducted.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.info('[Payment] Verification amount confirmed', {
      flowType,
      frontendAmount: expectedAmount,
      verificationAmount: pricing.amount,
      razorpayOrderAmount: orderAmount,
      razorpayOrderId,
    });

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const accessPatch = {
      test_access_activated: true,
      psychometric_result_paid: true,
      subscribed: true,
      subscription_tier: flowType,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedSubscriber, error: updateError } = await admin
      .from('subscribers')
      .update(accessPatch)
      .eq('user_id', user.id)
      .select('user_id')
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedSubscriber) {
      const { error: insertError } = await admin.from('subscribers').insert({
        user_id: user.id,
        email: user.email,
        ...accessPatch,
      });
      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true, amount: pricing.amount, currency: pricing.currency }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});