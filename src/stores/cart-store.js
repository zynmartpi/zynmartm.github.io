import { getAuthState } from "./pi-auth-store.js";

const state = {
  cart: [],
  listeners: [],
};

export const getCart = () => state.cart;
export const getCartCount = () => state.cart.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
export const getCartTotal = () => state.cart.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
export const getPiTotal = () => state.cart.reduce((acc, item) => acc + (Number(item.piPrice) || 0) * (Number(item.quantity) || 0), 0);

const notify = () => state.listeners.forEach((fn) => fn());
export const onCartChange = (fn) => {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter((l) => l !== fn); };
};

export const addToCart = (product) => {
  const cartProduct = {
    ...product,
    piPrice: Number(product.piPrice || product.price_pi || (Number(product.price) * 0.5) || 0),
    image: product.image || (product.images?.[0] || "https://placehold.co/600x400?text=No+Image"),
  };
  const existing = state.cart.find((item) => item.id === cartProduct.id);
  if (existing) {
    state.cart = state.cart.map((item) =>
      item.id === cartProduct.id ? { ...item, quantity: item.quantity + 1 } : item
    );
  } else {
    state.cart = [...state.cart, { ...cartProduct, quantity: 1 }];
  }
  notify();
};

export const removeFromCart = (productId) => {
  state.cart = state.cart.filter((item) => item.id !== productId);
  notify();
};

export const updateQuantity = (productId, quantity) => {
  if (quantity <= 0) { removeFromCart(productId); return; }
  state.cart = state.cart.map((item) =>
    item.id === productId ? { ...item, quantity } : item
  );
  notify();
};

export const clearCart = () => {
  state.cart = [];
  notify();
};
