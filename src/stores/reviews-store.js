import { db, query, where, getDocs, addDoc, collection, serverTimestamp } from "../lib/firebase.js";

const state = {
  reviews: [],
  loading: true,
  listeners: [],
};

const notify = () => state.listeners.forEach((fn) => fn());

export const getReviews = () => state.reviews;
export const isReviewsLoading = () => state.loading;

export const onReviewsChange = (fn) => {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter((l) => l !== fn); };
};

export const getProductReviews = (productId) =>
  state.reviews.filter((r) => String(r.productId) === String(productId));

export const getProductRating = (productId) => {
  const productReviews = getProductReviews(productId);
  if (productReviews.length === 0) return 0;
  const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / productReviews.length;
};

export const addReview = async (review) => {
  try {
    await addDoc(collection(db, "reviews"), {
      productId: review.productId,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
      date: serverTimestamp(),
    });
    await fetchReviews();
    return true;
  } catch (e) {
    console.error("Failed to add review:", e);
    return false;
  }
};

export const fetchReviews = async () => {
  state.loading = true;
  notify();
  try {
    const snapshot = await getDocs(collection(db, "reviews"));
    state.reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (e) {
    console.error("Failed to fetch reviews:", e);
  } finally {
    state.loading = false;
    notify();
  }
};

fetchReviews();
