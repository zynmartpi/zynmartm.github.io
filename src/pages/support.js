import { t, getDir } from "../stores/language-store.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";

export function renderSupportPage() {
  const app = document.getElementById("app");
  const dir = getDir();

  const contactMethods = [
    { title: t("email_support") || "Email Support", desc: "zyntrawalletp@gmail.com", color: "bg-primary/10 text-primary", action: "email" },
    { title: t("chat_support") || "Chat Support", desc: t("chat_support_desc") || "Chat with us", color: "bg-blue-50 text-blue-600", action: "wallet" },
  ];

  const faqs = [
    { q: t("support_faq_1_q") || "How do I make a payment?", a: t("support_faq_1_a") || "You can pay using Pi Network directly from the app." },
    { q: t("support_faq_2_q") || "How long does shipping take?", a: t("support_faq_2_a") || "Shipping times vary by seller and location." },
    { q: t("support_faq_3_q") || "Can I cancel an order?", a: t("support_faq_3_a") || "You can cancel before the seller processes it." },
    { q: t("support_faq_4_q") || "How do I become a seller?", a: t("support_faq_4_a") || "Add your first product to become a seller automatically." },
    { q: t("support_faq_5_q") || "What is ZYN balance?", a: t("support_faq_5_a") || "ZYN is our reward token earned by watching ads and adding products." },
  ];

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-[#fafafa] pb-12" dir="${dir}">
      <main class="p-4 space-y-8 mt-4">
        <!-- Contact Grid -->
        <div class="grid grid-cols-1 gap-4">
          ${contactMethods.map((m) => `
            <button class="support-contact bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:bg-gray-50 transition-colors text-start" data-action="${m.action}">
              <div class="p-4 rounded-2xl ${m.color}">
                ${m.action === "email"
                  ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>'
                  : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.038 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.038-8 9-8s9 3.582 9 8z"/></svg>'
                }
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-gray-900 leading-tight">${m.title}</h3>
                <p class="text-sm font-medium text-gray-500 mt-0.5">${m.desc}</p>
              </div>
              <svg class="w-5 h-5 text-gray-300 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          `).join("")}
        </div>

        <!-- FAQs -->
        <div class="space-y-4">
          <h2 class="text-lg font-bold text-gray-900 px-1">${t("faqs_label") || "FAQs"}</h2>
          <div class="space-y-3" id="faq-list">
            ${faqs.map((faq, i) => `
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button class="faq-toggle w-full p-6 text-start flex justify-between items-center bg-white hover:bg-gray-50/50 transition-colors" data-faq="${i}">
                  <span class="font-semibold text-gray-900 text-sm tracking-tight">${faq.q}</span>
                  <svg class="w-4 h-4 text-primary transition-transform duration-300 ${dir === "rtl" ? "rotate-180" : ""}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
                <div class="faq-answer px-6 pb-6 pt-0 hidden" data-faq-answer="${i}">
                  <div class="h-px bg-gray-50 mb-4"></div>
                  <p class="text-sm font-medium text-gray-500 leading-relaxed text-start">${faq.a}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </main>
    </div>
  `;

  renderHeader({ showBack: false, showSearch: false, showCategories: false });

  // Bind events
  document.querySelectorAll(".support-contact").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "email") window.open("mailto:zynmart.support@gmail.com", "_blank");
      else if (action === "wallet") navigate("/wallet");
    });
  });

  document.querySelectorAll(".faq-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.faq;
      const answer = document.querySelector(`[data-faq-answer="${idx}"]`);
      const icon = btn.querySelector("svg");
      if (answer) {
        answer.classList.toggle("hidden");
        if (icon) icon.style.transform = answer.classList.contains("hidden") ? "" : "rotate(90deg)";
      }
    });
  });
}
