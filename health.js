export default {
  async fetch() {
    return Response.json({ ok: true, service: 'candlemagic-paypal-backend' });
  }
};
