import { t, getDir } from "../stores/language-store.js";
import { getAuthState, refreshUserData } from "../stores/pi-auth-store.js";
import { db, collection, query, where, getDocs, doc, updateDoc, onSnapshot } from "../lib/firebase.js";
import { renderHeader } from "../components/header.js";
import { showToast } from "../components/toast.js";
import { navigate } from "../components/router.js";

let unsubscribe = null;

export function renderSellerOrdersPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const userData = getAuthState().userData;

  if (!userData) { navigate("/"); return; }

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-[#fafafa] pb-32" dir="${dir}">
      <main class="container mx-auto pb-8 px-0 sm:px-4">
        <div class="bg-white sm:rounded-b-xl border-b sm:border-x sm:border-t-0 border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
            <h1 class="text-xl font-bold text-gray-900">${t("manage_sales_label") || "Manage Sales"}</h1>
            <div class="flex gap-1">
              ${["all", "pending", "processing", "shipped"].map((f) => `
                <button class="seller-filter-btn px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${f === "pending" ? "bg-gray-100 text-gray-900" : "text-gray-400"}" data-filter="${f}">
                  ${f === "all" ? (t("all") || "All") : (t(f + "_status") || f)}
                </button>
              `).join("")}
            </div>
          </div>
          <div id="seller-orders-content" class="overflow-x-auto no-scrollbar">
            <div class="p-6 space-y-4">
              <div class="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse space-y-4 shadow-sm">
                <div class="h-3 w-32 bg-gray-100 rounded-full"></div>
                <div class="h-4 w-48 bg-gray-100 rounded-full"></div>
                <div class="h-16 bg-gray-100 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  renderHeader({ showBack: false, showSearch: false, showCategories: false });

  let activeFilter = "pending";

  // Filter buttons
  document.querySelectorAll(".seller-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll(".seller-filter-btn").forEach((b) => {
        b.className = `seller-filter-btn px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${b.dataset.filter === activeFilter ? "bg-gray-100 text-gray-900" : "text-gray-400"}`;
      });
      loadOrders(userData.username, activeFilter);
    });
  });

  loadOrders(userData.username, activeFilter);

  // Real-time listener
  if (unsubscribe) unsubscribe();
  const q2 = query(collection(db, "orders"), where("seller_ids", "array-contains", userData.username));
  unsubscribe = onSnapshot(q2, () => {
    loadOrders(userData.username, activeFilter);
  });
}

async function loadOrders(sellerId, filter) {
  const container = document.getElementById("seller-orders-content");
  if (!container) return;

  try {
    const q = query(collection(db, "orders"), where("seller_ids", "array-contains", sellerId));
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <svg class="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          <div>
            <h3 class="text-base font-bold text-gray-900">${t("no_sales_found") || "No sales found"}</h3>
            <p class="text-gray-400 text-xs mt-1 px-8">${t("no_orders_match_filter") || "No orders match this filter"}</p>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <thead>
          <tr class="bg-[#f8f9fa] border-b border-gray-200">
            <th class="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">${t("product") || "Product"}</th>
            <th class="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">${t("order") || "Order"}</th>
            <th class="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">${t("status") || "Status"}</th>
            <th class="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">${t("amount") || "Amount"}</th>
            <th class="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">${t("actions") || "Actions"}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          ${filtered.map((order) => {
            const sellerItems = (order.items || []).filter((i) => i.seller_id === sellerId);
            const mainItem = sellerItems[0] || {};
            const orderTotal = sellerItems.reduce((acc, cur) => acc + (Number(cur.price) * (cur.quantity || 1)), 0);
            const statusConfig = getStatusConfig(order.status || "pending");
            return `
              <tr class="group hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                      <img src="${mainItem.image || mainItem.images?.[0] || 'https://placehold.co/64x64?text=P'}" alt="" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/64x64?text=P'" />
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-sm font-bold text-gray-900 truncate">${mainItem.name || t("product") || "Product"}</span>
                      <span class="text-[11px] text-gray-500 mt-0.5">${t("qty_label") || "Qty"}: ${mainItem.quantity || 1}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-xs font-bold text-gray-700">#${order.id.slice(-5).toUpperCase()}</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${statusConfig.color}">${statusConfig.label}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span class="text-sm font-bold text-gray-900">${orderTotal.toFixed(2)} Pi</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    ${order.status === "pending" ? `<button class="btn-accept px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold active:scale-95" data-order-id="${order.id}">${t("accept_order") || "Accept"}</button>` : ""}
                    ${order.status === "processing" ? `<button class="btn-ship px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold active:scale-95" data-order-id="${order.id}">${t("mark_as_shipped") || "Ship"}</button>` : ""}
                    ${!["pending", "processing"].includes(order.status) ? `<button class="btn-view px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-bold" data-order-id="${order.id}">${t("view_details") || "View"}</button>` : ""}
                  </div>
                </td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>`;

    // Bind action buttons
    container.querySelectorAll(".btn-accept").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await updateDoc(doc(db, "orders", btn.dataset.orderId), { status: "processing", acceptedAt: new Date().toISOString() });
          showToast(t("status_updated_success") || "Status updated!", "success");
        } catch { showToast(t("error_occurred") || "Error", "error"); }
      });
    });
    container.querySelectorAll(".btn-ship").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await updateDoc(doc(db, "orders", btn.dataset.orderId), { status: "shipped", shippedAt: new Date().toISOString() });
          showToast(t("status_updated_success") || "Status updated!", "success");
        } catch { showToast(t("error_occurred") || "Error", "error"); }
      });
    });
    container.querySelectorAll(".btn-view").forEach((btn) => {
      btn.addEventListener("click", () => navigate(`/orders?id=${btn.dataset.orderId}`));
    });
  } catch (e) {
    console.error("Seller orders error:", e);
    container.innerHTML = `<p class="p-6 text-red-500 font-bold">Error loading orders</p>`;
  }
}

function getStatusConfig(status) {
  switch (status) {
    case "pending": return { label: t("pending_status") || "Pending", color: "bg-amber-50 text-amber-600 border-amber-100" };
    case "processing": return { label: t("processing_status") || "Processing", color: "bg-blue-50 text-blue-600 border-blue-100" };
    case "shipped": return { label: t("shipped_status") || "Shipped", color: "bg-purple-50 text-purple-600 border-purple-100" };
    case "delivered": return { label: t("delivered_status") || "Delivered", color: "bg-green-50 text-green-600 border-green-100" };
    case "cancelled": return { label: t("cancelled_status") || "Cancelled", color: "bg-red-50 text-red-600 border-red-100" };
    default: return { label: status, color: "bg-gray-50 text-gray-500 border-gray-100" };
  }
}
