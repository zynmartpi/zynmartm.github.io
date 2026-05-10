import { db, doc, getDoc } from "../lib/firebase.js";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || Date.now().toString();

let hasChecked = false;

export function initVersionChecker() {
  if (hasChecked) return;
  hasChecked = true;

  const currentVersion = APP_VERSION;
  const storedVersion = sessionStorage.getItem("zynmart_app_version");

  if (storedVersion !== currentVersion) {
    sessionStorage.setItem("zynmart_app_version", currentVersion);
  }

  setTimeout(async () => {
    try {
      const configRef = doc(db, "config", "app");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const latestVersion = configSnap.data()?.deploy_version;
        if (latestVersion && latestVersion !== currentVersion) {
          console.warn(`Stale version detected! Current: ${currentVersion}, Latest: ${latestVersion}. Reloading...`);
          sessionStorage.setItem("zynmart_app_version", latestVersion);
          if ("caches" in window) {
            const cacheNames = await window.caches.keys();
            await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
          }
          window.location.reload();
        }
      }
    } catch (e) {
      console.warn("Version check failed:", e);
    }
  }, 5000);
}
