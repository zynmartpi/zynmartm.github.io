const icons = {
  success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>',
  error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>',
  info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
};

const colors = {
  success: { bg: "#ecfdf5", border: "#bbf7d0", text: "#166534", icon: "#16a34a" },
  error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "#dc2626" },
  info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: "#2563eb" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "#d97706" },
};

export function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const c = colors[type] || colors.info;
  const toast = document.createElement("div");
  toast.className = "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border min-w-[280px] max-w-[90vw] animate-fade-in";
  toast.style.cssText = `background:${c.bg};border-color:${c.border};`;
  toast.innerHTML = `
    <div style="color:${c.icon}">${icons[type] || icons.info}</div>
    <p style="color:${c.text};font-weight:600;font-size:14px;margin:0">${message}</p>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px) scale(0.95)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
