import { getAuthState, ensurePaymentsAuth } from "../stores/pi-auth-store.js";
import { db, doc, getDoc, updateDoc, addDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "../lib/firebase.js";
import { renderHeader } from "../components/header.js";
import { t, getDir } from "../stores/language-store.js";
import { navigate } from "../components/router.js";
import { showToast } from "../components/toast.js";

let walletState = {
  piBalance: 0,
  zynBalance: 0,
  piReward: 0,
  walletAddress: null,
  selectedBalance: "pi",
  loading: true,
  isDepositOpen: false,
  depositAmount: "",
  isDepositing: false,
  withdrawAmount: "",
  isWithdrawing: false,
  transactions: [],
};

export function renderWalletPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const auth = getAuthState();
  const s = walletState;

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-gray-50 pb-24" dir="${dir}">
      <div class="container mx-auto px-4 py-6 space-y-6">

        <!-- TOP BALANCE BUTTONS GRID -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <!-- Pi Button -->
          <button id="btn-select-pi" class="flex flex-col items-center justify-center p-4 rounded-xl transition-all border-2 ${s.selectedBalance === 'pi' ? 'bg-primary text-white border-primary active:scale-95' : 'bg-white text-gray-500 border-gray-100 hover:border-primary/30'}">
            <div class="p-2 rounded-xl mb-2 ${s.selectedBalance === 'pi' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <span class="text-xs font-semibold mb-1">Pi</span>
            <span class="text-sm font-bold">${s.loading ? "..." : s.piBalance.toFixed(3)}</span>
          </button>

          <!-- Zyn Button -->
          <button id="btn-select-zyn" class="flex flex-col items-center justify-center p-4 rounded-xl transition-all border-2 ${s.selectedBalance === 'zyn' ? 'bg-primary text-white border-primary active:scale-95' : 'bg-white text-gray-500 border-gray-100 hover:border-primary/30'}">
            <div class="p-2 rounded-xl mb-2 ${s.selectedBalance === 'zyn' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <span class="text-xs font-semibold mb-1">Zyn</span>
            <span class="text-sm font-bold">${s.loading ? "..." : s.zynBalance.toFixed(3)}</span>
          </button>
        </div>

        <!-- PI DETAIL CARD -->
        ${s.selectedBalance === 'pi' ? `
          <div class="bg-primary rounded-2xl p-6 text-white relative overflow-hidden border border-primary/20">
            <div class="absolute top-0 right-0 p-8 opacity-10">
              <svg class="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="relative z-10 space-y-6">
              <div class="flex justify-between items-center">
                <div>
                  <div class="text-white/80 text-sm font-medium mb-1">${t("available_balance") || "Available Balance"}</div>
                  <div class="flex items-baseline gap-2">
                    <span class="text-4xl font-bold">${s.loading ? "..." : s.piBalance.toFixed(4)}</span>
                    <span class="text-xl font-medium text-white/80">Pi</span>
                  </div>
                </div>
                <button id="btn-refresh-balance" class="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 ${s.loading ? 'animate-spin' : ''}">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
              <button id="btn-deposit" class="w-full bg-white text-primary py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                ${t("deposit") || "Deposit"}
              </button>
            </div>
          </div>
        ` : ''}

        <!-- ZYN DETAIL CARD -->
        ${s.selectedBalance === 'zyn' ? `
          <div class="bg-primary rounded-2xl p-6 text-white relative overflow-hidden border border-primary/20">
            <div class="absolute top-0 right-0 p-8 opacity-10">
              <svg class="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="relative z-10 space-y-6">
              <div class="space-y-1">
                <div class="text-white/80 text-sm font-medium mb-1">${t("zyn_label") || "ZYN Rewards"}</div>
                <div class="flex items-baseline gap-2">
                  <span class="text-4xl font-bold">${s.loading ? "..." : s.zynBalance.toFixed(4)}</span>
                  <span class="text-xl font-medium text-white/80">Zyn</span>
                </div>
              </div>
              <div class="pt-6 border-t border-white/10 space-y-4">
                <div class="flex justify-between items-end">
                  <label class="text-xs font-semibold text-white/80 capitalize">${t("withdraw_zyn_label") || "Withdraw ZYN to your wallet"}</label>
                  <span class="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">Limit: 20 ZYN</span>
                </div>
                <input id="input-withdraw-amount" type="number" step="0.01" value="${s.withdrawAmount}" placeholder="0.0000"
                  class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all" ${s.isWithdrawing ? 'disabled' : ''} />
                <button id="btn-withdraw-zyn" class="w-full bg-white text-primary py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50" ${s.isWithdrawing || !s.withdrawAmount || !s.walletAddress ? 'disabled' : ''} title="${!s.walletAddress ? (t("wallet_address_required") || "Please add wallet address first") : ''}">
                  ${s.isWithdrawing ? (t("processing") || "Processing...") : (t("withdraw_to_wallet") || "Withdraw to saved wallet")}
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- RECENT ACTIVITY SECTION -->
        <div class="space-y-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              ${t("recent_activity") || "Recent Activity"}
            </h3>
            <button id="btn-refresh-history" class="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              ${t("view_all") || "View All"}
            </button>
          </div>
          <div class="space-y-3">
            ${s.transactions.length === 0 ? `
              <div class="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <div class="bg-gray-50 w-12 h-12 rounded-xl border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <p class="text-gray-500 font-medium text-sm">${t("no_transactions") || "No transactions yet"}</p>
              </div>
            ` : s.transactions.map(tx => `
              <div class="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-primary/20 transition-all">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'received' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
                    ${tx.type === 'received'
                      ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="rotate(135 12 12)"/></svg>'
                      : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="rotate(45 12 12)"/></svg>'
                    }
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-semibold text-gray-900 text-sm line-clamp-1">${tx.title}</h4>
                      ${tx.isVerified ? '<div class="p-0.5 bg-blue-50 text-blue-600 rounded-full" title="On-chain verified"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' : ''}
                    </div>
                    <p class="text-[10px] text-gray-400 font-medium">${formatTxDate(tx.createdAt, dir)}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-sm ${tx.type === 'received' ? 'text-green-600' : 'text-gray-900'}">
                    ${tx.type === 'received' ? '+' : '-'} ${tx.amount}
                  </div>
                  ${tx.txid ? `<a href="https://api.mainnet.minepi.com/explorer/transactions/${tx.txid}" target="_blank" rel="noreferrer" class="text-xs text-primary hover:underline font-medium mt-1 block">${t("view_explorer") || "Explorer"}</a>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- DEPOSIT MODAL -->
      ${s.isDepositOpen ? renderDepositModal() : ''}
    </div>
  `;

  renderHeader();
  bindWalletEvents();
}

function renderDepositModal() {
  const s = walletState;
  return `
    <div id="deposit-overlay" class="fixed inset-0 bg-black/50 dialog-backdrop z-50 flex items-end justify-center" onclick="if(event.target===this){document.getElementById('deposit-overlay').remove();walletState.isDepositOpen=false;}">
      <div class="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div class="text-center">
          <div class="p-4 bg-primary/10 rounded-3xl mb-2 relative inline-block">
            <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="flex items-center justify-center gap-2 mt-2">
            <div class="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <span class="font-black text-gray-900 tracking-tighter">ZYNMART PAY</span>
          </div>
          <h2 class="text-2xl font-black uppercase tracking-tight mt-3">${t("deposit_pi_title") || "Deposit Pi"}</h2>
          <p class="text-sm font-bold text-gray-500 leading-relaxed px-4 mt-1">${t("deposit_pi_desc") || "Deposit Pi to your wallet balance"}</p>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-black uppercase text-gray-500 ml-1">${t("amount_to_deposit_label") || "Amount to deposit"}</label>
            <div class="relative">
              <input id="input-deposit-amount" type="number" step="0.01" value="${s.depositAmount}" placeholder="0.00"
                class="w-full rounded-2xl border-2 border-gray-200 focus:border-primary h-14 font-bold text-xl pr-12 px-4 focus:outline-none" ${s.isDepositing ? 'disabled' : ''} />
              <div class="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-400">Pi</div>
            </div>
            ${s.walletAddress ? `<div class="text-[8px] text-gray-400 ml-1 font-mono">${s.walletAddress.substring(0, 8)}...${s.walletAddress.substring(s.walletAddress.length - 8)}</div>` : ''}
            ${s.depositAmount && !isNaN(parseFloat(s.depositAmount)) ? `
              <div class="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-bold text-primary uppercase">${t("you_will_get") || "You will get"}</span>
                  <span class="text-lg font-black text-primary">${parseFloat(s.depositAmount).toFixed(3)} Pi</span>
                </div>
              </div>
            ` : ''}
          </div>
          <button id="btn-confirm-deposit" class="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-lg disabled:opacity-50" ${s.isDepositing || !s.depositAmount ? 'disabled' : ''}>
            ${s.isDepositing ? `<svg class="w-6 h-6 animate-spin mx-auto" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>` : (t("confirm_deposit") || "Confirm Deposit")}
          </button>
        </div>

        <div class="border-t border-gray-100 pt-4">
          <p class="text-[9px] font-bold text-gray-400 text-center uppercase tracking-[0.2em]">Secure Payment via Pi Network SDK</p>
        </div>
      </div>
    </div>
  `;
}

function formatTxDate(createdAt, dir) {
  if (!createdAt) return '';
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  return date.toLocaleDateString(dir === "rtl" ? "ar-EG" : "en-US", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function bindWalletEvents() {
  const s = walletState;

  // Balance selector buttons
  document.getElementById("btn-select-pi")?.addEventListener("click", () => {
    walletState.selectedBalance = "pi";
    renderWalletPage();
  });
  document.getElementById("btn-select-zyn")?.addEventListener("click", () => {
    walletState.selectedBalance = "zyn";
    renderWalletPage();
  });

  // Refresh balance
  document.getElementById("btn-refresh-balance")?.addEventListener("click", () => {
    fetchBalances(true);
  });

  // Deposit button
  document.getElementById("btn-deposit")?.addEventListener("click", () => {
    walletState.isDepositOpen = true;
    renderWalletPage();
  });

  // Deposit modal events
  const depositInput = document.getElementById("input-deposit-amount");
  if (depositInput) {
    depositInput.addEventListener("input", (e) => {
      walletState.depositAmount = e.target.value;
      // Re-render just the modal part
      const overlay = document.getElementById("deposit-overlay");
      if (overlay) {
        overlay.outerHTML = renderDepositModal();
        bindDepositModalEvents();
      }
    });
    bindDepositModalEvents();
  }

  // Withdraw events
  const withdrawInput = document.getElementById("input-withdraw-amount");
  if (withdrawInput) {
    withdrawInput.addEventListener("input", (e) => {
      walletState.withdrawAmount = e.target.value;
      const btn = document.getElementById("btn-withdraw-zyn");
      if (btn) btn.disabled = !e.target.value || !walletState.walletAddress || walletState.isWithdrawing;
    });
  }

  document.getElementById("btn-withdraw-zyn")?.addEventListener("click", () => {
    handleWithdrawZyn();
  });

  // Refresh history
  document.getElementById("btn-refresh-history")?.addEventListener("click", () => {
    fetchHistory();
  });
}

function bindDepositModalEvents() {
  document.getElementById("btn-confirm-deposit")?.addEventListener("click", () => {
    handleDeposit();
  });
}

async function fetchBalances(showSpinner = false) {
  const auth = getAuthState();
  if (!auth.userData?.id) return null;

  try {
    if (showSpinner) walletState.loading = true;
    const userRef = doc(db, "users", auth.userData.id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const d = userSnap.data();
      walletState.piBalance = Number(d.available_balance || 0);
      walletState.zynBalance = Number(d.pi_balance || d.wallet_balance || 0);
      walletState.piReward = Number(d.pi_reward_balance || 0);
      walletState.walletAddress = d.wallet_address || null;
    }
    walletState.loading = false;
    renderWalletPage();
    return walletState.walletAddress;
  } catch (e) {
    console.error("Wallet: fetch error", e);
    walletState.loading = false;
    return null;
  }
}

async function fetchHistory() {
  const auth = getAuthState();
  if (!auth.userData?.username) return;

  try {
    const q = query(collection(db, "transactions"), where("userId", "==", auth.userData.username), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    walletState.transactions = snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 10);

    // Fetch blockchain transactions if wallet address exists
    if (walletState.walletAddress) {
      try {
        const url = `https://api.mainnet.minepi.com/accounts/${walletState.walletAddress}/transactions?limit=20&order=desc`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const records = data._embedded?.records || [];
          const chainTxs = records
            .filter(tx => {
              const memo = (tx.memo || "").toUpperCase();
              return memo.includes("PIMART") || memo.includes("ZYNMART");
            })
            .map(tx => ({
              id: tx.id,
              title: tx.memo || "Blockchain Transaction",
              amount: "—",
              type: "received",
              status: "on_chain",
              createdAt: tx.created_at,
              txid: tx.id,
              isVerified: true
            }));

          // Merge: mark local as verified if matching
          chainTxs.forEach(ctx => {
            const matched = walletState.transactions.find(ltx => {
              if (ltx.isVerified) return false;
              const amtMatch = (ltx.amount || "").includes(ctx.amount || "") || (ctx.memo || "").includes(ltx.amount || "");
              const timeDiff = Math.abs(new Date(ltx.createdAt).getTime() - new Date(ctx.createdAt).getTime());
              return amtMatch && timeDiff < 3600000;
            });
            if (matched) {
              matched.isVerified = true;
              matched.txid = ctx.id;
            } else {
              walletState.transactions.push(ctx);
            }
          });

          // Re-sort
          walletState.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          walletState.transactions = walletState.transactions.slice(0, 10);
        }
      } catch (err) {
        console.error("Blockchain fetch error:", err);
      }
    }

    renderWalletPage();
  } catch (error) {
    console.error("Failed to fetch history:", error);
  }
}

async function handleDeposit() {
  const auth = getAuthState();
  if (!auth.userData?.username) return;

  const depositAmount = parseFloat(walletState.depositAmount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    showToast(t("invalid_amount_error") || "Please enter a valid amount", "error");
    return;
  }

  walletState.isDepositing = true;
  renderWalletPage();

  try {
    await ensurePaymentsAuth();

    if (!window.Pi) {
      showToast("Pi SDK not available", "error");
      walletState.isDepositing = false;
      renderWalletPage();
      return;
    }

    await window.Pi.createPayment({
      amount: depositAmount,
      memo: `Deposit to ZYNMART Wallet - ${depositAmount} Pi`,
      metadata: {
        type: 'wallet_deposit',
        userId: auth.userData.username,
        amount: depositAmount,
        piAmount: depositAmount,
      },
    }, {
      onReadyForServerApproval: async (paymentId) => {
        const apiUrl = window.location.hostname.endsWith(".netlify.app")
          ? `${window.location.origin}/.netlify/functions/payment-approve`
          : `${window.location.origin}/payment/approve`;
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, piAmount: depositAmount }),
        });
      },
      onReadyForServerCompletion: async (paymentId, txid) => {
        const userRef = doc(db, "users", auth.userData.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentBalance = Number(userData?.available_balance || 0);
          const newBalance = currentBalance + depositAmount;
          await updateDoc(userRef, {
            available_balance: newBalance,
            wallet_address: walletState.walletAddress || userData?.wallet_address || null,
            updated_at: serverTimestamp()
          });
          await addDoc(collection(db, "transactions"), {
            userId: auth.userData.username,
            title: "Wallet Deposit",
            amount: depositAmount.toString(),
            type: "received",
            status: "completed",
            createdAt: serverTimestamp()
          });
        }
      },
      onCancel: () => {
        walletState.isDepositing = false;
        walletState.isDepositOpen = false;
        walletState.depositAmount = "";
        showToast(t("payment_cancelled") || "Payment cancelled", "error");
        renderWalletPage();
      },
      onError: (error) => {
        walletState.isDepositing = false;
        showToast(error.message || "Payment error", "error");
        renderWalletPage();
      },
    });

    walletState.isDepositing = false;
    walletState.isDepositOpen = false;
    walletState.depositAmount = "";
    showToast(t("deposit_success") || "Deposit successful!", "success");
    await fetchBalances(true);
    await fetchHistory();
  } catch (e) {
    console.error("Deposit error:", e);
    walletState.isDepositing = false;
    showToast(t("error_occurred") || "An error occurred", "error");
    renderWalletPage();
  }
}

async function handleWithdrawZyn() {
  const auth = getAuthState();
  if (!walletState.walletAddress) {
    showToast(t("wallet_address_required") || "Please add your wallet address in Settings first", "error");
    return;
  }

  const amountNum = parseFloat(walletState.withdrawAmount);
  if (isNaN(amountNum) || amountNum < 1) {
    showToast(t("min_withdraw_amount") || "Minimum withdrawal is 1 ZYN", "error");
    return;
  }
  if (amountNum > walletState.zynBalance) {
    showToast(t("insufficient_balance") || "Insufficient Zyn balance", "error");
    return;
  }

  walletState.isWithdrawing = true;
  renderWalletPage();

  try {
    // Check blockchain wallet validity
    try {
      const horizonRes = await fetch(`https://api.mainnet.minepi.com/accounts/${walletState.walletAddress}`);
      if (!horizonRes.ok) {
        showToast(t("wallet_not_found_blockchain") || "This address was not found on the blockchain", "error");
        walletState.isWithdrawing = false;
        renderWalletPage();
        return;
      }
      const accountData = await horizonRes.json();
      const hasZynTrustline = accountData.balances?.some(b => b.asset_code === 'ZYN');
      if (!hasZynTrustline) {
        showToast(t("trustline_required") || "You must activate the ZYN token in your Pi Wallet before withdrawing", "error");
        walletState.isWithdrawing = false;
        renderWalletPage();
        return;
      }
    } catch (err) {
      console.error("Blockchain validation error:", err);
      showToast("Failed to validate wallet on the blockchain", "error");
      walletState.isWithdrawing = false;
      renderWalletPage();
      return;
    }

    const userRef = doc(db, "users", auth.userData.id);
    const userSnap = await getDoc(userRef);
    const today = new Date().toDateString();
    let withdrawnToday = 0;
    let currentDbZyn = walletState.zynBalance;

    if (userSnap.exists()) {
      const data = userSnap.data();
      currentDbZyn = Number(data.pi_balance || data.wallet_balance || 0);
      if (data.lastZynWithdrawalDate === today) {
        withdrawnToday = Number(data.dailyZynWithdrawn || 0);
      }
    }

    if (withdrawnToday + amountNum > 20) {
      showToast(t("daily_withdraw_limit") || `Daily withdrawal limit is 20 ZYN. You can withdraw ${Math.max(0, 20 - withdrawnToday)} more today.`, "error");
      walletState.isWithdrawing = false;
      renderWalletPage();
      return;
    }

    const newZynBalance = currentDbZyn - amountNum;
    const newWithdrawnToday = withdrawnToday + amountNum;

    await updateDoc(userRef, {
      pi_balance: newZynBalance,
      lastZynWithdrawalDate: today,
      dailyZynWithdrawn: newWithdrawnToday,
      updated_at: serverTimestamp()
    });

    await addDoc(collection(db, "withdrawals"), {
      userId: auth.userData.username,
      walletAddress: walletState.walletAddress,
      amount: amountNum,
      status: "pending",
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, "transactions"), {
      userId: auth.userData.username,
      title: `Withdraw request: ${amountNum} ZYN`,
      amount: amountNum.toString(),
      type: "sent",
      status: "pending",
      createdAt: serverTimestamp()
    });

    walletState.zynBalance = newZynBalance;
    walletState.withdrawAmount = "";
    walletState.isWithdrawing = false;
    showToast(t("withdrawal_submitted") || "Withdrawal request submitted successfully!", "success");
    await fetchBalances(true);
    await fetchHistory();
  } catch (e) {
    console.error("Withdraw error:", e);
    showToast(t("error_occurred") || "An error occurred", "error");
    walletState.isWithdrawing = false;
    renderWalletPage();
  }
}

export function setupWalletEventListeners() {
  fetchBalances(true);
  fetchHistory();
}
