'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ShippingAddress {
  name?: string;
  street?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
  phone?: string;
}

interface Order {
  id: string | number;
  order_id?: string | number;
  user_id: string;
  status: string;
  created_at: string;
  total: number;
  cancellation_reason?: string | null;
  shipping_address?: ShippingAddress | null;
  billing_address?: ShippingAddress | null;
}

interface OrderItem {
  id: number;
  order_id: string | number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export default function AdminOrdersPage() {
  const { dark: darkMode } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<string | number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/orders');
      
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to fetch orders');
      }

      const { orders: ordersData, items: itemsData } = await response.json();
      // Sort orders by date (newest first) if created_at is available
      const sortedOrders = (ordersData || []).slice().sort((a: any, b: any) => {
        const da = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
      setOrders(sortedOrders);
      setOrderItems(itemsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string | number, reason?: string) => {
    setCancelling(orderId);
    setError(null);
    setSuccessMessage(null);
    try {
      console.log('Cancelling order:', orderId, 'Reason:', reason);
      
      // Update via server API with cancellation reason
      const resp = await fetch('/api/admin/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: reason || 'No reason provided' })
      });

      const json = await resp.json();

      if (!resp.ok) {
        const msg = json?.error || `Cancel failed (status ${resp.status})`;
        throw new Error(msg);
      }

      setSuccessMessage('Order cancelled successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowCancelDialog(null);
      setCancelReason('');
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(null);
    }
  };

  const handleStatusUpdate = async (orderId: string | number, newStatus: string) => {
    setUpdatingStatus(orderId);
    setError(null);
    setSuccessMessage(null);
    try {
      console.log('Updating order:', orderId, 'Type:', typeof orderId, 'to status:', newStatus);
      
      // Update via server API using service role (handles RLS/service permissions)
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      const resp = await fetch('/api/admin/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });

      const json = await resp.json();

      console.log('API update response:', resp.status, json);

      if (!resp.ok) {
        // Revert optimistic update and surface error
        await fetchOrders();
        const msg = json?.error || `Update failed (status ${resp.status})`;
        throw new Error(msg);
      }

      const updateData = json.data;
      if (!updateData || updateData.length === 0) {
        console.warn('API returned no updated rows — possible permission issue or invalid id');
        await fetchOrders();
        throw new Error('Failed to update order - please check if order exists or permissions');
      }

      setSuccessMessage(`Order status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getOrderItems = (orderId: string | number) => {
    // Handle both string UUIDs and numeric IDs
    return orderItems.filter(item => {
      if (typeof item.order_id === 'string' && typeof orderId === 'string') {
        return item.order_id === orderId;
      }
      const itemId = typeof item.order_id === 'string' ? parseInt(item.order_id, 10) : item.order_id;
      const queryId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      return itemId === queryId;
    });
  };

  // When modal opens, try to resolve customer contact details.
  useEffect(() => {
    let mounted = true;
    async function resolveContact() {
      setCustomerEmail(null);
      setCustomerPhone(null);
      if (!selectedOrder) return;

      // prefer shipping then billing addresses
      const s = (selectedOrder as any).shipping_address || {};
      const b = (selectedOrder as any).billing_address || {};
      if ((s && (s.email || s.phone)) || (b && (b.email || b.phone))) {
        if (mounted) {
          setCustomerEmail(s.email || b.email || null);
          setCustomerPhone(s.phone || b.phone || null);
        }
        return;
      }

      try {
        const uid = selectedOrder.user_id;
        // Call server route that uses service role to safely lookup contact info
        const resp = await fetch('/api/admin/user-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid })
        });
        if (resp.ok) {
          const json = await resp.json();
          if (mounted) {
            setCustomerEmail(json.email || null);
            setCustomerPhone(json.phone || null);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    resolveContact();
    return () => { mounted = false; };
  }, [selectedOrder]);

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Orders Management</h1>
          <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>View and manage all customer orders</p>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900 rounded">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900 rounded">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-700 dark:text-green-300 text-sm">{successMessage}</span>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">No orders found.</div>
            ) : (
              orders.map(order => {
                const itemsForOrder = getOrderItems(order.id);
                const computedTotal = itemsForOrder.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
                return (
                <Card key={order.id} className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white'} shadow-lg`}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order #{order.order_id || order.id}</CardTitle>
                        <CardDescription className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Placed on {new Date(order.created_at).toLocaleString()}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'cancelled' ? (
                          <span className="flex items-center gap-1 text-red-500 text-xs font-semibold"><XCircle className="w-4 h-4" /> Cancelled</span>
                        ) : order.status === 'completed' ? (
                          <span className="flex items-center gap-1 text-green-500 text-xs font-semibold"><CheckCircle2 className="w-4 h-4" /> Completed</span>
                        ) : order.status === 'pending' ? (
                          <span className="flex items-center gap-1 text-yellow-500 text-xs font-semibold"><AlertCircle className="w-4 h-4" /> Pending</span>
                        ) : order.status === 'shipped' ? (
                          <span className="flex items-center gap-1 text-blue-500 text-xs font-semibold"><CheckCircle2 className="w-4 h-4" /> Shipped</span>
                        ) : order.status === 'delivered' ? (
                          <span className="flex items-center gap-1 text-green-500 text-xs font-semibold"><CheckCircle2 className="w-4 h-4" /> Delivered</span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 text-xs font-semibold"><AlertCircle className="w-4 h-4" /> {order.status}</span>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'completed' && (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={cancelling === order.id}
                              onClick={() => setShowCancelDialog(order.id)}
                              className={darkMode ? 'text-white' : 'text-black'}
                            >
                              {cancelling === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Order'}
                            </Button>
                            <select
                              className={`ml-2 px-2 py-1 rounded border ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'} ${updatingStatus === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              value={order.status || 'pending'}
                              disabled={updatingStatus === order.id}
                              onChange={(e) => {
                                const newStatus = String(e.target.value).toLowerCase();
                                handleStatusUpdate(order.id, newStatus);
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                            </select>
                            {updatingStatus === order.id && <Loader2 className="w-4 h-4 animate-spin inline-block ml-2" />}
                            <Button
                              variant="outline"
                              size="sm"
                              className={`ml-2 ${darkMode ? 'bg-white text-black border-white hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-900'}`}
                              onClick={() => setSelectedOrder(order)}
                            >
                              View Details
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>User ID: <span className="font-mono text-xs">{order.user_id}</span></div>
                    <div className={`mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Total: <span className="font-mono">₹{computedTotal.toFixed(2)}</span></div>
                    <div className={`mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Status: <span className="font-mono">{order.status}</span></div>
                    <div className="mt-4">
                      <div className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>Order Items:</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs sm:text-sm">
                          <thead>
                              <tr className="bg-gray-100 dark:bg-gray-800">
                              <th className="px-2 py-1 text-left text-white">Product</th>
                              <th className="px-2 py-1 text-left text-white">Quantity</th>
                              <th className="px-2 py-1 text-left text-white">Price</th>
                              <th className="px-2 py-1 text-left text-white">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getOrderItems(order.id).map(item => (
                              <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                                <td className={`px-2 py-1 ${darkMode ? 'text-white' : 'text-black'}`}>{item.product_name || item.product_id}</td>
                                <td className={`px-2 py-1 ${darkMode ? 'text-white' : 'text-black'}`}>{item.quantity}</td>
                                <td className={`px-2 py-1 ${darkMode ? 'text-white' : 'text-black'}`}>₹{Number(item.price || 0).toFixed(2)}</td>
                                <td className={`px-2 py-1 ${darkMode ? 'text-white' : 'text-black'}`}>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })
            )}
          </div>
        )}
        {selectedOrder ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
            <div className={`relative max-w-3xl w-full mx-auto p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>Order #{selectedOrder.order_id || selectedOrder.id} Details</h2>
                  <div className="text-sm text-gray-400">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
                {/* contact info will be displayed in Shipping/Billing sections below */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const items = getOrderItems(selectedOrder.id);
                    const total = items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
                    return (<div className="text-sm font-medium">Total: <span className="font-mono">₹{total.toFixed(2)}</span></div>);
                  })()}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>Close</Button>
                </div>
              </div>

              {/* User display removed per request */}

              {selectedOrder.status === 'cancelled' && selectedOrder.cancellation_reason && (
                <div className={`p-4 rounded mb-4 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                  <div className={`font-semibold mb-1 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Cancellation Reason:</div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedOrder.cancellation_reason}</p>
                </div>
              )}

              <div className="mb-4">
                <div className="font-semibold mb-2">Items</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                      <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="px-2 py-1 text-left text-white">Product</th>
                        <th className="px-2 py-1 text-left text-white">Quantity</th>
                        <th className="px-2 py-1 text-left text-white">Price</th>
                        <th className="px-2 py-1 text-left text-white">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getOrderItems(selectedOrder.id).map(item => (
                        <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className={`px-2 py-1 ${darkMode ? 'text-white' : 'text-black'}`}>{item.product_name || item.product_id}</td>
                          <td className={`px-2 py-1 ${darkMode ? 'text-white' : 'text-black'}`}>{item.quantity}</td>
                          <td className={`px-2 py-1 ${darkMode ? 'text-white' : 'text-black'}`}>₹{Number(item.price || 0).toFixed(2)}</td>
                          <td className={`px-2 py-1 ${darkMode ? 'text-white' : 'text-black'}`}>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="font-semibold mb-2">Shipping Address</div>
                  <div className="text-sm">
                    <div className="font-medium">{selectedOrder.shipping_address?.name || '—'}</div>
                    <div>{selectedOrder.shipping_address?.street || selectedOrder.shipping_address?.address || '—'}</div>
                    <div>{selectedOrder.shipping_address?.city || ''}{selectedOrder.shipping_address?.city ? ', ' : ''}{selectedOrder.shipping_address?.state || ''} {selectedOrder.shipping_address?.pincode || ''}</div>
                    <div className="mt-1 text-xs text-gray-500">Email: {selectedOrder.shipping_address?.email || customerEmail || '—'}</div>
                    <div className="text-xs text-gray-500">Phone: {selectedOrder.shipping_address?.phone || customerPhone || '—'}</div>
                  </div>
                </div>

                <div>
                  <div className="font-semibold mb-2">Billing Address</div>
                  <div className="text-sm">
                    <div className="font-medium">{selectedOrder.billing_address?.name || selectedOrder.shipping_address?.name || '—'}</div>
                    <div>{selectedOrder.billing_address?.street || selectedOrder.billing_address?.address || '—'}</div>
                    <div>{selectedOrder.billing_address?.city || ''}{selectedOrder.billing_address?.city ? ', ' : ''}{selectedOrder.billing_address?.state || ''} {selectedOrder.billing_address?.pincode || ''}</div>
                    <div className="mt-1 text-xs text-gray-500">Email: {selectedOrder.billing_address?.email || selectedOrder.shipping_address?.email || customerEmail || '—'}</div>
                    <div className="text-xs text-gray-500">Phone: {selectedOrder.billing_address?.phone || selectedOrder.shipping_address?.phone || customerPhone || '—'}</div>
                  </div>

                  <div className="mt-4">
                  
                  </div>
                </div> 
              </div> 
            </div> 
          </div> 
        ) : null}
        
        {/* Cancellation Reason Dialog */}
        {showCancelDialog ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/50" onClick={() => { setShowCancelDialog(null); setCancelReason(''); }} />
            <div className={`relative max-w-md w-full p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>Cancel Order</h2>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Please provide a reason for cancelling this order.</p>
              <textarea
                className={`w-full p-3 rounded border mb-4 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-black border-gray-300'}`}
                placeholder="Enter cancellation reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  disabled={cancelling === showCancelDialog || !cancelReason.trim()}
                  onClick={() => handleCancelOrder(showCancelDialog, cancelReason)}
                  className="flex-1"
                >
                  {cancelling === showCancelDialog ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowCancelDialog(null); setCancelReason(''); }}
                  className="flex-1"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
