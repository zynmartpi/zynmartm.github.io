import { db } from "../lib/firebase.js";

const STORAGE_KEY = "zynmart_dynamic_products";
const CACHE_EXPIRATION_MS = 60 * 60 * 1000;
const PAGE_SIZE = 100;

const state = {
  products: [],
  loading: true,
  hasMore: true,
  nextPageToken: null,
  listeners: [],
};

export const getProducts = () => state.products;
export const isLoading = () => state.loading;
export const hasMoreProducts = () => state.hasMore;

const notify = () => state.listeners.forEach((fn) => fn());
export const onProductsChange = (fn) => {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter((l) => l !== fn); };
};

const fetchProducts = async (forceRefresh = false, isLoadMore = false) => {
  if (!forceRefresh && !isLoadMore) {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const cacheTime = localStorage.getItem(`${STORAGE_KEY}_time`);
      if (cached && cacheTime) {
        const parsed = JSON.parse(cached);
        const isFresh = Date.now() - Number(cacheTime) < CACHE_EXPIRATION_MS;
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          state.products = parsed;
          if (isFresh) { state.loading = false; state.hasMore = true; notify(); return; }
        }
      }
    } catch (e) { console.error("Cache read error:", e); }
  }

  if (!isLoadMore) state.loading = true;
  notify();

  try {
    const response = await db.collection("products").getDocs("products", {
      pageSize: PAGE_SIZE,
      pageToken: isLoadMore ? (state.nextPageToken || undefined) : undefined,
    });

    const firestoreProducts = response.docs.map((d) => {
      const data = d.data();
      const productId = isNaN(Number(d.id)) ? d.id : Number(d.id);
      return {
        id: productId,
        name: data.name || "Untitled Product",
        category: data.category || "General",
        description: data.description || "",
        price: Number(data.price_usd || data.price || 0),
        piPrice: Number(data.price_pi || 0),
        image: data.images?.[0] || data.image || "https://placehold.co/600x400?text=No+Image",
        images: data.images || [],
        rating: Number(data.rating || 5.0),
        reviews: Number(data.reviews || 0),
        sold: Number(data.sold || 0),
        stock: Number(data.stock_quantity || data.stock || 0),
        seller_id: data.seller_id,
        is_active: data.is_active !== false,
        location: data.location || null,
        country: data.country || data.location || "",
      };
    });

    const validProducts = firestoreProducts.filter((p) => p.name && p.id);

    if (isLoadMore) {
      state.products = [...state.products, ...validProducts];
    } else {
      state.products = validProducts;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validProducts));
        localStorage.setItem(`${STORAGE_KEY}_time`, Date.now().toString());
      } catch {}
    }

    state.nextPageToken = response.nextPageToken;
    state.hasMore = !!response.nextPageToken;
  } catch (e) {
    console.error("Failed to fetch products from Firestore", e);
  } finally {
    state.loading = false;
    notify();
  }
};

export const refreshProducts = async () => {
  state.nextPageToken = null;
  await fetchProducts(true);
};

export const loadMore = async () => {
  if (!state.loading && state.hasMore && state.nextPageToken) {
    await fetchProducts(false, true);
  }
};

export const getProductById = (id) => state.products.find((p) => String(p.id) === String(id));

export const getProductsByCategory = (category) => {
  if (category === "all") return state.products;
  return state.products.filter((p) => p.category === category);
};

// Initial load
fetchProducts();
