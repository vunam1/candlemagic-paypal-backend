VERCEL PAYPAL BACKEND — CANDLEMAGIC.CLICK

Deploy folder này lên Vercel.

Environment Variables bắt buộc:
PAYPAL_CLIENT_ID = PayPal LIVE Client ID
PAYPAL_CLIENT_SECRET = PayPal LIVE Client Secret
ALLOWED_ORIGIN = https://www.candlemagic.click

Sau deploy, test:
https://TEN-PROJECT.vercel.app/api/health
Phải thấy JSON có "ok": true.

PAYMENT_API_URL trong landing phải là:
https://TEN-PROJECT.vercel.app/api

Frontend sẽ gọi:
POST /api/create-order
POST /api/capture-order

Không đưa PAYPAL_CLIENT_SECRET vào HTML.
