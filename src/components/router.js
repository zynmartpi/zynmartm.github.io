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
