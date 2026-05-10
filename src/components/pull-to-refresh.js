export class PullToRefresh {
  constructor(container, onRefresh) {
    this.container = container;
    this.onRefresh = onRefresh;
    this.startY = 0;
    this.pulling = false;
    this.refreshing = false;
    this.indicator = null;
    this.init();
  }

  init() {
    this.container.addEventListener("touchstart", (e) => {
      if (window.scrollY > 0 || this.refreshing) return;
      this.startY = e.touches[0].clientY;
      this.pulling = true;
    }, { passive: true });

    this.container.addEventListener("touchmove", (e) => {
      if (!this.pulling || this.refreshing) return;
      const diff = e.touches[0].clientY - this.startY;
      if (diff > 0) {
        this.showIndicator(Math.min(diff / 3, 60));
      }
    }, { passive: true });

    this.container.addEventListener("touchend", async () => {
      if (!this.pulling || this.refreshing) return;
      this.pulling = false;
      if (this.indicator && parseFloat(this.indicator.style.height) > 40) {
        this.refreshing = true;
        this.showIndicator(50, true);
        try {
          await this.onRefresh();
        } catch (e) {
          console.error("Refresh failed:", e);
        }
        this.refreshing = false;
        this.hideIndicator();
      } else {
        this.hideIndicator();
      }
    }, { passive: true });
  }

  showIndicator(height, isRefreshing = false) {
    if (!this.indicator) {
      this.indicator = document.createElement("div");
      this.indicator.className = "ptr-indicator flex items-center justify-center overflow-hidden transition-all duration-300";
      this.indicator.style.cssText = "height:0;overflow:hidden;transition:height 0.3s;";
      this.container.prepend(this.indicator);
    }
    this.indicator.style.height = height + "px";
    this.indicator.innerHTML = isRefreshing
      ? '<svg class="w-6 h-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>'
      : '<span class="text-xs font-bold text-primary">Pull to refresh</span>';
  }

  hideIndicator() {
    if (this.indicator) {
      this.indicator.style.height = "0";
      setTimeout(() => { if (this.indicator) { this.indicator.remove(); this.indicator = null; } }, 300);
    }
  }
}
