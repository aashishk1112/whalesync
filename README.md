# WhaleSync - Automated Trader Copying Platform

WhaleSync is a premium, high-performance platform for automated trader copying, built with a modern, glassmorphic UI and a robust AWS-backed infrastructure. It enables users to follow top traders, analyze performance metrics, and participate in a tiered subscription ecosystem.

## 🚀 Live Environments

| Environment | Status | URL |
| :--- | :--- | :--- |
| **Production** | 🟢 Live | [https://dh92ug7975qbn.cloudfront.net](https://dh92ug7975qbn.cloudfront.net) |
| **Development** | 🟡 Active | [https://d36lxxpxcj1q4f.cloudfront.net](https://d36lxxpxcj1q4f.cloudfront.net) |

---

## ✨ Core Features

### 1. Tiered Subscription Model
A dynamic, database-driven pricing system stored in DynamoDB:
- **Free**: 1 Trader Slot, 5-min Signal Delay, Limited Capital.
- **Pro**: 10 Trader Slots, Real-time Signals, AI Suggestions.
- **Elite**: Unlimited Slots, Whale Alerts, Early Signal Access.

### 2. Referral Engine
- **Reward**: +1 Trader Slot for every successful referral.
- **Unique Codes**: Every user gets a dedicated referral code and link in their Settings.

### 3. Intelligence & Analytics
- **Global Leaderboard**: Rank traders by ROI, PNL, and Win Rate with real-time Polymarket data.
- **Performance Dashboard**: Personal analytics including accuracy, equity growth charts (SVG), and risk metrics.

### 4. Advanced UI/UX
- **Glassmorphism**: Sleek, modern design with blurred panels and vibrant gradients.
- **Micro-animations**: Smooth transitions and interactive elements for a premium feel.

---

## 🛠 Tech Stack

- **Frontend**: React (Vite), TailwindCSS-inspired Vanilla CSS, Lucide Icons.
- **Backend**: FastAPI (Python), Boto3, Pydantic.
- **Database**: AWS DynamoDB (Isolated stacks for Dev/Prod).
- **Security**: AWS Secrets Manager, Google OAuth 2.0.
- **Deployment**: AWS Lambda, API Gateway, S3, CloudFront.

---

## 🏗 Infrastructure & Deployment

We use a **prefixed resource strategy** to ensure complete isolation between environments.

### Environment Separation
- **Dev Resources**: `dev-whalesync-users`, `dev-whalesync-secrets`, etc.
- **Prod Resources**: `prod-whalesync-users`, `prod-whalesync-secrets`, etc.

### Deployment Strategy & Branch Segregation
The `deploy_direct.sh` script enforces a strict branch-to-environment mapping to prevent accidental overrides:

| Environment | Target Branch | Workflow |
| :--- | :--- | :--- |
| **Production** | `main` | Merge `dev` $\rightarrow$ `main`, then `./deploy_direct.sh prod` |
| **Development** | `dev` | Merge `feature/*` $\rightarrow$ `dev`, then `./deploy_direct.sh dev` |

The script validates your current Git branch before proceeding with any AWS provisioning.

The script handles:
1. DynamoDB table creation & automated seeding (Subscription Tiers).
2. Secret Manager setup.
3. Lambda function provisioning with environment-specific variables.
4. S3 frontend hosting and CloudFront distribution.
5. Cache invalidation.

---

## 💻 Local Development

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Use .env.development for local settings
   uvicorn main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 📝 License
Proprietary - WhaleSync Team
