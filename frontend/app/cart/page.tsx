'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';
import PageShell from '@/components/site/page-shell';
import {
  siteContainer,
  siteCard,
  siteBtnPrimary,
  siteBtnSecondary,
  siteBackLink,
  siteBadge,
  siteDivider,
  siteHeading,
  siteSubtext,
} from '@/lib/siteStyles';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const { dark: darkMode } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  const handleCheckout = () => {
    if (!user) {
      router.push('/login');
    } else {
      router.push('/checkout');
    }
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <PageShell>
      <div className={cn(siteContainer(), 'py-10 md:py-14')}>
        <Link href="/" className={cn(siteBackLink(darkMode), 'mb-8')}>
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <div className="mb-10">
          <h1 className={siteHeading(darkMode, 'lg')}>Shopping Cart</h1>
          <p className={cn(siteSubtext(darkMode), 'mt-2')}>
            Review your items before checkout
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className={cn(siteCard(darkMode), 'p-12 text-center')}>
            <ShoppingCart className={cn(
              'w-20 h-20 mx-auto mb-6',
              darkMode ? 'text-gray-600' : 'text-gray-300'
            )} />
            <h2 className={cn(siteHeading(darkMode, 'sm'), 'mb-4')}>Your cart is empty</h2>
            <p className={cn(siteSubtext(darkMode), 'mb-8 max-w-md mx-auto')}>
              Discover our premium saffron collection and add some items to get started.
            </p>
            <Link href="/products">
              <Button className={siteBtnPrimary()}>Shop Premium Saffron</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <div className={cn(siteCard(darkMode), 'p-6 md:p-8')}>
                <h2 className={cn(siteHeading(darkMode, 'sm'), 'mb-6 text-xl md:text-2xl')}>
                  My Bag ({cartItems.reduce((sum, item) => sum + (item.quantity ?? item.qty ?? 1), 0)} items)
                </h2>
                <div className="space-y-6">
                  {cartItems.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <div className={cn(siteDivider(darkMode), 'mb-6')} />}
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden">
                          <Image
                            src={item.image || '/placeholder.jpg'}
                            alt={item.name || ''}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="grow min-w-0">
                          <h3 className={cn(siteHeading(darkMode, 'sm'), 'text-base md:text-lg truncate')}>
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {item.grade && (
                              <span className={siteBadge(darkMode)}>{item.grade}</span>
                            )}
                            {item.weight && (
                              <span className={cn('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>
                                {item.weight}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 flex items-baseline gap-3 flex-wrap">
                            <span className={cn(siteHeading(darkMode, 'sm'), 'text-xl md:text-2xl')}>₹{item.price}</span>
                            {item.originalPrice ? (
                              <>
                                <span className={cn('text-lg line-through', darkMode ? 'text-gray-400' : 'text-gray-500')}>₹{item.originalPrice}</span>
                                <span className={cn('text-sm', siteSubtext(darkMode))}>
                                  ({Math.round(((item.originalPrice - (item.price ?? 0)) / (item.originalPrice || 1)) * 100)}% OFF)
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, (item.quantity ?? item.qty ?? 0) - 1)}
                            className={siteBtnSecondary(darkMode, 'h-8 w-8 p-0 rounded-full')}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>

                          <span className={cn(
                            'text-base font-medium min-w-8 text-center',
                            darkMode ? 'text-white' : 'text-gray-900'
                          )}>
                            {item.quantity ?? item.qty ?? 0}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, (item.quantity ?? item.qty ?? 0) + 1)}
                            className={siteBtnSecondary(darkMode, 'h-8 w-8 p-0 rounded-full')}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className={cn(siteHeading(darkMode, 'sm'), 'text-lg')}>
                            ₹{(item.price ?? 0) * (item.quantity ?? item.qty ?? 0)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-2 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className={cn(siteCard(darkMode), 'p-6 md:p-8 sticky top-24')}>
                <h2 className={cn(siteHeading(darkMode, 'sm'), 'mb-6 text-xl')}>
                  Order Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={siteSubtext(darkMode)}>Subtotal</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className={siteSubtext(darkMode)}>Shipping (tax inclusive)</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>₹{shipping}</span>
                  </div>

                  {subtotal <= 500 && (
                    <p className="text-sm text-amber-600 font-light">
                      Add ₹{500 - subtotal} more for free shipping
                    </p>
                  )}

                  <div className={cn(siteDivider(darkMode), 'pt-3')} />

                  <div className="flex justify-between">
                    <span className={cn(siteHeading(darkMode, 'sm'), 'text-lg')}>Total</span>
                    <span className={cn(siteHeading(darkMode, 'sm'), 'text-lg')}>₹{total}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  className={cn(siteBtnPrimary(), 'w-full mt-6')}
                >
                  Proceed to Checkout
                </Button>

                <div className="mt-5 text-center">
                  <div className="inline-flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <p className={cn('text-xs', siteSubtext(darkMode))}>
                      Secure 256-bit SSL encryption
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
