# 🔁 Account Recovery & Re-Entry System

## 🎯 Objective

Handle users re-registering with a previously deleted account in a way that:

- Prevents leaderboard abuse
- Preserves user identity
- Improves retention and reactivation
- Maintains data integrity

---

## 🧠 Core Principle

> Accounts are persistent identities, not disposable sessions.

---

## 🔄 User Flow

### Scenario: User signs up with an existing (deleted) email

1. System detects existing account
2. Blocks automatic account creation
3. Displays Account Recovery Modal

---

## 🧩 User Options

### 1. Restore Account (Default)

- Reactivates previous account
- Restores:
  - PnL history
  - ROI / rankings
  - Followers / copiers
  - Trade history

### 2. Start Fresh

- Creates a new account
- Previous account is archived
- No historical data is carried forward

---

## ⚠️ Anti-Abuse Rules

To prevent gaming the leaderboard:

- Users starting fresh:
  - Cannot appear on leaderboard for 7 days
  - Cannot earn badges immediately
  - Risk score initialized conservatively

---

## 🗄️ Data Handling

### Soft Delete Strategy (Recommended)

- `account_status = deleted`
- Data is retained but hidden
- Enables recovery + audit tracking

---

## 🧱 Data Relationships

| Entity            | Behavior on Restore | Behavior on Fresh Start |
|------------------|-------------------|------------------------|
| PnL History       | Restored          | Not linked             |
| Followers         | Restored          | Reset                  |
| Trades            | Restored          | Reset                  |
| Leaderboard Rank  | Restored          | Reset                  |

---

## 🎮 Gamification Opportunity

If historical data exists, show:

- Previous Rank
- Best ROI
- Follower Count

### Example Copy
>
> "You previously ranked #42 with +18% ROI. Continue where you left off?"

---

## 📊 Analytics Events

- `account_recovery_modal_viewed`
- `account_restored`
- `account_fresh_start`
- `reentry_conversion_rate`

---

## ⚙️ API Endpoints

### 1. Restore Account
`POST /api/auth/restore`
- **Payload**: `{ "email": "user@example.com" }`
- **Logic**:
  - Updates `status` to `active`
  - Removes `deleted_at` timestamp
  - Re-activates all previous data links

### 2. Start Fresh
`POST /api/auth/create_new`
- **Payload**: `{ "email": "user@example.com" }`
- **Logic**:
  - Archives previous user ID (`status = archived`)
  - Generates new `userId`
  - Initializes fresh portfolio ($\$10,000$ default)
  - Applies `leaderboard_lock` (7-day cooling period)

---

## 🛠️ Implementation Checklist

- [x] Backend DynamoDB Service Update (`restore_user`, `create_fresh_account`)
- [x] API Routes in `auth.py`
- [x] Frontend `AccountRecoveryModal` component
- [x] `AuthContext` integration
- [x] `Login.jsx` trigger logic
- [ ] Manual E2E Verification
