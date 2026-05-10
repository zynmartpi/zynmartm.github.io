import { t, getDir } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { db, doc, getDoc, updateDoc } from "../lib/firebase.js";
import { CATEGORIES } from "../lib/categories.js";
import { renderHeader } from "../components/header.js";
import { showToast } from "../components/toast.js";
import { navigate, getParams } from "../components/router.js";

const COLORS = [
  { hex: "#EF4444" }, { hex: "#3B82F6" }, { hex: "#10B981" }, { hex: "#F59E0B" },
  { hex: "#000000" }, { hex: "#FFFFFF" }, { hex: "#6B7280" }, { hex: "#8B5CF6" },
  { hex: "#EC4899" }, { hex: "#F97316" }, { hex: "#78350F" }, { hex: "#1E3A8A" },
];

let formData = { name: "", category: "", description: "", tags: "", usdPrice: "0.00", stock: "3", showColors: true, location: null };
let images = [];
let selectedColors = [];
let productId = null;
let loading = true;

export async function renderEditProductPage() {
  const params = getParams();
  productId = params.id;
  if (!productId) { showToast("Product ID required", "error"); navigate("/seller/dashboard"); return; }

  const app = document.getElementById("app");
  const dir = getDir();
  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-[#fafafa] pb-32" dir="${dir}">
      <div class="bg-white px-4 py-2 border-b border-gray-100 flex items-center justify-between">
        <h1 class="text-lg font-black text-gray-900">${t("edit_product") || "Edit Product"}</h1>
        <span class="text-xs font-semibold opacity-30">ZYNMART</span>
      </div>
      <main class="container mx-auto px-4 py-8 max-w-lg" id="edit-content">
        <div class="flex items-center justify-center py-20">
          <svg class="w-10 h-10 animate-spin text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        </div>
      </main>
    </div>
  `;
  renderHeader({ showBack: false, showSearch: false, showCategories: false });

  await loadProduct();
}

async function loadProduct() {
  try {
    const productRef = doc(db, "products", productId);
    const snap = await getDoc(productRef);
    if (!snap.exists()) { showToast("Product not found", "error"); navigate("/seller/dashboard"); return; }
    const data = snap.data();
    formData = {
      name: data.name || "",
      category: data.category || "",
      description: data.description || "",
      tags: (data.tags || []).join(", "),
      usdPrice: String(data.price_pi || data.piPrice || 0),
      stock: String(data.stock_quantity || data.stock || 1),
      showColors: true,
      location: data.location || null,
    };
    images = data.images || (data.image ? [data.image] : []);
    selectedColors = data.colors || [];
  } catch (e) {
    console.error("Failed to load product:", e);
    showToast("Failed to load product", "error");
    navigate("/seller/dashboard");
    return;
  }
  loading = false;
  renderEditForm();
}

function renderEditForm() {
  const c = document.getElementById("edit-content");
  if (!c) return;
  const dir = getDir();

  c.innerHTML = `
    <div class="space-y-8">
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21" stroke-width="2"/></svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">${t("product_details")}</h3>
            <p class="text-sm text-gray-500">${t("describe_your_item")}</p>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-3" id="img-grid">
          ${images.map((img, i) => `
            <div class="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <img src="${img}" class="w-full h-full object-cover"/>
              <button class="rm-img absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full" data-i="${i}">✕</button>
              ${i === 0 ? `<div class="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center">${t("cover")}</div>` : ""}
            </div>`).join("")}
          ${images.length < 3 ? `
            <label class="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="file" multiple accept="image/*" id="file-in" class="hidden"/>
              <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4" stroke-width="2"/></svg>
              <span class="text-xs text-gray-400 mt-1">${images.length}/3</span>
            </label>` : ""}
        </div>
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${t("product_name_label")}</label>
            <input type="text" id="inp-name" value="${formData.name}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all"/>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${t("category")}</label>
            <select id="inp-cat" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all">
              <option value="">${t("select_category")}</option>
              ${CATEGORIES.map(cat => `<option value="${cat}" ${formData.category === cat ? "selected" : ""}>${cat}</option>`).join("")}
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${t("description")}</label>
            <textarea id="inp-desc" rows="4" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all resize-none">${formData.description}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">${t("price_pi")}</label>
              <input type="number" id="inp-price" value="${formData.usdPrice}" step="0.001" min="0" max="10" class="w-full bg-white border border-primary/30 rounded-xl p-4 text-lg font-semibold text-primary outline-none focus:border-primary transition-all"/>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">${t("stock_label")}</label>
              <input type="number" id="inp-stock" value="${formData.stock}" min="1" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-lg font-semibold text-gray-900 outline-none focus:border-primary transition-all"/>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${t("tags")}</label>
            <input type="text" id="inp-tags" value="${formData.tags}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all"/>
          </div>
        </div>
      </div>
      <button id="btn-update" class="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        ${t("update_success") || "Update Product"}
      </button>
    </div>`;

  document.getElementById("file-in")?.addEventListener("change", async (e) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 3) { showToast(t("max_images_error"), "error"); return; }
    for (let f of files) images.push(URL.createObjectURL(f));
    renderEditForm();
  });
  document.querySelectorAll(".rm-img").forEach(b => b.addEventListener("click", () => { images.splice(parseInt(b.dataset.i), 1); renderEditForm(); }));
  document.getElementById("btn-update")?.addEventListener("click", handleUpdate);
}

async function handleUpdate() {
  const name = document.getElementById("inp-name")?.value?.trim();
  const category = document.getElementById("inp-cat")?.value;
  const description = document.getElementById("inp-desc")?.value?.trim();
  const price = parseFloat(document.getElementById("inp-price")?.value);
  const stock = parseInt(document.getElementById("inp-stock")?.value);
  const tags = document.getElementById("inp-tags")?.value?.split(",").map(t => t.trim()).filter(t => t) || [];

  if (!name || images.length === 0 || !category || !description || !price || price <= 0) {
    showToast(t("fill_required_fields"), "error"); return;
  }

  const btn = document.getElementById("btn-update");
  if (btn) { btn.disabled = true; btn.innerHTML = `<div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>`; }

  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      name, category, description,
      price_pi: price,
      stock_quantity: stock,
      images,
      tags,
      colors: selectedColors,
      updated_at: new Date().toISOString(),
    });
    showToast(t("update_success") || "Product updated!", "success");
    navigate(`/product?id=${productId}`);
  } catch (e) {
    console.error(e);
    showToast(t("publish_error") || "Error updating", "error");
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> ${t("update_success") || "Update Product"}`; }
  }
}
