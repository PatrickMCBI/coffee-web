# Brew & Bean — Coffee Shop Ordering System

Next.js (App Router) + Firebase (Firestore + Auth) + Bootstrap 5.

## Features

**Customer side**
- Browse menu by category, add items to a cart (persisted in `localStorage`)
- Checkout with name / phone / notes, writes an order to Firestore
- Live order status tracking page (`/order/[id]`), updates in real time as the admin changes status
- `/track` page to look up an order by ID

**Admin side** (`/admin/login` → `/admin/dashboard`)
- Email/password sign-in via Firebase Auth
- **New-order alerts**: a chime (generated with the Web Audio API — no audio file needed) plus a toast popup fires whenever a new order comes in, from any tab. A bell icon in the navbar badges the unread count and jumps to the Orders tab; a speaker icon mutes/unmutes the sound (saved in `localStorage`). Clicking the speaker also asks for browser-notification permission, so orders can alert you even when the dashboard tab isn't focused.
- **Analytics tab**: revenue, order count, average order value, and a status breakdown for Today / 7 days / 30 days / all time, a revenue-over-time chart, and a top-selling-items chart + table
- **Orders tab**: live list of incoming orders, filter by status, update status (pending → preparing → ready → completed / cancelled)
- **Menu tab**: full CRUD for menu items (name, description, price, category, image URL, available toggle)

## 1. Create a Firebase project

1. Go to the Firebase console (console.firebase.google.com) → Add project.
2. In **Build → Firestore Database**, create a database (start in production mode).
3. In **Build → Authentication → Sign-in method**, enable **Email/Password**.
4. In **Authentication → Users**, add the admin user(s) you'll sign in with (email + password).
5. In **Project settings → General → Your apps**, add a Web app and copy the config values.
6. Deploy `firestore.rules` (included in this project) via the Firebase console's Rules tab, or with the CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # point it at this project, keep the existing firestore.rules
   firebase deploy --only firestore:rules
   ```

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the `NEXT_PUBLIC_FIREBASE_*` values from step 1.5, and set:

```
NEXT_PUBLIC_ADMIN_EMAILS=you@example.com,manager@example.com
```

This is the list of emails allowed into `/admin/dashboard`. Anyone signed in with a different email is redirected back to the login page. (This check is client-side convenience only — see **Security notes** below.)

## 3. Install and run

```bash
npm install
npm run dev
```

- Shop: http://localhost:3000
- Admin: http://localhost:3000/admin/login

Add your first menu items from the Menu tab — the homepage reads live from Firestore, so items appear immediately.

## Data model

**`menuItems` collection**
```
{ name, description, price (number), category, imageUrl, available (bool) }
```

**`orders` collection**
```
{
  items: [{ id, name, price, qty }],
  total, customerName, phone, notes,
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled",
  createdAt: serverTimestamp
}
```

## Security notes

- `firestore.rules` lets anyone create an order and read a single order by ID (needed for checkout + tracking without login), but only signed-in users can list all orders, change order status, or write menu items.
- The `NEXT_PUBLIC_ADMIN_EMAILS` allowlist only gates the UI. To also restrict at the database level to *specific* admin emails (not just "any signed-in user"), set a custom claim (e.g. `admin: true`) on those accounts via the Firebase Admin SDK and change the rules to check `request.auth.token.admin == true`. Fine for a single-shop setup with a small trusted staff list; worth doing before scaling up.

## Deploying to Cloudflare

This project is already configured for Cloudflare Workers using the official OpenNext adapter (`@opennextjs/cloudflare`, `wrangler.jsonc`, `open-next.config.ts` are included).

1. **Install the Cloudflare CLI dependencies** (already in `package.json`, just run):
   ```bash
   npm install
   ```

2. **Log in to Cloudflare** (opens a browser to authorize):
   ```bash
   npx wrangler login
   ```

3. **Add your environment variables as Worker secrets/vars.** The `NEXT_PUBLIC_*` Firebase values get baked into the client bundle at build time, so set them in your shell (or a `.env.local` for local builds) before deploying:
   ```bash
   cp .env.local.example .env.local   # fill in your real Firebase values
   ```
   If you deploy from **Cloudflare's dashboard (Workers Builds / Git integration)** instead of your machine, add the same variables under your Worker's *Settings → Build variables and secrets* so they're available during the build.

4. **Preview it running in the actual Workers runtime** (recommended before your first real deploy — this uses `workerd`, not the Next.js dev server):
   ```bash
   npm run preview
   ```

5. **Deploy:**
   ```bash
   npm run deploy
   ```
   This runs `opennextjs-cloudflare build` then `opennextjs-cloudflare deploy`, and prints your live URL (`https://brew-and-bean-coffee-shop.<your-subdomain>.workers.dev`). Change the `name` field in `wrangler.jsonc` first if you want a different subdomain, and add a custom domain afterward from the Cloudflare dashboard under your Worker's *Settings → Domains & Routes*.

**Alternative: deploy via Git (Workers Builds).** Push this repo to GitHub/GitLab, then in the Cloudflare dashboard go to *Workers & Pages → Create → Connect to Git*, select the repo, set the build command to `npx opennextjs-cloudflare build`, and add your environment variables under *Build variables and secrets*. Every push then auto-deploys.

Note: Cloudflare's older "Pages" product only supported static exports or the Edge runtime for Next.js. The Workers + OpenNext path used here supports the full feature set this app needs (Server Actions, SSR, middleware, etc.), so it's the right target rather than Pages.

