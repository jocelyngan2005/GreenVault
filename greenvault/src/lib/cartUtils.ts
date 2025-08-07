// Cart utility functions for managing cart state across the application

export interface CartItem {
  id: string;
  projectName: string;
  owner: string;
  co2Amount: number;
  pricePerTon: number;
  location: string;
  projectType: string;
  description: string;
  verified: boolean;
  quantity: number;
  totalPrice: number;
  image?: string;
}

export const cartUtils = {
  // Get cart items from localStorage
  getCartItems: (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const items = localStorage.getItem('cart-items');
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Error loading cart items:', error);
      return [];
    }
  },

  // Save cart items to localStorage
  saveCartItems: (items: CartItem[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('cart-items', JSON.stringify(items));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: items }));
    } catch (error) {
      console.error('Error saving cart items:', error);
    }
  },

  // Add item to cart
  addToCart: (item: Omit<CartItem, 'quantity' | 'totalPrice'>, quantity: number = 1): boolean => {
    try {
      const currentItems = cartUtils.getCartItems();
      const existingItemIndex = currentItems.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Item already exists, update quantity
        currentItems[existingItemIndex].quantity += quantity;
        currentItems[existingItemIndex].totalPrice = 
          currentItems[existingItemIndex].pricePerTon * currentItems[existingItemIndex].quantity;
      } else {
        // Add new item
        const newItem: CartItem = {
          ...item,
          quantity,
          totalPrice: item.pricePerTon * quantity
        };
        currentItems.push(newItem);
      }
      
      cartUtils.saveCartItems(currentItems);
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return false;
    }
  },

  // Remove item from cart
  removeFromCart: (itemId: string): boolean => {
    try {
      const currentItems = cartUtils.getCartItems();
      const updatedItems = currentItems.filter(item => item.id !== itemId);
      cartUtils.saveCartItems(updatedItems);
      return true;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      return false;
    }
  },

  // Update item quantity
  updateQuantity: (itemId: string, quantity: number): boolean => {
    try {
      if (quantity < 1) {
        return cartUtils.removeFromCart(itemId);
      }

      const currentItems = cartUtils.getCartItems();
      const itemIndex = currentItems.findIndex(item => item.id === itemId);
      
      if (itemIndex >= 0) {
        currentItems[itemIndex].quantity = quantity;
        currentItems[itemIndex].totalPrice = 
          currentItems[itemIndex].pricePerTon * quantity;
        cartUtils.saveCartItems(currentItems);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      return false;
    }
  },

  // Clear all items from cart
  clearCart: (): boolean => {
    try {
      cartUtils.saveCartItems([]);
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  },

  // Get cart summary
  getCartSummary: (): { itemCount: number; totalAmount: number; totalCO2: number } => {
    const items = cartUtils.getCartItems();
    return {
      itemCount: items.length,
      totalAmount: items.reduce((total, item) => total + item.totalPrice, 0),
      totalCO2: items.reduce((total, item) => total + (item.co2Amount * item.quantity), 0)
    };
  },

  // Check if item is in cart
  isInCart: (itemId: string): boolean => {
    const items = cartUtils.getCartItems();
    return items.some(item => item.id === itemId);
  },

  // Get item quantity in cart
  getItemQuantity: (itemId: string): number => {
    const items = cartUtils.getCartItems();
    const item = items.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  }
};

// Hook for React components to use cart functionality
export const useCart = () => {
  return cartUtils;
};
