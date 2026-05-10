export class ErrorBoundary {
  constructor() {
    this.hasError = false;
    this.error = null;
    this.fallback = null;
    this.children = null;
    this.onReset = null;
  }

  wrap(children, fallback) {
    this.children = children;
    this.fallback = fallback;
    return this.render();
  }

  handleError(error) {
    this.hasError = true;
    this.error = error;
    console.error("ErrorBoundary caught:", error);
  }

  reset() {
    this.hasError = false;
    this.error = null;
    if (this.onReset) this.onReset();
  }

  render() {
    if (this.hasError) {
      if (this.fallback) return typeof this.fallback === "function" ? this.fallback(this.error) : this.fallback;
      return `
        <div class="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h2 class="text-lg font-bold text-gray-900">Something went wrong</h2>
          <p class="text-sm text-gray-500 max-w-md">${this.error?.message || "An unexpected error occurred."}</p>
          <button onclick="window.location.reload()" class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-all hover:bg-primary/90">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Try Again
          </button>
        </div>
      `;
    }
    return this.children;
  }
}

export const errorBoundary = new ErrorBoundary();
