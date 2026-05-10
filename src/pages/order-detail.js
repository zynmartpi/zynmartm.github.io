import { t, getDir } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { db, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "../lib/firebase.js";
import { showToast } from "../components/toast.js";
import { navigate } from "../components/router.js";

let order = null;
let loading = true;
let isConfirmingReceipt = false;
let isCancellingOrder = false;
let isOpeningDispute = false;
let showCancelDialog = false;
let showDisputeDialog = false;

export function renderOrderDetailPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("id");

  if (!orderId) {
    app.innerHTML = `<div class="min-h-screen bg-white flex flex-col items-center justify-center p-8 space-y-6 text-center">
      <div class="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center shadow-inner">
        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
      </div>
      <div><h1 class="text-xl font-black text-gray-900">${t("error") || "Error"}</h1><p class="text-gray-400 text-sm font-bold mt-1">Order ID not found.</p></div>
      <button onclick="window.history.back()" class="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm">Back</button>
    </div>`;
    return;
  }

  if (loading) {
    app.innerHTML = `<div class="min-h-screen bg-[#fafafa]" dir="${dir}">
      <div class="p-4 border-b bg-white flex items-center gap-4">
        <svg class="w-6 h-6 text-gray-400 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        <div class="h-4 w-24 bg-gray-100 rounded-full animate-pulse"></div>
      </div>
      <div class="p-4 space-y-6">
        <div class="bg-white rounded-[32px] p-6 border border-gray-100 animate-pulse space-y-6 shadow-sm"><div class="h-4 w-32 bg-gray-100 rounded-full"></div><div class="h-20 w-full bg-gray-100 rounded-[24px]"></div><div class="h-40 w-full bg-gray-100 rounded-[32px]"></div></div>
      </div>
    </div>`;
    fetchOrder(orderId);
    return;
  }

  if (!order) {
    app.innerHTML = `<div class="min-h-screen bg-white flex flex-col items-center justify-center p-8 space-y-6 text-center">
      <div class="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center shadow-inner">
        <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
      </div>
      <div><h1 class="text-xl font-black text-gray-900">${t("error") || "Error"}</h1><p class="text-gray-400 text-sm font-bold mt-1">Order record not found.</p></div>
      <button onclick="navigate('/orders')" class="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm">Back to Orders</button>
    </div>`;
    return;
  }

  const statusConfig = getStatusConfig(order.status);

  // Timeline steps
  const timelineSteps = [
    { s: "pending", l: t("pending_status") || "Pending" },
    { s: "processing", l: t("processing_status") || "Processing" },
    { s: "shipped", l: t("shipped_status") || "Shipped" },
    { s: "delivered", l: t("delivered_status") || "Delivered" },
  ];
  const progressWidth = order.status === "delivered" ? "100%" : order.status === "shipped" ? "70%" : order.status === "processing" ? "40%" : "10%";

  const statusOrder = ["pending", "processing", "shipped", "delivered"];
  const currentIdx = statusOrder.indexOf(order.status);

  app.innerHTML = `
    <div class="min-h-screen bg-[#fafafa] pb-32" dir="${dir}">
      <!-- Premium Header -->
      <header class="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button id="btn-back" class="p-2 hover:bg-gray-50 rounded-2xl transition-all active:scale-90">
              <svg class="w-6 h-6 text-gray-900 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 class="text-lg font-black text-gray-900 tracking-tight">${t("order_details") || "Order Details"}</h1>
              <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                Escrow Protected
              </p>
            </div>
          </div>
        </div>
      </header>

      <main class="container mx-auto px-4 py-6 space-y-6">
        <!-- Status Section -->
        <div class="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-6 overflow-hidden relative">
          <div class="flex justify-between items-start relative z-10">
            <div class="space-y-1 text-start">
              <p class="text-[10px] font-black text-gray-300 uppercase tracking-widest">Order ID</p>
              <h2 class="text-lg font-black text-gray-900 flex items-center gap-2">
                #${order.id.slice(-8).toUpperCase()}
                <button id="btn-copy-id" class="text-gray-300 hover:text-blue-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-width="2"/></svg>
                </button>
              </h2>
              <p class="text-xs font-bold text-gray-400">${order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</p>
            </div>
            <div class="px-4 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 border shadow-sm ${statusConfig.color}">
              ${statusConfig.icon}
              ${statusConfig.label}
            </div>
          </div>

          <!-- 3-Step Timeline -->
          <div class="px-2 pt-4 pb-2 relative">
            <div class="absolute top-[14px] left-0 w-full h-1 bg-gray-50 rounded-full z-0 overflow-hidden">
              <div class="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" style="width:${progressWidth}"></div>
            </div>
            <div class="relative z-10 flex justify-between">
              ${timelineSteps.map((step, idx) => {
                const isActive = idx <= currentIdx && !["cancelled", "disputed"].includes(order.status);
                const icons = [
                  '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><polyline points="12,6 12,12 16,14" stroke-width="2"/></svg>',
                  '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" stroke-width="2"/><rect x="14" y="3" width="7" height="7" stroke-width="2"/><rect x="3" y="14" width="7" height="7" stroke-width="2"/><rect x="14" y="14" width="7" height="7" stroke-width="2"/></svg>',
                  '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
                  '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
                ];
                return `<div class="flex flex-col items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive ? "bg-white border-blue-600 text-blue-600 shadow-lg scale-110" : "bg-gray-100 border-transparent text-gray-300"}">${icons[idx]}</div>
                  <span class="text-[8px] font-black uppercase text-center max-w-[50px] tracking-tight ${isActive ? "text-gray-900" : "text-gray-300"}">${step.l}</span>
                </div>`;
              }).join("")}
            </div>
          </div>
        </div>

        <!-- Support & Coordination -->
        <div class="grid grid-cols-2 gap-4">
          <button class="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col items-center gap-3 group active:scale-95 transition-all">
            <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.038 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.038-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <span class="text-[10px] font-black uppercase text-gray-900 tracking-widest">${t("contact_seller") || "Contact Seller"}</span>
          </button>
          <button class="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex flex-col items-center gap-3 group active:scale-95 transition-all" onclick="navigate('/support')">
            <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke-width="2"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>
            </div>
            <span class="text-[10px] font-black uppercase text-gray-900 tracking-widest">${t("help_center") || "Support"}</span>
          </button>
        </div>

        <!-- Handover Information -->
        <div class="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">${t("handover_info") || "Handover Details"}</h3>
            <div class="h-[2px] w-20 bg-gray-50"></div>
          </div>
          <div class="space-y-5">
            <div class="flex gap-4">
              <div class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
              <div class="text-start space-y-0.5">
                <p class="text-[10px] font-black text-gray-300 uppercase tracking-widest">${t("full_name_label") || "Full Name"}</p>
                <p class="text-sm font-black text-gray-900">${order.address?.name || "-"}</p>
              </div>
            </div>
            <div class="flex gap-4">
              <div class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div class="text-start space-y-0.5 flex-1">
                <p class="text-[10px] font-black text-gray-300 uppercase tracking-widest">${t("location") || "Location"}</p>
                <p class="text-sm font-black text-gray-900">${order.address?.city || "-"}</p>
                ${order.address?.address ? `<p class="text-xs text-gray-500 font-bold">${order.address.address}</p>` : ""}
              </div>
            </div>
            <div class="flex gap-4 items-center justify-between">
              <div class="flex gap-4">
                <div class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </div>
                <div class="text-start space-y-0.5">
                  <p class="text-[10px] font-black text-gray-300 uppercase tracking-widest">${t("phone_number") || "Phone"}</p>
                  <p class="text-sm font-black text-gray-900">${order.address?.phone || "-"}</p>
                </div>
              </div>
              ${order.address?.phone ? `<a href="tel:${order.address.phone}" class="p-3 bg-green-50 text-green-600 rounded-xl active:scale-90 transition-all"><svg class="w-4 h-4 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></a>` : ""}
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">${t("items") || "Items"}</h3>
            <span class="text-[10px] font-black text-gray-400 bg-gray-50 px-3 py-1 rounded-full">${order.items?.length || 0} TOTAL</span>
          </div>
          <div class="space-y-4">
            ${(order.items || []).map((item) => `
              <div class="flex gap-4 items-center">
                <div class="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0">
                  <img src="${item.image || item.images?.[0] || "https://placehold.co/64x64?text=P"}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/64x64?text=P'" />
                </div>
                <div class="flex-1 text-start">
                  <h4 class="text-sm font-black text-gray-900 line-clamp-1">${item.name}</h4>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">${t("qty") || "Qty"}: ${item.quantity || 1}</span>
                  </div>
                </div>
                <div class="text-end">
                  <p class="text-sm font-black text-gray-900">${(Number(item.price) * (item.quantity || 1)).toFixed(3)} Pi</p>
                </div>
              </div>
            `).join("")}
          </div>
          <!-- Total Summary -->
          <div class="pt-6 border-t border-gray-50 space-y-3">
            <div class="flex justify-between text-xs items-center font-bold">
              <span class="text-gray-400 uppercase tracking-widest">${t("subtotal") || "Subtotal"}</span>
              <span class="text-gray-900">${(Number(order.totalPi || 0) * 0.9).toFixed(3)} Pi</span>
            </div>
            <div class="flex justify-between text-xs items-center font-bold">
              <span class="text-gray-400 uppercase tracking-widest">Fees & Protection</span>
              <span class="text-gray-900">${(Number(order.totalPi || 0) * 0.1).toFixed(3)} Pi</span>
            </div>
            <div class="flex justify-between items-center text-lg font-black pt-2 text-gray-900">
              <span class="uppercase tracking-tighter">${t("total_amount") || "Total"}</span>
              <p class="text-blue-600">${Number(order.totalPi || 0).toFixed(3)} Pi</p>
            </div>
          </div>
        </div>

        <!-- Major Actions -->
        <div class="pt-4 space-y-4">
          ${order.status === "shipped" ? `
            <button id="btn-confirm-receipt" class="w-full bg-blue-600 text-white py-5 rounded-[28px] font-black text-sm shadow-2xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50" ${isConfirmingReceipt ? "disabled" : ""}>
              ${isConfirmingReceipt ? '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>' : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> ${t("confirm_receipt") || "Confirm Receipt"}`}
            </button>
          ` : ""}

          ${["pending", "processing"].includes(order.status) ? `
            <button id="btn-cancel" class="w-full bg-white border border-red-100 text-red-600 py-5 rounded-[28px] font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9l-6 6m0-6l6 6"/></svg>
              ${t("cancel_order") || "Cancel Order"}
            </button>
          ` : ""}

          ${["shipped", "processing"].includes(order.status) ? `
            <button id="btn-dispute" class="w-full bg-white border border-amber-200 text-amber-700 py-5 rounded-[28px] font-black text-sm active:scale-95 transition-all flex items-center justify-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              ${t("open_dispute") || "Open Dispute"}
            </button>
          ` : ""}
        </div>
      </main>

      <!-- Cancel Dialog -->
      <div id="cancel-dialog" class="fixed inset-0 z-[100] ${showCancelDialog ? "" : "hidden"}">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="absolute inset-0 flex items-center justify-center p-6">
          <div class="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 shadow-2xl">
            <div class="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            </div>
            <h2 class="font-black text-2xl text-center text-gray-900">${t("cancel_order_title") || "Cancel Order?"}</h2>
            <p class="text-gray-400 text-center font-bold text-sm leading-relaxed">${t("cancel_order_desc") || "Your Pi will be returned to your available balance. This cannot be reversed."}</p>
            <button id="btn-confirm-cancel" class="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50" ${isCancellingOrder ? "disabled" : ""}>
              ${isCancellingOrder ? '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>' : (t("yes_cancel") || "Yes, Cancel")}
            </button>
            <button id="btn-keep-cancel" class="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-black text-sm">${t("no_keep_it") || "No, Keep It"}</button>
          </div>
        </div>
      </div>

      <!-- Dispute Dialog -->
      <div id="dispute-dialog" class="fixed inset-0 z-[100] ${showDisputeDialog ? "" : "hidden"}">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="absolute inset-0 flex items-center justify-center p-6">
          <div class="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 shadow-2xl">
            <div class="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto">
              <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            </div>
            <h2 class="font-black text-2xl text-center text-gray-900">${t("open_dispute_title") || "Open a Dispute?"}</h2>
            <p class="text-gray-400 text-center font-bold text-sm leading-relaxed">${t("open_dispute_desc") || "Opening a dispute will hold the payment and our team will review the case."}</p>
            <button id="btn-confirm-dispute" class="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-600/20 active:scale-95 transition-all disabled:opacity-50" ${isOpeningDispute ? "disabled" : ""}>
              ${isOpeningDispute ? '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>' : (t("yes_open_dispute") || "Yes, Open Dispute")}
            </button>
            <button id="btn-keep-dispute" class="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-black text-sm">${t("no_keep_it") || "No, Keep It"}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind events
  document.getElementById("btn-back")?.addEventListener("click", () => window.history.back());
  document.getElementById("btn-copy-id")?.addEventListener("click", () => {
    navigator.clipboard.writeText(order.id);
    showToast("ID Copied!", "success");
  });

  document.getElementById("btn-confirm-receipt")?.addEventListener("click", handleConfirmReceipt);
  document.getElementById("btn-cancel")?.addEventListener("click", () => { showCancelDialog = true; renderOrderDetailPage(); });
  document.getElementById("btn-confirm-cancel")?.addEventListener("click", handleCancelOrder);
  document.getElementById("btn-keep-cancel")?.addEventListener("click", () => { showCancelDialog = false; renderOrderDetailPage(); });
  document.getElementById("btn-dispute")?.addEventListener("click", () => { showDisputeDialog = true; renderOrderDetailPage(); });
  document.getElementById("btn-confirm-dispute")?.addEventListener("click", handleOpenDispute);
  document.getElementById("btn-keep-dispute")?.addEventListener("click", () => { showDisputeDialog = false; renderOrderDetailPage(); });
}

function getStatusConfig(status) {
  switch (status) {
    case "pending": return { label: t("pending_status") || "Pending", color: "bg-amber-50 text-amber-600 border-amber-100", icon: "⏳" };
    case "processing": return { label: t("processing_status") || "Processing", color: "bg-blue-50 text-blue-600 border-blue-100", icon: "📦" };
    case "shipped": return { label: t("shipped_status") || "Shipped", color: "bg-purple-50 text-purple-600 border-purple-100", icon: "🚚" };
    case "delivered": return { label: t("delivered_status") || "Delivered", color: "bg-green-50 text-green-600 border-green-100", icon: "✅" };
    case "cancelled": return { label: t("cancelled_status") || "Cancelled", color: "bg-red-50 text-red-600 border-red-100", icon: "❌" };
    case "disputed": return { label: t("disputed_status") || "Disputed", color: "bg-amber-50 text-amber-600 border-amber-100", icon: "⚠️" };
    default: return { label: status, color: "bg-gray-50 text-gray-500 border-gray-100", icon: "📦" };
  }
}

async function fetchOrder(orderId) {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      order = { id: orderId, ...orderSnap.data() };
    }
  } catch (error) {
    console.error("Error fetching order details:", error);
  } finally {
    loading = false;
    renderOrderDetailPage();
  }
}

async function handleConfirmReceipt() {
  if (!order) return;
  isConfirmingReceipt = true;
  renderOrderDetailPage();
  try {
    const orderRef = doc(db, "orders", order.id);
    await updateDoc(orderRef, { status: "delivered", paymentStatus: "completed", deliveredAt: new Date().toISOString() });

    // Transfer funds to seller(s)
    for (const item of order.items || []) {
      if (!item.seller_id) continue;
      const q = query(collection(db, "users"), where("username", "==", item.seller_id));
      const sellerDocs = await getDocs(q);
      if (sellerDocs.docs.length > 0) {
        const sellerDoc = sellerDocs.docs[0];
        const currentBal = Number(sellerDoc.data()?.available_balance || 0);
        const addedAmt = Number(item.price) * (item.quantity || 1);
        await updateDoc(doc(db, "users", sellerDoc.id), { available_balance: currentBal + addedAmt });
        await addDoc(collection(db, "transactions"), { userId: item.seller_id, title: `Payment Received: Order #${order.id.slice(-5)}`, amount: addedAmt.toString(), type: "received", status: "completed", createdAt: new Date().toISOString() });
      }
    }

    showToast(t("receipt_confirmed_success") || "Receipt confirmed!", "success");
    order = { ...order, status: "delivered", paymentStatus: "completed" };
  } catch (error) {
    console.error("Confirm Receipt Error:", error);
    showToast(t("error_occurred") || "Error", "error");
  } finally {
    isConfirmingReceipt = false;
    renderOrderDetailPage();
  }
}

async function handleCancelOrder() {
  if (!order) return;
  const userData = getAuthState().userData;
  isCancellingOrder = true;
  renderOrderDetailPage();
  try {
    const orderRef = doc(db, "orders", order.id);
    await updateDoc(orderRef, { status: "cancelled", paymentStatus: "refunded", cancelledAt: new Date().toISOString() });

    // Refund to user wallet
    if (userData?.username) {
      const q = query(collection(db, "users"), where("username", "==", userData.username));
      const userDocs = await getDocs(q);
      if (userDocs.docs.length > 0) {
        const userDoc = userDocs.docs[0];
        const currentBal = Number(userDoc.data()?.available_balance || 0);
        const refundAmt = Number(order.totalPi || 0);
        await updateDoc(doc(db, "users", userDoc.id), { available_balance: currentBal + refundAmt });
        await addDoc(collection(db, "transactions"), { userId: userData.username, title: `Order Refund: #${order.id.slice(-5)}`, amount: refundAmt.toString(), type: "received", status: "completed", createdAt: new Date().toISOString() });
      }
    }

    showToast(t("order_cancelled_success") || "Order cancelled!", "success");
    order = { ...order, status: "cancelled", paymentStatus: "refunded" };
  } catch (error) {
    console.error("Cancel Order Error:", error);
    showToast(t("cancel_failed") || "Cancel failed", "error");
  } finally {
    isCancellingOrder = false;
    showCancelDialog = false;
    renderOrderDetailPage();
  }
}

async function handleOpenDispute() {
  if (!order) return;
  const userData = getAuthState().userData;
  isOpeningDispute = true;
  renderOrderDetailPage();
  try {
    const orderRef = doc(db, "orders", order.id);
    await updateDoc(orderRef, { status: "disputed", disputedAt: new Date().toISOString(), disputeReason: "buyer_initiated" });

    await addDoc(collection(db, "disputes"), { orderId: order.id, buyerId: userData?.username, sellerIds: order.seller_ids || [], reason: "buyer_initiated", status: "open", createdAt: new Date().toISOString(), totalPi: order.totalPi || 0 });

    showToast(t("dispute_opened_success") || "Dispute opened successfully.", "success");
    order = { ...order, status: "disputed" };
  } catch (error) {
    console.error("Dispute Error:", error);
    showToast(t("error_occurred") || "Error", "error");
  } finally {
    isOpeningDispute = false;
    showDisputeDialog = false;
    renderOrderDetailPage();
  }
}
