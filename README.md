# ZK-Procure: Autonomous B2B Procurement with Zero-Knowledge Proofs

ZK-Procure solves the fundamental conflict in B2B procurement: **Trust vs. Privacy**. 
Buyers need to verify compliance (GST validity, revenue thresholds, creditworthiness) before issuing purchase orders, but suppliers hate exposing their raw financial data to third parties.

ZK-Procure combines **Autonomous AI Agents**, **Zero-Knowledge Proofs (ZKPs)**, and **Razorpay** to create a seamless, end-to-end procurement network where a buyer can mathematically verify a supplier's credentials without ever seeing the underlying sensitive data.

---

## 🏗 System Design & Architecture

The system consists of three main layers:

1. **AI Orchestration Layer (Google Gemini)**
   - Translates natural language intent into strict procurement policies.
   - Autonomously searches for suppliers and orchestrates the transaction state machine.
2. **Zero-Knowledge Compliance Layer (SnarkJS / OPA)**
   - Instead of uploading P&L statements, suppliers generate a cryptographic proof locally.
   - The backend uses Open Policy Agent (OPA) to evaluate the math, guaranteeing the supplier meets the criteria (e.g., Revenue > ₹50L) while preserving 100% data privacy.
3. **Settlement Layer (Razorpay)**
   - Once the ZK Proof is verified, the smart contract authorizes the transaction.
   - A Razorpay order is instantly generated and seamlessly captured for B2B checkout.

---

## 🛠 Tech Stack

* **Monorepo:** Turborepo, pnpm
* **Frontends (Buyer & Supplier):** Next.js 15, React, Tailwind CSS, Lucide Icons
* **Backend API:** Node.js, Fastify, Knex.js
* **Database & Infrastructure:** PostgreSQL, Redis, Docker
* **AI Agent:** Google Generative AI (Gemini 3.6 Flash)
* **Cryptography:** SnarkJS (Groth16 ZK-SNARKs)
* **Payments:** Razorpay API

---

## 🚀 How to Run the Project

### 1. Prerequisites
- **Node.js** (v18+)
- **pnpm** (\
pm install -g pnpm\)
- **Docker** (Must be running on your machine)

### 2. Start the Infrastructure (Database)
Open a terminal in the root directory (\c:\internship\RazorpayBuildathon\) and run:
\\\ash
docker-compose up -d
\\\
*(This spins up PostgreSQL on port 5433, Redis on 6379, and OPA on 8181).*

### 3. Install Dependencies
\\\ash
pnpm install
\\\

### 4. Start the Servers
You need three separate terminal windows to run the stack:

**Terminal 1: Start the Backend API**
\\\ash
cd apps/api
npx tsx src/index.ts
\\\
*(Runs on http://localhost:3001)*

**Terminal 2: Start the Buyer Dashboard**
\\\ash
cd apps/web-buyer
npm run dev
\\\
*(Runs on http://localhost:3000)*

**Terminal 3: Start the Supplier Portal**
\\\ash
cd apps/web-supplier
npm run dev
\\\
*(Runs on http://localhost:3002)*

---

## 🎬 Full End-to-End Flow & Exact Prompt

To demo the project, follow this exact sequence:

### Step 1: The Buyer Request (AI Agent)
1. Open the **Buyer Dashboard** at [http://localhost:3000/chat](http://localhost:3000/chat).
2. Paste this **exact prompt** into the chat:
   > **"Find me a supplier for 200 laptops with revenue over 5000000 paise. Create a transaction and request a ZK proof."**
3. The AI Agent will autonomously find a supplier, create a Draft transaction, and set the policy.

### Step 2: The Supplier Proof (Zero-Knowledge)
1. Open the **Supplier Portal** at [http://localhost:3002](http://localhost:3002).
2. You will see a pending compliance request from the buyer.
3. Click the **Generate Proof** button. 
4. *What happens:* The browser mathematically proves the supplier's revenue is > 50L without sharing the actual number, and submits it to the API.

### Step 3: The Buyer Settlement (Razorpay)
1. Go back to the **Buyer Dashboard** and open the **Transactions** tab ([http://localhost:3000/transactions](http://localhost:3000/transactions)).
2. Click on the transaction you just created.
3. The status will now say **AUTHORIZED** because the ZK Proof was verified.
4. Click the green **Proceed to Checkout** / **Mock Settle** button.
5. The payment is processed via Razorpay, and the transaction transitions to **SETTLED**.
