import { db, doc, getDoc, setDoc, serverTimestamp } from "../lib/firebase.js";
import { PI_NETWORK_CONFIG } from "../lib/system-config.js";
import { initializeGlobalPayment, checkIncompletePayments } from "../lib/pi-payment.js";

const AUTH_CACHE_KEY = "zynmart_pi_auth_cache";

const state = {
  isAuthenticated: false,
  authMessage: "Initializing Pi Network...",
  hasError: false,
  isTimedOut: false,
  piAccessToken: null,
  userData: null,
  piScopes: [],
  appId: null,
  listeners: [],
};

export const getAuthState = () => state;

const notifyListeners = () => state.listeners.forEach((fn) => fn());
export const onAuthChange = (fn) => {
  state.listeners.push(fn);
  return () => { state.listeners = state.listeners.filter((l) => l !== fn); };
};

const cacheAuth = (accessToken, data, scopes) => {
  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ accessToken, userData: data, scopes, cachedAt: Date.now() }));
  } catch {}
};

const clearCachedAuth = () => {
  try { sessionStorage.removeItem(AUTH_CACHE_KEY); } catch {}
};

const restoreCachedAuth = () => {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.userData?.id) return false;
    state.piAccessToken = parsed.accessToken;
    setApiAuthToken(parsed.accessToken);
    state.userData = parsed.userData;
    state.piScopes = parsed.scopes || [];
    state.appId = parsed.userData.app_id;
    state.isAuthenticated = true;
    state.hasError = false;
    state.authMessage = "Authenticated";
    ensureUserInFirestore(parsed.userData);
    return true;
  } catch { return false; }
};

const ensureUserInFirestore = async (user) => {
  if (!user?.username) return;
  try {
    const userRef = doc(db, "users", user.username);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const refCode = localStorage.getItem("referral_code");
      await setDoc(userRef, {
        username: user.username,
        display_name: user.username,
        role: "user",
        available_balance: 0,
        pi_balance: 0,
        followers_count: 0,
        following_count: 0,
        rating: 5,
        verified: false,
        country: "",
        referred_by: refCode || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      if (refCode && refCode !== user.username) {
        try {
          const referrerRef = doc(db, "users", refCode);
          const referrerSnap = await getDoc(referrerRef);
          if (referrerSnap.exists()) {
            const rData = referrerSnap.data();
            const currentZyn = Number(rData.pi_balance !== undefined ? rData.pi_balance : (rData.wallet_balance || 0));
            await setDoc(referrerRef, { pi_balance: currentZyn + 10 });
          }
        } catch (err) { console.error("Failed to reward referrer", err); }
      }
      localStorage.removeItem("referral_code");
    }
  } catch (e) { console.error("Error ensuring user in Firestore:", e); }
};

const loadPiSDK = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.Pi !== "undefined") return resolve();
    const existing = document.querySelector('script[data-pi-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Pi SDK")));
      if (typeof window.Pi !== "undefined") resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = PI_NETWORK_CONFIG.SDK_URL;
    script.async = true;
    script.dataset.piSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pi SDK script"));
    document.head.appendChild(script);
  });
};

const ensurePiReady = async () => {
  if (typeof window === "undefined") return;
  if (typeof window.Pi === "undefined") await loadPiSDK();
  if (typeof window.Pi === "undefined") throw new Error("Pi SDK failed to load");
  await window.Pi.init({ version: "2.0", sandbox: PI_NETWORK_CONFIG.SANDBOX });
  initializeGlobalPayment();
};

const authenticateAndLogin = async (scopes) => {
  state.authMessage = "Authenticating with Pi Network...";
  notifyListeners();
  const piAuthResult = await window.Pi.authenticate(scopes, async (payment) => {
    await checkIncompletePayments(payment);
  });
  if (!piAuthResult?.accessToken) throw new Error("No access token received from Pi Network");

  state.piAccessToken = piAuthResult.accessToken;
  state.piScopes = scopes;

  // Build user data directly from Pi SDK (no backend needed)
  const piUser = piAuthResult.user || {};
  state.userData = {
    id: piUser.username || "unknown",
    username: piUser.username || "unknown",
    display_name: piUser.username || "unknown",
    role: "user",
    available_balance: 0,
    pi_balance: 0,
    country: "",
    app_id: "zynmart",
  };

  await ensureUserInFirestore(state.userData);
  await refreshUserData(state.userData.id);
  cacheAuth(piAuthResult.accessToken, state.userData, scopes);
};

export const refreshUserData = async (userId) => {
  const targetId = userId || state.userData?.id;
  if (!targetId) return;
  try {
    const userRef = doc(db, "users", targetId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      state.userData = { ...(state.userData || {}), ...userSnap.data() };
      cacheAuth(state.piAccessToken, state.userData, state.piScopes);
      notifyListeners();
    }
  } catch (e) { console.error("Failed to refresh user data:", e); }
};

export const updateBalance = async (newBalance) => {
  if (state.userData) {
    state.userData = { ...state.userData, available_balance: newBalance };
    cacheAuth(state.piAccessToken, state.userData, state.piScopes);
    try {
      await setDoc(doc(db, "users", state.userData.id), { available_balance: newBalance });
    } catch (e) { console.error("Failed to update balance:", e); }
    notifyListeners();
  }
};

export const updateZynBalance = async (newBalance) => {
  if (state.userData) {
    state.userData = { ...state.userData, pi_balance: newBalance };
    cacheAuth(state.piAccessToken, state.userData, state.piScopes);
    try {
      await setDoc(doc(db, "users", state.userData.id), { pi_balance: newBalance });
    } catch (e) { console.error("Failed to update Zyn balance:", e); }
    notifyListeners();
  }
};

export const updateUserRole = (newRole) => {
  if (state.userData) {
    state.userData = { ...state.userData, role: newRole };
    cacheAuth(state.piAccessToken, state.userData, state.piScopes);
    notifyListeners();
  }
};

export const updateCountry = async (country) => {
  if (state.userData) {
    state.userData = { ...state.userData, country };
    cacheAuth(state.piAccessToken, state.userData, state.piScopes);
    try {
      await setDoc(doc(db, "users", state.userData.id), { country });
    } catch (e) { console.error("Failed to update country:", e); }
    notifyListeners();
  }
};

export const ensurePaymentsAuth = async () => {
  if (state.piScopes.includes("payments")) return;
  await ensurePiReady();
  await authenticateAndLogin(["username", "payments"]);
  state.isAuthenticated = true;
  notifyListeners();
};

const initializePiAndAuthenticate = async () => {
  try {
    state.hasError = false;
    state.isTimedOut = false;
    state.authMessage = "Loading Pi Network SDK...";
    notifyListeners();
    const timeoutId = setTimeout(() => {
      state.isTimedOut = true;
      state.authMessage = "Authentication is taking longer than expected.";
      notifyListeners();
    }, 20000);
    try {
      await ensurePiReady();
      state.authMessage = "Authenticating with Pi...";
      notifyListeners();
      await authenticateAndLogin(["username"]);
      clearTimeout(timeoutId);
      state.hasError = false;
      state.isTimedOut = false;
      state.isAuthenticated = true;
      state.authMessage = "Authenticated";
      initializeGlobalPayment();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (err) {
    console.error("Pi Network initialization failure:", err);
    clearCachedAuth();
    state.hasError = true;
    state.isTimedOut = false;
    state.authMessage = err.message || "Authentication error";
    state.isAuthenticated = false;
  }
  notifyListeners();
};

export const initAuth = async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref) localStorage.setItem("referral_code", ref);

    const restored = restoreCachedAuth();
    if (restored) {
      try {
        await ensurePiReady().catch((e) => console.error("ensurePiReady failed", e));
        try { await authenticateAndLogin(["username", "payments"]); }
        catch { try { await authenticateAndLogin(["username"]); } catch {} }
      } catch {}
      notifyListeners();
      return;
    }
    setTimeout(() => initializePiAndAuthenticate(), 100);
  } catch (e) {
    state.hasError = true;
    state.authMessage = "Failed to initialize.";
    notifyListeners();
  }
};

export const reinitialize = () => initializePiAndAuthenticate();
