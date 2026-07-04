"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from './UserContext';

interface CartItem {
  id: number | string;
  cart_id?: string; // Database cart ID
  name?: string;
  product_name?: string;
  price?: number;
  quantity?: number;
  qty?: number;
  originalPrice?: number;
  original_price?: number;
  image?: string;
  grade?: string;
  weight?: string;
  product_id?: number;
  [key: string]: any;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem, quantity?: number) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user-specific cart key
  const getCartKey = () => {
    return user ? `tadbir_cart_${user.id}` : 'tadbir_cart_guest';
  };

  // Fetch cart from database for logged-in users
  const fetchCartFromDB = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/cart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });

      const result = await response.json();

      if (result.success && result.cartItems) {
        // Map database cart items to local cart item format
        const mappedItems = result.cartItems.map((item: any) => ({
          id: item.product_id,
          cart_id: item.id,
          name: item.product_name,
          product_name: item.product_name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          originalPrice: item.original_price ? parseFloat(item.original_price) : undefined,
          original_price: item.original_price ? parseFloat(item.original_price) : undefined,
          image: item.image,
          grade: item.grade,
          weight: item.weight,
          product_id: item.product_id
        }));
        setCartItems(mappedItems);
        
        // Also sync to localStorage for offline access
        saveToLocalStorage(mappedItems);

        // Dispatch event to update navbar count asynchronously to avoid setState-in-render
        setTimeout(() => window.dispatchEvent(new CustomEvent('tadbir_cart_updated', { detail: mappedItems })), 0);
      }
    } catch (error) {
      console.error('Error fetching cart from database:', error);
      // Fallback to localStorage if DB fetch fails
      loadCart();
    } finally {
      setIsLoading(false);
    }
  };

  // Save to database for logged-in users
  const saveToDatabase = async (item: CartItem, quantity: number) => {
    if (!user) return;

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          product_id: item.id || item.product_id,
          product_name: item.name || item.product_name,
          price: item.price,
          quantity,
          original_price: item.originalPrice || item.original_price,
          image: item.image,
          grade: item.grade,
          weight: item.weight
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        console.error('Failed to save to database:', result.error);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  // Update quantity in database
  const updateInDatabase = async (cartItemId: string | number, quantity: number) => {
    if (!user) return;

    try {
      const authToken = localStorage.getItem('authToken');
      await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({ cart_item_id: cartItemId, quantity })
      });
    } catch (error) {
      console.error('Error updating database:', error);
    }
  };

  // Delete from database
  const deleteFromDatabase = async (productId: number | string) => {
    if (!user) return;

    try {
      const authToken = localStorage.getItem('authToken');
      await fetch(`/api/cart?product_id=${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });
    } catch (error) {
      console.error('Error deleting from database:', error);
    }
  };

  // Load cart from localStorage
  const loadCart = () => {
    try {
      const cartKey = getCartKey();
      const raw = localStorage.getItem(cartKey) || '[]';
      const parsed = JSON.parse(raw) as CartItem[];
      const normalized = parsed.map(i => ({ ...i, quantity: i.quantity ?? i.qty ?? 1 }));
      setCartItems(normalized);
    } catch (e) {
      setCartItems([]);
    }
  };

  // Save cart to localStorage
  const saveToLocalStorage = (items: CartItem[]) => {
    try {
      const cartKey = getCartKey();
      localStorage.setItem(cartKey, JSON.stringify(items));
      
      // Also save to the old key for backward compatibility
      localStorage.setItem('tadbir_cart', JSON.stringify(items));

      // Dispatch events asynchronously for real-time updates (avoid cross-component updates during render)
      setTimeout(() => {
        try {
          window.dispatchEvent(new StorageEvent('storage', {
            key: cartKey,
            newValue: JSON.stringify(items)
          }));
        } catch (e) {
          // Some browsers may restrict constructing StorageEvent; ignore failures
        }
        window.dispatchEvent(new CustomEvent('tadbir_cart_updated', { detail: items }));
      }, 0);
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  };

  // Clear cart when user changes or logs in
  useEffect(() => {
    const currentCartKey = getCartKey();
    
    if (user) {
      // User logged in - fetch from database
      fetchCartFromDB();
    } else {
      // User logged out - load guest cart from localStorage
      loadCart();
    }
  }, [user]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const cartKey = getCartKey();
      if (e.key === cartKey || e.key === 'tadbir_cart') {
        try {
          const parsed = JSON.parse(e.newValue || '[]') as CartItem[];
          const normalized = parsed.map(i => ({ ...i, quantity: i.quantity ?? i.qty ?? 1 }));
          setCartItems(normalized);
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const addToCart = async (item: CartItem, quantity = 1) => {
    if (user) {
      // For logged-in users, save to database first, then refresh from DB
      try {
        await saveToDatabase(item, quantity);
        // Refresh cart from database to get updated quantities
        await fetchCartFromDB();
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    } else {
      // For guest users, use localStorage
      setCartItems(prevItems => {
        const existingItem = prevItems.find(i => i.id === item.id);
        let newItems;
        
        if (existingItem) {
          // Update quantity if item exists
          newItems = prevItems.map(i => 
            i.id === item.id 
              ? { ...i, quantity: (i.quantity || 1) + quantity }
              : i
          );
        } else {
          // Add new item
          newItems = [...prevItems, { ...item, quantity }];
        }
        
        saveToLocalStorage(newItems);
        return newItems;
      });
    }
  };

  const removeFromCart = (id: string | number) => {
    const itemToRemove = cartItems.find(item => item.id === id);
    
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      saveToLocalStorage(newItems);
      return newItems;
    });
    
    // Delete from database if user is logged in
    if (user) {
      deleteFromDatabase(id);
    }
  };

  const updateQuantity = async (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    if (user) {
      // For logged-in users, update in database then refresh
      const itemToUpdate = cartItems.find(item => item.id === id);
      
      if (itemToUpdate?.cart_id) {
        try {
          await updateInDatabase(itemToUpdate.cart_id, quantity);
          // Refresh cart from database
          await fetchCartFromDB();
        } catch (error) {
          console.error('Error updating quantity:', error);
        }
      }
    } else {
      // For guest users, update localStorage
      setCartItems(prevItems => {
        const newItems = prevItems.map(item => 
          item.id === id ? { ...item, quantity } : item
        );
        saveToLocalStorage(newItems);
        return newItems;
      });
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    const cartKey = getCartKey();
    localStorage.removeItem(cartKey);
    localStorage.removeItem('tadbir_cart');
    
    // Clear from database if user is logged in
    if (user) {
      try {
        const authToken = localStorage.getItem('authToken');
        // Delete all cart items for this user
        for (const item of cartItems) {
          if (item.cart_id || item.id) {
            await deleteFromDatabase(item.id);
          }
        }
      } catch (error) {
        console.error('Error clearing cart from database:', error);
      }
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};