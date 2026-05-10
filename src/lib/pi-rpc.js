import { BACKEND_CONFIG } from "./system-config.js";

/**
 * Get real Pi balance from blockchain
 */
export async function getRealPiBalance(walletAddress) {
  if (!walletAddress) return 0;
  try {
    const response = await fetch(`${BACKEND_CONFIG.BLOCKCHAIN_BASE_URL}/accounts/${walletAddress}`);
    if (!response.ok) {
      if (response.status === 404) return 0;
      throw new Error(`Horizon API error: ${response.statusText}`);
    }
    const data = await response.json();
    const nativeBalance = data.balances?.find((b) => b.asset_type === "native");
    return nativeBalance ? parseFloat(nativeBalance.balance) : 0;
  } catch (error) {
    console.error("Failed to fetch blockchain balance:", error);
    throw error;
  }
}

/**
 * Fetch app-specific transactions from blockchain
 */
export async function getAppTransactions(walletAddress) {
  if (!walletAddress) return [];
  try {
    const url = `${BACKEND_CONFIG.BLOCKCHAIN_BASE_URL}/accounts/${walletAddress}/transactions?limit=20&order=desc`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Horizon API error: ${response.statusText}`);
    }
    const data = await response.json();
    const records = data._embedded?.records || [];
    return records
      .filter((tx) => {
        const memo = (tx.memo || "").toUpperCase();
        return memo.includes("PIMART") || memo.includes("ZYNMART");
      })
      .map((tx) => ({
        id: tx.id,
        memo: tx.memo,
        created_at: tx.created_at,
      }));
  } catch (error) {
    console.error("Failed to fetch app transactions:", error);
    return [];
  }
}
