import { corsHeaders, json, paypalToken, pp, expectedAmount } from './_paypal.js';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method !== 'POST') return json(request, { error: 'Method not allowed' }, 405);

    let body;
    try { body = await request.json(); }
    catch { return json(request, { error: 'Invalid JSON' }, 400); }

    const orderID = String(body.orderID || '').trim();
    const expected = expectedAmount(body.quantity);
    if (!orderID || !expected) return json(request, { error: 'Missing or invalid order data' }, 400);

    try {
      const token = await paypalToken();

      await pp(`/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, token, {
        method: 'POST',
        requestId: `capture-${orderID}`,
        body: '{}'
      });

      const verifiedOrder = await pp(`/v2/checkout/orders/${encodeURIComponent(orderID)}`, token, { method: 'GET' });
      const unit = verifiedOrder.purchase_units?.[0];
      const capture = unit?.payments?.captures?.[0];
      const amount = capture?.amount?.value || '';
      const currency = capture?.amount?.currency_code || '';
      const verified = verifiedOrder.status === 'COMPLETED' && capture?.status === 'COMPLETED' && amount === expected && currency === 'USD';

      if (!verified) {
        return json(request, {
          verified: false,
          orderID,
          status: verifiedOrder.status || '',
          captureStatus: capture?.status || '',
          amount,
          currency
        }, 409);
      }

      return json(request, {
        verified: true,
        orderID,
        status: verifiedOrder.status,
        captureStatus: capture.status,
        captureID: capture.id,
        amount,
        currency
      });
    } catch (err) {
      console.error(err);
      return json(request, { error: 'PayPal verification failed', detail: err.message || String(err) }, 500);
    }
  }
};
