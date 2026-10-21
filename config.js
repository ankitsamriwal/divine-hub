/* Divine Hub — public runtime config. Nothing here is secret: payment LINKS are
   public URLs by design. Secrets (token signing key, webhook secrets, admin key)
   live only in the Cloudflare worker's env; see docs/LAUNCH.md.
   Payment links are unused while PAYMENTS_ENABLED is false. */
window.DH_CONFIG = {
  WORKER_URL: 'https://divine-guide.ankitsamriwal.workers.dev',

  /* PAYMENTS ARE OFF in this release (owner decision): no checkout links or
     buy buttons are rendered, and the four links below are not used even if
     filled in. The app offers a 7-day free trial and a demand test instead.
     To switch payments on later, set this to true AND set the worker var
     PAYMENTS_ENABLED="true" (docs/LAUNCH.md). Keep both in step. */
  PAYMENTS_ENABLED: false,

  /* Planned price shown in the demand test (and on the paywall once payments are on). */
  PRICE_MONTHLY_USD: '$1.99', PRICE_YEARLY_USD: '$14.99',
  PRICE_MONTHLY_INR: '₹99',   PRICE_YEARLY_INR: '₹699',

  /* DORMANT. Provider routing (Ankit's decision): India / INR -> Razorpay, everyone else
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
