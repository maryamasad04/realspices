'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Calendar, 
  CreditCard, 
  MapPin, 
  Eye,
  RefreshCw,
  ArrowLeft,
  Truck,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';
import PageShell from '@/components/site/page-shell';
import {
  siteCard,
  siteBtnPrimary,
  siteBtnSecondary,
  siteBackLink,
  siteHeading,
  siteSubtext,
  siteContainer,
  siteDivider,
} from '@/lib/siteStyles';
import { useUser } from '@/context/UserContext';
import { getUserOrders, cancelOrder } from '@/lib/orderApi';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_id: string;
  order_details: {
    items: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
      weight?: string;
      image?: string;
      grade?: string;
    }>;
    subtotal: number;
    shipping: number;
    total: number;
    orderDate: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  total_amount: number;
  cancellation_reason?: string | null;
  shipping_address: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  // Some responses include a separate `address` object; allow it as a fallback
  address?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    id: number;
    product_id?: number;
    product_name?: string;
    price: number;
    quantity: number;
    weight?: string;
    image?: string;
    grade?: string;
    product?: {
      name?: string;
      image?: string;
      grade?: string;
      weight?: string;
    };
  }>;
  shipping_amount?: number;
}

function OrdersPageInner() {
  // Helper: format numbers as Indian Rupee currency
  const formatINR = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '₹0';
    try {
      return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
    } catch (e) {
      return `₹${value}`;
    }
  };
  const { dark: darkMode } = useTheme();
  const { user, authLoading } = useUser();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [apiDebug, setApiDebug] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const getOrderLineItems = (order: Order) => {
    if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
      return order.order_items;
    }
    if (Array.isArray(order.order_details)) {
      return order.order_details;
    }
    if (order.order_details?.items && Array.isArray(order.order_details.items)) {
      return order.order_details.items;
    }
    return [];
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await getUserOrders();
      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || 'Failed to fetch orders');
        setApiDebug(JSON.stringify({ error: result.error }, null, 2));
      }
    } catch (err: any) {
      setError(err.message);
      setApiDebug(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user?.id) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, pathname]);

  useEffect(() => {
    const onFocus = () => {
      if (user?.id) fetchOrders();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.id]);

  // When orders are loaded, check URL params to auto-open/scroll to a specific order
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    try {
      const orderIdParam = searchParams?.get('orderId');
      const openParam = searchParams?.get('open');
      let targetId: string | null = null;
      if (orderIdParam) targetId = `order-${orderIdParam}`;
      else if (openParam) targetId = `order-${orders[0].order_id}`;
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring', 'ring-rose-300');
          setTimeout(() => el.classList.remove('ring', 'ring-rose-300'), 1600);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [orders, searchParams]);

  // Debug helper: fetch raw /api/orders and show response
  const fetchRawApiOrders = async () => {
    try {
      setApiDebug('Fetching...');
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: Record<string,string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const resp = await fetch('/api/orders', { method: 'GET', headers });
      const text = await resp.text();
      let body: any = text;
      try { body = JSON.parse(text); } catch(e) { /* keep text */ }
      setApiDebug(JSON.stringify({ status: resp.status, ok: resp.ok, body }, null, 2));
      console.log('Raw /api/orders response', { status: resp.status, ok: resp.ok, body });
    } catch (err: any) {
      setApiDebug(String(err));
      console.error('Error fetching /api/orders', err);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const result = await cancelOrder(orderId);
      if (result.success) {
        // Refresh orders list
        fetchOrders();
        toast({
          title: 'Order Cancelled',
          description: 'Your order has been cancelled successfully.',
        });
      } else {
        alert(result.error || 'Failed to cancel order');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-yellow-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-rose-700" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper: convert number to words (Indian format)
  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];
    
    if (num === 0) return 'Zero';
    
    let parts: string[] = [];
    let scaleIndex = 0;
    
    while (num > 0) {
      let part = num % (scaleIndex === 0 ? 1000 : 100);
      if (part !== 0) {
        let partWords = '';
        if (part >= 100) {
          partWords = ones[Math.floor(part / 100)] + ' Hundred ';
          part %= 100;
        }
        if (part >= 20) {
          partWords += tens[Math.floor(part / 10)] + ' ';
          part %= 10;
        } else if (part >= 10) {
          partWords += teens[part - 10] + ' ';
          part = 0;
        }
        if (part > 0) {
          partWords += ones[part];
        }
        if (scales[scaleIndex]) {
          partWords += ' ' + scales[scaleIndex];
        }
        parts.unshift(partWords.trim());
      }
      num = Math.floor(num / (scaleIndex === 0 ? 1000 : 100));
      scaleIndex++;
    }
    return parts.join(' ').trim() + ' Only';
  };

  // Print/export invoice: opens a new window with printable invoice HTML
  const printInvoice = (order: Order) => {
    try {
      console.log('Generating invoice for order:', order);
      
      // Get items from order_items or order_details (which can be an array or object with items)
      const items = (order.order_items && order.order_items.length > 0)
        ? order.order_items
        : Array.isArray(order.order_details)
          ? order.order_details
          : (order.order_details && order.order_details.items) || [];

      if (!items || items.length === 0) {
        alert('No items found in this order. Cannot generate invoice.');
        return;
      }

      // Calculate subtotal
      const subtotal = (typeof order.order_details === 'object' && !Array.isArray(order.order_details) && typeof order.order_details?.subtotal === 'number' && order.order_details.subtotal > 0)
        ? order.order_details.subtotal
        : items.reduce((sum: number, it: any) => sum + ((it.price || 0) * (it.quantity || 0)), 0);

      // Get shipping amount
      const shipping = (typeof order.order_details === 'object' && !Array.isArray(order.order_details) && typeof order.order_details?.shipping === 'number' && order.order_details.shipping > 0)
        ? order.order_details.shipping
        : typeof order.shipping_amount === 'number' && order.shipping_amount > 0
          ? order.shipping_amount
          : 0;

      // Calculate GST and total
      const gstRate = 18;
      const gstAmount = (subtotal * gstRate) / 100;
      const discount = 0;
      const total = typeof order.total_amount === 'number' && order.total_amount > 0
        ? order.total_amount
        : subtotal + gstAmount + shipping - discount;

      // Validate total is a valid number
      if (isNaN(total) || total <= 0) {
        alert('Invalid order total. Cannot generate invoice.');
        console.error('Invalid total:', { total, subtotal, gstAmount, shipping, order });
        return;
      }

      // Get address
      const address = order.shipping_address || order.address || {};
      const invoiceDate = new Date(order.created_at);
      const invoiceDateStr = invoiceDate.toLocaleDateString('en-IN');
      
      // Generate order number (Order No.)
      const orderNo = `ORD${order.order_id?.substring(0, 6)?.toUpperCase() || Math.random().toString(36).substr(2, 9)}`;

      const itemsHtml = items.map((it: any, idx: number) => {
        const name = it.product?.name || it.product_name || it.name || '';
        const weight = it.weight || it.product?.weight || '';
        const grade = it.grade || it.product?.grade || '';
        const hsn = '3304'; // Default HSN for cosmetics/wellness products

        // Coerce incoming values to numbers to avoid runtime errors like rate.toFixed is not a function
        const priceNum = Number(it.price ?? it.product?.price) || 0;
        const qty = Number(it.quantity) || 0;
        const rate = priceNum;
        const mrp = formatINR(priceNum);
        const lineTotal = rate * qty;
        const lineTotalFormatted = formatINR(lineTotal);

        return `
          <tr style="border-bottom: 1px solid #ccc;">
            <td style="padding: 8px; text-align: center; font-size: 12px;">${idx + 1}</td>
            <td style="padding: 8px; font-size: 12px;">${name}${grade ? ' (' + grade + ')' : ''}${weight ? ' - ' + weight : ''}</td>
            <td style="padding: 8px; text-align: center; font-size: 12px;">${hsn}</td>
            <td style="padding: 8px; text-align: center; font-size: 12px;">₹${(rate).toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; font-size: 12px;">${qty}</td>
            <td style="padding: 8px; text-align: right; font-size: 12px;">₹${(lineTotal).toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; font-size: 12px;">18%</td>
            <td style="padding: 8px; text-align: right; font-size: 12px;">₹${(lineTotal * 0.18).toFixed(2)}</td>
            <td style="padding: 8px; text-align: right; font-size: 12px;">₹${(lineTotal + lineTotal * 0.18).toFixed(2)}</td>
          </tr>`;
      }).join('');

      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice - ${order.order_id}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; padding: 20px; background: #fff; }
          .invoice-container { max-width: 900px; margin: 0 auto; background: white; border: 1px solid #ddd; padding: 30px; }
          .header-top { position: relative; display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 20px; justify-content: flex-start; }
          .logo-section { flex: 0 0 140px; display: flex; align-items: center; justify-content: flex-start; }
          .logo-section .logo-text img { max-width: 100px; height: auto; object-fit: contain; display: block; margin: 0; }
          .right-section { flex: 0 0 260px; display: flex; flex-direction: column; align-items: flex-end; margin-left: auto; margin-right: 0; }
          .invoice-title { position: absolute; left: 50%; transform: translateX(-50%); top: 6px; text-align: center; z-index: 2; }
          .invoice-title h1 { font-size: 20px; font-weight: bold; margin: 0; }
          .company-section { text-align: left; margin-top: 6px; }
          .company-info { font-size: 11px; color: #666; margin-top: 8px; line-height: 1.4; }
          .contact-center { text-align: left; font-size: 11px; color: #666; margin-top: 8px; line-height: 1.4; white-space: nowrap; }
          .gst { white-space: nowrap; }
          
          .details-section { display: flex; gap: 30px; margin-bottom: 20px; font-size: 12px; }
          .details-column { flex: 1; }
          .details-label { font-weight: bold; margin-bottom: 3px; }
          .details-value { color: #333; margin-bottom: 8px; line-height: 1.4; }
          
          .address-section { display: flex; gap: 40px; margin-bottom: 20px; border-top: 2px solid #ddd; border-bottom: 2px solid #ddd; padding: 15px 0; font-size: 12px; }
          .address-block { flex: 1; }
          .address-block h3 { font-size: 12px; font-weight: bold; margin-bottom: 8px; }
          .address-block p { margin-bottom: 4px; line-height: 1.5; }
          
          .table-section { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .items-table th { background: #f5f5f5; border: 1px solid #ccc; padding: 8px; font-size: 11px; font-weight: bold; text-align: left; }
          .items-table td { border: 1px solid #ccc; padding: 8px; font-size: 11px; }
          .items-table .text-right { text-align: right; }
          .items-table .text-center { text-align: center; }
          
          .totals-section { display: flex; gap: 30px; }
          .totals-left { flex: 1; }
          .totals-right { width: 350px; }
          .totals-table { width: 100%; border-collapse: collapse; }
          .totals-table tr { border-bottom: 1px solid #ddd; }
          .totals-table td { padding: 8px; font-size: 12px; }
          .totals-table .label { text-align: left; }
          .totals-table .value { text-align: right; font-weight: normal; }
          .totals-table .total-row { font-weight: bold; border-top: 2px solid #333; border-bottom: 2px solid #333; }
          .totals-table .gst-row { background: #f9f9f9; }
          
          .words-section { margin-top: 15px; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
          .words-label { font-weight: bold; }
          
          .payment-section { display: flex; gap: 30px; margin-top: 20px; border-top: 2px solid #ddd; padding-top: 15px; font-size: 11px; }
          .payment-block { flex: 1; }
          .payment-block h4 { font-weight: bold; margin-bottom: 8px; }
          .payment-method { margin-bottom: 4px; }
          
          .footer-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; justify-content: space-between; font-size: 11px; }
          .footer-text { flex: 1; }
          .footer-signature { text-align: right; padding-right: 40px; }
          
          .savings-banner { background: #ffebee; border: 2px solid #f44336; padding: 10px; margin: 15px 0; text-align: center; font-weight: bold; font-size: 13px; color: #d32f2f; }
          
          @media print { body { padding: 0; } .invoice-container { border: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header-top">
            <div class="logo-section">
              <div class="logo-text"><img src="/real spices.jpeg" alt="Real Spices Logo" /></div>
            </div>

            <div class="right-section">
              <div class="invoice-title">
                <h1>TAX INVOICE</h1>
              </div>

              <div class="company-section">
                <div class="company-info">
                  Address: 11-3-184, Moazampura<br/>
                  Mallepally, Hyderabad, Telangana <br/>
                  India 500001<br/>
                  Phone: +91-1234-567890 <br/>
                  GSTIN: XX-XXXX-XXXXX-XXX <br/>
                  Email: contact@realspices.com <br/>
                </div>
              </div>
            </div>
          </div>
        
          <!-- Invoice Details -->
          <div class="details-section">
            <div class="details-column">
              <div class="details-label">Invoice No.</div>
              <div class="details-value">${order.order_id}</div>
              <div class="details-label">Invoice Date</div>
              <div class="details-value">${invoiceDateStr}</div>
            </div>
            <div class="details-column">
              <div class="details-label">Order No.</div>
              <div class="details-value">${orderNo}</div>
              <div class="details-label">Courier Name</div>
              <div class="details-value">Standard Shipping</div>
            </div>
          </div>
          
          <!-- Addresses -->
          <div class="address-section">
            <div class="address-block">
              <h3>Seller/Consignor:</h3>
              <p><strong className="text-yellow-700 font-extrabold uppercase">REAL SPICES</strong></p>
              <p>11-3-184, Moazampura, Mallepally<br/>
              Hyderabad, Telangana - 500001<br/>
              <span class="gst">GSTIN: XX-XXXX-XXXXX-XXX</span></p>
            </div>
            <div class="address-block">
              <h3>Billing Address:</h3>
              <p><strong>${address.name || 'Customer'}</strong></p>
              <p>${address.address || address.street || 'Address'}
              <br/>${address.city || 'City'} ${address.state || 'State'} - ${address.pincode || '000000'}</p>
            </div>
            <div class="address-block">
              <h3>Shipping Address:</h3>
              <p><strong>${address.name || 'Customer'}</strong></p>
              <p>${address.address || address.street || 'Address'}
              <br/>${address.city || 'City'} ${address.state || 'State'} - ${address.pincode || '000000'}</p>
            </div>
          </div>
          
          <!-- Items Table -->
          <div class="table-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th class="text-center">S.No.</th>
                  <th>Description of Goods</th>
                  <th class="text-center">HSN/SAC</th>
                  <th class="text-right">MRP</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-center">IGST Rate</th>
                  <th class="text-right">IGST Amt</th>
                  <th class="text-right">Total Amt (Incl. tax)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          
          <!-- Totals and Words -->
          <div class="totals-section">
            <div class="totals-left">
              <div class="words-section">
                <span class="words-label">Rs. In Words:</span>
                <div>${numberToWords(total).replace(/\$/g, '')}</div>
              </div>
            </div>
            <div class="totals-right">
              <table class="totals-table">
                <tr>
                  <td class="label">Sub Total:</td>
                  <td class="value">₹${subtotal.toFixed(2)}</td>
                </tr>
                <tr class="gst-row">
                  <td class="label">IGST (18%):</td>
                  <td class="value">₹${gstAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Shipping:</td>
                  <td class="value">₹${shipping.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="label">Discount:</td>
                  <td class="value">₹${discount.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td class="label">Grand Total:</td>
                  <td class="value">₹${total.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <div class="savings-banner">
            *** Your Total Savings: Rs. ${discount.toFixed(2)} ***
          </div>
          
          <!-- Payment Section -->
          <div class="payment-section">
            <div class="payment-block">
              <h4>Payment Method:</h4>
              <div class="payment-method">UPI / Online</div>
              <div class="payment-method">Payment Date: ${invoiceDateStr}</div>
            </div>
            <div class="payment-block">
              <h4>Payment Reference:</h4>
              <div class="payment-method">Ref ID: ${order.order_id}</div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer-section">
            <div class="footer-text">
              <p>Thank you for your business!</p>
            </div>
            <div class="footer-signature">
              <p style="margin-bottom: 30px;">Authorized Signatory</p>
              <p style="border-top: 1px solid #333; padding-top: 5px;">(Signature & Stamp)</p>
            </div>
          </div>
        </div>
      </body>
      </html>`;

      const w = window.open('', '_blank', 'width=1000,height=1200');
      if (!w) {
        alert('Unable to open print window — please allow popups for this site.');
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      // Give the window a moment to layout images/styles then print
      setTimeout(() => w.print(), 500);
    } catch (e) {
      console.error('Error printing invoice', e);
      alert('Failed to generate invoice for printing.');
    }
  };

  if (authLoading) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="text-center py-12">
          <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
            Loading your account...
          </p>
        </div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell className="flex items-center justify-center">
        <Card className={`${siteCard(darkMode)} shadow-none max-w-md mx-auto`}>
          <CardContent className="p-8 text-center">
            <Package className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <h2 className={`${siteHeading(darkMode, 'sm')} mb-4`}>Please Log In</h2>
            <p className={`${siteSubtext(darkMode)} mb-6`}>
              You need to log in to view your orders.
            </p>
            <Link href="/login">
              <Button className={siteBtnPrimary()}>
                Log In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className={`${siteContainer()} py-8`}>
        
        {/* Back Button */}
        <Link href="/" className={`${siteBackLink(darkMode)} mb-8`}>
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className={siteHeading(darkMode, 'md')}>My Orders</h1>
          <p className={`${siteSubtext(darkMode)} mt-2`}>
            Track and manage your orders
          </p>
          <div className="mt-4">
            {apiDebug && (
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-1">Raw API response (debug):</div>
                <pre className="max-h-48 overflow-auto text-xs p-3 rounded bg-black/40 text-white">{apiDebug}</pre>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-4 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              Loading your orders...
            </p>
          </div>
        ) : error ? (
          <Card className={`${siteCard(darkMode)} shadow-none`}>
            <CardContent className="p-12 text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-rose-700" />
              <h2 className={`${siteHeading(darkMode, 'sm')} mb-4`}>Error Loading Orders</h2>
              <p className={`${siteSubtext(darkMode)} mb-6`}>
                {error}
              </p>
              <Button onClick={() => fetchOrders()} className={siteBtnSecondary(darkMode)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card className={`${siteCard(darkMode)} shadow-none`}>
            <CardContent className="p-12 text-center">
              <Package className={`w-24 h-24 mx-auto mb-6 ${
                darkMode ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <h2 className={`${siteHeading(darkMode, 'sm')} mb-4`}>No Orders Yet</h2>
              <p className={`${siteSubtext(darkMode)} mb-8`}>
                You haven't placed any orders yet. Start shopping for premium saffron!
              </p>
              <Link href="/products">
                <Button className={siteBtnPrimary('px-8')}>
                  Shop Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card id={`order-${order.order_id}`} key={order.id} className={`${siteCard(darkMode)} shadow-none`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className={siteHeading(darkMode, 'sm')}>
                        Order #{order.order_id}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className={`w-4 h-4 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className={`w-4 h-4 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                            {formatINR(typeof order.total_amount === 'number' ? order.total_amount : 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Cancellation Notice */}
                  {order.status === 'cancelled' && (
                    <div className={`p-4 rounded-lg mb-6 border-l-4 ${darkMode ? 'bg-rose-900/20 border-rose-600 text-rose-300' : 'bg-rose-50 border-rose-500 text-rose-700'}`}>
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">Order Cancelled</h5>
                          {order.cancellation_reason && (
                            <p className={`text-sm ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}>
                              <span className="font-medium">Reason:</span> {order.cancellation_reason}
                            </p>
                          )}
                          <p className={`text-xs mt-2 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                            This order has been cancelled. If you have questions, please contact our support team.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                      <h4 className={`font-medium mb-3 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>Items Ordered</h4>
                      <div className="space-y-3">
                        {getOrderLineItems(order).length > 0
                          ? getOrderLineItems(order).map((item: any, index: number) => (
                              <div key={index} className="flex items-center gap-3">
                                <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                                  <Image
                                    src={item.product?.image || item.image || '/placeholder.jpg'}
                                    alt={item.product?.name || item.product_name || item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h5 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.product?.name || item.product_name || item.name}</h5>
                                  <div className="flex items-center gap-2 text-sm">
                                    {item.grade && (
                                      <Badge variant="outline" className="text-xs">{item.grade}</Badge>
                                    )}
                                    {item.weight && (
                                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{item.weight}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{`${formatINR(item.price)} × ${item.quantity}`}</div>
                                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatINR(item.price * item.quantity)}</div>
                                </div>
                              </div>
                            ))
                          : <div className="text-sm text-gray-500">No items found for this order.</div>
                        }
                      </div>
                    </div>

                    {/* Order Summary & Actions */}
                    <div>
                      <h4 className={`font-medium mb-3 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Subtotal:
                          </span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            {formatINR(typeof order.order_details?.subtotal === 'number' && order.order_details.subtotal > 0
                              ? order.order_details.subtotal
                              : order.order_items && Array.isArray(order.order_items)
                                ? order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                                : 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Shipping:
                          </span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            {formatINR(typeof order.order_details?.shipping === 'number' && order.order_details.shipping > 0
                              ? order.order_details.shipping
                              : typeof order.shipping_amount === 'number' && order.shipping_amount > 0
                                ? order.shipping_amount
                                : 0)}
                          </span>
                        </div>
                        <Separator className={siteDivider(darkMode)} />
                        <div className="flex justify-between font-medium">
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            Total:
                          </span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                            {formatINR(typeof order.total_amount === 'number' && order.total_amount > 0
                              ? order.total_amount
                              : (typeof order.order_details?.subtotal === 'number' && order.order_details.subtotal > 0
                                  ? order.order_details.subtotal
                                  : order.order_items && Array.isArray(order.order_items)
                                    ? order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                                    : 0) + (typeof order.order_details?.shipping === 'number' && order.order_details.shipping > 0
                                        ? order.order_details.shipping
                                        : order.order_details?.shipping || 0))
                          }
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-2">
                        <Button 
                          size="sm" 
                          className={siteBtnSecondary(darkMode, 'w-full')}
                          onClick={() => setSelectedOrder(order)}
                        >Get Invoice
                        </Button>
                        
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            className={siteBtnSecondary(darkMode, 'w-full text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-800/50 dark:hover:bg-rose-900/20')}
                            onClick={() => handleCancelOrder(order.order_id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Order
                          </Button>
                        )}
                      </div>

                      <div className={`mt-4 p-3 rounded-xl border ${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-stone-50 border-gray-200/80'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className={`text-xs font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Delivery Address
                          </span>
                        </div>
                        <div className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <strong>{order.shipping_address.name || order.address?.name || ''}</strong><br />
                          {order.shipping_address?.address || order.shipping_address?.street || order.address?.address || order.address?.street || ''}<br />
                          {order.shipping_address?.city || order.address?.city || ''}, {order.shipping_address?.state || order.address?.state || ''} {order.shipping_address?.pincode || order.address?.pincode || ''}<br />
                          <span>Email: {user?.email || order.shipping_address?.email || order.address?.email || ''}</span><br />
                          <span>Phone: {user?.phone || order.shipping_address?.phone || order.address?.phone || ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
            <div className={`relative max-w-3xl w-full mx-auto p-6 ${siteCard(darkMode)} shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className={siteHeading(darkMode, 'sm')}>Invoice — Order #{selectedOrder.order_id}</h2>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Placed on {new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setSelectedOrder(null)} className={siteBtnSecondary(darkMode)}>Close</Button>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="font-semibold mb-2">Items</div>
                  <div className="space-y-3">
                    {(selectedOrder.order_items && selectedOrder.order_items.length > 0)
                      ? selectedOrder.order_items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                              <Image src={item.product?.image || item.image || '/placeholder.jpg'} alt={item.product?.name || item.product_name || item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.product?.name || item.product_name || item.name}</div>
                              <div className="text-sm text-gray-500">{item.grade || item.product?.grade || ''} {item.weight || item.product?.weight || ''}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{`${formatINR(item.price)} × ${item.quantity}`}</div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatINR(item.price * item.quantity)}</div>
                            </div>
                          </div>
                        ))
                      : (Array.isArray(selectedOrder.order_details) && selectedOrder.order_details.length > 0)
                        ? selectedOrder.order_details.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                                <Image src={item.image || '/placeholder.jpg'} alt={item.name} fill className="object-cover" />
                              </div>
                              <div className="flex-1">
                                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</div>
                                <div className="text-sm text-gray-500">{item.grade || ''} {item.weight || ''}</div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{`${formatINR(item.price)} × ${item.quantity}`}</div>
                                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatINR(item.price * item.quantity)}</div>
                              </div>
                            </div>
                          ))
                        : (selectedOrder.order_details && selectedOrder.order_details.items && selectedOrder.order_details.items.length > 0)
                          ? selectedOrder.order_details.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                                  <Image src={item.image || '/placeholder.jpg'} alt={item.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</div>
                                <div className="text-sm text-gray-500">{item.grade || ''} {item.weight || ''}</div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{`${formatINR(item.price)} × ${item.quantity}`}</div>
                                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatINR(item.price * item.quantity)}</div>
                              </div>
                            </div>
                          ))
                        : <div className="text-sm text-gray-500">No items found for this order.</div>
                    }
                  </div>
                </div>

                <div>
                  <div className="font-semibold mb-2">Order Summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatINR(
                        // Check if order_details has subtotal (object structure)
                        (typeof selectedOrder.order_details === 'object' && !Array.isArray(selectedOrder.order_details) && typeof selectedOrder.order_details?.subtotal === 'number' && selectedOrder.order_details.subtotal > 0)
                          ? selectedOrder.order_details.subtotal
                          // Otherwise calculate from order_items
                          : (selectedOrder.order_items && selectedOrder.order_items.length > 0)
                            ? selectedOrder.order_items.reduce((s, it) => s + (it.price * it.quantity), 0)
                            // Or from order_details if it's an array
                            : (Array.isArray(selectedOrder.order_details) && selectedOrder.order_details.length > 0)
                              ? selectedOrder.order_details.reduce((s: number, it: any) => s + ((it.price || 0) * (it.quantity || 0)), 0)
                              : 0
                      )}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Shipping:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatINR(
                        (typeof selectedOrder.order_details === 'object' && !Array.isArray(selectedOrder.order_details) && typeof selectedOrder.order_details?.shipping === 'number' && selectedOrder.order_details.shipping > 0)
                          ? selectedOrder.order_details.shipping
                          : selectedOrder.shipping_amount || 0
                      )}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>Total:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatINR(
                        (typeof selectedOrder.total_amount === 'number' && selectedOrder.total_amount > 0)
                          ? selectedOrder.total_amount
                          : (() => {
                              const subtotal = (typeof selectedOrder.order_details === 'object' && !Array.isArray(selectedOrder.order_details) && typeof selectedOrder.order_details?.subtotal === 'number')
                                ? selectedOrder.order_details.subtotal
                                : (selectedOrder.order_items && selectedOrder.order_items.length > 0)
                                  ? selectedOrder.order_items.reduce((s, it) => s + (it.price * it.quantity), 0)
                                  : (Array.isArray(selectedOrder.order_details) && selectedOrder.order_details.length > 0)
                                    ? selectedOrder.order_details.reduce((s: number, it: any) => s + ((it.price || 0) * (it.quantity || 0)), 0)
                                    : 0;
                              const shipping = (typeof selectedOrder.order_details === 'object' && !Array.isArray(selectedOrder.order_details) && typeof selectedOrder.order_details?.shipping === 'number')
                                ? selectedOrder.order_details.shipping
                                : selectedOrder.shipping_amount || 0;
                              return subtotal + shipping;
                            })()
                      )}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button size="sm" className={siteBtnSecondary(darkMode, 'w-full')} onClick={() => printInvoice(selectedOrder)}>Print / Download</Button>
                    <Button size="sm" className={siteBtnSecondary(darkMode, 'w-full')} onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Order link copied'); }}>Copy Link</Button>
                  </div>

                  <div className={`mt-4 p-3 rounded-xl border ${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-stone-50 border-gray-200/80'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Delivery Address</span>
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <strong>{selectedOrder.shipping_address?.name || selectedOrder.address?.name || ''}</strong><br />
                      {selectedOrder.shipping_address?.address || selectedOrder.shipping_address?.street || selectedOrder.address?.address || selectedOrder.address?.street || ''}<br />
                      {selectedOrder.shipping_address?.city || selectedOrder.address?.city || ''}, {selectedOrder.shipping_address?.state || selectedOrder.address?.state || ''} {selectedOrder.shipping_address?.pincode || selectedOrder.address?.pincode || ''}<br />
                      <span>Email: {user?.email || selectedOrder.shipping_address?.email || selectedOrder.address?.email || ''}</span><br />
                      <span>Phone: {user?.phone || selectedOrder.shipping_address?.phone || selectedOrder.address?.phone || ''}</span>
                    </div>
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

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersPageInner />
    </Suspense>
  );
}