// Order management functions for backend API integration
import { backendFetch } from './backendApi.js';

// Order interface
export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  weight?: string;
  image?: string;
  grade?: string;
}

export interface OrderData {
  addressId: string;
  items?: OrderItem[];
}

// Enhanced order data interface for database storage
export interface OrderDataFull {
  orderId: string;
  orderDetails: OrderItem[];
  totalAmount: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  shippingAddress: any;
  billingAddress?: any;
  addressId?: string;
  paymentMethod: string;
  paymentStatus?: string;
  orderStatus?: string;
}

// Save order to database
export async function saveOrderToDatabase(orderData: OrderDataFull): Promise<{ success: boolean; order?: any; error?: string }> {
  try {
    // Attach auth token if present; otherwise include legacy userId in body so server can set user_id
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const bodyPayload: any = { ...orderData };
    if (!authToken && userId) {
      // Legacy fallback: include user_id in payload so server can persist it
      bodyPayload.user_id = userId;
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save order');
    }

    return { success: true, order: result.order };

  } catch (error: any) {
    console.error('Save order error:', error);
    return { success: false, error: error.message };
  }
}

// Create a new order (legacy function for backward compatibility)
export async function createOrder(addressId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const response = await backendFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ addressId })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create order');
    }

    // Clear cart after successful order
    localStorage.removeItem('tadbir_cart');
    // Dispatch update asynchronously to avoid setState-in-render in other components
    setTimeout(() => window.dispatchEvent(new CustomEvent('tadbir_cart_updated', { detail: [] })), 0);

    return { success: true, orderId: response.data.id };

  } catch (error: any) {
    console.error('Create order error:', error);
    return { success: false, error: error.message };
  }
}

// Get user's orders
export async function getUserOrders(): Promise<{ success: boolean; orders?: any[]; error?: string }> {
  try {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    if (!authToken) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch('/api/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch orders');

    const orders = result.orders || result.data || [];
    return { success: true, orders };
  } catch (error: any) {
    console.error('Get orders error:', error);
    return { success: false, error: error.message };
  }
}

// Get specific order by ID
export async function getOrderById(orderId: string): Promise<{ success: boolean; order?: any; error?: string }> {
  try {
    const response = await backendFetch(`/api/orders/${orderId}`, {
      method: 'GET'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch order');
    }

    return { success: true, order: response.data };

  } catch (error: any) {
    console.error('Get order error:', error);
    return { success: false, error: error.message };
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await backendFetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to update order');
    }

    return { success: true };

  } catch (error: any) {
    console.error('Update order status error:', error);
    return { success: false, error: error.message };
  }
}

// Cancel order
export async function cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!authToken) {
      return { success: false, error: 'Authentication required' };
    }

    const resp = await fetch('/api/orders', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ orderId })
    });

    const result = await resp.json();
    if (!resp.ok) {
      return { success: false, error: result.error || 'Failed to cancel order' };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Cancel order error:', error);
    return { success: false, error: error.message };
  }
}