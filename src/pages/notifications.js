import { getAuthState } from "../stores/pi-auth-store.js";
import { getNotifications, getUnreadCount, isLoading, markAsRead, markAllAsRead, onNotificationsChange } from "../stores/notifications-store.js";

export function renderNotificationsPage() {
  const auth = getAuthState();
  if (!auth.isAuthenticated) {
    return `
      <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div class="bg-white rounded-2xl p-8 shadow-sm text-center max-w-sm">
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 class="text-xl font-bold mb-2">Login Required</h2>
          <p class="text-gray-500 mb-6">Please log in to see your notifications.</p>
        </div>
      </div>
    `;
  }

  const notifications = getNotifications();
  const unreadCount = getUnreadCount();
  const loading = isLoading();

  return `
    <div class="min-h-screen bg-gray-50 pb-20">
      <!-- Header -->
      <div class="sticky top-0 z-30 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">Notifications</h1>
        ${unreadCount > 0 ? `
          <button id="mark-all-read" class="text-sm text-primary font-semibold">Mark all as read</button>
        ` : ''}
      </div>

      <!-- Notifications List -->
      <div class="p-4 space-y-3">
        ${loading ? `
          <div class="flex flex-col items-center justify-center py-20">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ` : notifications.length === 0 ? `
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p class="text-gray-500">No notifications yet</p>
          </div>
        ` : notifications.map(notif => `
          <div class="notification-item bg-white p-4 rounded-2xl shadow-sm border-l-4 ${notif.read ? 'border-transparent' : 'border-primary'}" data-id="${notif.id}">
            <div class="flex gap-4">
              <div class="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                ${getNotificationIcon(notif.type)}
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start">
                  <p class="font-bold text-sm">${notif.title || 'Notification'}</p>
                  <span class="text-[10px] text-gray-400">${formatTime(notif.createdAt)}</span>
                </div>
                <p class="text-gray-600 text-sm mt-1">${notif.body || ''}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getNotificationIcon(type) {
  switch(type) {
    case 'order':
    case 'new_order':
      return `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`;
    case 'payment':
      return `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    case 'system':
      return `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    default:
      return `<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>`;
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return date.toLocaleDateString();
}

export function setupNotificationsEventListeners() {
  const markAllBtn = document.getElementById('mark-all-read');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      await markAllAsRead();
      window.dispatchEvent(new CustomEvent('route-change'));
    });
  }

  document.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.dataset.id;
      await markAsRead(id);
      item.classList.remove('border-primary');
      item.classList.add('border-transparent');
    });
  });
}
