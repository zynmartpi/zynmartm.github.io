import { t, getDir } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { showRewardedAd, isAdLoading } from "../stores/ads-store.js";
import { db, doc, getDoc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from "../lib/firebase.js";
import { renderHeader } from "../components/header.js";
import { showToast } from "../components/toast.js";

const PRIZES = [
  { id: 1, amount: 0.5, type: "win", color: "#f59e0b", darkColor: "#d97706" },
  { id: 2, amount: 0.2, type: "win", color: "#94a3b8", darkColor: "#64748b" },
  { id: 3, amount: 10, type: "win", color: "#8b5cf6", darkColor: "#7c3aed" },
  { id: 4, amount: 0.9, type: "win", color: "#06b6d4", darkColor: "#0891b2" },
  { id: 5, amount: 0.6, type: "win", color: "#ec4899", darkColor: "#db2777" },
  { id: 6, amount: 1, type: "win", color: "#10b981", darkColor: "#059669" },
  { id: 7, amount: 0.2, type: "win", color: "#a1a1aa", darkColor: "#71717a" },
  { id: 8, amount: 0.5, type: "win", color: "#f97316", darkColor: "#ea580c" },
  { id: 9, amount: 0.3, type: "win", color: "#6366f1", darkColor: "#4f46e5" },
  { id: 10, amount: 0.8, type: "win", color: "#14b8a6", darkColor: "#0d9488" },
].map((p) => ({ ...p, label: `${p.amount} ${t("zyn_label") || "ZYN"}` }));

let rotation = 0;
let isSpinning = false;
let spinsLeft = 0;
let zynBalance = 0;
let promoCode = "";
let isRedeeming = false;

export function renderSpinWheelPage() {
  const app = document.getElementById("app");
  const dir = getDir();

  // Check free spin
  const lastSpinDate = localStorage.getItem("lastFreeSpinDate_final");
  const today = new Date().toDateString();
  if (lastSpinDate !== today) spinsLeft = 1;
  else if (spinsLeft < 0) spinsLeft = 0;

  // Build conic gradient
  const conicGrad = PRIZES.map((p, i) => {
    const start = (i * 360) / PRIZES.length;
    const end = ((i + 1) * 360) / PRIZES.length;
    return `${p.color} ${start}deg, ${p.darkColor} ${end - 5}deg, ${p.color} ${end}deg`;
  }).join(", ");

  // Segment dividers
  const dividers = PRIZES.map((_, i) => {
    const angle = (i * 360) / PRIZES.length;
    return `<div class="absolute top-0 left-1/2 w-[1px] h-1/2 origin-bottom z-10" style="transform:rotate(${angle}deg);background:linear-gradient(to top,rgba(255,255,255,0.1),rgba(255,255,255,0.4))"></div>`;
  }).join("");

  // Prize labels
  const labels = PRIZES.map((prize, i) => {
    const angle = 360 / PRIZES.length;
    const rotate = i * angle + angle / 2;
    const isSmall = prize.amount < 1;
    return `<div class="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-center pointer-events-none" style="transform:rotate(${rotate - 90}deg)">
      <div class="flex flex-col items-center rotate-90 w-24 translate-x-14">
        <span class="font-extrabold text-white drop-shadow-lg tracking-tight ${isSmall ? "text-[11px]" : "text-[15px]"}" style="text-shadow:0 2px 4px rgba(0,0,0,0.3)">${prize.label}</span>
      </div>
    </div>`;
  }).join("");

  // Exterior pins
  const pins = Array(20).fill(0).map((_, i) => {
    const bgColor = i % 2 === 0 ? "#fbbf24" : "#ffffff";
    return `<div class="absolute z-20" style="top:50%;left:50%;width:6px;height:6px;background:${bgColor};border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.3);transform:rotate(${i * 18}deg) translateY(-152px) translateX(-50%)"></div>`;
  }).join("");

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-gray-50 pb-20 overflow-x-hidden" dir="${dir}">

      <!-- Top Banner Card -->
      <div class="bg-gradient-to-r from-primary via-primary/90 to-emerald-600 rounded-2xl p-5 flex gap-4 items-center mb-10 shadow-xl shadow-primary/30 mx-4 mt-6 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div class="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center p-2 border border-white/20">
          <div class="w-full h-full border-[3px] border-white/50 rounded-full relative">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full -mt-2 shadow-sm"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-[1px] h-full bg-white/30"></div>
              <div class="w-full h-[1px] bg-white/30 absolute"></div>
            </div>
          </div>
        </div>
        <div class="space-y-1 text-start text-white relative z-10">
          <h2 class="text-lg font-black tracking-tight">${t("spin_and_collect") || "Spin & Collect"}</h2>
          <p class="text-[11px] font-medium opacity-80 leading-tight">${t("spin_description") || "Spin the wheel and win ZYN rewards!"}</p>
        </div>
      </div>

      <!-- Main Wheel Card -->
      <div class="w-full max-w-sm mx-auto flex flex-col items-center justify-center relative z-10 px-4">
        <div class="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-[32px] p-8 sm:p-12 w-full flex items-center justify-center border border-gray-100/80 mb-12 relative overflow-visible shadow-2xl shadow-primary/10">
          <div class="relative w-full max-w-[300px] aspect-square flex items-center justify-center flex-shrink-0">

            <!-- Visual Pointer Shield -->
            <div class="absolute top-[-14px] left-1/2 -translate-x-1/2 z-40 transform translate-y-[-5px]">
              <div class="w-10 h-12 relative" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2))">
                <div class="w-full h-full bg-gradient-to-b from-red-500 to-red-600 relative" style="clip-path:polygon(10% 0,90% 0,50% 100%)">
                  <div class="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>

            <!-- Outer Glow Ring -->
            <div class="absolute inset-[-8px] rounded-full bg-gradient-to-br from-primary/20 via-transparent to-primary/10 z-0"></div>

            <!-- The Wheel Border Ring -->
            <div class="absolute inset-0 border-[10px] rounded-full shadow-xl z-10" style="border-color:#1a1a2e"></div>

            <!-- Exterior Pins -->
            ${pins}

            <!-- The Wheel -->
            <div id="wheel" class="w-full h-full rounded-full relative overflow-hidden transition-transform ease-[cubic-bezier(0.1,0,0.1,1)]" style="transform:rotate(${rotation}deg);transition-duration:${isSpinning ? "5500ms" : "0ms"};background:conic-gradient(${conicGrad})">
              <!-- Glossy Overlay -->
              <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10"></div>
              <div class="absolute inset-0" style="background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.15) 0%,transparent 60%)"></div>
              <!-- Segment Dividers -->
              ${dividers}
              <!-- Prize Labels -->
              ${labels}
            </div>

            <!-- Center Button -->
            <button id="btn-spin" class="absolute inset-0 m-auto w-[88px] h-[88px] rounded-full z-50 flex items-center justify-center active:scale-95 transition-all disabled:opacity-50" style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);box-shadow:0 4px 20px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.1),0 0 0 4px rgba(255,255,255,0.8),0 0 0 6px rgba(26,26,46,0.3)" ${isSpinning ? "disabled" : ""}>
              ${isSpinning
                ? '<svg class="w-8 h-8 animate-spin text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>'
                : `<div class="flex flex-col items-center gap-0.5"><span class="font-black text-[11px] text-yellow-400 tracking-widest uppercase">${t("spin_button") || "SPIN"}</span><span class="text-[8px] text-gray-400 font-medium">FREE</span></div>`
              }
            </button>
          </div>
        </div>

        <!-- Bottom Status Card -->
        <div class="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[min(90vw,340px)] h-14 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl flex flex-row items-center justify-between p-4 px-6 shadow-xl border border-white/5">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-yellow-400/10 rounded-full flex items-center justify-center">
              <span class="text-sm">🎰</span>
            </div>
            <div class="flex flex-col text-left">
              <p class="text-sm font-bold text-white">${spinsLeft} ${t("spins_left_label") || "Spins Left"}</p>
            </div>
          </div>
          <div class="h-6 w-[1px] bg-white/10"></div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-medium text-gray-400">${t("total") || "Total"}:</span>
            <p class="text-sm font-black text-yellow-400">${zynBalance.toFixed(1)} <span class="text-[10px] font-bold text-yellow-400/70">${t("zyn_label") || "ZYN"}</span></p>
          </div>
        </div>
      </div>

      <!-- Promo Code Section -->
      <div class="w-full max-w-sm mx-auto mt-6 bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm border border-gray-100">
        <label class="text-xs font-semibold text-gray-500 text-start">${t("enter_promo_code") || "Enter Promo Code"}</label>
        <div class="flex gap-2">
          <input type="text" id="inp-promo" value="${promoCode}" placeholder="e.g. ZYN-SPIN-..." class="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary transition-all placeholder:text-gray-300 placeholder:font-medium" />
          <button id="btn-redeem" class="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold text-sm px-6 rounded-xl active:scale-95 transition-all outline-none" ${!promoCode.trim() || isRedeeming ? "disabled" : ""}>
            ${isRedeeming ? '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>' : (t("redeem") || "Redeem")}
          </button>
        </div>
      </div>

      <!-- Info -->
      <div class="mt-10 text-center text-gray-400 flex flex-col items-center gap-2">
        <svg class="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p class="text-[10px] font-medium tracking-wide uppercase leading-none opacity-80">${t("free_spin_notice") || "1 free spin per day. Watch ads for more!"}</p>
      </div>
    </div>
  `;

  renderHeader({ showBack: false, showSearch: false, showCategories: false });

  // Bind events
  document.getElementById("btn-spin")?.addEventListener("click", handleActionClick);
  document.getElementById("btn-redeem")?.addEventListener("click", handleRedeemCode);
  const promoInput = document.getElementById("inp-promo");
  promoInput?.addEventListener("input", (e) => { promoCode = e.target.value.toUpperCase(); });

  // Fetch ZYN balance
  fetchZynBalance();
}

async function fetchZynBalance() {
  const userData = getAuthState().userData;
  if (!userData?.id) return;
  try {
    const userRef = doc(db, "users", userData.id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      zynBalance = Number(userSnap.data().pi_balance || 0);
      // Update display without full re-render
      const balEls = document.querySelectorAll(".text-yellow-400");
      // Will update on next render
    }
  } catch (e) {
    console.error("SpinWheel: failed to fetch ZYN balance", e);
  }
}

async function handleActionClick() {
  if (isSpinning || isAdLoading()) return;

  if (spinsLeft <= 0) {
    const success = await showRewardedAd();
    if (success) processSpinWithOdds();
    return;
  }

  processSpinWithOdds();
}

function processSpinWithOdds() {
  const rand = Math.random() * 100;
  let prizeIdx = 0;

  if (rand < 40) {
    // 40% - smallest prizes (0.2 ZYN)
    prizeIdx = Math.random() > 0.5 ? 1 : 6;
  } else if (rand < 65) {
    // 25% - small prizes (0.3, 0.5)
    prizeIdx = Math.random() > 0.5 ? 0 : 7;
  } else if (rand < 82) {
    // 17% - medium prizes (0.6, 0.8, 0.9)
    const mid = [4, 9, 3];
    prizeIdx = mid[Math.floor(Math.random() * mid.length)];
  } else if (rand < 95) {
    // 13% - 1 ZYN
    prizeIdx = 5;
  } else {
    // 5% - grand prize 10 ZYN
    prizeIdx = 2;
  }

  startSpinAnimation(prizeIdx);
}

function startSpinAnimation(prizeIdx) {
  const today = new Date().toDateString();
  localStorage.setItem("lastFreeSpinDate_final", today);

  const segments = PRIZES.length;
  const anglePerSegment = 360 / segments;
  const spins = 12;
  const currentRot = rotation % 360;
  const targetAngle = prizeIdx * anglePerSegment + anglePerSegment / 2;
  const delta = spins * 360 + (360 - targetAngle) - currentRot;
  const finalRotation = rotation + delta;

  rotation = finalRotation;
  isSpinning = true;
  spinsLeft = Math.max(0, spinsLeft - 1);

  // Apply rotation directly to wheel element
  const wheel = document.getElementById("wheel");
  if (wheel) {
    wheel.style.transitionDuration = "5500ms";
    wheel.style.transform = `rotate(${rotation}deg)`;
  }

  // Disable center button
  const btnSpin = document.getElementById("btn-spin");
  if (btnSpin) btnSpin.disabled = true;

  setTimeout(async () => {
    isSpinning = false;
    const prize = PRIZES[prizeIdx];

    if (getAuthState().userData?.id) {
      try {
        const userId = getAuthState().userData.id;
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const currentDbZyn = Number(userSnap.exists() ? (userSnap.data().pi_balance || 0) : 0);
        const newTotal = currentDbZyn + prize.amount;

        await updateDoc(userRef, { pi_balance: newTotal, updated_at: serverTimestamp() });
        zynBalance = newTotal;

        // Create transaction record for wallet history
        await addDoc(collection(db, "transactions"), {
          userId: getAuthState().userData.username || userId,
          title: `Spin Wheel Reward: ${prize.amount} ZYN`,
          amount: prize.amount.toString(),
          type: "received",
          status: "completed",
          createdAt: serverTimestamp()
        });

        if (prize.amount >= 10) {
          showToast(t("win_message")?.replace("{amount}", prize.amount.toString()) || `🏆 You won ${prize.amount} ZYN!`, "success");
        } else if (prize.amount >= 1) {
          showToast(t("win_message")?.replace("{amount}", prize.amount.toString()) || `🎉 You won ${prize.amount} ZYN!`, "success");
        } else {
          showToast(t("win_message")?.replace("{amount}", prize.amount.toString()) || `✨ You won ${prize.amount} ZYN!`, "success");
        }
      } catch (err) {
        console.error("Failed to update reward balance:", err);
      }
    }

    renderSpinWheelPage();
  }, 5500);
}

async function handleRedeemCode() {
  const code = promoCode.trim();
  if (!code) return;
  isRedeeming = true;
  renderSpinWheelPage();

  try {
    const userData = getAuthState().userData;
    if (!userData?.id) {
      showToast(t("login_required") || "Please login to redeem codes.", "error");
      isRedeeming = false; return;
    }

    // Check if code exists in Firestore
    const codeRef = doc(db, "promocodes", code);
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      showToast(t("invalid_code") || "Invalid promotional code.", "error");
      isRedeeming = false; return;
    }

    const userRef = doc(db, "users", userData.id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const usedCodes = data.usedCodes || [];
      if (usedCodes.includes(code)) {
        showToast(t("code_already_used") || "Code already redeemed.", "error");
        isRedeeming = false; return;
      }

      // Delete code globally so it can't be reused
      await deleteDoc(codeRef);

      await updateDoc(userRef, { usedCodes: [...usedCodes, code] });

      // Add 1 spin
      spinsLeft += 1;
      promoCode = "";
      showToast(t("code_redeemed_success") || "Code redeemed! You got 1 extra spin. 🎁", "success");
    }
  } catch (e) {
    console.error(e);
    showToast(t("error_occurred") || "Error redeeming code.", "error");
  } finally {
    isRedeeming = false;
    renderSpinWheelPage();
  }
}
