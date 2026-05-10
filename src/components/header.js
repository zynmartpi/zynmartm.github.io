import { t, getDir, onLanguageChange, setLanguage } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { getCartCount, onCartChange } from "../stores/cart-store.js";
import { getUnreadCount, onNotificationsChange } from "../stores/notifications-store.js";
import { CATEGORIES } from "../lib/categories.js";
import { navigate } from "./router.js";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function renderHeader(options = {}) {
  const { showSearch = false, showCategories = false, showBack = false, title = "", activeCategory = "all", onCategoryChange = null } = options;
  const dir = getDir();
  const userData = getAuthState().userData;
  const cartCount = getCartCount();
  const unreadCount = getUnreadCount();
  const categories = CATEGORIES.map((id) => ({ id, label: id }));

  const headerEl = document.getElementById("header");
  if (!headerEl) return;

  headerEl.innerHTML = `
    <header class="relative z-50 w-full transition-all duration-300 bg-white border-b border-gray-200">
      <div class="py-3 px-4 flex items-center justify-between gap-4 ${showBack ? "bg-primary/5" : ""}">
        <div class="flex items-center gap-3">
          ${showBack ? `
            <button id="btn-back" class="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
              <svg class="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          ` : `
            <div id="btn-logo" class="flex items-center gap-2 active:scale-95 transition-transform cursor-pointer">
              <div class="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              </div>
              <span class="text-lg font-black text-gray-900 tracking-tighter leading-none">ZYNMART</span>
            </div>
          `}
          ${title ? `<h1 class="text-lg font-black text-gray-900 tracking-tight">${title}</h1>` : ""}
        </div>
        <div class="flex items-center gap-1">
          <div class="relative" id="lang-dropdown-container">
            <button id="btn-lang" class="p-2 text-gray-600 active:bg-gray-100 rounded-full transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            </button>
            <div id="lang-dropdown" class="hidden absolute top-full mt-2 w-36 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 ${dir === "rtl" ? "left-0" : "right-0"}">
              ${languages.map((lang) => `
                <button class="lang-option w-full text-start px-4 py-3 text-sm font-bold hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0" data-lang="${lang.code}">
                  <span class="text-xl leading-none">${lang.flag}</span>
                  <span class="text-gray-700">${lang.label}</span>
                </button>
              `).join("")}
            </div>
          </div>
          <button id="btn-notifications" class="p-2 text-gray-600 active:bg-gray-100 rounded-full transition-all relative">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.058-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            ${unreadCount > 0 ? `<span class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-bold">${unreadCount > 9 ? "9+" : unreadCount}</span>` : ""}
          </button>
          <button id="btn-map" class="p-2 text-gray-600 active:bg-gray-100 rounded-full transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          </button>
          <button id="btn-cart" class="p-2 text-gray-600 active:bg-gray-100 rounded-full transition-all relative">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
            ${cartCount > 0 ? `<span class="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-bold">${cartCount}</span>` : ""}
          </button>
          ${!showBack ? `
            <button id="btn-menu" class="p-2 text-primary active:bg-primary/5 rounded-full transition-all">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          ` : ""}
        </div>
      </div>
      ${(showSearch || showCategories) ? `
        <div class="border-t border-gray-200">
          ${showSearch ? `
            <div class="px-4 pt-3 pb-2">
              <form id="search-form" class="relative group">
                <input type="search" name="q" id="search-input" placeholder="${t("search_placeholder")}" class="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-xl py-2.5 text-sm transition-all outline-none ${dir === "rtl" ? "text-right pr-11 pl-4" : "text-left pl-11 pr-4"}" />
                <div class="absolute top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors ${dir === "rtl" ? "right-4" : "left-4"}">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
              </form>
            </div>
          ` : ""}
          ${showCategories ? `
            <div class="${showSearch ? "pt-0 pb-3" : "py-2"}">
              <div class="flex items-center gap-4 overflow-x-auto no-scrollbar px-4">
                <button id="btn-all-departments" class="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                  ${t("all") || "All"}
                </button>
                ${categories.slice(0, 10).map((cat) => `
                  <button class="category-btn text-[12px] font-bold tracking-tight whitespace-nowrap transition-all py-1.5 border-b-2 ${activeCategory === cat.id ? "text-primary border-primary" : "text-gray-500 border-transparent hover:text-primary/70"}" data-category="${cat.id}">
                    ${t(cat.label)}
                  </button>
                `).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      ` : ""}
    </header>

    <!-- Sidebar Overlay -->
    <div id="sidebar-overlay" class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-all duration-300 opacity-0 pointer-events-none"></div>

    <!-- Sidebar -->
    <aside id="sidebar" class="fixed top-0 bottom-0 z-[110] w-[300px] bg-white shadow-2xl transition-all duration-500 ease-out flex flex-col ${dir === "rtl" ? "-right-[300px]" : "-left-[300px]"}">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-primary/5">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          <span class="font-black text-gray-900 tracking-tight">${t("all_departments") || "All Departments"}</span>
        </div>
        <button id="btn-close-sidebar" class="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
        <div class="flex flex-col gap-6">
          <div class="px-2">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">General</p>
            <div class="grid gap-1">
              ${renderSidebarItem("home", t("home"), `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>`, "/")}
              ${renderSidebarItem("add_product", t("add_product") || "Add Product", `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>`, "/seller/add-product")}
              ${renderSidebarItem("manage_orders", t("manage_sales_label") || "Manage Sales", `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>`, "/seller/orders")}
              ${renderSidebarItem("wallet", t("wallet"), `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>`, "/wallet")}
              ${renderSidebarItem("orders", t("orders"), `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>`, "/orders")}
              ${renderSidebarItem("spin", t("spin_label"), `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>`, "/spin-wheel")}
            </div>
          </div>
          <div class="px-2">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">System</p>
            <div class="grid gap-1">
              ${renderSidebarItem("settings", t("settings") || "Settings", `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>`, "/settings")}
              ${renderSidebarItem("support", t("support") || "Support", `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`, "/support")}
              ${renderSidebarItem("terms", t("terms") || "Terms", `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>`, "/terms")}
            </div>
          </div>
        </div>
      </div>
      <div class="p-4 border-t border-gray-100 bg-gray-50/50">
        <button id="btn-profile" class="w-full flex items-center justify-between gap-2 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-primary/20 transition-all active:scale-95 group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <div class="text-left">
              <p class="text-sm font-black text-gray-900 leading-none">${userData?.username || t("account")}</p>
              <p class="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">${t("my_profile") || "My Profile"}</p>
            </div>
          </div>
          <svg class="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </aside>
  `;

  bindHeaderEvents(options, onCategoryChange);
}

function renderSidebarItem(id, label, iconPath, href) {
  return `
    <button class="sidebar-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all group w-full text-start hover:bg-primary/5 text-gray-700 hover:text-primary" data-href="${href}">
      <svg class="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${iconPath}</svg>
      <span class="text-sm font-bold">${label}</span>
    </button>
  `;
}

function bindHeaderEvents(options, onCategoryChange) {
  const dir = getDir();

  // Back button
  const btnBack = document.getElementById("btn-back");
  if (btnBack) btnBack.addEventListener("click", () => window.history.back());

  // Logo
  const btnLogo = document.getElementById("btn-logo");
  if (btnLogo) btnLogo.addEventListener("click", () => navigate("/"));

  // Language dropdown
  const btnLang = document.getElementById("btn-lang");
  const langDropdown = document.getElementById("lang-dropdown");
  if (btnLang && langDropdown) {
    btnLang.addEventListener("click", () => langDropdown.classList.toggle("hidden"));
    document.querySelectorAll(".lang-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLanguage(btn.dataset.lang);
        langDropdown.classList.add("hidden");
      });
    });
    document.addEventListener("click", (e) => {
      if (!document.getElementById("lang-dropdown-container")?.contains(e.target)) {
        langDropdown.classList.add("hidden");
      }
    });
  }

  // Navigation buttons
  const btnNotifications = document.getElementById("btn-notifications");
  if (btnNotifications) btnNotifications.addEventListener("click", () => navigate("/notifications"));

  const btnMap = document.getElementById("btn-map");
  if (btnMap) btnMap.addEventListener("click", () => navigate("/map"));

  const btnCart = document.getElementById("btn-cart");
  if (btnCart) btnCart.addEventListener("click", () => navigate("/cart"));

  // Sidebar
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const btnMenu = document.getElementById("btn-menu");
  const btnCloseSidebar = document.getElementById("btn-close-sidebar");

  const openSidebar = () => {
    if (sidebar) sidebar.style[dir === "rtl" ? "right" : "left"] = "0";
    if (sidebarOverlay) { sidebarOverlay.classList.remove("opacity-0", "pointer-events-none"); sidebarOverlay.classList.add("opacity-100", "pointer-events-auto"); }
  };
  const closeSidebar = () => {
    if (sidebar) sidebar.style[dir === "rtl" ? "right" : "left"] = dir === "rtl" ? "-300px" : "-300px";
    if (sidebarOverlay) { sidebarOverlay.classList.add("opacity-0", "pointer-events-none"); sidebarOverlay.classList.remove("opacity-100", "pointer-events-auto"); }
  };

  if (btnMenu) btnMenu.addEventListener("click", openSidebar);
  if (btnCloseSidebar) btnCloseSidebar.addEventListener("click", closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

  // Sidebar items
  document.querySelectorAll(".sidebar-item").forEach((item) => {
    item.addEventListener("click", () => {
      navigate(item.dataset.href);
      closeSidebar();
    });
  });

  // Profile button
  const btnProfile = document.getElementById("btn-profile");
  if (btnProfile) btnProfile.addEventListener("click", () => { navigate("/profile"); closeSidebar(); });

  // Search form
  const searchForm = document.getElementById("search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("search-input")?.value?.trim();
      if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    });
  }

  // Category buttons
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (onCategoryChange) onCategoryChange(btn.dataset.category);
    });
  });

  // All departments button
  const btnAllDepts = document.getElementById("btn-all-departments");
  if (btnAllDepts) btnAllDepts.addEventListener("click", openSidebar);
}
