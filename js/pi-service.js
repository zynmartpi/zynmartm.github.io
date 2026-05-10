class PiService {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.accessToken = null;
    this.config = window.PI_CONFIG || { version: "2.0", sandbox: true };
    this.authMessage = 'Initializing Pi Network...';
    this.hasError = false;
  }

  getApiUrl(path) {
    // Vercel rewrites handle the routing: /payment/approve -> /api/payment-approve
    return window.location.origin + path;
  }

  async apiPost(path, payload) {
    const url = this.getApiUrl(path);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  }

  async init() {
    try {
      if (!window.Pi) {
        throw new Error('Pi SDK not found. Make sure you are in Pi Browser.');
      }
      await window.Pi.init({ version: this.config.version, sandbox: this.config.sandbox });
      console.log('Pi SDK initialized');
      return true;
    } catch (error) {
      console.error('Pi Init Error:', error);
      this.hasError = true;
      this.authMessage = error.message;
      return false;
    }
  }

  async authenticate() {
    try {
      const scopes = ['username', 'payments'];
      const authResult = await window.Pi.authenticate(scopes, (payment) => {
        console.log('Incomplete payment found:', payment);
      });

      this.accessToken = authResult.accessToken;
      this.user = authResult.user;
      this.isAuthenticated = true;
      this.authMessage = `Authenticated: ${this.user.username}`;
      
      console.log('Pi Authenticated:', this.user.username);
      
      // Try background login but don't block
      this.apiPost('/auth/login', { pi_auth_token: authResult.accessToken })
        .catch(err => console.warn('Backend login skipped/failed:', err));

      return authResult;
    } catch (error) {
      console.error('Pi Auth Error:', error);
      this.hasError = true;
      this.authMessage = error.message;
      throw error;
    }
  }
}

window.piService = new PiService();
