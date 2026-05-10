import { t, getDir } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { db, doc, getDoc, updateDoc } from "../lib/firebase.js";
import { renderHeader } from "../components/header.js";
import { showToast } from "../components/toast.js";
import { navigate } from "../components/router.js";

export function renderShippingAddressPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const userData = getAuthState().userData;

  const profile = userData?.profileDetails || {};

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-[#fafafa] pb-12" dir="${dir}">
      <main class="p-4 space-y-6 mt-4">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900">${t("shipping_address") || "Shipping Address"}</h2>
              <p class="text-sm text-gray-500">${t("shipping_address_desc") || "Your delivery details"}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">${t("full_name") || "Full Name"}</label>
              <input type="text" id="inp-fullName" value="${profile.fullName || ""}" placeholder="${t("enter_full_name") || "Full name"}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all"/>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">${t("phone_number") || "Phone Number"}</label>
              <input type="tel" id="inp-phone" value="${profile.phoneNumber || ""}" placeholder="${t("enter_phone") || "Phone number"}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all"/>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-700">${t("country_label") || "Country"}</label>
                <input type="text" id="inp-country" value="${profile.country || ""}" placeholder="${t("country_label") || "Country"}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all"/>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-700">${t("city") || "City"}</label>
                <input type="text" id="inp-city" value="${profile.city || ""}" placeholder="${t("city") || "City"}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all"/>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">${t("address") || "Address"}</label>
              <textarea id="inp-address" rows="3" placeholder="${t("enter_address") || "Full address"}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all resize-none">${profile.address || ""}</textarea>
            </div>
          </div>

          <button id="btn-save" class="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all">${t("save") || "Save"}</button>
        </div>
      </main>
    </div>
  `;

  renderHeader({ showBack: false, showSearch: false, showCategories: false });

  document.getElementById("btn-save")?.addEventListener("click", async () => {
    const userId = getAuthState().userData?.id;
    if (!userId) { showToast(t("error_occurred") || "Error", "error"); return; }

    const profileDetails = {
      fullName: document.getElementById("inp-fullName")?.value || "",
      phoneNumber: document.getElementById("inp-phone")?.value || "",
      country: document.getElementById("inp-country")?.value || "",
      city: document.getElementById("inp-city")?.value || "",
      address: document.getElementById("inp-address")?.value || "",
    };

    try {
      await updateDoc(doc(db, "users", userId), { profileDetails });
      showToast(t("success") || "Saved!", "success");
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      if (redirect) navigate(redirect);
    } catch (e) {
      showToast(t("error_occurred") || "Error saving", "error");
    }
  });
}
