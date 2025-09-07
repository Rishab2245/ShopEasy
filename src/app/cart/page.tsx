'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShoppingCart, Lock, Truck, CreditCard, X, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

// Success Toast Component
interface SuccessToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ isOpen, onClose, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-green-400 hover:text-green-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirm Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  confirmText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = 'Confirm'
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: <Trash2 className="h-6 w-6 text-red-600" />,
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
      iconBg: 'bg-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
    },
    info: {
      icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${typeStyles[type].iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                {typeStyles[type].icon}
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{message}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${typeStyles[type].button}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const { user } = useAuth();
  const { cartItems, totalAmount, updateCartItem, removeFromCart, loading } = useCart();
  const router = useRouter();

  // State for modals and toasts
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    onConfirm: () => {},
    title: '',
    message: '',
    type: 'danger' as 'danger' | 'warning' | 'info'
  });

  const [successToast, setSuccessToast] = useState({
    isOpen: false,
    message: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleQuantityChange = async (cartId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateCartItem(cartId, newQuantity);
    setSuccessToast({
      isOpen: true,
      message: 'Cart updated successfully!'
    });
  };

  const handleRemoveItem = async (cartId: number) => {
    const item = cartItems.find(item => item.cart_id === cartId);
    
    setConfirmModal({
      isOpen: true,
      title: 'Remove Item',
      message: `Are you sure you want to remove "${item?.name}" from your cart?`,
      type: 'danger',
      onConfirm: async () => {
        await removeFromCart(cartId);
        setSuccessToast({
          isOpen: true,
          message: 'Item removed from cart'
        });
      }
    });
  };

  if (!user) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-r-indigo-400 animate-pulse mx-auto"></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                Your <span className="text-yellow-300">Cart</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed">
                Ready to complete your premium shopping experience
              </p>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="h-12 w-12 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed max-w-md mx-auto">
              Discover our premium collection and add items to start your shopping journey
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = totalAmount;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const finalTotal = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Your <span className="text-yellow-300">Cart</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed">
              Review your selected items and complete your purchase
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <h2 className="text-xl font-bold text-slate-900">
                  Shopping Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </h2>
              </div>
              
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.cart_id} className="p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg">
                          <Image
                            src={item.image_url || '/placeholder-image.jpg'}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {item.name}
                        </h3>
                        <p className="text-slate-600 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {item.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleQuantityChange(item.cart_id, item.quantity - 1)}
                            className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4 text-slate-600" />
                          </button>
                          
                          <span className="w-12 text-center font-semibold text-slate-900 text-lg">
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => handleQuantityChange(item.cart_id, item.quantity + 1)}
                            className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
                          >
                            <Plus className="h-4 w-4 text-slate-600" />
                          </button>
                        </div>
                        
                        {/* Price */}
                        <div className="text-right min-w-0">
                          <p className="text-xl font-bold text-slate-900">
                            ${item.total_price.toFixed(2)}
                          </p>
                          <p className="text-sm text-slate-500">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.cart_id)}
                          className="w-10 h-10 rounded-full text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors duration-200"
                          title="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-6 py-3 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Continue Shopping
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-slate-900">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {subtotal < 50 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-amber-800 text-sm font-medium">
                    Add ${(50 - subtotal).toFixed(2)} more to get FREE shipping!
                  </p>
                </div>
              )}

              <button
                onClick={() => alert('Checkout functionality would be implemented here')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center mb-4"
              >
                <Lock className="mr-2 h-5 w-5" />
                Secure Checkout
              </button>

              {/* Trust Indicators */}
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-green-600" />
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                  <span>30-day return guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.type === 'danger' ? 'Remove' : 'Confirm'}
      />

      <SuccessToast
        isOpen={successToast.isOpen}
        onClose={() => setSuccessToast({ ...successToast, isOpen: false })}
        message={successToast.message}
      />
    </div>
  );
}