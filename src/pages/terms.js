import { t, getDir } from "../stores/language-store.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";

export function renderTermsPage() {
  const app = document.getElementById("app");
  const dir = getDir();

  const sections = [
    { title: t("terms_acceptance_title") || "Acceptance of Terms", desc: t("terms_acceptance_desc") || "By accessing and using ZynMart, you agree to be bound by these Terms of Service." },
    { title: t("terms_account_title") || "Account Responsibilities", desc: t("terms_account_desc") || "You are responsible for maintaining the confidentiality of your Pi Network account and for all activities under it." },
    { title: t("terms_conduct_title") || "User Conduct", desc: t("terms_conduct_desc") || "You agree not to use ZynMart for any unlawful purpose or in any way that could damage the platform." },
    { title: t("terms_ip_title") || "Intellectual Property", desc: t("terms_ip_desc") || "All content on ZynMart, including text, graphics, and software, is the property of ZynMart and protected by copyright laws." },
    { title: t("terms_dispute_title") || "Dispute Resolution", desc: t("terms_dispute_desc") || "Any disputes arising from the use of ZynMart shall be resolved through appropriate legal channels." },
  ];

  app.innerHTML = `
    <div class="min-h-screen bg-gray-50 pb-12" dir="${dir}">
      <div class="sticky top-0 z-50 bg-white border-b border-gray-100 p-4 flex items-center gap-4 shadow-sm">
        <button class="p-1 hover:bg-gray-50 rounded-full transition-colors" id="btn-back">
          <svg class="w-6 h-6 text-gray-700 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 class="text-lg font-black text-gray-900">${t("terms") || "Terms of Service"}</h1>
      </div>
      <main class="container mx-auto px-4 py-8 max-w-2xl">
        <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-8">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-black text-gray-900">${t("terms") || "Terms of Service"}</h2>
              <p class="text-xs text-gray-500 font-bold uppercase tracking-wider">${t("effective_date") || "Effective Date"}</p>
            </div>
          </div>
          <div class="prose prose-sm max-w-none text-start space-y-6 font-bold">
            ${sections.map((s) => `
              <section class="space-y-2">
                <h3 class="text-sm font-black text-gray-900 uppercase tracking-tight">${s.title}</h3>
                <p class="text-gray-600 leading-relaxed">${s.desc}</p>
              </section>
            `).join("")}
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById("btn-back")?.addEventListener("click", () => window.history.back());
}
