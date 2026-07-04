/**
 * Razorpay integration helpers.
 * Add RAZORPAY_KEY_ID (public) and RAZORPAY_KEY_SECRET (server) to enable live payments later.
 */

export interface RazorpayCheckoutOptions {
  orderId: string;
  amountInPaise: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
}

export function getRazorpayPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || null;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
}

export function isRazorpayServerConfigured(): boolean {
  return Boolean(isRazorpayConfigured() && (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET));
}

/** Options object for future Razorpay Checkout.open() integration */
export function buildRazorpayCheckoutOptions(options: RazorpayCheckoutOptions) {
  return {
    key: getRazorpayPublicKey(),
    amount: options.amountInPaise,
    currency: options.currency || 'INR',
    name: 'Real Spices',
    description: options.description || `Order ${options.orderId}`,
    order_id: undefined as string | undefined, // set after creating Razorpay order server-side
    prefill: {
      name: options.customerName,
      email: options.customerEmail,
      contact: options.customerPhone || '',
    },
    theme: { color: '#b91c1c' },
    notes: { merchant_order_id: options.orderId },
  };
}
