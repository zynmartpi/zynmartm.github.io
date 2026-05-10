<div align="center">

# 🛒 ZynMart

**Pi Network Connected Marketplace & Wallet**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com)
[![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Pi SDK](https://img.shields.io/badge/Pi%20SDK-2.0-6441A5?logo=pi&logoColor=white)](https://minepi.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

*Shop, sell, earn ZYN rewards & manage your wallet. Spin the wheel daily, deposit, withdraw & trade on ZynMart.*

[🚀 Live Demo](#-deployment) · [📱 Features](#-features) · [🏗️ Architecture](#%EF%B8%8F-architecture) · [⚙️ Setup](#%EF%B8%8F-setup) · [📡 API](#-api-routes)

</div>

---

## 📱 Features

### 🛍️ Marketplace
- **Product Catalog** — Browse & search products by category
- **Seller Dashboard** — Add, edit, manage products & orders
- **Cart & Checkout** — Seamless Pi payments with SDK integration
- **Reviews & Ratings** — User feedback system

### 💰 Wallet
- **Dual Balance** — Pi & ZYN balance management
- **Deposit** — Pi SDK payment integration with blockchain validation
- **Withdraw** — ZYN withdrawal with daily limits & trustline verification
- **Transaction History** — Merged Firestore + blockchain records

### 🎡 Spin Wheel
- **Daily Free Spins** — Earn ZYN rewards every day
- **Ad Rewards** — Watch ads for extra spins
- **Promo Codes** — Redeem codes for bonus ZYN
- **Auto-Credit** — Winnings go directly to ZYN wallet balance

### 👤 User System
- **Pi Authentication** — Seamless Pi Browser login
- **Profile Management** — Avatar, country, wallet address
- **Notifications** — Real-time order & payment updates
- **Multi-Language** — Arabic, English, French

---

## 🏗️ Architecture

```
zynmart/
├── 📂 api/                    # Vercel Serverless Functions
│   ├── auth-login.js          # Pi authentication endpoint
│   ├── auth-verify.js         # Token verification
│   ├── payment-approve.js     # Pi payment approval
│   ├── payment-complete.js    # Pi payment completion
│   └── payment-cancel.js      # Pi payment cancellation
├── 📂 src/
│   ├── 📂 components/         # UI Components
│   │   ├── header.js          # Navigation header
│   │   ├── router.js          # Client-side router
│   │   ├── toast.js           # Notification toasts
│   │   └── ...
│   ├── 📂 lib/                # Core Libraries
│   │   ├── firebase.js        # Firestore configuration
│   │   ├── pi-payment.js      # Pi payment flow
│   │   ├── pi-rpc.js          # Blockchain RPC calls
│   │   ├── system-config.js   # App configuration
│   │   └── ...
│   ├── 📂 pages/              # Page Renderers
│   │   ├── home.js            # Product feed
│   │   ├── wallet.js          # Wallet & transactions
│   │   ├── spin-wheel.js      # Spin wheel game
│   │   ├── checkout.js        # Pi checkout
│   │   └── ...
│   ├── 📂 stores/             # State Management
│   │   ├── pi-auth-store.js   # Auth state & Firestore sync
│   │   ├── cart-store.js      # Shopping cart
│   │   ├── orders-store.js    # Order management
│   │   └── ...
│   ├── 📂 locales/            # i18n Translations
│   │   ├── ar.json
│   │   ├── en.json
│   │   └── fr.json
│   ├── main.js                # App entry point
│   └── styles.css             # Global styles
├── 📂 public/                 # Static assets
├── 📂 js/                     # Legacy Pi SDK scripts
├── index.html                 # SPA entry with Pi interceptor
├── vercel.json                # Vercel deployment config
├── vite.config.js             # Vite build configuration
└── package.json
```

---

## ⚙️ Setup

### Prerequisites
- [Node.js](https://nodejs.org/) ≥ 18
- [Pi Browser](https://minepi.com) (for testing)
- Firebase project with Firestore
- Pi Developer Portal API Key

### Install

```bash
git clone https://github.com/zynmartpi/zynmartpi.github.io.git
cd zynmartpi.github.io
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PI_SERVER_API_KEY=your_pi_api_key
PI_API_BASE=https://api.minepi.com/v2
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id
```

### Run Locally

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository on [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite framework
4. Add `PI_SERVER_API_KEY` in **Settings → Environment Variables**
5. Deploy!

### Manual

```bash
npm run build
# Deploy the `dist/` folder to any static host
```

---

## 📡 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/auth/login` | POST | Verify Pi access token & return user data |
| `/auth/verify` | POST | Verify Pi access token validity |
| `/payment/approve` | POST | Approve a Pi payment via Pi API |
| `/payment/complete` | POST | Complete a Pi payment with txid |
| `/payment/cancel` | POST | Cancel a Pi payment |

All API routes use Vercel Serverless Functions with `req.body` parsing built-in.

---

## 🔐 Security

- Pi API key stored as **environment variable** (never in code)
- Blockchain trustline validation for withdrawals
- Firestore security rules for data access
- CORS headers on all API endpoints
- No sensitive data in client-side code

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the Pi Network Community**

[⬆ Back to Top](#-zynmart)

</div>
