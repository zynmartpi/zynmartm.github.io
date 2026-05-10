import { t, getDir } from "../stores/language-store.js";
import { getCart, getPiTotal, clearCart } from "../stores/cart-store.js";
import { getAuthState, ensurePaymentsAuth } from "../stores/pi-auth-store.js";
import { showInterstitialAd } from "../stores/ads-store.js";
import { db, doc, getDoc, updateDoc, collection, addDoc } from "../lib/firebase.js";
import { pay } from "../lib/pi-payment.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";
import { showToast } from "../components/toast.js";

const DELIVERY_TIMES = ["08:00 – 10:00","10:00 – 12:00","12:00 – 14:00","14:00 – 16:00","16:00 – 18:00","18:00 – 20:00"];

let addresses = [];
let selectedAddressId = null;
let loadingAddresses = true;
let isProcessing = false;
let openSection = null;
let selectedTime = null;
let note = "";
let paymentMethod = null;
let showAddModal = false;
let savingAddress = false;
let addressForm = { firstName: "", lastName: "", address: "", address2: "", city: "", country: "", state: "", zipCode: "", businessName: "", isDefault: false };

export function renderCheckoutPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const cart = getCart();
  const piTotal = getPiTotal();

  // Buy Now support
  const params = new URLSearchParams(window.location.search);
  const pId = params.get("id");
  const pName = params.get("name");
  const pPrice = params.get("price");
  const pImage = params.get("image");
  const pCategory = params.get("category");
  const buyNowProduct = pId && pName && pPrice && pImage ? { id: isNaN(parseInt(pId)) ? pId : parseInt(pId), name: pName, price: parseFloat(pPrice), image: pImage, category: pCategory || "General", quantity: 1 } : null;
  const checkoutItems = buyNowProduct ? [buyNowProduct] : cart;

  if (checkoutItems.length === 0 && !buyNowProduct) { navigate("/cart"); return; }

  const calculatedPiTotal = buyNowProduct ? Number(buyNowProduct.price) || 0 : Number(piTotal) || 0;
  const subtotal = calculatedPiTotal;
  const tax = Number((subtotal * 0.05).toFixed(3)) || 0;
  const total = Number((subtotal + tax).toFixed(3)) || 0;
  const memo = buyNowProduct ? `Direct Purchase: ${buyNowProduct.name}` : `Cart Purchase: ${cart.length} items`;

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  // Accordion section helper
  function renderSection(id, icon, label, value, content) {
    const isOpen = openSection === id;
    return `
      <div class="border-b border-[#dfe2e1] last:border-b-0">
        <button class="section-toggle w-full flex items-center justify-between py-4 px-4 active:bg-gray-50/50 transition-colors" data-section="${id}">
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 text-[#5c6bc0] flex-shrink-0">${icon}</div>
            <div class="text-start">
              <p class="text-[15px] font-semibold text-[#212529]">${label}</p>
              ${value && !isOpen ? `<p class="text-[13px] text-[#0aad0a] font-medium mt-0.5">${value}</p>` : ""}
            </div>
          </div>
          <svg class="w-4 h-4 text-[#889397] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        ${isOpen ? `<div class="px-4 pb-4">${content}</div>` : ""}
      </div>
    `;
  }

  // Address section content
  let addressContent = "";
  if (loadingAddresses) {
    addressContent = '<div class="h-16 bg-gray-50 rounded-lg animate-pulse"></div>';
  } else if (addresses.length === 0) {
    addressContent = `<button class="w-full flex items-center gap-3 border border-dashed border-[#0aad0a] rounded-lg py-4 px-4 text-[#0aad0a] font-semibold text-sm" id="btn-add-address-empty">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      ${t("add_new_address") || "Add New Address"}
    </button>`;
  } else {
    addressContent = `<div class="space-y-2">
      ${addresses.map(addr => `
        <button class="addr-btn w-full text-start p-3 rounded-lg border transition-all ${selectedAddressId === addr.id ? "border-[#0aad0a] bg-green-50/50" : "border-[#dfe2e1]"}" data-addr-id="${addr.id}">
          <div class="flex items-center justify-between">
            <p class="text-[14px] font-bold text-[#212529]">${addr.fullName}</p>
            ${selectedAddressId === addr.id ? '<svg class="w-4 h-4 text-[#0aad0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' : ""}
          </div>
          <p class="text-[13px] text-[#889397] mt-0.5">${addr.address}, ${addr.city}, ${addr.state || ""}</p>
        </button>
      `).join("")}
      <button class="w-full flex items-center gap-2 text-[#0aad0a] font-semibold text-sm pt-2" id="btn-add-address-list">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        ${t("add_new_address") || "Add a new address"}
      </button>
    </div>`;
  }

  // Time section content
  const timeContent = `<div class="grid grid-cols-2 gap-2">
    ${DELIVERY_TIMES.map(slot => `
      <button class="time-btn py-3 px-3 rounded-lg border text-sm font-semibold transition-all ${selectedTime === slot ? "border-[#0aad0a] bg-green-50 text-[#0aad0a]" : "border-[#dfe2e1] text-[#212529]"}" data-time="${slot}">${slot}</button>
    `).join("")}
  </div>`;

  // Note section content
  const noteContent = `
    <textarea id="inp-note" rows="3" class="w-full border border-[#dfe2e1] rounded-lg px-3 py-2.5 text-sm text-[#212529] outline-none focus:border-[#0aad0a] resize-none transition-all" placeholder="${t("order_note_placeholder") || "Add delivery instructions..."}">${note}</textarea>
    <button id="btn-save-note" class="mt-2 text-sm font-bold text-[#0aad0a]">${t("save") || "Save"}</button>`;

  // Payment section content
  const paymentContent = `<div class="space-y-2">
    <button class="pay-btn w-full flex items-center justify-between p-3.5 rounded-lg border transition-all ${paymentMethod === "sdk" ? "border-[#0aad0a] bg-green-50/50" : "border-[#dfe2e1]"}" data-pay="sdk">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div class="text-start">
          <p class="font-bold text-[#212529] text-sm">${t("pi_sdk_payment") || "Pi SDK Payment"}</p>
          <p class="text-[#889397] text-xs">${t("pi_sdk_desc") || "Pay directly via Pi SDK"}</p>
        </div>
      </div>
      ${paymentMethod === "sdk" ? '<svg class="w-4 h-4 text-[#0aad0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' : ""}
    </button>
    <button class="pay-btn w-full flex items-center justify-between p-3.5 rounded-lg border transition-all ${paymentMethod === "wallet" ? "border-[#0aad0a] bg-green-50/50" : "border-[#dfe2e1]"}" data-pay="wallet">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <div class="text-start">
          <p class="font-bold text-[#212529] text-sm">${t("app_wallet_payment") || "App Wallet Payment"}</p>
          <p class="text-[#889397] text-xs">${t("wallet_desc") || "Pay from your ZYNMART balance"}</p>
        </div>
      </div>
      ${paymentMethod === "wallet" ? '<svg class="w-4 h-4 text-[#0aad0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' : ""}
    </button>
  </div>`;

  const addrValue = selectedAddress ? `${selectedAddress.fullName} – ${selectedAddress.city}, ${selectedAddress.state || ""}` : "";
  const timeValue = selectedTime || "";
  const payValue = paymentMethod === "sdk" ? (t("pi_sdk_payment") || "Pi SDK") : paymentMethod === "wallet" ? (t("app_wallet_payment") || "App Wallet") : "";

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-white pb-40" dir="${dir}">
      <main class="px-4 py-4 space-y-4">
        <!-- ACCORDION CARD -->
        <div class="bg-white border border-[#dfe2e1] rounded-lg overflow-hidden">
          ${renderSection("address", '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>', t("shipping_address_label") || "Shipping Address", addrValue, addressContent)}
          ${renderSection("time", '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><polyline points="12,6 12,12 16,14" stroke-width="2"/></svg>', t("delivery_time") || "Delivery Time", timeValue, timeContent)}
          ${renderSection("note", '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>', t("delivery_instructions") || "Delivery Instructions", note, noteContent)}
          ${renderSection("payment", '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>', t("payment_method") || "Payment Method", payValue, paymentContent)}
        </div>

        <!-- ORDER DETAILS -->
        <div class="bg-white border border-[#dfe2e1] rounded-lg overflow-hidden">
          <div class="px-4 py-4 border-b border-[#dfe2e1]">
            <h2 class="font-bold text-[#212529]" style="font-size:16px">${t("order_details") || "Order Details"}</h2>
          </div>
          <div class="p-4 space-y-3">
            ${checkoutItems.map(item => {
              const itemPrice = (Number(item.piPrice) || Number(item.price) || 0) * (Number(item.quantity) || 1);
              return `
              <div class="flex items-center gap-3 p-3 border border-[#dfe2e1] rounded-lg bg-white">
                <div class="relative flex-shrink-0 border border-[#dfe2e1] rounded overflow-hidden bg-gray-50" style="width:50px;height:50px">
                  <img src="${item.image || 'https://placehold.co/200x200?text=P'}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/200x200?text=P'" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-[#212529] leading-snug line-clamp-2" style="font-size:13px">${item.name}</p>
                  <p class="text-[#889397] mt-0.5" style="font-size:11px">${t(item.category?.toLowerCase()) || item.category || t("standard") || "Standard"}</p>
                </div>
                <div class="text-end flex-shrink-0">
                  <p class="font-bold text-[#212529] whitespace-nowrap" style="font-size:13px">${itemPrice.toFixed(3)} Pi</p>
                  <p class="text-[#889397] font-semibold" style="font-size:11px">${t("qty_label") || "Qty"}: ${item.quantity || 1}</p>
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>
      </main>

      <!-- STICKY FOOTER -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-[#dfe2e1] z-50">
        <div class="px-4 py-3 pb-8">
          <button id="btn-pay-now" class="w-full text-white py-4 rounded font-bold flex items-center justify-between px-5 active:scale-95 transition-all disabled:opacity-50" style="background-color:#0aad0a;font-size:16px" ${isProcessing || checkoutItems.length === 0 || !selectedAddress ? "disabled" : ""}>
            ${isProcessing ? '<div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>' : `<span>${t("pay_now") || "Pay Now"}</span><span>${total.toFixed(3)} Pi</span>`}
          </button>
        </div>
      </div>

      <!-- ADD ADDRESS MODAL -->
      <div id="add-address-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 ${showAddModal ? "" : "hidden"}">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" id="modal-overlay"></div>
        <div class="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
            <div>
              <h3 class="text-xl font-bold text-[#212529]">${t("new_shipping_address") || "New Shipping Address"}</h3>
              <p class="text-sm text-[#889397]">${t("add_new_shipping_address_desc") || "Add a new address for delivery"}</p>
            </div>
            <button id="btn-close-modal" class="p-2 hover:bg-gray-100 rounded-lg transition-colors" ${savingAddress ? "disabled" : ""}>
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="add-address-form" class="flex-1 overflow-y-auto p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <input type="text" required placeholder="${t("first_name") || "First name"}" id="inp-fname" value="${addressForm.firstName}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
              <input type="text" required placeholder="${t("last_name") || "Last name"}" id="inp-lname" value="${addressForm.lastName}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
            </div>
            <input type="text" required placeholder="${t("address_line_1") || "Address Line 1"}" id="inp-addr1" value="${addressForm.address}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
            <input type="text" placeholder="${t("address_line_2") || "Address Line 2"}" id="inp-addr2" value="${addressForm.address2}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
            <input type="text" required placeholder="${t("city") || "City"}" id="inp-city" value="${addressForm.city}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
            <div class="grid grid-cols-2 gap-4">
              <input type="text" required placeholder="${t("country") || "Country"}" id="inp-country" value="${addressForm.country}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
              <input type="text" required placeholder="${t("state") || "State"}" id="inp-state" value="${addressForm.state}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
            </div>
            <input type="text" required placeholder="${t("zip_code") || "Zip Code"}" id="inp-zip" value="${addressForm.zipCode}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
            <input type="text" placeholder="${t("business_name") || "Business Name"}" id="inp-biz" value="${addressForm.businessName}" class="w-full border border-[#dfe2e1] rounded-lg px-4 py-3 text-sm focus:border-[#0aad0a] outline-none transition-all" />
            <label class="flex items-center gap-3 cursor-pointer group">
              <div class="relative">
                <input type="checkbox" id="chk-default" ${addressForm.isDefault ? "checked" : ""} class="sr-only" />
                <div class="w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${addressForm.isDefault ? "bg-[#0aad0a] border-[#0aad0a]" : "border-[#dfe2e1]"}">
                  ${addressForm.isDefault ? '<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg>' : ""}
                </div>
              </div>
              <span class="text-sm font-semibold text-[#545455]">${t("set_as_default_address") || "Set as Default"}</span>
            </label>
          </form>
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 sticky bottom-0">
            <button id="btn-cancel-addr" class="flex-1 py-3 px-4 border border-[#0aad0a] text-[#0aad0a] font-bold rounded-lg hover:bg-green-50 active:scale-95 transition-all disabled:opacity-50" ${savingAddress ? "disabled" : ""}>${t("cancel") || "Cancel"}</button>
            <button id="btn-save-addr" class="flex-[2] py-3 px-4 bg-[#0aad0a] text-white font-bold rounded-lg hover:bg-[#099609] active:scale-95 transition-all shadow-lg shadow-[#0aad0a]/20 disabled:opacity-50" ${savingAddress ? "disabled" : ""}>
              ${savingAddress ? '<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>' : (t("save_address") || "Save Address")}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderHeader({ showBack: false, showCategories: false });

  // Bind events
  document.querySelectorAll(".section-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const sec = btn.dataset.section;
      openSection = openSection === sec ? null : sec;
      renderCheckoutPage();
    });
  });

  document.querySelectorAll(".addr-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedAddressId = btn.dataset.addrId;
      openSection = null;
      renderCheckoutPage();
    });
  });

  document.querySelectorAll(".time-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedTime = btn.dataset.time;
      openSection = null;
      renderCheckoutPage();
    });
  });

  document.querySelectorAll(".pay-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      paymentMethod = btn.dataset.pay;
      openSection = null;
      renderCheckoutPage();
    });
  });

  document.getElementById("inp-note")?.addEventListener("input", (e) => { note = e.target.value; });
  document.getElementById("btn-save-note")?.addEventListener("click", () => { openSection = null; renderCheckoutPage(); });

  document.getElementById("btn-add-address-empty")?.addEventListener("click", () => { showAddModal = true; renderCheckoutPage(); });
  document.getElementById("btn-add-address-list")?.addEventListener("click", () => { showAddModal = true; renderCheckoutPage(); });
  document.getElementById("btn-close-modal")?.addEventListener("click", () => { showAddModal = false; renderCheckoutPage(); });
  document.getElementById("modal-overlay")?.addEventListener("click", () => { showAddModal = false; renderCheckoutPage(); });
  document.getElementById("btn-cancel-addr")?.addEventListener("click", () => { showAddModal = false; renderCheckoutPage(); });

  document.getElementById("chk-default")?.addEventListener("change", (e) => { addressForm.isDefault = e.target.checked; renderCheckoutPage(); });

  // Address form inputs
  ["inp-fname","inp-lname","inp-addr1","inp-addr2","inp-city","inp-country","inp-state","inp-zip","inp-biz"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", (e) => {
      const map = { "inp-fname":"firstName","inp-lname":"lastName","inp-addr1":"address","inp-addr2":"address2","inp-city":"city","inp-country":"country","inp-state":"state","inp-zip":"zipCode","inp-biz":"businessName" };
      addressForm[map[id]] = e.target.value;
    });
  });

  document.getElementById("btn-save-addr")?.addEventListener("click", handleSaveAddress);
  document.getElementById("btn-pay-now")?.addEventListener("click", () => handlePayNow(checkoutItems, total, memo, buyNowProduct));

  // Fetch addresses
  if (loadingAddresses) fetchAddresses();
}

async function fetchAddresses() {
  const userData = getAuthState().userData;
  if (!userData?.id) { loadingAddresses = false; return; }
  try {
    const userRef = doc(db, "users", userData.id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      addresses = data.addresses || [];
      if (addresses.length > 0) {
        const def = addresses.find(a => a.isDefault);
        selectedAddressId = def ? def.id : addresses[0].id;
      }
    }
  } catch (e) { console.error("Error fetching addresses:", e); }
  finally { loadingAddresses = false; renderCheckoutPage(); }
}

async function handleSaveAddress() {
  const userData = getAuthState().userData;
  if (!userData?.id || savingAddress) return;
  if (!addressForm.firstName || !addressForm.lastName || !addressForm.address || !addressForm.city) {
    showToast(t("fill_required_fields") || "Fill required fields", "error"); return;
  }
  savingAddress = true; renderCheckoutPage();
  try {
    const newId = "addr_" + Date.now();
    const newAddr = {
      id: newId,
      fullName: `${addressForm.firstName} ${addressForm.lastName}`.trim(),
      firstName: addressForm.firstName, lastName: addressForm.lastName,
      phoneNumber: userData.phoneNumber || "",
      country: addressForm.country || "", city: addressForm.city,
      state: addressForm.state || "", address: addressForm.address,
      address2: addressForm.address2 || "", zipCode: addressForm.zipCode || "",
      businessName: addressForm.businessName || "",
      isDefault: addressForm.isDefault || addresses.length === 0,
      label: "Shipping"
    };
    let updated = [...addresses];
    if (newAddr.isDefault) updated = updated.map(a => ({ ...a, isDefault: false }));
    updated.push(newAddr);
    await updateDoc(doc(db, "users", userData.id), { addresses: updated, updated_at: new Date().toISOString() });
    addresses = updated;
    selectedAddressId = newId;
    showAddModal = false;
    addressForm = { firstName: "", lastName: "", address: "", address2: "", city: "", country: "", state: "", zipCode: "", businessName: "", isDefault: false };
    showToast(t("saved_successfully") || "Saved!", "success");
  } catch (e) { console.error(e); showToast(e.message || "Error", "error"); }
  finally { savingAddress = false; renderCheckoutPage(); }
}

async function handlePayNow(checkoutItems, total, memo, buyNowProduct) {
  const userData = getAuthState().userData;
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  if (!selectedAddress) { showToast(t("fill_required_fields") || "Select address", "error"); return; }
  if (!paymentMethod) { showToast(t("select_payment_method") || "Select payment method", "error"); openSection = "payment"; renderCheckoutPage(); return; }
  if (!userData) { showToast(t("login_required") || "Login required", "error"); return; }
  isProcessing = true; renderCheckoutPage();

  // Pre-flight: prevent buying own product
  for (const item of checkoutItems) {
    try {
      const pRef = doc(db, "products", String(item.id));
      const pSnap = await getDoc(pRef);
      if (pSnap.exists()) {
        const sid = String(pSnap.data().seller_id || "").trim();
        if (sid && (sid === String(userData.username).trim() || sid === String(userData.id).trim())) {
          showToast(t("cannot_buy_own_product") || "Cannot buy your own product", "error");
          isProcessing = false; renderCheckoutPage(); return;
        }
      }
    } catch (e) { console.error("Pre-flight check failed:", e); }
  }

  if (paymentMethod === "sdk") {
    try {
      await ensurePaymentsAuth();
      await pay({
        amount: total,
        memo: `Purchase from ZYNMART: ${checkoutItems.length} items`,
        metadata: { type: "product_purchase", userId: userData.username, totalPi: total, itemsCount: checkoutItems.length },
        onComplete: async () => { await finalizeOrder("sdk", checkoutItems, total, memo, buyNowProduct, selectedAddress); },
        onCancel: () => { isProcessing = false; showToast(t("ad_cancelled") || "Cancelled", "info"); renderCheckoutPage(); },
        onError: (error) => { isProcessing = false; showToast(error?.message || t("payment_failed") || "Payment failed", "error"); renderCheckoutPage(); },
      });
    } catch (e) { isProcessing = false; renderCheckoutPage(); }
    return;
  }

  try { await finalizeOrder("wallet", checkoutItems, total, memo, buyNowProduct, selectedAddress); }
  catch (e) { showToast(e?.message || "Payment failed", "error"); isProcessing = false; renderCheckoutPage(); }
}

async function finalizeOrder(method, checkoutItems, total, memo, buyNowProduct, selectedAddress) {
  const userData = getAuthState().userData;
  if (!userData || !selectedAddress) return;
  try {
    const userRef = doc(db, "users", userData.id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User not found");
    const dbData = userSnap.data();
    const balance = Number(dbData?.available_balance || 0);
    if (method === "wallet" && balance < total) {
      showToast(`❌ ${t("insufficient_balance") || "Insufficient balance"}`, "error");
      isProcessing = false; renderCheckoutPage(); return;
    }
    if (method === "wallet") {
      const nb = balance - total;
      await updateDoc(userRef, { available_balance: nb, updated_at: new Date().toISOString() });
    }

    const itemsWithSeller = [];
    for (const item of checkoutItems) {
      const pRef = doc(db, "products", String(item.id));
      const pSnap = await getDoc(pRef);
      let seller_id = "system";
      if (pSnap.exists()) {
        const pData = pSnap.data();
        await updateDoc(pRef, { stock_quantity: Math.max(0, Number(pData.stock_quantity || 0) - (item.quantity || 1)), sold: Number(pData.sold || 0) + (item.quantity || 1) });
        seller_id = String(pData.seller_id || "system").trim();
      }
      itemsWithSeller.push({ ...item, price: Number(item.price || item.piPrice || 0), seller_id });
    }

    const sellerIds = [...new Set(itemsWithSeller.map(i => i.seller_id).filter(s => s !== "system"))];
    await addDoc(collection(db, "orders"), {
      userId: userData.username, items: itemsWithSeller, seller_ids: sellerIds,
      totalPi: total, status: "pending", createdAt: new Date().toISOString(),
      address: selectedAddress, deliveryTime: selectedTime || "",
      paymentStatus: method === "wallet" ? "escrow" : "held_in_escrow_sdk",
      note: note || ""
    });

    await addDoc(collection(db, "transactions"), {
      userId: userData.username, title: memo, amount: total.toString(),
      type: "sent", status: "completed", createdAt: new Date().toISOString()
    });

    if (!buyNowProduct) clearCart();
    showToast(t("payment_success") || "Payment successful!", "success");
    showInterstitialAd().catch(() => {});
    navigate("/orders");
  } catch (e) {
    showToast(e?.message || t("payment_failed") || "Payment failed", "error");
  } finally { isProcessing = false; }
}
