import { db, doc, getDoc, updateDoc, addDoc, collection, getDocs, serverTimestamp } from "../lib/firebase.js";
import { getAuthState } from "./pi-auth-store.js";
import { showToast } from "../components/toast.js";
import { t } from "./language-store.js";

const state = {
  orders: [],
  loading: true,
  listeners: [],
};

export const getOrders = () => state.orders;
export const isLoading = () => state.loading;
export const getOrderById = (id) => state.orders.find((o) => o.id === id);

const notify = () => state.listeners.forEach((fn) => fn());
export const onOrdersChange = (fn) => {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter((l) => l !== fn); };
};

const fetchOrders = async () => {
  const userId = getAuthState().userData?.username || "guest";
  if (!userId || userId === "guest") { state.loading = false; notify(); return; }
  state.loading = true;
  try {
    const querySnapshot = await getDocs("orders");
    state.orders = querySnapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          items: data.items || [],
          totalPi: Number(data.total_pi || data.totalPi || data.total_price || 0),
          status: data.status || "processing",
          createdAt: data.created_at || data.createdAt || new Date().toISOString(),
          address: data.address || {},
          buyer_id: data.buyer_id || data.userId || data.username || data.user_id,
          seller_ids: data.seller_ids || [],
        };
      })
      .filter((order) => String(order.buyer_id || "").toLowerCase() === String(userId).toLowerCase() && String(userId).toLowerCase() !== "guest");
  } catch (e) {
    console.error("Failed to fetch orders from Firestore", e);
    const saved = localStorage.getItem(`zynmart_orders_${userId}`);
    if (saved) state.orders = JSON.parse(saved);
  } finally { state.loading = false; notify(); }
};

export const addOrder = async (orderData) => {
  const userId = getAuthState().userData?.username || "guest";
  try {
    const itemsBySeller = orderData.items.reduce((acc, item) => {
      const sellerId = item.seller_id || "system";
      if (!acc[sellerId]) acc[sellerId] = [];
      acc[sellerId].push(item);
      return acc;
    }, {});

    for (const item of orderData.items) {
      try {
        const productId = String(item.id);
        const productRef = doc(db, "products", productId);
        const pDoc = await getDoc(productRef);
        if (pDoc.exists() && pDoc.data()) {
          const currentStock = Number(pDoc.data().stock_quantity || pDoc.data().stock || 0);
          const purchasedQty = Number(item.quantity || 1);
          await updateDoc(productRef, { stock_quantity: Math.max(0, currentStock - purchasedQty), stock: Math.max(0, currentStock - purchasedQty) });
        }
      } catch (err) { console.error("Failed to deduct stock for product", item.id, err); }
    }

    const newOrders = [];
    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
      const totalPiForSeller = items.reduce((sum, item) => sum + ((Number(item.piPrice) || Number(item.price) || 0) * (item.quantity || 1)), 0);
      const newOrderData = { items, address: orderData.address, total_pi: totalPiForSeller, buyer_id: userId, userId, status: "pending", created_at: new Date().toISOString(), seller_ids: [sellerId] };
      const docRef = await addDoc(collection(db, "orders"), newOrderData);
      newOrders.push({ ...orderData, id: docRef.id || `ORD-${Date.now()}-${sellerId}`, items, status: "pending", createdAt: new Date().toISOString(), totalPi: totalPiForSeller });
    }
    state.orders = [...newOrders, ...state.orders];
    notify();
  } catch (e) {
    console.error("Error adding order to Firestore:", e);
    throw e;
  }
};

fetchOrders();
