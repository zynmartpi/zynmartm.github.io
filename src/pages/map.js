import { t, getDir } from "../stores/language-store.js";
import { getProducts } from "../stores/products-store.js";
import { renderHeader } from "../components/header.js";
import { navigate } from "../components/router.js";

let mapInstance = null;
let markers = [];

export function renderMapPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const products = getProducts();
  const productsWithLocations = products.filter((p) => p.location);

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-white" dir="${dir}">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div id="map-container" class="w-full" style="height:calc(100vh - 64px);position:relative;">
        <div id="leaflet-map" class="w-full h-full"></div>
        <div id="map-loading" class="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center gap-3 z-10">
          <div class="w-12 h-12 bg-blue-600/10 rounded-full animate-pulse flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <p class="text-gray-400 font-black text-sm animate-pulse">Initializing Map...</p>
        </div>
      </div>
    </div>
    <style>
      .leaflet-popup-content-wrapper { border-radius: 20px !important; padding: 0 !important; overflow: hidden !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important; }
      .leaflet-popup-content { margin: 0 !important; width: 200px !important; }
      .leaflet-popup-tip { background: white !important; }
      .leaflet-container { font-family: inherit !important; }
      .custom-pi-marker { background: none !important; border: none !important; }
      .leaflet-control-attribution { display: none !important; }
    </style>
  `;

  renderHeader({ showSearch: false, showCategories: false });

  // Load Leaflet and initialize map
  loadLeafletMap(productsWithLocations);
}

async function loadLeafletMap(products) {
  // Check if Leaflet already loaded
  if (window.L) {
    initLeafletMap(products);
    return;
  }

  const script = document.createElement("script");
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  script.onload = () => initLeafletMap(products);
  script.onerror = () => {
    const loading = document.getElementById("map-loading");
    if (loading) loading.innerHTML = `<p class="text-red-500 font-bold">Failed to load map</p>`;
  };
  document.head.appendChild(script);
}

function initLeafletMap(products) {
  const loading = document.getElementById("map-loading");
  const mapEl = document.getElementById("leaflet-map");
  if (!mapEl || !window.L) return;

  if (loading) loading.style.display = "none";

  // Clean up previous instance
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }

  mapInstance = window.L.map(mapEl, { attributionControl: false }).setView([20, 0], 2);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapInstance);

  // Add product markers
  products.forEach((product) => {
    if (!product.location) return;
    const lat = product.location.lat || product.location.latitude;
    const lng = product.location.lng || product.location.longitude;
    if (!lat || !lng) return;

    const icon = window.L.divIcon({
      className: "custom-pi-marker",
      html: `<div style="background:#0aad0a;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px;box-shadow:0 4px 12px rgba(10,173,10,0.4);border:3px solid white;">π</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = window.L.marker([lat, lng], { icon }).addTo(mapInstance);
    marker.bindPopup(`
      <div style="padding:0;">
        <img src="${product.image || product.images?.[0] || 'https://placehold.co/200x120?text=No+Image'}" alt="${product.name}" style="width:200px;height:120px;object-fit:cover;" onerror="this.src='https://placehold.co/200x120?text=No+Image'" />
        <div style="padding:12px;">
          <p style="font-weight:800;font-size:13px;margin:0 0 4px;color:#21313c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${product.name}</p>
          <p style="font-weight:900;font-size:15px;margin:0;color:#0aad0a;">${(product.piPrice || 0).toFixed(3)} Pi</p>
        </div>
      </div>
    `);

    marker.on("click", () => {
      // Navigate on popup click
    });

    markers.push(marker);
  });

  // Fit bounds if there are markers
  if (markers.length > 0) {
    const group = window.L.featureGroup(markers);
    mapInstance.fitBounds(group.getBounds().pad(0.1));
  }
}
