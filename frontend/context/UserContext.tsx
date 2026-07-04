"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProfile } from '../lib/backendApi';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface UserContextType {
  user: User | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  clearUserCart: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function persistUserId(userId: string | null) {
  if (typeof window === 'undefined') return;
  if (userId) localStorage.setItem('userId', userId);
  else localStorage.removeItem('userId');
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setAuthLoading(false);
      return;
    }

    getProfile(token)
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          persistUserId(String(data.user.id));
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('authToken');
        persistUserId(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const logout = () => {
    // Save current user's cart before clearing user data
    if (user && user.id) {
      const userCartKey = `tadbir_cart_${user.id}`;
      const userCart = localStorage.getItem(userCartKey);
      if (userCart) {
        // Keep user's cart saved under their ID for when they log back in
        // Don't move it to guest cart
      }
    }
    
    setUser(null);
    localStorage.removeItem('authToken');
    persistUserId(null);
    
    // Start fresh guest cart after logout
    localStorage.setItem('tadbir_cart_guest', '[]');
    localStorage.setItem('tadbir_cart', '[]');
  };

  const setUserAndClearCart = (newUser: User | null) => {
    const currentUserId = user?.id;
    const newUserId = newUser?.id;
    
    // Only clear cart if switching to a different user (not same user re-logging in)
    if (newUser && currentUserId && newUserId !== currentUserId) {
      // Different user login - clear previous user's cart
      localStorage.removeItem(`tadbir_cart_${currentUserId}`);
    }
    
    // Don't clear cart on same user re-login - let them keep their items
    setUser(newUser);
    persistUserId(newUser?.id ? String(newUser.id) : null);
  };

  return (
    <UserContext.Provider value={{ user, authLoading, setUser: setUserAndClearCart, logout, clearUserCart: () => {} }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within a UserProvider');
  return context;
};
