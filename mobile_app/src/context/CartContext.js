import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({}); // Start with empty cart
  const [boxCart, setBoxCart] = useState({}); // Start with empty box cart
  const [products, setProducts] = useState([]); // Store products for stock validation
  const [boxes, setBoxes] = useState([]); // Store boxes for validation
  const [promotionalProducts, setPromotionalProducts] = useState({}); // Store promotional products with their promotion data

  const addToCart = (productId) => {
    console.log('Adding to cart:', productId);
    const product = products.find(p => p.id.toString() === productId.toString());
    const currentQuantity = cart[productId] || 0;
    
    if (product && product.stockQuantity !== undefined) {
      if (currentQuantity >= product.stockQuantity) {
        console.log('Cannot add more: stock limit reached');
        return false; // Indicate failure
      }
    }
    
    setCart((prev) => ({ ...prev, [productId]: currentQuantity + 1 }));
    return true; // Indicate success
  };

  const removeFromCart = (productId) => {
    console.log('Removing from cart:', productId);
    setCart((prev) => ({ ...prev, [productId]: Math.max((prev[productId] || 1) - 1, 0) }));
  };

  const updateQuantity = (productId, quantity) => {
    console.log('Updating quantity:', productId, quantity);
    const product = products.find(p => p.id.toString() === productId.toString());
    
    if (quantity <= 0) {
      setCart((prev) => {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      });
    } else if (product && product.stockQuantity !== undefined && quantity > product.stockQuantity) {
      console.log('Cannot update: quantity exceeds stock limit');
      return false; // Indicate failure
    } else {
      setCart((prev) => ({ ...prev, [productId]: quantity }));
      return true; // Indicate success
    }
  };

  const removeItem = (productId) => {
    console.log('Removing item:', productId);
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const getCartCount = () => {
    const productCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
    const boxCount = Object.values(boxCart).reduce((sum, count) => sum + count, 0);
    const totalCount = productCount + boxCount;
    
    // Debug: Log cart count for consistency check
    console.log('Cart Count Debug:');
    console.log('- Product count:', productCount);
    console.log('- Box count:', boxCount);
    console.log('- Total count:', totalCount);
    console.log('- Cart items:', Object.entries(cart));
    console.log('- Box items:', Object.entries(boxCart));
    
    return totalCount;
  };

  const getCartItems = () => {
    return Object.entries(cart).map(([productId, quantity]) => ({
      id: productId,
      quantity,
    }));
  };

  const clearCart = () => {
    setCart({});
    setBoxCart({});
  };

  const setProductsData = (productsData) => {
    setProducts(productsData);
  };

  // Box cart functions
  const addBoxToCart = (boxId) => {
    console.log('Adding box to cart:', boxId);
    
    // Check if box can be added (all products must be in stock)
    if (!canAddBoxToCart(boxId)) {
      console.log('Cannot add box: some products are out of stock');
      return false; // Indicate failure
    }
    
    const currentQuantity = boxCart[boxId] || 0;
    setBoxCart((prev) => ({ ...prev, [boxId]: currentQuantity + 1 }));
    return true; // Indicate success
  };

  const removeBoxFromCart = (boxId) => {
    console.log('Removing box from cart:', boxId);
    setBoxCart((prev) => ({ ...prev, [boxId]: Math.max((prev[boxId] || 1) - 1, 0) }));
  };

  const updateBoxQuantity = (boxId, quantity) => {
    console.log('Updating box quantity:', boxId, quantity);
    
    if (quantity <= 0) {
      setBoxCart((prev) => {
        const newBoxCart = { ...prev };
        delete newBoxCart[boxId];
        return newBoxCart;
      });
    } else {
      setBoxCart((prev) => ({ ...prev, [boxId]: quantity }));
      return true; // Indicate success
    }
  };

  const removeBoxItem = (boxId) => {
    console.log('Removing box item:', boxId);
    setBoxCart((prev) => {
      const newBoxCart = { ...prev };
      delete newBoxCart[boxId];
      return newBoxCart;
    });
  };

  const getBoxCartCount = () => {
    return Object.values(boxCart).reduce((sum, count) => sum + count, 0);
  };

  const getBoxCartItems = () => {
    return Object.entries(boxCart).map(([boxId, quantity]) => ({
      id: boxId,
      quantity,
    }));
  };

  const setBoxesData = (boxesData) => {
    setBoxes(boxesData);
  };

  const getBoxWithData = (boxId) => {
    return boxes.find(b => b.id.toString() === boxId.toString());
  };

  // Add promotional product to the promotional products store
  const addPromotionalProduct = (product) => {
    if (product && product.promotion) {
      setPromotionalProducts(prev => ({
        ...prev,
        [product.id]: product
      }));
    }
  };

  // Get product with promotional data if available
  const getProductWithPromotion = (productId) => {
    const promotionalProduct = promotionalProducts[productId];
    if (promotionalProduct) {
      return promotionalProduct;
    }
    return products.find(p => p.id.toString() === productId.toString());
  };

  const getProductStock = (productId) => {
    const product = products.find(p => p.id.toString() === productId.toString());
    return product?.stockQuantity;
  };

  const canAddToCart = (productId) => {
    const product = products.find(p => p.id.toString() === productId.toString());
    const currentQuantity = cart[productId] || 0;
    return !product || product.stockQuantity === undefined || currentQuantity < product.stockQuantity;
  };

  // Check if a box can be added to cart (all products must be in stock)
  const canAddBoxToCart = (boxId) => {
    const box = boxes.find(b => b.id.toString() === boxId.toString());
    if (!box || !box.products || !Array.isArray(box.products)) {
      return false;
    }
    
    // Check if any product in the box is out of stock
    for (let i = 0; i < box.products.length; i++) {
      const product = box.products[i];
      if (product.stockQuantity === 0) {
        return false;
      }
    }
    
    return true;
  };

  // Calculate promotional price for a product
  const getPromotionalPrice = (product) => {
    if (!product || !product.promotion) {
      return product?.price || 0;
    }

    switch (product.promotion.type) {
      case 'discount':
        const discountValue = product.promotion.discountValue || 0;
        return (product.price || 0) * (1 - discountValue / 100);
      case '2+1':
        // For 2+1, we need to calculate based on quantity
        // This will be handled in getCartTotal
        return product.price || 0;
      default:
        return product.price || 0;
    }
  };

  // Calculate effective price per item for 2+1 offers
  const getEffectivePricePerItem = (product, quantity) => {
    if (!product || !product.promotion || product.promotion.type !== '2+1') {
      return product?.price || 0;
    }

    if (quantity === 0) return 0;

    const quantityRequired = product.promotion.quantityRequired || 2;
    const quantityFree = product.promotion.quantityFree || 1;
    const fullSets = Math.floor(quantity / (quantityRequired + quantityFree));
    const remainingItems = quantity % (quantityRequired + quantityFree);
    const paidItems = (fullSets * quantityRequired) + Math.min(remainingItems, quantityRequired);
    
    return (paidItems * product.price) / quantity;
  };

  // Get cart total with promotional pricing
  const getCartTotal = () => {
    let total = 0;
    
    // Calculate products total
    Object.entries(cart).forEach(([productId, quantity]) => {
      const product = getProductWithPromotion(productId);
      if (product) {
        if (product.promotion && product.promotion.type === '2+1') {
          // 2+1 logic: buy 2, get 1 free
          const quantityRequired = product.promotion.quantityRequired || 2;
          const quantityFree = product.promotion.quantityFree || 1;
          const fullSets = Math.floor(quantity / (quantityRequired + quantityFree));
          const remainingItems = quantity % (quantityRequired + quantityFree);
          const paidItems = (fullSets * quantityRequired) + Math.min(remainingItems, quantityRequired);
          total += paidItems * product.price;
        } else {
          // Regular pricing with discount if applicable
          const promotionalPrice = getPromotionalPrice(product);
          total += quantity * promotionalPrice;
        }
      }
    });

    // Calculate boxes total
    Object.entries(boxCart).forEach(([boxId, quantity]) => {
      const box = getBoxWithData(boxId);
      if (box) {
        total += quantity * box.price;
      }
    });
    
    return total;
  };

  // Get detailed cart items with promotional pricing
  const getCartItemsWithPricing = () => {
    const productItems = Object.entries(cart).map(([productId, quantity]) => {
      const product = getProductWithPromotion(productId);
      if (!product) return null;

      let finalPrice = product.price;
      let promotionalPrice = null;
      let savings = 0;
      let effectivePricePerItem = product.price;

      if (product.promotion && product.promotion.type === 'discount') {
        promotionalPrice = getPromotionalPrice(product);
        finalPrice = promotionalPrice;
        effectivePricePerItem = promotionalPrice;
        savings = (product.price - promotionalPrice) * quantity;
      } else if (product.promotion && product.promotion.type === '2+1') {
        const quantityRequired = product.promotion.quantityRequired || 2;
        const quantityFree = product.promotion.quantityFree || 1;
        const fullSets = Math.floor(quantity / (quantityRequired + quantityFree));
        const remainingItems = quantity % (quantityRequired + quantityFree);
        const paidItems = (fullSets * quantityRequired) + Math.min(remainingItems, quantityRequired);
        finalPrice = (paidItems * product.price) / quantity;
        effectivePricePerItem = finalPrice;
        savings = (product.price * quantity) - (paidItems * product.price);
      }

      return {
        id: productId,
        product,
        quantity,
        originalPrice: product.price,
        finalPrice,
        effectivePricePerItem,
        promotionalPrice,
        savings,
        totalPrice: finalPrice * quantity,
        type: 'product'
      };
    }).filter(Boolean);

    const boxItems = Object.entries(boxCart).map(([boxId, quantity]) => {
      const box = getBoxWithData(boxId);
      if (!box) return null;

      return {
        id: boxId,
        product: box, // Use product field for consistency
        quantity,
        originalPrice: box.price,
        finalPrice: box.price,
        effectivePricePerItem: box.price,
        promotionalPrice: null,
        savings: 0,
        totalPrice: box.price * quantity,
        type: 'box'
      };
    }).filter(Boolean);

    return [...productItems, ...boxItems];
  };

  const value = {
    cart,
    boxCart,
    products,
    boxes,
    addToCart,
    removeFromCart,
    updateQuantity,
    removeItem,
    addBoxToCart,
    removeBoxFromCart,
    updateBoxQuantity,
    removeBoxItem,
    getCartCount,
    getCartItems,
    getBoxCartCount,
    getBoxCartItems,
    getCartTotal,
    getCartItemsWithPricing,
    getPromotionalPrice,
    getEffectivePricePerItem,
    addPromotionalProduct,
    getProductWithPromotion,
    getBoxWithData,
    clearCart,
    setProductsData,
    setBoxesData,
    getProductStock,
    canAddToCart,
    canAddBoxToCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 