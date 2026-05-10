import { PAYMENT_URLS, PI_BLOCKCHAIN_URLS } from "./system-config.js";

let rewardHandler = null;

export const setPaymentRewardHandler = (handler) => {
  rewardHandler = handler;
};

// Direct POST to Netlify functions or local server (like wallet pi)
const apiPost = async (url, payload) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  }
  return data;
};

const checkPaymentValid = async (txid, expectedAmount) => {
  try {
    const response = await fetch(PI_BLOCKCHAIN_URLS.GET_TRANSACTION(txid));
    const data = await response.json();
    if (!response.ok) return false;
    const records = data._embedded?.records;
    if (!records || records.length === 0) return false;
    const onchainAmount = parseFloat(records[0].amount);
    return onchainAmount >= expectedAmount;
  } catch (error) {
    console.error("Failed to validate payment on blockchain:", error);
    return false;
  }
};

const getSenderAddress = async (txid) => {
  try {
    const response = await fetch(PI_BLOCKCHAIN_URLS.GET_TRANSACTION_DETAILS(txid));
    const data = await response.json();
    return data.source_account || null;
  } catch (error) {
    console.error("Failed to get sender address:", error);
    return null;
  }
};

const completePaymentWithReward = async (payment, txidFromUser) => {
  try {
    const isPaymentValid = await checkPaymentValid(txidFromUser, payment.amount);
    if (!isPaymentValid) return;
    await apiPost(PAYMENT_URLS.COMPLETE, { paymentId: payment.identifier, txid: payment.transaction.txid });
    if (rewardHandler) rewardHandler(payment.metadata);
  } catch (error) {
    console.error("Failed to complete payment:", error);
    throw error;
  }
};

const createPaymentCallbacks = (options) => ({
  onReadyForServerApproval: async (paymentId) => {
    try { await apiPost(PAYMENT_URLS.APPROVE, { paymentId }); }
    catch (error) { console.error("Failed to approve payment:", error); }
  },
  onReadyForServerCompletion: async (paymentId, txid) => {
    try {
      await apiPost(PAYMENT_URLS.COMPLETE, { paymentId, txid });
      if (rewardHandler) rewardHandler(options.metadata);
      const walletAddress = await getSenderAddress(txid);
      const enrichedMetadata = { ...options.metadata, wallet_address: walletAddress };
      if (options.onComplete) options.onComplete(enrichedMetadata);
    } catch (error) {
      console.error("Failed to complete payment:", error);
      if (options.onError) options.onError(error instanceof Error ? error : new Error("Payment completion failed"));
    }
  },
  onCancel: (paymentId) => {
    console.log("Payment cancelled:", paymentId);
    apiPost(PAYMENT_URLS.CANCEL, { paymentId }).catch(() => {});
    if (options.onCancel) options.onCancel(paymentId);
  },
  onError: (error, payment) => {
    console.error("Payment error:", error, payment);
    if (options.onError) options.onError(error, payment);
  },
});

export const pay = async (options) => {
  const paymentData = { amount: options.amount, memo: options.memo || `Payment of ${options.amount} Pi`, metadata: options.metadata };
  const callbacks = createPaymentCallbacks(options);
  try {
    window.Pi.createPayment(paymentData, callbacks);
  } catch (error) {
    console.error("Failed to create payment:", error);
    if (options.onError) options.onError(error instanceof Error ? error : new Error("Failed to create payment"));
    throw error;
  }
};

export const checkIncompletePayments = async (payment) => {
  try {
    const paymentId = payment && payment.identifier;
    const txid = payment && payment.transaction && payment.transaction.txid;
    if (paymentId && txid) {
      await apiPost(PAYMENT_URLS.COMPLETE, { paymentId, txid });
    } else if (paymentId) {
      await apiPost(PAYMENT_URLS.CANCEL, { paymentId });
    }
  } catch (error) {
    console.error("Failed to notify incomplete payment:", error);
  }
};

export const initializeGlobalPayment = () => {
  if (typeof window !== "undefined") window.pay = pay;
};
