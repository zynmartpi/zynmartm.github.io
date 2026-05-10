(function() {
  async function startAuth() {
    const statusEl = document.getElementById('pi-auth-status');
    const retryBtn = document.getElementById('pi-auth-retry');
    const overlay = document.getElementById('pi-auth-loading');

    if (!statusEl || !overlay) return;

    try {
      const initialized = await window.piService.init();
      if (!initialized) throw new Error('Failed to initialize Pi SDK');

      statusEl.innerText = 'Authenticating...';
      await window.piService.authenticate();
      
      statusEl.innerText = 'Welcome ' + window.piService.user.username;
      
      // Hide overlay after success
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
      }, 1000);

    } catch (error) {
      statusEl.innerText = error.message || 'Authentication failed';
      statusEl.style.color = '#ff4444';
      if (retryBtn) retryBtn.style.display = 'block';
    }
  }

  window.addEventListener('load', () => {
    startAuth();
    document.getElementById('pi-auth-retry')?.addEventListener('click', () => {
      location.reload();
    });
  });
})();
