'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShieldCheck, CircleCheck as CheckCircle, ChevronDown, Pencil, MapPin, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';
import { useUser } from '@/context/UserContext';
import { getUserInfo } from '@/lib/userApi';
import { saveOrderToDatabase } from '@/lib/orderApi';
import { saveAddress, getUserAddresses, Address } from '@/lib/addressApi';
import { calculateCheckoutTotals } from '@/lib/checkoutConstants';
import PageShell from '@/components/site/page-shell';
import {
  siteContainer,
  siteSection,
  siteCard,
  siteBtnPrimary,
  siteBtnSecondary,
  siteBackLink,
  siteHeading,
  siteSubtext,
  siteDivider,
  siteEyebrow,
} from '@/lib/siteStyles';
import PaymentMethodSection from '@/components/checkout/PaymentMethodSection';

type Step = 'shipping' | 'address' | 'payment';

export default function CheckoutPage() {
  const { dark: darkMode } = useTheme();
  const { user, authLoading } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [expandedAddress, setExpandedAddress] = useState(false);
  const [orderData, setOrderData] = useState<{ orderId?: string; paymentStatus?: string }>({});
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [confirmedSnapshot, setConfirmedSnapshot] = useState<{
    items: LocalCartItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  } | null>(null);
  
  const [shippingData, setShippingData] = useState({
    name: '',
    email:'',
    phone: ''
  });
  const [userFetchError, setUserFetchError] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  type LocalCartItem = {
    id: number | string;
    name?: string;
    price?: number;
    quantity?: number;
    qty?: number;
    originalPrice?: number;
    image?: string;
    grade?: string;
    weight?: string;
    [key: string]: any;
  };

  const [cartItems, setCartItems] = useState<LocalCartItem[]>([]);

  const subtotal = cartItems.reduce((sum, item) => sum + ((item.price ?? 0) * (item.quantity ?? 0)), 0);
  const { shipping, tax, total } = calculateCheckoutTotals(subtotal);

  const displayItems = confirmedSnapshot?.items ?? cartItems;
  const displaySubtotal = confirmedSnapshot?.subtotal ?? subtotal;
  const displayShipping = confirmedSnapshot?.shipping ?? shipping;
  const displayTax = confirmedSnapshot?.tax ?? tax;
  const displayTotal = confirmedSnapshot?.total ?? total;

  useEffect(() => {
    if (authLoading) return;
    // Check if user is logged in, redirect to login if not
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch user details from user table (API)
    setUserLoading(true);
    setUserFetchError('');
    getUserInfo().then(res => {
      if (res.success && res.user) {
        setShippingData({
          name: res.user.name || '',
          email: res.user.email || '',
          phone: res.user.phone || ''
        });
      } else {
        setUserFetchError(res.error || 'Could not fetch user details');
      }
      setUserLoading(false);
      setLoadingAddress(false);
    });

    getUserAddresses().then((res) => {
      if (res.success && res.addresses && res.addresses.length > 0) {
        setSavedAddresses(res.addresses);
        const latest = res.addresses[0];
        setSelectedAddressId(latest.id);
        setAddressData({
          street: latest.street,
          city: latest.city,
          state: latest.state,
          pincode: latest.pincode,
        });
        setUseNewAddress(false);
      } else {
        setUseNewAddress(true);
      }
    });

    // Load cart items
    try {
      const raw = localStorage.getItem('tadbir_cart') || '[]';
      const parsed = JSON.parse(raw) as LocalCartItem[];
      const normalized = parsed.map(i => ({ ...i, quantity: i.quantity ?? i.qty ?? 1 }));
      setCartItems(normalized);
    } catch {
      setCartItems([]);
    }
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'tadbir_cart') {
        try {
          const parsed = JSON.parse(ev.newValue || '[]') as LocalCartItem[];
          const normalized = parsed.map(i => ({ ...i, quantity: i.quantity ?? i.qty ?? 1 }));
          setCartItems(normalized);
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user, authLoading, router]);

  const validateShipping = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    if (!shippingData.name) newErrors.name = 'Name is required';
    if (!shippingData.email) newErrors.email = 'Email is required';
    if (!shippingData.phone) newErrors.phone = 'Phone is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateAddress = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    if (!addressData.street) newErrors.street = 'Street is required';
    if (!addressData.city) newErrors.city = 'City is required';
    if (!addressData.state) newErrors.state = 'State is required';
    if (!addressData.pincode) newErrors.pincode = 'Pincode is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleShippingNext = () => {
    if (validateShipping()) {
      setCurrentStep('address');
    }
  };

  const selectSavedAddress = (address: Address) => {
    setSelectedAddressId(address.id);
    setUseNewAddress(false);
    setAddressData({
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setErrors({});
  };

  const handleAddressNext = async () => {
    if (!validateAddress()) return;

    if (!user?.id) {
      alert('Please log in to continue.');
      return;
    }

    if (!useNewAddress && selectedAddressId) {
      setCurrentStep('payment');
      return;
    }

    try {
      const result = await saveAddress({
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
      });

      if (result.success && result.address) {
        setSelectedAddressId(result.address.id);
        setSavedAddresses((prev) => {
          const exists = prev.some((a) => a.id === result.address!.id);
          return exists ? prev : [result.address!, ...prev];
        });
        setCurrentStep('payment');
      } else {
        alert(result.error || 'Failed to save address. Please try again.');
      }
    } catch {
      alert('An error occurred while saving the address.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select or save a delivery address before placing your order.');
      setCurrentStep('address');
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      const orderItems = cartItems.map((item) => ({
        id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
        name: item.name || '',
        price: item.price || 0,
        quantity: item.quantity || 1,
        weight: item.weight,
        image: item.image,
        grade: item.grade,
      }));

      const orderId = 'RS' + Date.now().toString().slice(-8);
      const snapshot = { items: [...cartItems], subtotal, shipping, tax, total };

      const result = await saveOrderToDatabase({
        orderId,
        orderDetails: orderItems,
        totalAmount: total,
        subtotal,
        shipping,
        tax,
        addressId: selectedAddressId,
        shippingAddress: {
          ...addressData,
          name: shippingData.name || undefined,
          email: shippingData.email || undefined,
          phone: shippingData.phone || undefined,
        },
        billingAddress: {
          ...addressData,
          email: shippingData.email || undefined,
          phone: shippingData.phone || undefined,
        },
        paymentMethod: 'online',
        paymentStatus: 'pending',
        orderStatus: 'pending',
      });

      if (result.success) {
        setConfirmedSnapshot(snapshot);
        setOrderData({ orderId, paymentStatus: 'pending' });
        setOrderComplete(true);
        setCartItems([]);
        localStorage.removeItem('tadbir_cart');
        setTimeout(() => window.dispatchEvent(new CustomEvent('tadbir_cart_updated', { detail: [] })), 0);
      } else {
        throw new Error(result.error || 'Order save failed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Order failed';
      alert(`Order failed: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <PageShell>
        <div className={`${siteContainer()} py-16 md:py-20`}>
          <div className={`${siteCard(darkMode)} text-center mb-8`}>
            <div className="p-12">
              <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6 animate-pulse" />
              <h1 className={`${siteHeading(darkMode, 'md')} mb-4`}>
                Order Confirmed!
              </h1>
              <p className={`text-lg mb-8 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Thank you for your order. Your premium saffron will be on its way soon.
              </p>
              
              {/* Order Details */}
              <div className={`grid grid-cols-2 gap-6 mb-8 p-6 rounded-lg ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="border-r border-gray-300 pr-4">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order ID</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    #{orderData.orderId || 'RS' + Date.now().toString().slice(-6)}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                  <p className={`text-2xl font-light bg-clip-text text-transparent bg-linear-to-r from-rose-400 to-amber-400`}>
                    ₹{displayTotal}
                  </p>
                </div>
              </div>

              {/* Order Status Timeline */}
              <div className={`p-6 rounded-lg mb-8 ${
                darkMode ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'
              }`}>
                <h3 className={`font-semibold mb-6 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                  Order Status
                </h3>
                <div className="space-y-4">
                  {/* Order Placed */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Order Placed
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                      orderData.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-amber-500'
                    }`}>
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {orderData.paymentStatus === 'paid' ? 'Payment Confirmed' : 'Payment Pending'}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {orderData.paymentStatus === 'paid'
                          ? 'Paid via Razorpay (Online)'
                          : 'Complete payment via Razorpay when gateway is connected. Order is saved.'}
                      </p>
                    </div>
                  </div>

                  {/* Processing */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Processing
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Your order is being prepared
                      </p>
                    </div>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Shipped
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Expected within 3-5 business days
                      </p>
                    </div>
                  </div>

                  {/* Delivered */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center shrink-0 mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Delivered
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Track your delivery in real-time
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className={`p-6 rounded-lg mb-8 text-left ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Summary
                </h3>
                <div className="space-y-3 mb-4">
                  {displayItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.weight} × {item.quantity}
                        </p>
                      </div>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₹{(item.price || 0) * (item.quantity || 1)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between mb-2">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</p>
                    <p className={darkMode ? 'text-white' : 'text-gray-900'}>₹{displaySubtotal}</p>
                  </div>
                  <div className="flex justify-between mb-2">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Shipping</p>
                    <p className={darkMode ? 'text-white' : 'text-gray-900'}>₹{displayShipping}</p>
                  </div>
                  <div className="flex justify-between mb-2">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Tax (18%)</p>
                    <p className={darkMode ? 'text-white' : 'text-gray-900'}>₹{displayTax}</p>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total</p>
                    <p className={`font-bold text-lg bg-linear-to-r from-rose-700 via-yellow-600 to-amber-600 bg-clip-text text-transparent`}>
                      ₹{displayTotal}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className={`p-6 rounded-lg mb-8 text-left ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delivery Address
                </h3>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {shippingData.name}
                </p>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {addressData.street}, {addressData.city}
                </p>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {addressData.state} - {addressData.pincode}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/orders?orderId=${orderData.orderId || ''}`}>
                  <Button className="bg-rose-800 hover:bg-rose-900 text-white border-0 w-full sm:w-auto">
                    View My Orders
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className={`${darkMode ? 'border-white text-white hover:bg-white/10' : ''} w-full sm:w-auto`}>
                    Continue Shopping
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  className={`${darkMode ? 'border-white text-white hover:bg-white/10' : ''} w-full sm:w-auto`}
                  onClick={() => {
                    navigator.clipboard.writeText(orderData.orderId || 'RS' + Date.now().toString().slice(-6));
                    alert('Order ID copied to clipboard!');
                  }}
                >
                  Copy Order ID
                </Button>
              </div>

              <p className={`text-sm mt-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                A confirmation email has been sent to <strong>{shippingData.email}</strong>
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className={`${siteContainer()} py-8 md:py-12`}>
        <Link href="/cart" className={`${siteBackLink(darkMode)} mb-8`}>
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <div className="mb-10">
          <span className={siteEyebrow(darkMode)}>Secure Checkout</span>
          <h1 className={`${siteHeading(darkMode, 'md')} mb-2`}>Checkout</h1>
          <p className={siteSubtext(darkMode)}>Complete your order for premium Kashmiri saffron</p>
        </div>

        <div className="mb-10 flex justify-center items-center gap-2">
          {(['shipping', 'address', 'payment'] as const).map((step, i) => {
            const labels = ['Shipping', 'Address', 'Payment'];
            const stepIndex = ['shipping', 'address', 'payment'].indexOf(currentStep);
            const isActive = currentStep === step;
            const isDone = i < stepIndex;
            return (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`w-8 sm:w-12 h-px ${isDone || isActive ? 'bg-rose-600' : darkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-rose-800 text-white'
                      : isDone
                        ? 'bg-rose-800/20 text-rose-600 border border-rose-800/30'
                        : darkMode
                          ? 'bg-white/5 text-gray-500 border border-white/10'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={`text-[10px] tracking-[0.12em] uppercase hidden sm:block ${
                    isActive ? (darkMode ? 'text-white' : 'text-gray-900') : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {labels[i]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            
            {/* STEP 1: Shipping Information */}
            {currentStep === 'shipping' && (
              <Card className={`border-0 shadow-none ${siteCard(darkMode)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`${siteHeading(darkMode, 'sm')}`}>
                      Shipping Information
                    </CardTitle>
                    {savedAddresses.length > 0 && !loadingAddress && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Auto-filled
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingAddress ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                      <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Loading your information...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="name" className={darkMode ? 'text-white' : undefined}>Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe"
                          value={shippingData.name}
                          onChange={(e) => setShippingData({...shippingData, name: e.target.value})}
                          className={`${darkMode ? 'bg-gray-700 border-white text-white placeholder-gray-300' : ''}`}
                        />
                        {errors.name && <p className="text-rose-500 text-sm mt-1">{errors.name}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className={darkMode ? 'text-white' : undefined}>Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@example.com"
                          value={shippingData.email}
                          onChange={(e) => setShippingData({...shippingData, email: e.target.value})}
                          className={`${darkMode ? 'bg-gray-700 border-white text-white placeholder-gray-300' : ''}`}
                        />
                        {errors.email && <p className="text-rose-500 text-sm mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <Label htmlFor="phone" className={darkMode ? 'text-white' : undefined}>Phone Number</Label>
                        <Input 
                          id="phone" 
                          type="text" 
                          placeholder="+91 98765 43210"
                          value={shippingData.phone}
                          onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                          className={`${darkMode ? 'bg-gray-700 border-white text-white placeholder-gray-300' : ''}`}
                        />
                        {errors.phone && <p className="text-rose-500 text-sm mt-1">{errors.phone}</p>}
                      </div>

                      <Button 
                        className="w-full mt-6 bg-rose-800 hover:bg-rose-900 text-white border-0"
                        onClick={handleShippingNext}
                      >
                        Next: Delivery Address
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* STEP 2: Address with Dropdown */}
            {currentStep === 'address' && (
              <div className="space-y-4">
                {/* Address Summary Box (Collapsible) */}
                <Card className={`border-0 shadow-none ${siteCard(darkMode)}`}>
                  <div 
                    className={`p-4 cursor-pointer flex items-center justify-between ${
                      expandedAddress ? 'border-b' : ''
                    }`}
                    onClick={() => setExpandedAddress(!expandedAddress)}
                  >
                    <div className="flex-1">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Shipping Details
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {shippingData.name} • {shippingData.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentStep('shipping');
                        }}
                        className="text-rose-700 hover:text-rose-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <ChevronDown className={`w-5 h-5 transition-transform ${expandedAddress ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {expandedAddress && (
                    <CardContent className="pt-4">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {shippingData.name}<br/>
                        {shippingData.phone}<br/>
                        {shippingData.email}
                      </p>
                    </CardContent>
                  )}
                </Card>

                {/* Address Form */}
                <Card className={`border-0 shadow-none ${siteCard(darkMode)}`}>
                  <CardHeader>
                    <CardTitle className={`${siteHeading(darkMode, 'sm')}`}>
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {savedAddresses.length > 0 && (
                      <div className="space-y-3">
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Saved Addresses
                        </p>
                        {savedAddresses.map((address) => (
                          <button
                            key={address.id}
                            type="button"
                            onClick={() => selectSavedAddress(address)}
                            className={`w-full text-left rounded-lg border p-4 transition-colors ${
                              !useNewAddress && selectedAddressId === address.id
                                ? darkMode
                                  ? 'border-rose-500 bg-rose-900/20'
                                  : 'border-rose-500 bg-rose-50'
                                : darkMode
                                  ? 'border-gray-600 hover:border-gray-500'
                                  : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-rose-600 mt-1 shrink-0" />
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {address.street}
                                </p>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {address.city}, {address.state} — {address.pincode}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUseNewAddress(true);
                            setSelectedAddressId(null);
                            setAddressData({ street: '', city: '', state: '', pincode: '' });
                          }}
                          className={darkMode ? 'border-gray-600 text-white hover:bg-white/10' : ''}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Address
                        </Button>
                        <Separator />
                      </div>
                    )}

                    {(useNewAddress || savedAddresses.length === 0) && (
                      <>
                    <div>
                      <Label htmlFor="street" className={darkMode ? 'text-white' : undefined}>Street Address</Label>
                      <Input 
                        id="street" 
                        placeholder="123 Main Street"
                        value={addressData.street}
                        onChange={(e) => setAddressData({...addressData, street: e.target.value})}
                        className={`${darkMode ? 'bg-gray-700 border-white text-white placeholder-gray-300' : ''}`}
                      />
                      {errors.street && <p className="text-rose-500 text-sm mt-1">{errors.street}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className={darkMode ? 'text-white' : undefined}>City</Label>
                        <Input 
                          id="city" 
                          placeholder="Mumbai"
                          value={addressData.city}
                          onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                          className={`${darkMode ? 'bg-gray-700 border-white text-white placeholder-gray-300' : ''}`}
                        />
                        {errors.city && <p className="text-rose-500 text-sm mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <Label htmlFor="state" className={darkMode ? 'text-white' : undefined}>State</Label>
                        <Input 
                          id="state" 
                          placeholder="Maharashtra"
                          value={addressData.state}
                          onChange={(e) => setAddressData({...addressData, state: e.target.value})}
                          className={`${darkMode ? 'bg-gray-700 border-white text-white placeholder-gray-300' : ''}`}
                        />
                        {errors.state && <p className="text-rose-500 text-sm mt-1">{errors.state}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pincode" className={darkMode ? 'text-white' : undefined}>PIN Code</Label>
                      <Input 
                        id="pincode" 
                        placeholder="400001"
                        value={addressData.pincode}
                        onChange={(e) => setAddressData({...addressData, pincode: e.target.value})}
                        className={`${darkMode ? 'bg-gray-700 border-white text-white placeholder-gray-300' : ''}`}
                      />
                      {errors.pincode && <p className="text-rose-500 text-sm mt-1">{errors.pincode}</p>}
                    </div>
                      </>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline"
                        className={`flex-1 ${darkMode ? 'border-white text-white hover:bg-white/10' : ''}`}
                        onClick={() => setCurrentStep('shipping')}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-1 bg-rose-800 hover:bg-rose-900 text-white border-0"
                        onClick={handleAddressNext}
                      >
                        Next: Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 3: Payment Method */}
            {currentStep === 'payment' && (
              <Card className={`border-0 shadow-none ${siteCard(darkMode)}`}>
                <CardHeader>
                  <CardTitle className={`${siteHeading(darkMode, 'sm')}`}>
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PaymentMethodSection
                    darkMode={darkMode}
                    total={total}
                    isProcessing={isProcessing}
                    onBack={() => setCurrentStep('address')}
                    onPlaceOrder={handlePlaceOrder}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary - Sticky */}
          <div>
            <Card className={`border-0 shadow-none sticky top-24 ${siteCard(darkMode)}`}>
              <CardHeader>
                <CardTitle className={`${siteHeading(darkMode, 'sm')}`}>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-4">
                  {displayItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="relative w-16 h-16 shrink-0">
                        <Image
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name || ''}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="grow">
                        <h4 className={`font-medium ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {item.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-rose-600 border-rose-200 text-xs">
                            {item.grade}
                          </Badge>
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {item.weight} × {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        ₹{(item.price ?? 0) * (item.quantity ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Subtotal
                    </span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                      ₹{displaySubtotal}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Shipping Charges
                    </span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                      {displayShipping === 0 ? 'Free' : `₹${displayShipping}`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Tax (18% GST)
                    </span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                      ₹{displayTax}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>Grand Total</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>₹{displayTotal}</span>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-4 text-center">
                    <div className="inline-flex items-center justify-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Secure 256-bit SSL encryption
                      </p>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

