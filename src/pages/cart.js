import { t, getDir } from "../stores/language-store.js";
import { getCart, getCartCount, getPiTotal, removeFromCart, updateQuantity, clearCart } from "../stores/cart-store.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";

export function renderCartPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const cart = getCart();
  const cartCount = getCartCount();
  const piTotal = getPiTotal();

  const piSubtotalVal = Number(piTotal) || 0;
  const serviceFee = Number((piSubtotalVal * 0.02).toFixed(3)) || 0;
  const piTotalDisplay = Number((piSubtotalVal + serviceFee).toFixed(3)) || 0;

  if (cart.length === 0) {
    app.innerHTML = `
      <div id="header"></div>
      <div class="min-h-screen bg-white" dir="${dir}">
        <div class="flex flex-col items-center justify-center px-8 pt-28 pb-20 space-y-5">
          <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
            <svg class="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
          <div class="text-center">
            <h2 class="text-lg font-bold text-gray-900">${t("cart_empty") || "Your cart is empty"}</h2>
            <p class="text-sm text-gray-500 mt-1">${t("explore_products_desc") || "Explore products and add them to your cart"}</p>
          </div>
        </div>
      </div>
    `;
    renderHeader({ showBack: false, showCategories: false });
    return;
  }

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-white" dir="${dir}">
      <main class="px-4 py-5 pb-10 space-y-5">
        <!-- PRODUCT LIST -->
        <div>
          ${cart.map((item, index) => {
            const itemTotalNum = (Number(item.piPrice) || Number(item.price) || 0) * (Number(item.quantity) || 1);
            const itemTotal = itemTotalNum.toFixed(3);
            return `
              <div class="py-6 flex gap-3 items-center ${index === 0 ? "border-t border-[#dfe2e1]" : ""} border-b border-[#dfe2e1]">
                <!-- Product Image -->
                <div class="relative flex-shrink-0 border border-[#dfe2e1] rounded-[8px] overflow-hidden" style="width:70px;height:70px">
                  <img src="${item.image || 'https://placehold.co/200x200?text=P'}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/200x200?text=P'" />
                </div>
                <!-- Product Info -->
                <div class="flex-1 min-w-0">
                  <h6 class="font-bold text-[#212529] leading-snug line-clamp-2" style="font-size:16px">${item.name}</h6>
                  <p class="text-[#889397] mt-0.5" style="font-size:14px">${t(item.category?.toLowerCase()) || item.category || t("standard") || "Standard"}</p>
                  <button class="remove-btn flex items-center gap-1 mt-2 text-[#889397] hover:text-red-500 transition-colors" style="font-size:14px" data-id="${item.id}">
                    <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    <span>${t("remove") || "Remove"}</span>
                  </button>
                </div>
                <!-- Qty + Price column -->
                <div class="flex flex-col items-end gap-3 flex-shrink-0">
                  <span class="font-bold text-[#212529]" style="font-size:16px">${itemTotal} Pi</span>
                  <div class="flex items-center border border-[#dfe2e1] rounded overflow-hidden" style="width:96px;height:32px">
                    <button class="qty-btn flex items-center justify-center bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 transition-colors" style="width:32px;height:32px" data-id="${item.id}" data-action="dec" ${item.quantity <= 1 ? "disabled" : ""}>
                      <svg class="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
                    </button>
                    <div class="flex items-center justify-center border-x border-[#dfe2e1] font-bold text-[#212529]" style="width:32px;height:32px;font-size:14px">${item.quantity}</div>
                    <button class="qty-btn flex items-center justify-center bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors" style="width:32px;height:32px" data-id="${item.id}" data-action="inc">
                      <svg class="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <!-- CHECKOUT BAR -->
        <div class="border border-[#dfe2e1] rounded-lg overflow-hidden mt-4">
          <div class="px-5 py-4 flex items-center justify-between border-b border-[#dfe2e1]">
            <span class="font-bold text-[#212529]" style="font-size:16px">${t("total") || "Total"}</span>
            <span class="font-bold text-[#212529]" style="font-size:18px">${piTotalDisplay.toFixed(3)} Pi</span>
          </div>
          <div class="p-4">
            <button id="btn-checkout" class="w-full text-white flex items-center justify-between px-5 py-3.5 rounded font-bold active:scale-95 transition-all" style="background-color:#0aad0a;font-size:16px">
              <span>${t("go_to_checkout") || "Go to Checkout"}</span>
              <span>${piTotalDisplay.toFixed(3)} Pi</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  `;

  renderHeader({ showBack: false, showCategories: false });

  // Bind events
  document.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const item = cart.find((i) => String(i.id) === String(id));
      if (item) {
        updateQuantity(Number(id), action === "inc" ? item.quantity + 1 : item.quantity - 1);
        renderCartPage();
      }
    });
  });

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeFromCart(Number(btn.dataset.id));
      renderCartPage();
    });
  });

  document.getElementById("btn-checkout")?.addEventListener("click", () => {
    navigate("/checkout");
  });
}
