/* Divine Hub — public runtime config. Nothing here is secret: payment LINKS are
   public URLs by design. Secrets (token signing key, webhook secrets, admin key)
   live only in the Cloudflare worker's env; see docs/PAYMENTS.md.
   Leave a link as '' until the provider product exists: the Plus sheet then shows
   "checkout opens soon" and falls back to the email request path. */
window.DH_CONFIG = {
  WORKER_URL: 'https://divine-guide.ankitsamriwal.workers.dev',

  PRICE_MONTHLY_USD: '$1.99', PRICE_YEARLY_USD: '$14.99',
  PRICE_MONTHLY_INR: '₹99',   PRICE_YEARLY_INR: '₹699',

  /* Provider routing (Ankit's decision): India / INR -> Razorpay, everyone else
     (USD/AED diaspora) -> Stripe. All four values are PLACEHOLDERS until Ankit
     creates the products; they are public URLs, not secrets.
     Stripe: the app appends ?client_reference_id=<claim id> to the Payment Link.
     Razorpay: the app appends ?claim_id=<claim id>; the Payment Page needs a
     field named claim_id so it lands in payment notes. */
  STRIPE_LINK_MONTHLY: '',   // $1.99/month  e.g. https://buy.stripe.com/xxxx
  STRIPE_LINK_YEARLY: '',    // $14.99/year
  RAZORPAY_LINK_MONTHLY: '', // ₹99/month    e.g. https://pages.razorpay.com/xxxx
  RAZORPAY_LINK_YEARLY: '',  // ₹699/year

  OWNER_EMAIL: 'ankitsamriwal@gmail.com'
};
