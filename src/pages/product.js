import { t, getDir } from "../stores/language-store.js";
import { getAuthState } from "../stores/pi-auth-store.js";
import { getProductById } from "../stores/products-store.js";
import { addToCart } from "../stores/cart-store.js";
import { isInWishlist, toggleWishlist } from "../stores/wishlist-store.js";
import { renderHeader } from "../components/header.js";
import { navigate, getParams } from "../components/router.js";
import { showToast } from "../components/toast.js";
import { getProductReviews, getProductRating, addReview } from "../stores/reviews-store.js";

let currentProduct = null;

export function renderProductPage() {
  const app = document.getElementById("app");
  const dir = getDir();
  const params = getParams();
  const productId = params.id;
  currentProduct = getProductById(productId);

  if (!currentProduct) {
    app.innerHTML = `
      <div id="header"></div>
      <div class="min-h-screen bg-white flex items-center justify-center" dir="${dir}">
        <div class="text-center space-y-4">
          <p class="text-gray-500 font-bold">Product not found</p>
          <button class="bg-primary text-white px-6 py-2 rounded-xl font-bold" onclick="window.history.back()">Go Back</button>
        </div>
      </div>
    `;
    renderHeader({ showBack: true });
    return;
  }

  const inWishlist = isInWishlist(currentProduct.id);
  const avgRating = getProductRating(currentProduct.id);
  const reviews = getProductReviews(currentProduct.id);
  const rating = avgRating || currentProduct.rating;

  app.innerHTML = `
    <div id="header"></div>
    <div class="min-h-screen bg-white pb-32" dir="${dir}">
      <div class="relative">
        <div class="aspect-square bg-gray-50 overflow-hidden">
          <img src="${currentProduct.image}" alt="${currentProduct.name}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/600x400?text=No+Image'" />
        </div>
        ${currentProduct.images?.length > 1 ? `
          <div class="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
            ${currentProduct.images.map((img, i) => `
              <img src="${img}" alt="${currentProduct.name} ${i + 1}" class="w-16 h-16 rounded-lg object-cover border-2 ${i === 0 ? 'border-primary' : 'border-gray-200'} cursor-pointer product-thumbnail" data-src="${img}" />
            `).join("")}
          </div>
        ` : ""}
      </div>

      <div class="px-4 py-4 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-primary uppercase tracking-wider">${t(currentProduct.category?.toLowerCase()) || currentProduct.category}</span>
            <h1 class="text-xl font-black text-gray-900 leading-tight">${currentProduct.name}</h1>
          </div>
          <button id="btn-wishlist" class="p-2 rounded-full ${inWishlist ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50'} transition-all">
            <svg class="w-6 h-6" fill="${inWishlist ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 text-amber-500">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span class="text-sm font-bold">${rating.toFixed(1)}</span>
          </div>
          <span class="text-xs text-gray-400">${reviews.length || currentProduct.reviews || 0} reviews</span>
          <span class="text-xs text-gray-400">${currentProduct.sold || 0} sold</span>
        </div>

        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-black text-primary">${currentProduct.piPrice.toFixed(3)} Pi</span>
        </div>

        ${currentProduct.description ? `
          <div class="space-y-2">
            <h3 class="text-sm font-black text-gray-900">${t("description") || "Description"}</h3>
            <p class="text-sm text-gray-600 leading-relaxed">${currentProduct.description}</p>
          </div>
        ` : ""}

        ${currentProduct.stock > 0 ? `
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            <span class="text-xs font-bold text-green-600">${t("in_stock") || "In Stock"} (${currentProduct.stock})</span>
          </div>
        ` : `
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-red-500"></span>
            <span class="text-xs font-bold text-red-600">${t("out_of_stock") || "Out of Stock"}</span>
          </div>
        `}

        <!-- Reviews Section -->
        <div class="pt-4 border-t border-gray-100 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-black text-gray-900">${t("reviews") || "Reviews"} (${reviews.length})</h3>
            <button id="btn-write-review" class="text-xs font-bold text-primary">${t("write_review") || "Write a Review"}</button>
          </div>
          ${reviews.length === 0 ? `
            <p class="text-sm text-gray-400 text-center py-6">${t("no_reviews_yet") || "No reviews yet"}<br><span class="text-xs">${t("be_first_review") || "Be the first to review!"}</span></p>
          ` : `
            <div class="space-y-3 max-h-64 overflow-y-auto">
              ${reviews.slice(0, 5).map(r => `
                <div class="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-gray-700">${r.author}</span>
                    <div class="flex items-center gap-0.5 text-amber-500">
                      ${Array.from({ length: 5 }, (_, i) => `<svg class="w-3 h-3 ${i < r.rating ? 'fill-current' : 'text-gray-300 fill-current'}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`).join("")}
                    </div>
                  </div>
                  <p class="text-xs text-gray-600">${r.comment}</p>
                  <span class="text-[10px] text-gray-400">${r.date ? new Date(r.date).toLocaleDateString() : ""}</span>
                </div>
              `).join("")}
            </div>
          `}
        </div>

        <!-- Review Form (hidden by default) -->
        <div id="review-form" class="hidden pt-4 border-t border-gray-100 space-y-3">
          <h3 class="text-sm font-black text-gray-900">${t("write_a_review") || "Write a Review"}</h3>
          <div class="flex items-center gap-1" id="star-rating">
            ${Array.from({ length: 5 }, (_, i) => `
              <button class="star-btn text-2xl text-gray-300 hover:text-amber-500 transition-colors" data-rating="${i + 1}">★</button>
            `).join("")}
          </div>
          <textarea id="review-comment" rows="3" class="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary transition-all resize-none" placeholder="${t("your_review") || "Your review..."}"></textarea>
          <div class="flex gap-3">
            <button id="btn-cancel-review" class="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-bold text-sm">${t("cancel") || "Cancel"}</button>
            <button id="btn-submit-review" class="flex-[2] bg-primary text-white py-2.5 rounded-xl font-bold text-sm">${t("submit_review") || "Submit"}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed bottom bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center gap-3 z-50">
      <button id="btn-add-cart-product" class="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-primary/20 ${currentProduct.stock <= 0 ? 'opacity-50 pointer-events-none' : ''}">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
        ${t("add_to_cart") || "Add to Cart"}
      </button>
      <button id="btn-buy-now" class="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-black text-sm active:scale-95 transition-all ${currentProduct.stock <= 0 ? 'opacity-50 pointer-events-none' : ''}">
        ${t("buy_now") || "Buy Now"}
      </button>
    </div>
  `;

  renderHeader({ showBack: true, title: currentProduct.name });

  document.getElementById("btn-wishlist")?.addEventListener("click", () => {
    toggleWishlist({ id: currentProduct.id, name: currentProduct.name, price: currentProduct.price, image: currentProduct.image, rating: currentProduct.rating, category: currentProduct.category });
    renderProductPage();
  });

  document.getElementById("btn-add-cart-product")?.addEventListener("click", () => {
    addToCart(currentProduct);
    showToast(t("added_to_cart") || "Added to cart!", "success");
  });

  document.getElementById("btn-buy-now")?.addEventListener("click", () => {
    addToCart(currentProduct);
    navigate("/cart");
  });

  document.querySelectorAll(".product-thumbnail").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const mainImg = document.querySelector(".aspect-square img");
      if (mainImg) mainImg.src = thumb.dataset.src;
    });
  });

  // Reviews
  document.getElementById("btn-write-review")?.addEventListener("click", () => {
    document.getElementById("review-form").classList.toggle("hidden");
  });
  document.getElementById("btn-cancel-review")?.addEventListener("click", () => {
    document.getElementById("review-form").classList.add("hidden");
  });
  let selectedRating = 0;
  document.querySelectorAll(".star-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedRating = parseInt(btn.dataset.rating);
      document.querySelectorAll(".star-btn").forEach((s, i) => {
        s.style.color = i < selectedRating ? "#f59e0b" : "#d1d5db";
      });
    });
  });
  document.getElementById("btn-submit-review")?.addEventListener("click", async () => {
    const comment = document.getElementById("review-comment")?.value?.trim();
    if (!selectedRating) { showToast(t("rating") + " required", "error"); return; }
    if (!comment) { showToast(t("comment_required") || "Comment required", "error"); return; }
    const userData = getAuthState().userData;
    const success = await addReview({
      productId: currentProduct.id,
      author: userData?.username || "Anonymous",
      rating: selectedRating,
      comment,
    });
    if (success) {
      showToast(t("review_submitted") || "Review submitted!", "success");
      document.getElementById("review-form").classList.add("hidden");
      renderProductPage();
    } else {
      showToast(t("review_failed") || "Failed to submit", "error");
    }
  });
}
