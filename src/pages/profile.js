import { t, getDir } from "../stores/language-store.js";
import { getAuthState, updateCountry } from "../stores/pi-auth-store.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";
import { showToast } from "../components/toast.js";

export function renderProfilePage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const userData = getAuthState().userData;

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-white pb-24" dir="${dir}">
      <main class="container mx-auto px-4 py-6 space-y-6">
        <div class="flex flex-col items-center space-y-3 py-4">
          <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </div>
          <h2 class="text-xl font-black text-gray-900">${userData?.display_name || userData?.username || "User"}</h2>
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">${userData?.role || "user"}</span>
        </div>

        <div class="space-y-3">
          <div class="border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 class="text-sm font-black text-gray-900">${t("account_info") || "Account Info"}</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">${t("username") || "Username"}</span>
                <span class="text-sm font-bold text-gray-800">${userData?.username || "-"}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">${t("country") || "Country"}</span>
                <span class="text-sm font-bold text-gray-800">${userData?.country || "-"}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">${t("wallet_address") || "Wallet"}</span>
                <span class="text-sm font-bold text-gray-800 truncate max-w-[180px]">${userData?.wallet_address || "-"}</span>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <button class="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all" data-link="/wallet">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                <span class="text-sm font-bold text-gray-700">${t("wallet") || "Wallet"}</span>
              </div>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button class="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all" data-link="/orders">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                <span class="text-sm font-bold text-gray-700">${t("orders") || "Orders"}</span>
              </div>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button class="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all" data-link="/settings">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span class="text-sm font-bold text-gray-700">${t("settings") || "Settings"}</span>
              </div>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <button class="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all" data-link="/support">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="text-sm font-bold text-gray-700">${t("support") || "Support"}</span>
              </div>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  `;

  renderHeader({ showBack: true, title: t("profile") || "Profile" });
}
