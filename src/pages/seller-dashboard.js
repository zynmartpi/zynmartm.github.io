import { t, getDir } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { db, collection, query, where, getDocs } from "../lib/firebase.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";
import { getProducts } from "../stores/products-store.js";

export function renderSellerDashboardPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const userData = getAuthState().userData;

  if (!userData) { navigate("/"); return; }

  const sellerProducts = getProducts().filter(
    (p) => p.seller_id === userData.username || p.seller_id === userData.id
  );

  app.innerHTML = `
    <div class="min-h-screen bg-gray-50 pb-24" dir="${dir}">
      <div class="sticky top-0 z-50 bg-white border-b border-gray-100 p-4 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-4">
          <button class="p-1 hover:bg-gray-50 rounded-full transition-colors" id="btn-home">
            <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          </button>
          <div>
            <h1 class="text-lg font-black text-gray-900">${t("seller_dashboard") || "Seller Dashboard"}</h1>
            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">${userData.username || "ZynMart Store"}</p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-sm font-black text-gray-900 tracking-tight">ZYNMART</span>
          <div class="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" stroke-width="2"/><rect x="14" y="3" width="7" height="7" stroke-width="2"/><rect x="3" y="14" width="7" height="7" stroke-width="2"/><rect x="14" y="14" width="7" height="7" stroke-width="2"/></svg>
          </div>
        </div>
      </div>

      <main class="container mx-auto px-4 py-6 space-y-6">
        <!-- Quick Actions -->
        <div class="grid grid-cols-2 gap-3">
          <button id="btn-add-product" class="flex items-center gap-3 bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <div class="text-start">
              <p class="text-sm font-black">${t("add_product") || "Add Product"}</p>
              <p class="text-[10px] text-white/70">${t("add_your_first_product") || "New product"}</p>
            </div>
          </button>
          <button id="btn-manage-orders" class="flex items-center gap-3 bg-gray-900 text-white p-4 rounded-2xl shadow-lg shadow-gray-900/20 active:scale-95 transition-all">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            <div class="text-start">
              <p class="text-sm font-black">${t("manage_orders") || "Orders"}</p>
              <p class="text-[10px] text-white/70">${t("recent_orders") || "View orders"}</p>
            </div>
          </button>
        </div>

        <!-- Time Filter -->
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2" id="time-filter">
          ${["today", "week", "month", "year", "all_time"].map((f) => `
            <button class="time-filter-btn px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${f === "all_time" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-white text-gray-500 border border-gray-100"}" data-filter="${f}">
              ${t(f) || f.replace("_", " ")}
            </button>
          `).join("")}
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-4" id="stats-grid">
          <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 text-green-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
              </div>
              <span class="text-[10px] font-black bg-gray-50 text-gray-500 px-2 py-1 rounded-lg" id="revenue-change">+0%</span>
            </div>
            <div class="space-y-0.5 text-start">
              <p class="text-2xl font-black text-gray-900 leading-none" id="stat-revenue">0.000 Pi</p>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${t("total_sales") || "Total Sales"}</p>
            </div>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
              </div>
              <span class="text-[10px] font-black bg-gray-50 text-gray-500 px-2 py-1 rounded-lg" id="orders-change">+0%</span>
            </div>
            <div class="space-y-0.5 text-start">
              <p class="text-2xl font-black text-gray-900 leading-none" id="stat-orders">0</p>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${t("orders_unit") || "Orders"}</p>
            </div>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
              <span class="text-[10px] font-black bg-gray-50 text-gray-500 px-2 py-1 rounded-lg">${sellerProducts.length}</span>
            </div>
            <div class="space-y-0.5 text-start">
              <p class="text-2xl font-black text-gray-900 leading-none">${sellerProducts.length}</p>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${t("products_count") || "Products"}</p>
            </div>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </div>
              <span class="text-[10px] font-black bg-gray-50 text-gray-500 px-2 py-1 rounded-lg">+0%</span>
            </div>
            <div class="space-y-0.5 text-start">
              <p class="text-2xl font-black text-gray-900 leading-none">0</p>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${t("customers_analytics") || "Customers"}</p>
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-sm font-black text-gray-900">${t("top_selling_products") || "Your Products"}</h3>
            <span class="text-xs font-bold text-gray-400">${sellerProducts.length} ${t("items") || "items"}</span>
          </div>
          ${sellerProducts.length === 0 ? `
            <div class="p-8 text-center space-y-3">
              <div class="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
              <p class="text-sm font-bold text-gray-500">${t("no_products_yet") || "No products yet"}</p>
              <p class="text-xs text-gray-400">${t("start_adding_products") || "Start adding products"}</p>
              <button id="btn-add-first" class="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm">${t("add_your_first_product") || "Add First Product"}</button>
            </div>
          ` : `
            <div class="divide-y divide-gray-50">
              ${sellerProducts.slice(0, 5).map(p => `
                <div class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <img src="${p.image}" class="w-12 h-12 rounded-xl object-cover bg-gray-50" onerror="this.src='https://placehold.co/200x200?text=N/A'"/>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gray-900 truncate">${p.name}</p>
                    <p class="text-xs text-gray-400">${p.piPrice.toFixed(3)} Pi · ${p.stock || 0} ${t("stock") || "stock"}</p>
                  </div>
                  <button class="edit-product-btn p-2 text-primary bg-primary/5 rounded-xl hover:bg-primary hover:text-white transition-all" data-id="${p.id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </main>
    </div>
  `;

  document.getElementById("btn-home")?.addEventListener("click", () => navigate("/"));
  document.getElementById("btn-add-product")?.addEventListener("click", () => navigate("/seller/add-product"));
  document.getElementById("btn-manage-orders")?.addEventListener("click", () => navigate("/seller/orders"));
  document.getElementById("btn-add-first")?.addEventListener("click", () => navigate("/seller/add-product"));

  document.querySelectorAll(".edit-product-btn").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`/seller/edit-product?id=${btn.dataset.id}`));
  });

  document.querySelectorAll(".time-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".time-filter-btn").forEach((b) => {
        b.className = `time-filter-btn px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${b.dataset.filter === btn.dataset.filter ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-white text-gray-500 border border-gray-100"}`;
      });
      fetchSellerStats(userData.username, btn.dataset.filter);
    });
  });

  fetchSellerStats(userData.username, "all_time");
}

async function fetchSellerStats(sellerId, filter) {
  try {
    const q = query(collection(db, "orders"), where("seller_ids", "array-contains", sellerId));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekCopy = new Date(now);
    const startOfWeek = new Date(weekCopy.setDate(weekCopy.getDate() - weekCopy.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const filtered = orders.filter((order) => {
      if (filter === "all_time") return true;
      if (!order.createdAt) return false;
      const d = new Date(order.createdAt);
      if (filter === "today") return d >= startOfToday;
      if (filter === "week") return d >= startOfWeek;
      if (filter === "month") return d >= startOfMonth;
      if (filter === "year") return d >= startOfYear;
      return true;
    });

    const totalRevenue = filtered.reduce((acc, order) => {
      const sellerItemsPrice = (order.items || [])
        .filter((item) => item.seller_id === sellerId)
        .reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0);
      return acc + sellerItemsPrice;
    }, 0);

    const revEl = document.getElementById("stat-revenue");
    const ordEl = document.getElementById("stat-orders");
    if (revEl) revEl.textContent = `${totalRevenue.toFixed(3)} Pi`;
    if (ordEl) ordEl.textContent = filtered.length.toString();
  } catch (e) {
    console.error("Failed to fetch seller stats:", e);
  }
}
