export const SHIPPING_FREE_THRESHOLD = 500;
export const SHIPPING_CHARGE = 50;
export const TAX_RATE = 0.18;

export function calculateCheckoutTotals(subtotal: number) {
  const shipping = subtotal > SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;

  return { subtotal, shipping, tax, total };
}
