import { t, getDir } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { getProducts, onProductsChange, isLoading, refreshProducts } from "../stores/products-store.js";
import { addToCart, onCartChange } from "../stores/cart-store.js";
import { showInterstitialAd } from "../stores/ads-store.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";
import { CATEGORIES } from "../lib/categories.js";
import { PullToRefresh } from "../components/pull-to-refresh.js";

let activeCategory = "all";
let womenSubCategory = "all";
let currentBanner = 0;
let currentPage = 1;
let isAnimating = false;
let showMyCountry = false;
const ITEMS_PER_PAGE = 10;

const banners = [
  { id: 1, title: t("summer_sale"), subtitle: t("up_to_50_off"), color: "bg-blue-600", image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_960_720.jpg" },
  { id: 2, title: t("new_arrival"), subtitle: t("smart_watch_series_7"), color: "bg-amber-500", image: "https://cdn.pixabay.com/photo/2015/06/25/17/21/smart-watch-821557_960_720.jpg" },
  { id: 3, title: t("zyn_exclusive"), subtitle: t("pay_with_zyn_only"), color: "bg-purple-600", image: "https://cdn.pixabay.com/photo/2018/09/17/14/27/headphones-3683983_960_720.jpg" },
];

const womenSubCategories = [
  { id: "all", label: "all", image: "https://cdn.pixabay.com/photo/2017/08/01/11/48/woman-2564660_960_720.jpg" },
  { id: "deals", label: "sub_deals", image: "https://cdn.pixabay.com/photo/2016/11/22/21/57/apparel-1850804_960_720.jpg" },
  { id: "clothing", label: "sub_clothing", image: "https://cdn.pixabay.com/photo/2015/03/26/09/41/tie-690084_960_720.jpg" },
  { id: "plus size", label: "sub_plus_size", image: "https://cdn.pixabay.com/photo/2017/08/05/00/12/girl-2581913_960_720.jpg" },
  { id: "beauty", label: "sub_beauty", image: "https://cdn.pixabay.com/photo/2016/01/10/21/05/micellar-water-1132528_960_720.jpg" },
];

let bannerInterval = null;

function getFilteredProducts() {
  const products = getProducts();
  const userData = getAuthState().userData;

  const countryFiltered = (showMyCountry && userData?.country)
    ? products.filter((p) => p.country === userData.country || !p.country)
    : products;

  const baseFiltered = activeCategory === "all"
    ? countryFiltered
    : countryFiltered.filter((p) => String(p.category).toLowerCase() === activeCategory.toLowerCase());

  if (activeCategory.toLowerCase() === "women" && womenSubCategory !== "all") {
    return baseFiltered.filter((p) => {
      const pSub = String(p.subCategory || "").toLowerCase().trim();
      const targetSub = String(womenSubCategory).toLowerCase().trim();
      return pSub === targetSub ||
        (targetSub === "clothing" && (pSub === "women_clothing" || pSub === "clothing")) ||
        (targetSub === "deals" && (pSub === "women_deals" || pSub === "deals")) ||
        (targetSub === "plus size" && (pSub === "women_curve_plus" || pSub === "plus size")) ||
        (targetSub === "beauty" && (pSub === "women_beauty" || pSub === "beauty"));
    });
  }
  return baseFiltered;
}

export function renderHomePage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const userData = getAuthState().userData;
  const loading = isLoading();
  const filteredProducts = getFilteredProducts();
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-white pb-24" dir="${dir}" id="home-page">
      ${loading ? `
        <div class="container mx-auto px-4 py-6 space-y-8">
          <div class="flex items-center justify-center py-20">
            <svg class="w-10 h-10 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          </div>
        </div>
      ` : `
        <main class="container mx-auto px-4 py-6 space-y-8" id="home-main">
          ${userData?.country ? `
            <div class="flex items-center gap-3">
              <button id="btn-country-filter" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${showMyCountry ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-primary/30"}">
                <span class="text-base">${showMyCountry ? "🏠" : "🌍"}</span>
                ${showMyCountry ? (t("my_country_only") || "My Country Only") : (t("all_countries") || "All Countries")}
              </button>
              ${showMyCountry ? `<span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">${userData.country}</span>` : ""}
            </div>
          ` : ""}

          ${activeCategory === "women" ? `
            <div class="-mx-4 px-4">
              <div class="flex items-start gap-6 overflow-x-auto no-scrollbar pb-2">
                ${womenSubCategories.map((sub) => `
                  <button class="women-sub-btn flex flex-col items-center gap-2 shrink-0" data-sub="${sub.id}">
                    <div class="transition-all relative shrink-0 flex items-center justify-center" style="width:72px;height:72px;border-radius:50%;border:${womenSubCategory === sub.id ? "2px solid black" : "2px solid transparent"};padding:2px;box-sizing:border-box">
                      <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background-color:#f3f4f6;position:relative;display:block">
                        <img src="${sub.image}" alt="${t(sub.label)}" class="object-cover rounded-full" style="width:100%;height:100%" />
                      </div>
                    </div>
                    <span class="text-xs font-bold px-3 py-1 rounded-full transition-all ${womenSubCategory === sub.id ? "bg-black text-white" : "text-gray-600"}">${t(sub.label)}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          ` : ""}

          ${activeCategory === "all" ? `
            <div class="relative h-44 rounded overflow-hidden shadow-lg group">
              ${banners.map((banner, index) => `
                <div class="absolute inset-0 transition-all duration-1000 ease-in-out flex items-center p-8 ${index === currentBanner ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"} ${banner.color}">
                  <div class="relative z-10 space-y-2 max-w-[60%] text-start">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">${banner.subtitle}</span>
                    <h2 class="text-2xl font-black text-white leading-tight">${banner.title}</h2>
                    <button class="mt-2 bg-white text-gray-900 px-5 py-2 rounded-xl font-black text-xs active:scale-95 transition-all shadow-sm">${t("shop_now")}</button>
                  </div>
                  <div class="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden">
                    <img src="${banner.image}" alt="${banner.title}" class="object-cover opacity-80 w-full h-full" />
                  </div>
                </div>
              `).join("")}
              <div class="absolute bottom-4 left-8 flex gap-1.5 z-20">
                ${banners.map((_, i) => `
                  <button class="banner-dot h-1.5 rounded-full transition-all duration-500 ${i === currentBanner ? "w-6 bg-white" : "w-1.5 bg-white/40"}" data-index="${i}"></button>
                `).join("")}
              </div>
            </div>
          ` : ""}

          <div class="space-y-4 transition-all duration-300 transform ${isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-black text-gray-900">
                ${activeCategory === "all" ? (t("all_products") || "All Products") : (t(activeCategory.toLowerCase()) || activeCategory)}
              </h2>
            </div>
            <div class="grid grid-cols-2 gap-4">
              ${filteredProducts
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((product) => `
                  <div class="product-card p-2 border border-[#dfe2e1] rounded-xl bg-white space-y-3 active:scale-95 active:opacity-90 transition-all duration-200 cursor-pointer group flex flex-col card-hover" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.piPrice}" data-product-image="${product.image}" data-product-category="${product.category}" data-product-rating="${product.rating}">
                    <div class="aspect-square rounded-lg bg-white overflow-hidden relative transition-all">
                      <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='https://placehold.co/600x400?text=No+Image'" />
                    </div>
                    <div class="space-y-1.5 px-1 py-1 text-start">
                      <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-primary uppercase tracking-wider">${t(product.category.toLowerCase()) || product.category}</span>
                        <div class="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                          <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span>${product.rating}</span>
                        </div>
                      </div>
                      <h3 class="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">${product.name}</h3>
                      <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-primary font-black">${product.piPrice.toFixed(3)} Pi</span>
                        </div>
                        <button class="btn-add-cart p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white active:scale-90 transition-all shadow-sm" data-product-id="${product.id}">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                `).join("")}
            </div>
            ${filteredProducts.length > ITEMS_PER_PAGE ? `
              <div class="flex items-center justify-center gap-2 py-4">
                ${Array.from({ length: totalPages }, (_, i) => `
                  <button class="pagination-btn px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === i + 1 ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}" data-page="${i + 1}">${i + 1}</button>
                `).join("")}
              </div>
            ` : ""}
          </div>
        </main>
      `}
    </div>
  `;

  renderHeader({
    showSearch: true,
    showCategories: true,
    activeCategory,
    onCategoryChange: handleCategoryChange,
  });

  bindHomeEvents();

  // Pull to refresh
  const homePage = document.getElementById("home-page");
  if (homePage) {
    new PullToRefresh(homePage, async () => {
      await refreshProducts();
    });
  }

  // Banner auto-rotate
  if (bannerInterval) clearInterval(bannerInterval);
  if (activeCategory === "all") {
    bannerInterval = setInterval(() => {
      currentBanner = (currentBanner + 1) % banners.length;
      updateBanner();
    }, 5000);
  }

  // Daily splash ad
  const splashKey = "last_splash_ad_time";
  const lastShown = localStorage.getItem(splashKey);
  const now = Date.now();
  if (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000) {
    setTimeout(async () => {
      const success = await showInterstitialAd();
      if (success) localStorage.setItem(splashKey, now.toString());
    }, 3000);
  }
}

function updateBanner() {
  const bannerSlides = document.querySelectorAll("[data-banner-slide]");
  const dots = document.querySelectorAll(".banner-dot");
  // Simple re-render for banner update
}

function handleCategoryChange(id) {
  isAnimating = true;
  setTimeout(() => {
    activeCategory = id;
    womenSubCategory = "all";
    currentPage = 1;
    isAnimating = false;
    renderHomePage();
  }, 300);
}

function bindHomeEvents() {
  // Country filter
  const btnCountryFilter = document.getElementById("btn-country-filter");
  if (btnCountryFilter) {
    btnCountryFilter.addEventListener("click", () => {
      showMyCountry = !showMyCountry;
      renderHomePage();
    });
  }

  // Women sub-categories
  document.querySelectorAll(".women-sub-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      isAnimating = true;
      setTimeout(() => {
        womenSubCategory = btn.dataset.sub;
        isAnimating = false;
        renderHomePage();
      }, 200);
    });
  });

  // Banner dots
  document.querySelectorAll(".banner-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      currentBanner = parseInt(dot.dataset.index);
      renderHomePage();
    });
  });

  // Product cards - navigate to product page
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-add-cart")) return;
      const params = new URLSearchParams({
        id: card.dataset.productId,
        name: card.dataset.productName,
        price: card.dataset.productPrice,
        image: card.dataset.productImage,
        category: card.dataset.productCategory,
        rating: card.dataset.productRating,
      });
      navigate(`/product?${params.toString()}`);
    });
  });

  // Add to cart buttons
  document.querySelectorAll(".btn-add-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      const card = btn.closest(".product-card");
      const product = {
        id: productId,
        name: card.dataset.productName,
        piPrice: parseFloat(card.dataset.productPrice),
        image: card.dataset.productImage,
        category: card.dataset.productCategory,
        rating: parseFloat(card.dataset.productRating),
        price: parseFloat(card.dataset.productPrice),
      };
      addToCart(product);
      import("../components/toast.js").then(({ showToast }) => {
        showToast("Added to cart!", "success");
      });
    });
  });

  // Pagination
  document.querySelectorAll(".pagination-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = parseInt(btn.dataset.page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      renderHomePage();
    });
  });
}
