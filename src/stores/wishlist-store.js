import { db, doc, deleteDoc, addDoc, collection, getDocs, where, query } from "../lib/firebase.js";
import { getAuthState } from "./pi-auth-store.js";

const state = {
  wishlist: [],
  loading: true,
  listeners: [],
};

export const getWishlist = () => state.wishlist;
export const getWishlistCount = () => state.wishlist.length;
export const isInWishlist = (productId) => state.wishlist.some((item) => String(item.id) === String(productId));

const notify = () => state.listeners.forEach((fn) => fn());
export const onWishlistChange = (fn) => {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter((l) => l !== fn); };
};

const fetchWishlist = async () => {
  const userId = getAuthState().userData?.username || "guest";
  if (!userId || userId === "guest") { state.loading = false; notify(); return; }
  state.loading = true;
  try {
    const q = query("wishlist", where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    state.wishlist = querySnapshot.docs.map((d) => {
      const data = d.data();
      return { id: data.id, name: data.name, price: data.price, image: data.image, rating: data.rating, reviews: data.reviews, category: data.category };
    });
  } catch (e) { console.error("Failed to fetch wishlist from Firestore", e); }
  finally { state.loading = false; notify(); }
};

export const addToWishlist = async (product) => {
  const userId = getAuthState().userData?.username || "guest";
  if (!isInWishlist(product.id)) {
    state.wishlist = [...state.wishlist, product];
    if (userId !== "guest") {
      try { await addDoc("wishlist", { ...product, userId, createdAt: new Date().toISOString() }); }
      catch (e) { console.error("Error adding to Firestore wishlist:", e); }
    }
    notify();
  }
};

export const removeFromWishlist = async (productId) => {
  const userId = getAuthState().userData?.username || "guest";
  state.wishlist = state.wishlist.filter((item) => String(item.id) !== String(productId));
  if (userId !== "guest") {
    try {
      const q = query("wishlist", where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const docToDelete = querySnapshot.docs.find((d) => String(d.data().id) === String(productId));
      if (docToDelete) await deleteDoc(doc(db, "wishlist", docToDelete.id));
    } catch (e) { console.error("Error removing from Firestore wishlist:", e); }
  }
  notify();
};

export const toggleWishlist = (product) => {
  if (isInWishlist(product.id)) removeFromWishlist(product.id);
  else addToWishlist(product);
};

fetchWishlist();
