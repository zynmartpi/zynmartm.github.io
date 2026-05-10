import { t, getDir } from "../stores/language-store.js";
import { getProducts } from "../stores/products-store.js";
import { addToCart } from "../stores/cart-store.js";
import { addSearch, getSearchHistory, removeSearch, clearHistory } from "../stores/search-history-store.js";
import { renderHeader } from "../components/header.js";
import { navigate, getParams } from "../components/router.js";
import { showToast } from "../components/toast.js";

export function renderSearchPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const params = getParams();
  const query = params.q || "";
  const allProducts = getProducts();
  const history = getSearchHistory();

  const filteredProducts = query
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(query.toLowerCase())
      )
    : [];

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-white pb-24" dir="${dir}">
      <main class="container mx-auto px-4 py-4 space-y-6">
        ${!query && history.length > 0 ? `
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-black text-gray-900">${t("search_history") || "Search History"}</h3>
              <button id="btn-clear-history" class="text-xs font-bold text-red-500">${t("clear") || "Clear"}</button>
            </div>
            <div class="flex flex-wrap gap-2">
              ${history.map((h) => `
                <div class="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                  <button class="history-item text-sm font-bold text-gray-700 hover:text-primary transition-colors" data-query="${h}">${h}</button>
                  <button class="remove-history text-gray-400 hover:text-red-500 transition-colors" data-query="${h}">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        ${query ? `
          <div>
            <h2 class="text-lg font-black text-gray-900 mb-4">${t("search_results") || "Search Results"}: "${query}" (${filteredProducts.length})</h2>
            ${filteredProducts.length === 0 ? `
              <div class="flex flex-col items-center justify-center py-16 space-y-3">
                <svg class="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <p class="text-gray-500 font-bold">${t("no_results") || "No results found"}</p>
              </div>
            ` : `
              <div class="grid grid-cols-2 gap-4">
                ${filteredProducts.map((product) => `
                  <div class="product-card p-2 border border-[#dfe2e1] rounded-xl bg-white space-y-3 active:scale-95 transition-all duration-200 cursor-pointer group flex flex-col" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.piPrice}" data-product-image="${product.image}" data-product-category="${product.category}" data-product-rating="${product.rating}">
                    <div class="aspect-square rounded-lg bg-white overflow-hidden relative">
                      <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='https://placehold.co/600x400?text=No+Image'" />
                    </div>
                    <div class="space-y-1.5 px-1 py-1 text-start">
                      <span class="text-[10px] font-bold text-primary uppercase tracking-wider">${t(product.category?.toLowerCase()) || product.category}</span>
                      <h3 class="text-sm font-bold text-gray-800 line-clamp-1">${product.name}</h3>
                      <div class="flex items-center justify-between">
                        <span class="text-primary font-black">${product.piPrice.toFixed(3)} Pi</span>
                        <button class="btn-add-cart p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white active:scale-90 transition-all shadow-sm" data-product-id="${product.id}">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        ` : ""}
      </main>
    </div>
  `;

  renderHeader({ showBack: true, title: t("search") || "Search" });

  if (query) addSearch(query);

  // Bind events
  document.getElementById("btn-clear-history")?.addEventListener("click", () => {
    clearHistory();
    renderSearchPage();
  });

  document.querySelectorAll(".history-item").forEach((btn) => {
    btn.addEventListener("click", () => navigate(`/search?q=${encodeURIComponent(btn.dataset.query)}`));
  });

  document.querySelectorAll(".remove-history").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeSearch(btn.dataset.query);
      renderSearchPage();
    });
  });

  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-add-cart")) return;
      const params = new URLSearchParams({
        id: card.dataset.productId, name: card.dataset.productName, price: card.dataset.productPrice,
        image: card.dataset.productImage, category: card.dataset.productCategory, rating: card.dataset.productRating,
      });
      navigate(`/product?${params.toString()}`);
    });
  });

  document.querySelectorAll(".btn-add-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".product-card");
      addToCart({ id: card.dataset.productId, name: card.dataset.productName, piPrice: parseFloat(card.dataset.productPrice), image: card.dataset.productImage, category: card.dataset.productCategory, rating: parseFloat(card.dataset.productRating), price: parseFloat(card.dataset.productPrice) });
      showToast("Added to cart!", "success");
    });
  });
}
