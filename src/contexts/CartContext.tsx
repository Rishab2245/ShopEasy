'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
  cart_id: number;
  product_id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  quantity: number;
  total_price: number;
}

interface CartContextType {
  cartItems: CartItem[];
  totalAmount: number;
  itemCount: number;
  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
  updateCartItem: (cartId: number, quantity: number) => Promise<boolean>;
  removeFromCart: (cartId: number) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  const refreshCart = useCallback(async () => {
    if (!token) {
      setCartItems([]);
      setTotalAmount(0);
      setItemCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.cartItems);
        setTotalAmount(data.totalAmount);
        setItemCount(data.itemCount);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [token, setCartItems, setTotalAmount, setItemCount, setLoading]);

  useEffect(() => {
    refreshCart();
  }, [token, user, refreshCart]);

  const addToCart = async (productId: number, quantity: number = 1): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.ok) {
        await refreshCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const updateCartItem = async (cartId: number, quantity: number): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/cart/${cartId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        await refreshCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return false;
    }
  };

  const removeFromCart = async (cartId: number): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`/api/cart/${cartId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await refreshCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      totalAmount,
      itemCount,
      addToCart,
      updateCartItem,
      removeFromCart,
      refreshCart,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}