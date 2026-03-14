<div align="center">

<h1>🏘️ Accord Living</h1>

<p><strong>A modern, real-time Society Management Platform for Admins, Residents & Security</strong></p>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-accord--living.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://accord-living.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Khatribhavesh05-black?style=for-the-badge&logo=github)](https://github.com/Khatribhavesh05/accord-living)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)

</div>

---

## 📖 Overview

**Accord Living** is a full-featured, multi-tenant society management web application that connects Admins, Residents, and Security personnel on a single real-time platform. Built with React + Firebase, it handles everything from onboarding and billing to visitor management and emergency alerts — all with live Firestore subscriptions so every update reflects instantly across portals.

> 🔗 **Live Demo:** [https://accord-living.vercel.app](https://accord-living.vercel.app)

---

## 📸 Screenshots

### 🏠 Landing Page
![Landing Page](https://raw.githubusercontent.com/Khatribhavesh05/accord-living/main/landing%20page.png)

### 🛡️ Admin — Operations Command Center
![Admin Dashboard](https://raw.githubusercontent.com/Khatribhavesh05/accord-living/main/admin%20dashboard.png)

### 🏡 Resident Dashboard
![Resident Dashboard](https://raw.githubusercontent.com/Khatribhavesh05/accord-living/main/Resident%20Dashboard.png)

### 🔖 Visitor Pre-Approval with QR Code
![Visitor Pre-Approval](https://raw.githubusercontent.com/Khatribhavesh05/accord-living/main/Visitor%20Pre-Approval.png)

---

## ✨ Features

### 🛡️ Admin Portal
- **Real-time KPI Dashboard** — live stats for flats, residents, billing, complaints, attendance, and emergencies
- **Onboarding Wizard** — bulk flat creation, resident credential generation, flat assignment, and staff onboarding
- **Resident Management** — create/edit residents with flat mapping and credential-aware flows
- **Bill Management** — generate bills for all or individual flats, track collection progress, view payment records, delete bills
- **Complaint Management** — search/filter, status updates, metrics (pending / in-progress / resolved)
- **Notices & Events** — create and manage announcements with real-time list updates
- **Attendance Logs** — real-time staff attendance with GPS and photo proof
- **Visitor Records** — search/filter, CSV/Excel export, blacklist management
- **Visitor System Settings** — policy toggles (approval, QR, photo capture, vehicle tracking, etc.)
- **Emergency Contact Management** — manage contacts used by resident SOS
- **Admin Settings** — society profile, payment preferences, expense categories, admin users, notification preferences, and full CSV exports

### 🏠 Resident Portal
- **Live Dashboard** — dues, payments, complaints, announcements, activity feed, and weather integration
- **My Bills** — view bills, record payments, generate invoices, and see payment history
- **Complaints** — submit complaints and track live status updates
- **Announcements** — real-time notices with read/unread tracking
- **Documents** — view and download society documents directly
- **Emergency SOS** — one-tap call to admin-managed emergency contacts
- **Visitor Pre-Approval** — create and manage pre-approvals, view QR codes, download approval PDFs
- **Resident Settings** — profile, notification preferences, payment preferences, password change, session controls

### 🔒 Security Portal
- **Dashboard** — summaries for visitors, deliveries, attendance, and active alerts
- **Visitor Entry** — manual check-in and check-out workflows
- **Pre-Approved Visitors** — search by code/mobile, allow/deny with time-window validation, mark entry/exit
- **Staff Attendance** — GPS capture, reverse geocode, camera photo proof, write to Firestore
- **Emergency Alerts** — live active and history feed with acknowledge/resolve actions
- **Security Settings** — profile, access control toggles, alert preferences

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router |
| Build Tool | Vite |
| Backend / Auth | Firebase Authentication |
| Database | Cloud Firestore (real-time) |
| Hosting | Vercel |
| PDF / Invoice | Custom PDF & Invoice generators |
| UI | Custom component library with dark mode support |

---

## 🏗️ Architecture

```
accord-living/
├── src/
│   ├── pages/
│   │   ├── admin/          # Admin portal pages
│   │   ├── resident/       # Resident portal pages
│   │   ├── security/       # Security portal pages
│   │   └── auth/           # Login & society creation
│   ├── firebase/           # Firestore service layer (per domain)
│   │   ├── billService.js
│   │   ├── visitorService.js
│   │   ├── complaintService.js
│   │   └── ...             # 14 service modules total
│   ├── context/
│   │   ├── AuthContext.jsx  # Firebase Auth + user profile
│   │   ├── VisitorContext.jsx
│   │   └── ThemeContext.jsx
│   ├── components/
│   │   ├── ProtectedRoute.jsx
│   │   └── ui/             # Toast, NotificationPanel, etc.
│   └── utils/
│       ├── invoiceGenerator.js
│       └── approvalPDFGenerator.js
└── docs/                   # Project documentation
```

### Multi-Tenant Model
Every piece of business data is scoped by `societyId`. Each society operates in complete isolation — residents, billing, complaints, and visitors never cross between societies.

### Real-Time Architecture
All modules use Firestore `onSnapshot` listeners. Changes made in any portal reflect instantly across all connected sessions — no polling, no page refresh required.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Authentication enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/Khatribhavesh05/accord-living.git
cd accord-living

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup

Create a `.env` file in the project root and add your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## 🔐 Role-Based Access

| Role | Access |
|---|---|
| **Admin** | Full platform control — `/admin/*` routes |
| **Resident** | Personal portal — `/resident/*` routes |
| **Security** | Gate management — `/security/*` routes |

- Wrong-role users are automatically redirected to their own dashboard.
- All routes are protected via `ProtectedRoute.jsx` with Firebase Auth enforcement.

---

## 🗄️ Firestore Collections

| Collection | Description |
|---|---|
| `users` | User profiles with role + societyId |
| `societies` | Society metadata |
| `flats` | Flat registry per society |
| `residents` | Resident records |
| `staff` | Staff/security members |
| `bills` | Maintenance bills |
| `complaints` | Resident complaints |
| `announcements` | Society notices & events |
| `visitors` | Visitor check-in/out logs |
| `visitor_preapprovals` | Pre-approved visitor requests |
| `visitor_blacklist` | Blacklisted individuals |
| `attendance` | Staff attendance records |
| `emergencies` | Emergency alerts & SOS |
| `documents` | Society documents |
| `app_settings` | Society-level settings |

---

## 📦 Deployment

The app is deployed on **Vercel** with zero-config deployment from the GitHub repository.

To deploy your own instance:

1. Push the repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add your Firebase environment variables in the Vercel dashboard
4. Deploy — Vercel handles the rest

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Khatribhavesh05/accord-living/issues).

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ by [Bhavesh Khatri](https://github.com/Khatribhavesh05)

⭐ **Star this repo if you found it useful!**

</div>
