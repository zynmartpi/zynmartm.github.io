const routes = {};
let currentRoute = null;

export function addRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.history.pushState({}, "", path);
  handleRoute();
}

export function getParams() {
  const search = window.location.search;
  return Object.fromEntries(new URLSearchParams(search));
}

export function getHash() {
  return window.location.hash;
}

function handleRoute() {
  const path = window.location.pathname;
  const search = window.location.search;

  try {
    // Try exact match first
    if (routes[path]) {
      currentRoute = path;
      routes[path]();
      return;
    }

    // Try pattern matching (e.g., /product matches /product)
    for (const routePath of Object.keys(routes)) {
      if (path.startsWith(routePath) && routePath !== "/") {
        currentRoute = routePath;
        routes[routePath]();
        return;
      }
    }

    // Default to home
    if (routes["/"]) {
      currentRoute = "/";
      routes["/"]();
    }
  } catch (err) {
    console.error("[Router] Error rendering page:", err);
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = '<div class="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-8 text-center"><div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center"><svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><h2 class="text-lg font-bold text-gray-900">Something went wrong</h2><p class="text-sm text-gray-500 max-w-md">' + (err.message || "An unexpected error occurred.") + '</p><button onclick="window.location.reload()" class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold btn-press hover:bg-primary/90"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Try Again</button></div>';
    }
  }
}

export function startRouter() {
  window.addEventListener("popstate", handleRoute);
  handleRoute();
}

// Handle link clicks globally
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (link) {
    e.preventDefault();
    const href = link.getAttribute("href") || link.getAttribute("data-link");
    navigate(href);
  }
});
