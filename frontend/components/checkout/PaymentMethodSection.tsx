'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, Shield, Smartphone, Wallet, Building2, Loader2 } from 'lucide-react';
import { isRazorpayConfigured } from '@/lib/razorpay';
import { siteBadge, siteBtnPrimary, siteBtnSecondary, siteCard } from '@/lib/siteStyles';

interface PaymentMethodSectionProps {
  darkMode: boolean;
  total: number;
  isProcessing: boolean;
  onBack: () => void;
  onPlaceOrder: () => void;
}

const SUPPORTED_METHODS = [
  { icon: Smartphone, label: 'UPI' },
  { icon: CreditCard, label: 'Credit Cards' },
  { icon: CreditCard, label: 'Debit Cards' },
  { icon: Building2, label: 'Net Banking' },
  { icon: Wallet, label: 'Wallets' },
];

export default function PaymentMethodSection({
  darkMode,
  total,
  isProcessing,
  onBack,
  onPlaceOrder,
}: PaymentMethodSectionProps) {
  const razorpayLive = isRazorpayConfigured();

  return (
    <div className="space-y-5">
      <div className={`${siteCard(darkMode)} p-5 ring-1 ${darkMode ? 'ring-rose-800/40' : 'ring-rose-200/60'}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="paymentMethod"
            value="online"
            defaultChecked
            className="mt-1 accent-rose-700"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Online Payment (Razorpay)
              </span>
              <span className={siteBadge(darkMode)}>Powered by Razorpay</span>
            </div>
            <p className={`text-sm mt-2 font-light ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Pay securely via Razorpay. Your card and banking details are never stored on our servers.
            </p>
          </div>
        </label>
      </div>

      <div>
        <p className={`text-[11px] font-medium tracking-[0.2em] uppercase mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Supported Methods
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUPPORTED_METHODS.map((method) => (
            <div
              key={method.label}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                darkMode
                  ? 'border-white/10 bg-white/[0.02] text-gray-300'
                  : 'border-gray-200/80 bg-white text-gray-600'
              }`}
            >
              <method.icon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{method.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`rounded-xl p-4 flex items-start gap-3 border ${
          darkMode ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/80 border-emerald-200/60'
        }`}
      >
        <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
            Secure Payment
          </p>
          <p className={`text-xs mt-1 font-light ${darkMode ? 'text-emerald-400/70' : 'text-emerald-700'}`}>
            256-bit SSL encryption. PCI-DSS compliant processing via Razorpay.
          </p>
        </div>
      </div>

      {!razorpayLive && (
        <p className={`text-xs font-light ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
          Razorpay credentials are not configured yet. Orders will be saved with pending payment status.
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className={`flex-1 ${siteBtnSecondary(darkMode)}`}
          onClick={onBack}
          disabled={isProcessing}
        >
          Back
        </Button>
        <Button
          className={`flex-1 ${siteBtnPrimary()}`}
          onClick={onPlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Placing Order...
            </span>
          ) : (
            `Place Order — ₹${total}`
          )}
        </Button>
      </div>
    </div>
  );
}
