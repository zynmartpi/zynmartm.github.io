import { db, doc, addDoc, getDocs, query, collection, where, serverTimestamp, updateDoc, onSnapshot } from "../lib/firebase.js";
import { getAuthState } from "./pi-auth-store.js";

const state = {
  notifications: [],
  loading: true,
  listeners: [],
};

export const getNotifications = () => state.notifications;
export const getUnreadCount = () => state.notifications.filter((n) => !n.read).length;
export const isLoading = () => state.loading;

const notify = () => state.listeners.forEach((fn) => fn());
export const onNotificationsChange = (fn) => {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter((l) => l !== fn); };
};

let unsubscribe = null;

export const initNotifications = () => {
  const userId = getAuthState().userData?.username || getAuthState().userData?.id;
  if (!userId) { state.loading = false; notify(); return; }

  const q = query(collection(db, "notifications"), where("toUserId", "==", userId));
  unsubscribe = onSnapshot(q, (snapshot) => {
    state.notifications = snapshot.docs
      .map((d) => {
        const data = d.data();
        return { id: d.id, type: data.type || "new_order", title: data.title || "", body: data.body || "", read: data.read || false, createdAt: data.createdAt || "", link: data.link || "", fromUserId: data.fromUserId || "" };
      })
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    state.loading = false;
    notify();
  });
};

export const markAsRead = async (id) => {
  state.notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  try { await updateDoc(doc(db, "notifications", id), { read: true }); } catch (e) { console.error("Error marking notification as read:", e); }
  notify();
};

export const markAllAsRead = async () => {
  const unread = state.notifications.filter((n) => !n.read);
  state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
  try { await Promise.all(unread.map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }))); } catch (e) { console.error("Error marking all as read:", e); }
  notify();
};

export const addNotification = async (notification) => {
  const userId = getAuthState().userData?.username || getAuthState().userData?.id;
  try {
    await addDoc(collection(db, "notifications"), { ...notification, toUserId: notification.fromUserId ? undefined : userId, read: false, createdAt: serverTimestamp() });
  } catch (e) { console.error("Error adding notification:", e); }
};

export const sendNotification = async (toUserId, notification) => {
  try {
    await addDoc(collection(db, "notifications"), { ...notification, toUserId, read: false, createdAt: serverTimestamp() });
  } catch (e) { console.error("Error sending notification:", e); }
};
