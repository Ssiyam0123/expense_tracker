# React Native Expo Mobile App Blueprint

This blueprint outlines the architecture, file structure, styling system, and offline sync strategy for the mobile companion app of the **Daily Expense Tracker**. It is designed to match the current Next.js web application structure, MongoDB schemas, and API contracts.

---

## 1. Technology Stack

- **Framework**: Expo (SDK 51+) with Expo Router (File-based Routing, matching Next.js App Router).
- **Language**: TypeScript.
- **Styling**: NativeWind (Tailwind CSS for React Native) to share responsive utility styling patterns.
- **Icons**: Expo Vector Icons (Lucide/FontAwesome).
- **State Management**: Zustand (lightweight, easy to persist).
- **Local Storage / Sync**:
  - `expo-sqlite` (structured offline database corresponding to IndexedDB).
  - `@react-native-async-storage/async-storage` (for settings, sync state, and queues).
- **Secure Storage**: `expo-secure-store` to persist authentication JWTs or session cookies.
- **Animations / Visuals**:
  - `expo-blur` (glassmorphism tabs, cards, and headers).
  - `react-native-svg` (for interactive line charts, donut breakdown graphs, and custom gauges).
  - `react-native-reanimated` (smooth micro-animations, swipe-to-delete transitions).

---

## 2. Directory Structure

The Expo application mirrors the Next.js routing and component design patterns:

```
expense-tracker-mobile/
├── app/                          # Expo Router Directory
│   ├── (auth)/                   # Authentication Group
│   │   ├── login.tsx             # Login Screen (Credentials & social toggle)
│   │   └── signup.tsx            # Signup Screen
│   ├── (tabs)/                   # Authenticated Tab Bar Layout
│   │   ├── _layout.tsx           # Tab Bar configuration (Glassmorphic look)
│   │   ├── index.tsx             # Home/Dashboard (Summary, Charts, QuickLog button)
│   │   ├── transactions.tsx      # Transactions List Page (Filters & Cards)
│   │   └── budgets.tsx           # Budgets list & progress screens
│   ├── _layout.tsx               # Root layout (Auth check, loading, themes)
│   └── modal/
│       ├── add-category.tsx      # Add Custom Category modal (Color picker, keyboard emojis)
│       └── edit-transaction.tsx  # Edit Transaction modal
├── components/                   # Shared UI Components
│   ├── DashboardSummary.tsx      # Cash Flow summary, remaining budget calculations
│   ├── QuickLogForm.tsx          # Fast input widget (falls back to Cash/Default Category)
│   ├── TransactionCard.tsx       # Glassmorphic card matching web redesign
│   ├── CategoryBreakdown.tsx     # Custom SVG Donut chart component
│   ├── CashFlowTrend.tsx         # Custom SVG Line/Area chart component
│   └── ui/                       # Base components (buttons, input fields)
├── db/                           # Local database configuration
│   ├── schema.ts                 # Local SQLite schema
│   └── sync.ts                   # Synchronization engine (idempotency, tombstoning)
├── hooks/                        # Custom React Hooks
│   ├── useAuth.ts                # Session management
│   └── useSync.ts                # Trigger-based sync scheduler
├── lib/                          # Utility libraries
│   ├── api.ts                    # Axios/Fetch client wrapper (attaches auth header)
│   └── utils.ts                  # Number formatting, currency utils, BDT minor units logic
├── package.json
└── app.json
```

---

## 3. Data Schema & Minor Units Configuration

To maintain consistency with the MongoDB backend schemas, money amounts **MUST** be stored and computed as integers representing **minor units (paisa)**.

### Local SQLite Schema Structure (`db/schema.ts`):
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,                  -- local UUID (matches local_id)
  server_id TEXT,                       -- MongoDB _id (if synced)
  amount_minor INTEGER NOT NULL,        -- e.g. 150000 representing 1,500.00 BDT
  currency TEXT DEFAULT 'BDT',
  type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
  category_id TEXT NOT NULL,
  payment_method_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,              -- ISO 8601 string
  note TEXT,
  tags TEXT,                            -- Comma-separated or JSON array
  sync_status TEXT CHECK(sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete')) DEFAULT 'pending_create',
  version INTEGER DEFAULT 1,
  deleted_at TEXT                       -- soft delete ISO string
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,                            -- emoji or icon key
  color TEXT,                           -- HEX color code
  type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT
);
```

---

## 4. API Client & Session Management

The mobile app communicates with the Next.js API route handlers (`/api/v1/`).

### Auth Hook (`hooks/useAuth.ts`):
- React Native cannot directly share the web NextAuth cookie session out-of-the-box.
- **Authentication Method**: Next.js route handlers can accept a JWT inside the `Authorization: Bearer <token>` header, or a custom session token. On login, the mobile app posts credentials to `/api/auth/callback/credentials` (or a dedicated mobile auth endpoint) and saves the session cookie/token in `expo-secure-store`.

### Axios API Wrapper (`lib/api.ts`):
```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://your-expense-tracker-domain.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 5. Offline Sync Engine

The mobile sync engine mirrors the browser's IndexedDB Last-Write-Wins (LWW) queue:

```mermaid
graph TD
    A[Create/Update/Delete Tx in Mobile UI] --> B[Write to Local SQLite with sync_status]
    B --> C{Internet Online?}
    C -- No --|Wait for trigger| D[Keep in Local DB]
    C -- Yes --> E[Trigger Sync API: POST /api/v1/transactions/sync]
    E --> F[Send local payload + device_id + local_id]
    F --> G[Next.js Server: Conflict check with updated_at / version]
    G --> H[Server updates MongoDB & returns final state]
    H --> I[Mobile DB: update sync_status to 'synced' & server_id]
```

### Sync Sync Payload Contract:
The sync payload matches the server expectation `/api/v1/transactions/sync`:
```typescript
interface SyncPayload {
  sourceDeviceId: string;
  transactions: {
    localId: string;
    amountMinor: number;
    currency: string;
    type: 'income' | 'expense';
    categoryId: string;
    paymentMethodId: string;
    timestamp: string;
    note?: string;
    tags?: string[];
    version: number;
    deletedAt?: string | null;
  }[];
}
```

---

## 6. Premium Responsive UI Conventions (Mobile-First)

To guarantee the user is wowed by the interface (matching the desktop glassmorphic design):

1. **Background Neon Blobs**: Use absolute positioned, blurred circular `<View>` tags with low opacity primary colors behind transparent containers:
   ```tsx
   // Neon Glow Background
   <View className="absolute top-[-50] left-[-50] w-[200] h-[200] bg-emerald-500 rounded-full blur-[80] opacity-20" />
   ```
2. **Glassmorphism panels**: Use `expo-blur`'s `<BlurView>` or semi-transparent background colors:
   - Card Background: `rgba(255, 255, 255, 0.02)`
   - Border: `rgba(255, 255, 255, 0.08)`
   - Text Colors: Primary (`#ffffff`), Secondary/Muted (`#a1a1aa`), Accents (`#22c55e` / `#ef4444`).
3. **Transaction Cards**:
   - Align **Icon & Category** on the left.
   - Align **Amount** in bold monospaced typography on the right.
   - Separate metadata pills (Payment Method icon, Date) with thin borders (`border-white/[0.05]`).
   - Note elements must expand vertically inside a padded sub-card using `numberOfLines={0}` to prevent text truncation bugs.
4. **SVG Charts**:
   - Use `react-native-svg` to draw paths for area charts. Add responsive height/width bindings by using `onLayout` triggers.
   - Custom hover tooltips are triggered via `PanGestureHandler` (from `react-native-gesture-handler`) tracking touch positions.
