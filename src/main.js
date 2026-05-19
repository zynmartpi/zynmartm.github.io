import "./styles.css";
import { initAuth, getAuthState, onAuthChange } from "./stores/pi-auth-store.js";
import { initNotifications } from "./stores/notifications-store.js";
import { addRoute, startRouter, navigate } from "./components/router.js";
import { renderHeader } from "./components/header.js";
import { reinitialize } from "./stores/pi-auth-store.js";
import { errorBoundary } from "./components/error-boundary.js";
import { renderHomePage } from "./pages/home.js";
import { renderProductPage } from "./pages/product.js";
import { renderCartPage } from "./pages/cart.js";
import { renderSearchPage } from "./pages/search.js";
import { renderOrdersPage } from "./pages/orders.js";
import { renderWalletPage, setupWalletEventListeners } from "./pages/wallet.js";
import { renderProfilePage } from "./pages/profile.js";
import { renderSpinWheelPage } from "./pages/spin-wheel.js";
import { renderCheckoutPage } from "./pages/checkout.js";
import { renderMapPage } from "./pages/map.js";
import { renderSettingsPage } from "./pages/settings.js";
import { renderSupportPage } from "./pages/support.js";
import { renderTermsPage } from "./pages/terms.js";
import { renderPrivacyPage } from "./pages/privacy.js";
import { renderSellerOrdersPage } from "./pages/seller-orders.js";
import { renderNotificationsPage, setupNotificationsEventListeners } from "./pages/notifications.js";
import { renderSellerDashboardPage } from "./pages/seller-dashboard.js";
import { renderAddProductPage } from "./pages/seller-add-product.js";
import { renderShippingAddressPage } from "./pages/shipping-address.js";
import { renderOrderDetailPage } from "./pages/order-detail.js";

// Register routes
addRoute("/", renderHomePage);
addRoute("/product", renderProductPage);
addRoute("/cart", renderCartPage);
addRoute("/search", renderSearchPage);
addRoute("/orders", renderOrdersPage);
addRoute("/wallet", renderWalletPage);
addRoute("/profile", renderProfilePage);
addRoute("/spin-wheel", renderSpinWheelPage);
addRoute("/checkout", renderCheckoutPage);

// New full pages
addRoute("/map", renderMapPage);
addRoute("/settings", renderSettingsPage);
addRoute("/support", renderSupportPage);
addRoute("/terms", renderTermsPage);
addRoute("/privacy", renderPrivacyPage);
addRoute("/seller/orders", renderSellerOrdersPage);
addRoute("/seller/dashboard", renderSellerDashboardPage);
addRoute("/seller/add-product", renderAddProductPage);
addRoute("/shipping-address", renderShippingAddressPage);
addRoute("/order-detail", renderOrderDetailPage);
addRoute("/notifications", () => {
  const app = document.getElementById("app");
  app.innerHTML = renderNotificationsPage();
  setupNotificationsEventListeners();
});


// Dev mode: skip Pi Auth when not in Pi Browser
const DEV_MODE = !window.Pi && import.meta.env.DEV;

// Auth loading screen
function renderAuthLoading() {
  const auth = getAuthState();
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="min-h-screen bg-white flex flex-col items-center justify-center space-y-6 p-8">
      <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
        <svg class="w-10 h-10 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
      <div class="text-center space-y-2">
        <h2 class="text-lg font-black text-gray-900">ZYNMART</h2>
        <p class="text-sm text-gray-500">${auth.authMessage}</p>
      </div>
      ${auth.hasError || auth.isTimedOut ? `
        <button id="btn-retry-auth" class="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all">
          Retry
        </button>
      ` : ""}
      ${DEV_MODE ? `
        <button id="btn-dev-mode" class="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all">
          Enter Dev Mode (Skip Auth)
        </button>
      ` : ""}
    </div>
  `;

  document.getElementById("btn-retry-auth")?.addEventListener("click", () => {
    reinitialize();
  });

  document.getElementById("btn-dev-mode")?.addEventListener("click", () => {
    enableDevMode();
  });
}

// Dev mode: simulate authenticated user
function enableDevMode() {
  const auth = getAuthState();
  auth.isAuthenticated = true;
  auth.hasError = false;
  auth.isTimedOut = false;
  auth.authMessage = "Dev Mode";
  auth.userData = {
    id: "dev_user_001",
    username: "DevUser",
    display_name: "Dev User",
    role: "user",
    country: "MA",
    pi_balance: 100,
    available_balance: 50,
    app_id: "zynmart-dev",
  };
  auth.piAccessToken = "dev-token";
  auth.listeners.forEach((fn) => fn());
}

// Main initialization
async function init() {
  // Global error handlers
  window.addEventListener("error", (e) => {
    console.error("[Global] Uncaught error:", e.error || e.message);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[Global] Unhandled rejection:", e.reason);
  });

  // Show loading while auth initializes
  renderAuthLoading();

  // Listen for auth changes
  onAuthChange(() => {
    const auth = getAuthState();
    if (auth.isAuthenticated) {
      initNotifications();
      setupWalletEventListeners();
      startRouter();
    } else if (auth.hasError || auth.isTimedOut) {
      renderAuthLoading();
    }
  });

  // Initialize Pi auth
  await initAuth();
}

init();
