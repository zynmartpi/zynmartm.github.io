import { t, getDir } from "../stores/language-store.js";
import { getOrders } from "../stores/orders-store.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function renderOrdersPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const orders = getOrders();

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-white pb-24" dir="${dir}">
      <main class="container mx-auto px-4 py-4 space-y-4">
        ${orders.length === 0 ? `
          <div class="flex flex-col items-center justify-center py-20 space-y-4">
            <svg class="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            <p class="text-gray-500 font-bold">${t("no_orders") || "No orders yet"}</p>
            <button class="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all" data-link="/">${t("start_shopping") || "Start Shopping"}</button>
          </div>
        ` : `
          <h2 class="text-lg font-black text-gray-900">${t("my_orders") || "My Orders"} (${orders.length})</h2>
          <div class="space-y-3">
            ${orders.map((order) => `
              <div class="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-gray-400">#${order.id?.slice(0, 8) || "ORD"}</span>
                  <span class="text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[order.status] || statusColors.processing}">${t(order.status) || order.status}</span>
                </div>
                <div class="space-y-2">
                  ${(order.items || []).slice(0, 2).map((item) => `
                    <div class="flex items-center gap-3">
                      <img src="${item.image || 'https://placehold.co/60x60?text=N'}" alt="${item.name}" class="w-10 h-10 rounded-lg object-cover" onerror="this.src='https://placehold.co/60x60?text=N'" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-gray-800 line-clamp-1">${item.name}</p>
                        <p class="text-xs text-gray-400">x${item.quantity || 1}</p>
                      </div>
                    </div>
                  `).join("")}
                  ${order.items?.length > 2 ? `<p class="text-xs text-gray-400">+${order.items.length - 2} more items</p>` : ""}
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span class="text-xs text-gray-400">${new Date(order.createdAt).toLocaleDateString()}</span>
                  <span class="text-sm font-black text-primary">${(order.totalPi || 0).toFixed(3)} Pi</span>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </main>
    </div>
  `;

  renderHeader({ showBack: true, title: t("orders") || "Orders" });
}
