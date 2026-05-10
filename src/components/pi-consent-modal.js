import { navigate } from "./router.js";
import { t } from "../stores/language-store.js";

const STORAGE_KEY = "zynmart-consent-given";

export function renderPiConsentModal() {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
  } catch { /* ignore */ }

  const overlay = document.createElement("div");
  overlay.id = "pi-consent-overlay";
  overlay.className = "fixed inset-0 z-[1000] flex items-center justify-center p-4";
  overlay.innerHTML = `
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="consent-backdrop"></div>
    <div class="relative w-full max-w-sm bg-white rounded-[2.5rem] p-6 shadow-2xl animate-fade-in space-y-6">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/10 rounded-xl">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <h2 class="text-lg font-bold text-gray-900">${t("app_consent")}</h2>
      </div>
      <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">${t("terms")}</span>
          <button class="text-xs text-primary hover:underline font-bold consent-link" data-href="/terms">${t("read_policy")}</button>
        </div>
        <div class="flex items-center justify-between pt-4 border-t border-gray-200">
          <span class="text-sm font-semibold text-gray-700">${t("privacy")}</span>
          <button class="text-xs text-primary hover:underline font-bold consent-link" data-href="/privacy">${t("read_policy")}</button>
        </div>
      </div>
      <button id="btn-consent-accept" class="w-full py-3.5 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/20 active:scale-95 transition-all">
        ${t("accept_and_continue")}
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("btn-consent-accept")?.addEventListener("click", () => {
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    overlay.remove();
  });

  document.getElementById("consent-backdrop")?.addEventListener("click", () => {
    // Can't dismiss without accepting
  });

  document.querySelectorAll(".consent-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const href = btn.dataset.href;
      if (href) navigate(href);
    });
  });
}
