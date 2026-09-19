import crypto from 'node:crypto';

const LIVE_BASE = 'https://api-m.paypal.com';

export const PRICE_BY_QTY = {
  1: '9.00',
  2: '16.00',
  3: '21.00',
  4: '24.00'
};

export function expectedAmount(quantity) {
  return PRICE_BY_QTY[Number(quantity)] || null;
}

export function corsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const configured =
    process.env.ALLOWED_ORIGIN ||
    'https://www.candlemagic.click';

  const base = configured.replace(
    /^https?:\/\/(www\.)?/,
    ''
  );

  const allowedOrigins = new Set([
    configured,
    `https://${base}`,
    `https://www.${base}`,
  ]);

  return {
    'Access-Control-Allow-Origin':
      allowedOrigins.has(origin)
        ? origin
        : configured,

    'Access-Control-Allow-Methods':
      'POST, OPTIONS',

    'Access-Control-Allow-Headers':
      'Content-Type',

    'Vary': 'Origin',
    'Content-Type':
      'application/json; charset=utf-8',

    'Cache-Control': 'no-store',
  };
}

export function json(
  request,
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: corsHeaders(request)
    }
  );
}

export async function paypalToken() {
  const id =
    process.env.PAYPAL_CLIENT_ID;

  const secret =
    process.env.PAYPAL_CLIENT_SECRET;

  if (!id || !secret) {
    throw new Error(
      'PayPal server secrets are missing'
    );
  }

  const auth = Buffer
    .from(`${id}:${secret}`)
    .toString('base64');

  const r = await fetch(
    `${LIVE_BASE}/v1/oauth2/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    }
  );

  const j = await r.json();

  if (!r.ok || !j.access_token) {
    throw new Error(
      j.error_description ||
      'Could not authenticate with PayPal'
    );
  }

  return j.access_token;
}

export async function pp(
  path,
  token,
  options = {}
) {
  const headers = {
    Authorization:
      `Bearer ${token}`,

    'Content-Type':
      'application/json',

    ...(options.requestId
      ? {
          'PayPal-Request-Id':
            options.requestId
        }
      : {}),

    ...(options.headers || {}),
  };

  const r = await fetch(
    `${LIVE_BASE}${path}`,
    {
      method:
        options.method || 'GET',

      headers,

      ...(options.body !== undefined
        ? { body: options.body }
        : {}),
    }
  );

  const text = await r.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
  } catch {
    data = { raw: text };
  }

  if (!r.ok) {
    const err = new Error(
      data.message ||
      data.name ||
      `PayPal error ${r.status}`
    );

    err.status = r.status;
    err.paypal = data;

    throw err;
  }

  return data;
}

export function requestId(
  prefix = 'req'
) {
  return `${prefix}-${crypto.randomUUID()}`;
}
