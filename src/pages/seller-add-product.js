import { t, getDir } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { db, doc, getDoc, setDoc, updateDoc } from "../lib/firebase.js";
import { CATEGORIES } from "../lib/categories.js";
import { renderHeader } from "../components/header.js";
import { showToast } from "../components/toast.js";
import { navigate } from "../components/router.js";
import { uploadImageToCloudinary } from "../lib/cloudinary.js";

const COLORS = [
  { hex: "#EF4444" }, { hex: "#3B82F6" }, { hex: "#10B981" }, { hex: "#F59E0B" },
  { hex: "#000000" }, { hex: "#FFFFFF" }, { hex: "#6B7280" }, { hex: "#8B5CF6" },
  { hex: "#EC4899" }, { hex: "#F97316" }, { hex: "#78350F" }, { hex: "#1E3A8A" },
];

let currentStep = 1;
let formData = { name: "", category: "", description: "", tags: "", usdPrice: "0.00", stock: "3", showColors: true, location: null };
let images = [];
let selectedColors = [];
let mapInstance = null;
let markerInstance = null;

export function renderAddProductPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-[#fafafa] pb-32" dir="${dir}">
      <div class="bg-white px-4 py-2 border-b border-gray-100">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-semibold text-primary">Step ${currentStep}/3</p>
          <span class="text-xs font-semibold opacity-30">ZYNMART</span>
        </div>
        <div class="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-primary transition-all duration-500" style="width:${(currentStep/3)*100}%"></div>
        </div>
      </div>
      <main class="container mx-auto px-4 py-8 max-w-lg" id="step-content"></main>
    </div>
  `;
  renderHeader({ showBack: false, showSearch: false, showCategories: false });
  renderStep();
}

function renderStep() {
  const c = document.getElementById("step-content");
  if (!c) return;
  const dir = getDir();

  if (currentStep === 1) renderStep1(c, dir);
  else if (currentStep === 2) renderStep2(c, dir);
  else if (currentStep === 3) renderStep3(c, dir);
}

function renderStep1(c, dir) {
  c.innerHTML = `
    <div class="space-y-8">
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21" stroke-width="2"/></svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">${t("visual_identity")||"Visual Identity"}</h3>
            <p class="text-sm text-gray-500">${t("upload_hint_images")||"Upload up to 3 images"}</p>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-3" id="img-grid">
          ${images.map((img,i)=>`
            <div class="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <img src="${img}" class="w-full h-full object-cover"/>
              <button class="rm-img absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full" data-i="${i}">✕</button>
              ${i===0?`<div class="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 text-center">${t("cover")||"Cover"}</div>`:""}
            </div>`).join("")}
          ${images.length<3?`
            <label class="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="file" multiple accept="image/*" id="file-in" class="hidden"/>
              <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4" stroke-width="2"/></svg>
              <span class="text-xs text-gray-400 mt-1">${images.length}/3</span>
            </label>`:""}
        </div>
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${t("product_name_label")||"Product Name"}</label>
            <input type="text" id="inp-name" value="${formData.name}" placeholder="${t("enter_product_name")||"Product name"}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all"/>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${t("category")||"Category"}</label>
            <select id="inp-cat" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all appearance-none">
              <option value="">${t("select_category")||"Select category"}</option>
              ${CATEGORIES.map(cat=>`<option value="${cat}" ${formData.category===cat?"selected":""}>${cat}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>
      <div class="fixed bottom-8 inset-x-4 max-w-lg mx-auto z-[150]">
        <button id="btn-next" class="w-full bg-primary text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all">${t("next")||"Next"} →</button>
      </div>
    </div>`;

  document.getElementById("file-in")?.addEventListener("change", async (e) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > 3) { showToast(t("max_images_error")||"Max 3 images","error"); return; }
    for (let f of files) {
      const localUrl = URL.createObjectURL(f);
      const uploadedUrl = await uploadImageToCloudinary(f);
      images.push(uploadedUrl || localUrl);
    }
    renderStep();
  });
  document.querySelectorAll(".rm-img").forEach(b => b.addEventListener("click", () => { images.splice(parseInt(b.dataset.i),1); renderStep(); }));
  document.getElementById("btn-next")?.addEventListener("click", () => {
    formData.name = document.getElementById("inp-name")?.value || "";
    formData.category = document.getElementById("inp-cat")?.value || "";
    if (!formData.name || images.length===0 || !formData.category) { showToast(t("fill_required_fields")||"Fill required fields","error"); return; }
    currentStep = 2; renderStep();
  });
}

function renderStep2(c, dir) {
  c.innerHTML = `
    <div class="space-y-8">
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900">${t("product_details")||"Product Details"}</h3>
            <p class="text-sm text-gray-500">${t("describe_your_item")||"Describe your item"}</p>
          </div>
        </div>
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${t("description")||"Description"}</label>
            <textarea id="inp-desc" rows="4" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all resize-none">${formData.description}</textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">${t("price_pi")||"Price (Pi)"}</label>
              <input type="number" id="inp-price" value="${formData.usdPrice}" step="0.001" min="0" max="10" class="w-full bg-white border border-primary/30 rounded-xl p-4 text-lg font-semibold text-primary outline-none focus:border-primary transition-all"/>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">${t("stock_label")||"Stock"}</label>
              <input type="number" id="inp-stock" value="${formData.stock}" min="1" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-lg font-semibold text-gray-900 outline-none focus:border-primary transition-all"/>
            </div>
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-between px-2">
              <p class="text-sm font-medium text-gray-700">${t("color_options")||"Colors"}</p>
              <button id="toggle-colors" class="w-12 h-6 rounded-full transition-all relative shadow-inner ${formData.showColors?"bg-primary":"bg-gray-200"}">
                <div class="absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.showColors?(dir==="rtl"?"right-1":"left-7"):(dir==="rtl"?"right-7":"left-1")}"></div>
              </button>
            </div>
            <div id="color-grid" class="${formData.showColors?"":"hidden"} flex flex-wrap gap-2.5 p-4 bg-gray-50/50 rounded-3xl border border-gray-100">
              ${COLORS.map(cl=>`
                <button class="color-btn w-9 h-9 rounded-xl border-2 transition-all ${selectedColors.includes(cl.hex)?"border-primary scale-90":"border-white"}" style="background:${cl.hex}" data-hex="${cl.hex}">
                  ${selectedColors.includes(cl.hex)?`<div class="w-2 h-2 rounded-full ${cl.hex==="#FFFFFF"?"bg-black":"bg-white"} mx-auto"></div>`:""}
                </button>`).join("")}
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">${t("tags")||"Tags"}</label>
            <input type="text" id="inp-tags" value="${formData.tags}" placeholder="${t("tags_placeholder_hint")||"Comma separated"}" class="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:border-primary transition-all"/>
          </div>
        </div>
      </div>
      <div class="fixed bottom-8 inset-x-4 max-w-lg mx-auto z-[150] flex gap-4">
        <button id="btn-prev" class="flex-1 bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-lg active:scale-95 transition-all">${t("back")||"Back"}</button>
        <button id="btn-next2" class="flex-[2] bg-primary text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all">${t("next")||"Next"} →</button>
      </div>
    </div>`;

  document.getElementById("toggle-colors")?.addEventListener("click", () => { formData.showColors = !formData.showColors; renderStep(); });
  document.querySelectorAll(".color-btn").forEach(b => b.addEventListener("click", () => {
    const hex = b.dataset.hex;
    selectedColors = selectedColors.includes(hex) ? selectedColors.filter(h=>h!==hex) : [...selectedColors, hex];
    renderStep();
  }));
  document.getElementById("btn-prev")?.addEventListener("click", () => { currentStep=1; renderStep(); });
  document.getElementById("btn-next2")?.addEventListener("click", () => {
    formData.description = document.getElementById("inp-desc")?.value || "";
    formData.usdPrice = document.getElementById("inp-price")?.value || "0";
    formData.stock = document.getElementById("inp-stock")?.value || "1";
    formData.tags = document.getElementById("inp-tags")?.value || "";
    if (!formData.description || parseFloat(formData.usdPrice) <= 0) { showToast(t("price_desc_required")||"Price & description required","error"); return; }
    currentStep = 3; renderStep();
  });
}

function renderStep3(c, dir) {
  c.innerHTML = `
    <div class="space-y-8">
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900">${t("product_location")||"Location"}</h3>
              <p class="text-sm text-gray-500">${t("meeting_point")||"Meeting point"}</p>
            </div>
          </div>
          <button id="btn-gps" class="bg-primary p-3 rounded-xl text-white active:scale-95 transition-all shadow-lg shadow-primary/30">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
        </div>
        <div class="space-y-6">
          <div class="relative w-full h-[320px] rounded-xl overflow-hidden border border-gray-200 shadow-inner">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
            <div id="leaflet-map" class="w-full h-full z-0"></div>
          </div>
          <div id="location-status" class="p-5 rounded-3xl border flex items-center gap-4 ${formData.location?"bg-green-50 border-green-100":"bg-amber-50 border-amber-100"}">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white ${formData.location?"bg-green-500":"bg-amber-500"}">
              ${formData.location
                ?'<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
                :'<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>'}
            </div>
            <div>
              <p class="text-sm font-bold ${formData.location?"text-green-900":"text-amber-900"}">${formData.location?(t("location_selected")||"Location selected"):(t("select_location")||"Select location")}</p>
              <p class="text-xs ${formData.location?"text-green-600":"text-amber-600"}">${formData.location?(t("coordinates_synced")||"Coordinates synced"):(t("click_on_map")||"Click on map")}</p>
            </div>
          </div>
        </div>
      </div>
      <button id="btn-publish" class="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50" ${!formData.location?"disabled":""}>
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        ${t("publish_product")||"Publish Product"}
      </button>
    </div>`;

  // Load Leaflet map
  loadMap();

  document.getElementById("btn-gps")?.addEventListener("click", () => {
    if (navigator.geolocation) {
      showToast(t("getting_location")||"Getting location...","info");
      navigator.geolocation.getCurrentPosition((pos) => {
        formData.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        showToast(t("location_set")||"Location set","success");
        if (mapInstance) { mapInstance.flyTo([formData.location.lat, formData.location.lng], 16); updateMarker(); }
        renderStep();
      }, () => showToast(t("location_error")||"Location error","error"), { enableHighAccuracy: true, timeout: 10000 });
    }
  });

  document.getElementById("btn-publish")?.addEventListener("click", async () => {
    if (!formData.location) { showToast(t("location_required")||"Location required","error"); return; }
    const userData = getAuthState().userData;
    if (!userData) return;
    try {
      const productData = {
        name: formData.name, category: formData.category, description: formData.description,
        price_pi: parseFloat(formData.usdPrice), stock_quantity: parseInt(formData.stock),
        images, tags: formData.tags.split(",").map(t=>t.trim()).filter(t=>t),
        colors: formData.showColors ? selectedColors : [],
        location: formData.location, is_active: true,
        seller_id: userData.username || "pi_user", seller_uid: userData.id || "pi_user",
        seller_name: userData.display_name || userData.username || "Seller",
        created_at: new Date().toISOString(),
      };
      const productsRef = db.collection("products");
      const newDocRef = await productsRef.addDoc(productData);
      const actualId = newDocRef.name ? newDocRef.name.split("/").pop() : newDocRef.id;

      // Reward 5 ZYN
      try {
        const userRef = doc(db, "users", userData.id);
        const userSnap = await getDoc(userRef);
        const currentZyn = Number(userSnap.exists() ? (userSnap.data().pi_balance || 0) : 0);
        await updateDoc(userRef, { pi_balance: currentZyn + 5, role: "seller" });
      } catch {}

      showToast(t("publish_success")||"Product published!","success");
      navigate(`/product?id=${actualId}`);
    } catch (e) {
      console.error(e);
      showToast(t("publish_error")||"Error publishing","error");
    }
  });
}

function loadMap() {
  if (window.L) { initMap(); return; }
  const s = document.createElement("script");
  s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  s.onload = initMap;
  document.head.appendChild(s);
}

function initMap() {
  const el = document.getElementById("leaflet-map");
  if (!el || !window.L) return;
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }
  const lat = formData.location?.lat || 20;
  const lng = formData.location?.lng || 0;
  const zoom = formData.location ? 13 : 2;
  mapInstance = window.L.map(el, { attributionControl: false }).setView([lat, lng], zoom);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapInstance);
  mapInstance.on("click", (e) => {
    formData.location = { lat: e.latlng.lat, lng: e.latlng.lng };
    updateMarker();
    renderStep();
  });
  if (formData.location) updateMarker();
}

function updateMarker() {
  if (!window.L || !mapInstance || !formData.location) return;
  if (markerInstance) markerInstance.setLatLng([formData.location.lat, formData.location.lng]);
  else {
    markerInstance = window.L.marker([formData.location.lat, formData.location.lng], { draggable: true }).addTo(mapInstance);
    markerInstance.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      formData.location = { lat: pos.lat, lng: pos.lng };
    });
  }
}
