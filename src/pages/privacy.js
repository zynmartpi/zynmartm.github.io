import { t, getDir } from "../stores/language-store.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";

export function renderPrivacyPage() {
  const app = document.getElementById("app");
  const dir = getDir();

  const sections = [
    { title: t("privacy_collect_title") || "Information We Collect", desc: t("privacy_collect_desc") || "We collect information you provide directly, such as your username, profile details, and transaction data." },
    { title: t("privacy_use_title") || "How We Use Your Information", desc: t("privacy_use_desc") || "We use your information to provide and improve our services, process transactions, and communicate with you." },
    { title: t("privacy_sharing_title") || "Information Sharing", desc: t("privacy_sharing_desc") || "We do not sell your personal information. We may share data with sellers to fulfill orders." },
    { title: t("privacy_rights_title") || "Your Rights", desc: t("privacy_rights_desc") || "You have the right to access, correct, or delete your personal information at any time." },
    { title: t("privacy_retention_title") || "Data Retention", desc: t("privacy_retention_desc") || "We retain your data as long as necessary to provide our services or as required by law." },
  ];

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-[#fafafa] pb-12" dir="${dir}">
      <main class="container mx-auto px-4 py-8 max-w-2xl mt-4">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-8">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">${t("privacy") || "Privacy Policy"}</h2>
              <p class="text-sm text-gray-500 font-medium">${t("effective_date") || "Effective Date"}</p>
            </div>
          </div>
          <div class="prose prose-sm max-w-none text-start space-y-6 font-medium">
            ${sections.map((s) => `
              <section class="space-y-2">
                <h3 class="text-sm font-bold text-gray-900">${s.title}</h3>
                <p class="text-gray-600 leading-relaxed">${s.desc}</p>
              </section>
            `).join("")}
          </div>
        </div>
      </main>
    </div>
  `;

  renderHeader({ showBack: false, showSearch: false, showCategories: false });
}
