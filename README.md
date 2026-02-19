# htApp — User Mobile App

Ionic/React app for the HackTickets platform. Users browse events, log in with phone + OTP, book tickets, and get a QR code for entry — no crypto wallet required.

## Stack

- **Ionic 8** + **React 19** — mobile-first UI
- **Capacitor 8** — native iOS/Android wrapper
- **React Router v5** — navigation
- **axios** — API client (proxied to backend in dev)
- **qrcode** — generates entry QR code on the client

## Setup

```bash
npm install
npm run dev     # Vite dev server on http://localhost:5173
```

The backend (`htBe`) must be running on `http://localhost:3000`. The Vite dev proxy forwards `/api/*` and `/verifyme/*` to it automatically — no CORS issues in dev.

## Environment Variables

Create a `.env` file (optional — defaults to `localhost:3000`):

```env
VITE_API_URL=http://localhost:3000
```

For production builds, set `VITE_API_URL` to your deployed backend URL.

## Project Structure

```
src/
  App.tsx                   # Router + AuthProvider + tab layout
  main.tsx                  # React entry point
  contexts/
    AuthContext.tsx          # Global auth state (localStorage-backed)
  services/
    api.ts                  # Centralized API client (axios)
  pages/
    Tab1.tsx / Tab1.css     # Events dashboard — browse + search
    Tab2.tsx / Tab2.css     # My Tickets — QR codes (auth-guarded)
    Tab3.tsx / Tab3.css     # Profile — login/logout, admin hint
    Login.tsx / Login.css   # Phone + OTP login flow
    BookTicket.tsx / .css   # 4-step booking: details → payment → processing → QR
  theme/
    variables.css           # Ionic CSS variables
```

## App Flow

```
Tab1 (Events)
  └─ Book Now ──► /login (if not logged in) ──► /book/:eventId
                                                      │
                                             4-step booking flow
                                                      │
                                             Success screen + QR code
                                             (verify URL shown below QR)

Tab2 (My Tickets) — auth-guarded
  └─ Show Entry QR ──► Modal with QR image + verify URL

Tab3 (Profile)
  └─ Login / Logout
  └─ Admin hint (if isAdmin)
```

## Scripts

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run lint         # ESLint
npm run test.unit    # Vitest unit tests
npm run test.e2e     # Cypress e2e tests
```

## Building for Mobile (Capacitor)

```bash
npm run build
npx cap add android   # or ios
npx cap sync
npx cap open android  # opens Android Studio
```

## Dev Notes

- In dev, the OTP is returned in the API response and shown in a yellow banner on the login screen — no SMS needed.
- The QR code encodes `{VITE_API_URL}/verifyme/{ticketId}/{userJWT}`. The verify URL is also displayed as plain text below the QR so it can be copy-pasted into the admin scanner.
- Auth state persists in `localStorage` keys: `ht_token`, `ht_phone`, `ht_isAdmin`.
