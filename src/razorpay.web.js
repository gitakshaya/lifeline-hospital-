// Browser: Razorpay's hosted checkout.js. Metro picks this file automatically on web.
function loadScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Razorpay. Check your internet connection.'));
    document.body.appendChild(s);
  });
}

// Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature }, same as the native SDK
export async function openCheckout(options) {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: resolve,
      modal: { ondismiss: () => reject({ description: 'Payment cancelled' }) },
    });
    rzp.on('payment.failed', (r) => reject(r.error));
    rzp.open();
  });
}
