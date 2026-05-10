import { ADS_CONFIG, BACKEND_CONFIG } from "../lib/system-config.js";
import { getAuthState, updateBalance } from "./pi-auth-store.js";
import { t } from "./language-store.js";
import { showToast } from "../components/toast.js";

const state = { isAdLoading: false };

export const isAdLoading = () => state.isAdLoading;

export const showRewardedAd = async () => {
  if (!ADS_CONFIG.ENABLED) { showToast("Ads are currently disabled.", "info"); return false; }
  if (state.isAdLoading) return false;
  if (typeof window === "undefined" || !window.Pi) { showToast(t("pi_not_found") || "Pi Browser not detected", "error"); return false; }
  const Pi = window.Pi;
  if (!Pi.Ads) { showToast(t("ads_sdk_not_ready") || "Ads SDK not ready", "error"); return false; }

  state.isAdLoading = true;
  const timeout = setTimeout(() => { state.isAdLoading = false; showToast(t("ads_timeout") || "Ads timeout", "error"); }, 25000);

  try {
    const adInfo = await Pi.Ads.showAd("rewarded");
    clearTimeout(timeout);
    state.isAdLoading = false;
    if (adInfo) {
      const actualAdId = adInfo.adId || adInfo.id || adInfo.token;
      const isCompleted = adInfo.isCompleted === true || adInfo.status === "completed" || adInfo.status === "success";
      if (actualAdId && isCompleted) {
        try {
          const result = await (await import("../lib/api.js")).api.post(`${BACKEND_CONFIG.BASE_URL}/v1/ads/verify`, { ad_id: actualAdId, ad_type: "rewarded" });
          if (result.data?.success) {
            showToast(t("reward_earned") || "Reward earned!", "success");
            if (result.data.new_balance !== undefined) updateBalance(result.data.new_balance);
            return true;
          }
        } catch (err) { showToast(t("reward_error") || "Reward verification failed", "error"); }
      } else if (isCompleted) {
        showToast("Pi Ads: Test reward granted!", "success");
        return true;
      }
    }
    return false;
  } catch (err) {
    clearTimeout(timeout);
    state.isAdLoading = false;
    showToast(`Ads Error: ${err.message || err}`, "error");
    return false;
  }
};

export const showInterstitialAd = async () => {
  if (!ADS_CONFIG.ENABLED) return false;
  if (state.isAdLoading) return false;
  if (typeof window === "undefined" || !window.Pi) return false;
  const Pi = window.Pi;
  if (!Pi.Ads) return false;

  state.isAdLoading = true;
  const timeout = setTimeout(() => { state.isAdLoading = false; }, 25000);

  try {
    const adInfo = await Pi.Ads.showAd("interstitial");
    clearTimeout(timeout);
    state.isAdLoading = false;
    return !!adInfo;
  } catch (err) {
    clearTimeout(timeout);
    state.isAdLoading = false;
    return false;
  }
};
