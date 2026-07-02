import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Server-side price catalog. Client can only confirm this value, never override it.
const PSYCHOMETRIC_PRICE = 499;
const CURRENT_PRICE_IN_PAISE = PSYCHOMETRIC_PRICE * 100;
const PRICE_CATALOG: Record<string, { amount: number; currency: string }> = {
  psychometric: { amount: CURRENT_PRICE_IN_PAISE, currency: 'INR' },
  college: { amount: CURRENT_PRICE_IN_PAISE, currency: 'INR' },
  school: { amount: CURRENT_PRICE_IN_PAISE, currency: 'INR' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const flow_type = String(body?.flow_type || 'psychometric');
    const expectedAmount = Number(body?.expected_amount || CURRENT_PRICE_IN_PAISE);
    const pricing = PRICE_CATALOG[flow_type];
    if (!pricing) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid flow_type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pricing.amount !== CURRENT_PRICE_IN_PAISE) {
      return new Response(JSON.stringify({ success: false, error: 'Payment price configuration error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (expectedAmount !== CURRENT_PRICE_IN_PAISE) {
      console.error('[Payment] Client/server price mismatch before order creation', {
        flow_type,
        frontendAmount: expectedAmount,
        backendAmount: CURRENT_PRICE_IN_PAISE,
      });
      return new Response(JSON.stringify({ success: false, error: 'Payment price changed. Please refresh and try again.' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ success: false, error: 'Razorpay not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const receipt = `rcpt_${flow_type}_${user.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);
    const auth = btoa(`${keyId}:${keySecret}`);
    console.info('[Payment] Creating Razorpay order', {
      flow_type,
      user_id: user.id,
      frontendAmount: expectedAmount,
      backendAmount: pricing.amount,
      currency: pricing.currency,
    });
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: pricing.amount,
        currency: pricing.currency,
        receipt,
        notes: { user_id: user.id, flow_type },
      }),
    });

    const order = await rzpRes.json();
    if (!rzpRes.ok) {
      return new Response(JSON.stringify({ success: false, error: order?.error?.description || 'Razorpay order failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (Number(order?.amount) !== pricing.amount || order?.currency !== pricing.currency) {
      console.error('[Payment] Razorpay created order with wrong amount', {
        flow_type,
        frontendAmount: expectedAmount,
        backendAmount: pricing.amount,
        razorpayOrderAmount: order?.amount,
        currency: order?.currency,
      });
      return new Response(JSON.stringify({ success: false, error: 'Payment could not be started. Please try again.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.info('[Payment] Razorpay order created', {
      flow_type,
      order_id: order.id,
      backendAmount: pricing.amount,
      razorpayOrderAmount: Number(order.amount),
      currency: order.currency,
    });

    return new Response(JSON.stringify({
      success: true,
      key_id: keyId,
      order_id: order.id,
      amount: Number(order.amount),
      currency: pricing.currency,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
