import { corsHeaders, json, paypalToken, pp, expectedAmount, requestId } from './_paypal.js';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405);

    let body;
    try { body = await request.json(); }
    catch { return json(request, { error: 'Invalid JSON' }, 400); }

    try {
      const amount = expectedAmount(body.quantity);
      if (!amount) return json(request, { error: 'Invalid bundle quantity' }, 400);

      const token = await paypalToken();
      const order = await pp('/v2/checkout/orders', token, {
        method: 'POST',
        requestId: requestId('create'),
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            description: `Christmas Magic Finds — ${String(body.bundle || '')} — ${String(body.designs || '')}`.slice(0, 127),
            custom_id: `CMF-${Date.now()}`,
            amount: { currency_code: 'USD', value: amount }
          }],
          application_context: { shipping_preference: 'NO_SHIPPING' }
        })
      });

      return json(request, { orderID: order.id });
    } catch (err) {
      console.error(err);
      return json(request, { error: 'PayPal create order failed', detail: err.message || String(err) }, 500);
    }
  }
};
