import { t, getDir, getLanguage, setLanguage, onLanguageChange } from "../stores/language-store.js";
import { getAuthState, updateCountry, refreshUserData } from "../stores/pi-auth-store.js";
import { showRewardedAd, showInterstitialAd } from "../stores/ads-store.js";
import { db, doc, updateDoc, getDoc, setDoc } from "../lib/firebase.js";
import { BACKEND_CONFIG } from "../lib/system-config.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";
import { showToast } from "../components/toast.js";

const COUNTRIES = [
  { code: "DZ", label: "الجزائر", flag: "🇩🇿" }, { code: "MA", label: "المغرب", flag: "🇲🇦" },
  { code: "TN", label: "تونس", flag: "🇹🇳" }, { code: "EG", label: "مصر", flag: "🇪🇬" },
  { code: "SA", label: "السعودية", flag: "🇸🇦" }, { code: "AE", label: "الإمارات", flag: "🇦🇪" },
  { code: "IQ", label: "العراق", flag: "🇮🇶" }, { code: "JO", label: "الأردن", flag: "🇯🇴" },
  { code: "LB", label: "لبنان", flag: "🇱🇧" }, { code: "PS", label: "فلسطين", flag: "🇵🇸" },
  { code: "SY", label: "سوريا", flag: "🇸🇾" }, { code: "KW", label: "الكويت", flag: "🇰🇼" },
  { code: "QA", label: "قطر", flag: "🇶🇦" }, { code: "BH", label: "البحرين", flag: "🇧🇭" },
  { code: "OM", label: "عمان", flag: "🇴🇲" }, { code: "SD", label: "السودان", flag: "🇸🇩" },
  { code: "LY", label: "ليبيا", flag: "🇱🇾" }, { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" }, { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "DE", label: "Germany", flag: "🇩🇪" }, { code: "TR", label: "Türkiye", flag: "🇹🇷" },
  { code: "IN", label: "India", flag: "🇮🇳" }, { code: "CN", label: "China", flag: "🇨🇳" },
  { code: "JP", label: "Japan", flag: "🇯🇵" }, { code: "KR", label: "South Korea", flag: "🇰🇷" },
  { code: "NG", label: "Nigeria", flag: "🇳🇬" }, { code: "BR", label: "Brazil", flag: "🇧🇷" },
  { code: "OTHER", label: "Other", flag: "🌍" },
];

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function renderSettingsPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const userData = getAuthState().userData;
  const lang = getLanguage();
  const isDark = document.documentElement.classList.contains("dark");

  const currentLangLabel = lang === "en" ? "English" : lang === "ar" ? "العربية" : "Français";
  const currentCountry = COUNTRIES.find((c) => c.code === userData?.country);
  const walletDisplay = userData?.wallet_address
    ? `${userData.wallet_address.substring(0, 6)}...${userData.wallet_address.substring(userData.wallet_address.length - 4)}`
    : t("not_set") || "Not set";

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-[#fafafa] pb-12" dir="${dir}">
      <main class="p-4 space-y-6 mt-4">
        <!-- Preferences -->
        <div class="space-y-2">
          <h2 class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">${t("preferences") || "Preferences"}</h2>
          <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <button class="settings-item w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors border-b border-gray-50" data-action="language">
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-xl bg-gray-50 text-gray-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                </div>
                <span class="font-semibold text-gray-800">${t("language") || "Language"}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-primary">${currentLangLabel}</span>
                <svg class="w-5 h-5 text-gray-300 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>
            <button class="settings-item w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors border-b border-gray-50" data-action="darkmode">
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-xl bg-gray-50 text-gray-600">
                  ${isDark
                    ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke-width="2"/><path stroke-linecap="round" stroke-width="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
                    : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'
                  }
                </div>
                <span class="font-semibold text-gray-800">${t("dark_mode") || "Dark Mode"}</span>
              </div>
              <div class="w-12 h-6 rounded-full relative transition-colors duration-300 ${isDark ? "bg-primary" : "bg-gray-200"}">
                <div class="absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${isDark ? (dir === "rtl" ? "right-7" : "left-7") : (dir === "rtl" ? "right-1" : "left-1")}"></div>
              </div>
            </button>
            <button class="settings-item w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors border-b border-gray-50" data-action="country">
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-xl bg-gray-50 text-primary">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                </div>
                <span class="font-semibold text-gray-800">${t("country_label") || "Country"}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-primary">${currentCountry?.label || t("not_set") || "Not set"}</span>
                <svg class="w-5 h-5 text-gray-300 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>
            <button class="settings-item w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors" data-action="wallet">
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-xl bg-gray-50 text-purple-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                </div>
                <span class="font-semibold text-gray-800">${t("wallet_address") || "Wallet Address"}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-primary">${walletDisplay}</span>
                <svg class="w-5 h-5 text-gray-300 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>
          </div>
        </div>

        <!-- Seller -->
        <div class="space-y-2">
          <h2 class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">${t("seller_label") || "Seller"}</h2>
          <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <button class="settings-item w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors" data-action="seller-dashboard">
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-xl bg-gray-50 text-primary">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                </div>
                <span class="font-semibold text-gray-800">${t("seller_dashboard") || "Seller Dashboard"}</span>
              </div>
              <svg class="w-5 h-5 text-gray-300 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        <!-- Rewards -->
        <div class="space-y-2">
          <h2 class="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">${t("rewards_support") || "Rewards & Support"}</h2>
          <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <button class="settings-item w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors border-b border-gray-50" data-action="watch-ad">
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-xl bg-gray-50 text-primary">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>
                </div>
                <span class="font-semibold text-gray-800">${t("watch_ad_earn") || "Watch Ad & Earn"}</span>
              </div>
              <svg class="w-5 h-5 text-gray-300 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button class="settings-item w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors" data-action="interstitial-ad">
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-xl bg-gray-50 text-purple-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>
                </div>
                <span class="font-semibold text-gray-800">${t("show_interstitial_ad") || "Show Interstitial Ad"}</span>
              </div>
              <svg class="w-5 h-5 text-gray-300 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </main>

      <!-- Language Modal -->
      <div id="lang-modal" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="document.getElementById('lang-modal').classList.add('hidden')"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-12 shadow-2xl">
          <div class="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-gray-900">${t("language") || "Language"}</h2>
            <button class="lang-close p-2 bg-gray-50 rounded-full">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="space-y-3">
            ${languages.map((l) => `
              <button class="lang-option w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98] ${lang === l.code ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-white border-gray-100"}" data-lang="${l.code}">
                <div class="flex items-center gap-4">
                  <span class="text-2xl">${l.flag}</span>
                  <span class="font-bold text-sm ${lang === l.code ? "text-primary" : "text-gray-700"}">${l.label}</span>
                </div>
                ${lang === l.code ? '<div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>' : ""}
              </button>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Country Modal -->
      <div id="country-modal" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="document.getElementById('country-modal').classList.add('hidden')"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-12 shadow-2xl max-h-[80vh] overflow-y-auto">
          <div class="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">${t("country_label") || "Country"}</h2>
            <button class="country-close p-2 bg-gray-50 rounded-full">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <p class="text-xs font-semibold text-gray-400 mb-4">${t("country_description") || "Select your country"}</p>
          <div class="space-y-2">
            ${COUNTRIES.map((c) => `
              <button class="country-option w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${userData?.country === c.code ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-white border-gray-100"}" data-country="${c.code}">
                <div class="flex items-center gap-4">
                  <span class="text-2xl">${c.flag}</span>
                  <span class="font-bold text-sm ${userData?.country === c.code ? "text-primary" : "text-gray-700"}">${c.label}</span>
                </div>
                ${userData?.country === c.code ? '<div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>' : ""}
              </button>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Wallet Modal -->
      <div id="wallet-modal" class="fixed inset-0 z-[100] hidden">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="document.getElementById('wallet-modal').classList.add('hidden')"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-12 shadow-2xl">
          <div class="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-bold text-gray-900">${t("wallet_address") || "Wallet Address"}</h2>
            <button class="wallet-close p-2 bg-gray-50 rounded-full">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="space-y-4">
            <p class="text-sm font-semibold text-gray-500">${t("wallet_description") || "Enter your Pi wallet address (56 chars)."}</p>
            <div class="relative">
              <input type="text" id="wallet-input" maxlength="56" placeholder="Pi Wallet Address..." value="${userData?.wallet_address || ""}" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-900 outline-none focus:border-primary transition-all" />
              <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400" id="wallet-char-count">${(userData?.wallet_address || "").length}/56</div>
            </div>
            <button id="btn-save-wallet" class="w-full py-3.5 mt-2 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-primary/20">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderHeader({ showBack: false, showSearch: false, showCategories: false });

  // Bind events
  document.querySelectorAll(".settings-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "language") document.getElementById("lang-modal")?.classList.remove("hidden");
      else if (action === "darkmode") toggleDarkMode();
      else if (action === "country") document.getElementById("country-modal")?.classList.remove("hidden");
      else if (action === "wallet") document.getElementById("wallet-modal")?.classList.remove("hidden");
      else if (action === "seller-dashboard") navigate("/seller/dashboard");
      else if (action === "watch-ad") showRewardedAd();
      else if (action === "interstitial-ad") showInterstitialAd();
    });
  });

  // Language modal
  document.querySelectorAll(".lang-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      document.getElementById("lang-modal")?.classList.add("hidden");
      renderSettingsPage();
    });
  });
  document.querySelector(".lang-close")?.addEventListener("click", () => document.getElementById("lang-modal")?.classList.add("hidden"));

  // Country modal
  document.querySelectorAll(".country-option").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateCountry(btn.dataset.country);
      document.getElementById("country-modal")?.classList.add("hidden");
      showToast(t("success") || "Country updated!", "success");
      renderSettingsPage();
    });
  });
  document.querySelector(".country-close")?.addEventListener("click", () => document.getElementById("country-modal")?.classList.add("hidden"));

  // Wallet modal
  const walletInput = document.getElementById("wallet-input");
  const walletCharCount = document.getElementById("wallet-char-count");
  walletInput?.addEventListener("input", () => {
    if (walletCharCount) walletCharCount.textContent = `${walletInput.value.length}/56`;
  });
  document.getElementById("btn-save-wallet")?.addEventListener("click", async () => {
    const val = walletInput?.value?.trim();
    if (!val || val.length !== 56) { showToast(t("wallet_56_chars") || "Wallet must be 56 chars", "error"); return; }
    try {
      // Verify on blockchain
      try {
        const res = await fetch(`${BACKEND_CONFIG.BLOCKCHAIN_BASE_URL}/accounts/${val}`);
        if (res.status === 404) { showToast(t("wallet_not_found_blockchain") || "Address not found on blockchain", "error"); return; }
      } catch {}
      const userId = getAuthState().userData?.id;
      if (userId) {
        await updateDoc(doc(db, "users", userId), { wallet_address: val });
        await refreshUserData();
      }
      showToast(t("success") || "Saved!", "success");
      document.getElementById("wallet-modal")?.classList.add("hidden");
      renderSettingsPage();
    } catch (e) {
      showToast(t("error_occurred") || "Error saving wallet", "error");
    }
  });
  document.querySelector(".wallet-close")?.addEventListener("click", () => document.getElementById("wallet-modal")?.classList.add("hidden"));
}

function toggleDarkMode() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("zynmart_theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  renderSettingsPage();
}

// Load saved theme
const savedTheme = localStorage.getItem("zynmart_theme");
if (savedTheme === "dark") document.documentElement.classList.add("dark");
