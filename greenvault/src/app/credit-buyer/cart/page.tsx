'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { cartUtils, CartItem } from '@/lib/cartUtils';
import { smartContractService } from '@/lib/smartContractService';

export default function CreditBuyerCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load cart items using utility function
    setCartItems(cartUtils.getCartItems());

    // Listen for cart updates from other components
    const handleCartUpdate = (event: CustomEvent) => {
      setCartItems(event.detail);
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, []);

  const updateQuantity = (id: string, newQuantity: number) => {
    cartUtils.updateQuantity(id, newQuantity);
    setCartItems(cartUtils.getCartItems());
  };

  const removeFromCart = (id: string) => {
    cartUtils.removeFromCart(id);
    setCartItems(cartUtils.getCartItems());
  };

  const clearCart = () => {
    cartUtils.clearCart();
    setCartItems([]);
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalCO2 = () => {
    return cartItems.reduce((total, item) => total + (item.co2Amount * item.quantity), 0);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    let anyError = false;
    let errorMsg = '';
    
    // Helper function to convert UUID to Sui object ID format
    const convertToSuiObjectId = (uuid: string): string => {
      // Remove hyphens and ensure it's 32 characters (64 hex chars)
      const cleanId = uuid.replace(/-/g, '');
      // Pad with zeros if needed and ensure it starts with 0x
      const paddedId = cleanId.padStart(64, '0');
      return '0x' + paddedId;
    };
    
    for (const item of cartItems) {
      try {
        // Convert UUID to Sui object ID format
        const suiObjectId = convertToSuiObjectId(item.id);
        
        // Call smart contract buy for each item
        const result = await smartContractService.buyCarbonCredit({
          creditId: suiObjectId,
          paymentAmount: item.totalPrice
        });
        if (!result.success) {
          anyError = true;
          // Provide more helpful error messages for common development issues
          if (result.error?.includes('E_INVALID_PROJECT') || result.error?.includes('MoveAbort') || result.error?.includes('error code 5')) {
            errorMsg = `Credit ${item.projectName} is not available for purchase. This might be because the credit needs to be listed for sale first in the marketplace.`;
          } else {
            errorMsg = result.error || 'Unknown error';
          }
          break;
        }
      } catch (e) {
        anyError = true;
        const errorStr = e instanceof Error ? e.message : 'Unknown error';
        if (errorStr.includes('E_INVALID_PROJECT') || errorStr.includes('MoveAbort') || errorStr.includes('error code 5')) {
          errorMsg = `Credit ${item.projectName} is not available for purchase. This might be because the credit needs to be listed for sale first in the marketplace.`;
        } else {
          errorMsg = errorStr;
        }
        break;
      }
    }
    if (anyError) {
      alert('Purchase failed: ' + errorMsg + '\n\nNote: In development, credits need to be properly minted and listed for sale before they can be purchased.');
      setIsProcessing(false);
      return;
    }
    alert('Purchase successful! Your carbon credits have been added to your portfolio.');
    clearCart();
    setIsProcessing(false);
  };

  if (!isMounted) {
    return (
      <Navigation>
        <div className="min-h-screen bg-white text-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Link 
            href="/credit-buyer/marketplace"
            className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Browse our marketplace to find carbon credits that match your sustainability goals.
            </p>
            <Link 
              href="/credit-buyer/marketplace"
              className="bg-black text-white px-6 py-3 border border-black hover:bg-white hover:text-black transition-colors inline-block"
            >
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="border border-black p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{item.projectName}</h3>
                        {item.verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 border border-green-300">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.projectType} • {item.location}</p>
                      <p className="text-sm text-gray-600 mb-2">By {item.owner}</p>
                      <p className="text-sm">{item.description}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-800 ml-4"
                      title="Remove from cart"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm text-gray-600">CO₂ per credit: </span>
                        <span className="font-medium">{item.co2Amount} tons</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Price per ton: </span>
                        <span className="font-medium">${item.pricePerTon}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Quantity:</label>
                        <div className="flex items-center border border-black">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 border-l border-r border-black">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-lg font-bold">${item.totalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {cartItems.length > 0 && (
                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear all items
                  </button>
                  <div className="text-sm text-gray-600">
                    Total CO₂ offset: <span className="font-semibold">{getTotalCO2().toFixed(1)} tons</span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="border border-black p-6">
                <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span>Items ({cartItems.length})</span>
                    <span>${getTotalAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">Environmental Impact</h4>
                  <p className="text-sm text-green-700">
                    This purchase will offset <strong>{getTotalCO2().toFixed(1)} tons</strong> of CO₂ 
                    equivalent to removing a car from the road for {Math.round(getTotalCO2() * 2.3)} days.
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || cartItems.length === 0}
                  className="w-full bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Complete Purchase'}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Secure payment processing • Carbon credits delivered instantly
                </p>
              </div>

              {/* Recently Viewed */}
              <div className="border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Need More Credits?</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/credit-buyer/marketplace?filter=verified" className="block text-blue-600 hover:underline">
                    Browse Verified Projects
                  </Link>
                  <Link href="/credit-buyer/marketplace?filter=nature-based" className="block text-blue-600 hover:underline">
                    Nature-Based Solutions
                  </Link>
                  <Link href="/credit-buyer/marketplace?filter=renewable" className="block text-blue-600 hover:underline">
                    Renewable Energy Credits
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </Navigation>
  );
}
