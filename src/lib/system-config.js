export const PI_NETWORK_CONFIG = {
  SDK_URL: "https://sdk.minepi.com/pi-sdk.js",
  SANDBOX: false,
};

export const ADS_CONFIG = {
  APP_STUDIO_ADS_ID: "",
  ENABLED: true,
};

export const BACKEND_CONFIG = {
  BLOCKCHAIN_BASE_URL: "https://api.mainnet.minepi.com",
  RPC_URL: "https://rpc.mainnet.minepi.com",
};

// Payment URLs: Vercel API routes (rewrites handle the mapping)
export const PAYMENT_URLS = {
  APPROVE: "/payment/approve",
  COMPLETE: "/payment/complete",
  CANCEL: "/payment/cancel",
};

export const PI_BLOCKCHAIN_URLS = {
  GET_TRANSACTION: (txid) => `${BACKEND_CONFIG.BLOCKCHAIN_BASE_URL}/transactions/${txid}/effects`,
  GET_TRANSACTION_DETAILS: (txid) => `${BACKEND_CONFIG.BLOCKCHAIN_BASE_URL}/transactions/${txid}`,
};

// Legacy compatibility
export const BACKEND_URLS = {
  APPROVE_PAYMENT: (paymentId) => PAYMENT_URLS.APPROVE,
  COMPLETE_PAYMENT: (paymentId) => PAYMENT_URLS.COMPLETE,
  CANCEL_PAYMENT: (paymentId) => PAYMENT_URLS.CANCEL,
};
