
---

# 💳 Full-Stack Payment Gateway Simulation

> A complete, end-to-end payment processing system built from scratch.

This project simulates a real-world payment gateway architecture, featuring a drop-in JavaScript SDK for merchants, a secure hosted checkout page, a RESTful API, and a PostgreSQL database for transaction ledgering. It is designed to demonstrate how modern payment providers securely handle sensitive data without exposing the merchant to PCI-DSS scope.

---

## 🚀 Project Overview

The system allows a **"Merchant"** website to collect payments securely. It decouples the frontend payment UI from the backend processing logic using a microservices approach.

### Key Components

* **Merchant SDK:** A lightweight library (`checkout.js`) that injects a secure iframe/modal into the merchant's site.
* **Checkout Frontend:** An isolated service that renders the actual payment UI (Card/UPI selection), ensuring isolation.
* **Backend API:** The core service responsible for validating requests, creating orders, and capturing payments.
* **Worker Service:** Handles asynchronous background processing (simulating bank communication latency).
* **Database:** PostgreSQL for persistent storage of transaction ledgers.
* **Containerization:** Fully Dockerized environment for consistent one-command deployment.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| --- | --- |
| **Frontend** | HTML5, CSS3, Vanilla JS (SDK), Express.js (Checkout Server) |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Queue/Cache** | Redis |
| **DevOps** | Docker, Docker Compose, Webpack (SDK Bundling) |

---

## 📂 Architecture & Services

The system is composed of five main microservices orchestrated via **Docker Compose**:

| Service Name | Port | Description |
| --- | --- | --- |
| **Checkout Service** | `3001` | Serves the payment UI and acts as a proxy to the API. |
| **API Service** | `8000` | Core logic for creating orders and capturing payments. |
| **Worker** | *N/A* | Processes background payment jobs from the queue. |
| **Database** | `5432` | PostgreSQL instance storing payment records. |
| **Redis** | `6379` | Message broker/Queue for the worker service. |

---

## 🏁 Getting Started

### Prerequisites

* **Docker Desktop** (Installed and running)
* **Node.js** (Optional, for local development/SDK building)

### Installation & Setup

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd payment_gateway

```

**2. Build the SDK**
Before running the containers, you must compile the merchant SDK.

```bash
cd sdk
npm install
node build.js
cd ..

```

**3. Start the System**
Spin up the entire stack (Database, API, Frontend, Redis) using Docker Compose.

```bash
docker-compose up --build

```

---

## 🧪 How to Test

Once the Docker containers are up and running, follow these steps to simulate a transaction:

1. **Open the Merchant Page:**
Locate the `test-merchant.html` file in the root directory and open it in your web browser.
2. **Initiate Payment:**
* Click the green **"Buy Now"** button on the merchant page.
* A secure modal will appear (served from the Checkout Service).


3. **Complete Transaction:**
* Select a payment method (e.g., UPI) and click **"Pay Now"**.
* The modal will display "Processing..." followed by "Payment Successful!".


4. **Verify:**
The modal will close, and the merchant page will receive a JavaScript callback with the Payment ID.

---

## 🔍 Debugging & Verification

### Check Database Records

Verify that the payment was successfully recorded in the PostgreSQL ledger:

```bash
docker exec -it gateway_db psql -U gateway_user -d payment_gateway -c "SELECT * FROM payments;"

```

### Useful Management Commands

**View Logs for a specific service:**

```bash
# Checkout Frontend Logs
docker logs payment_gateway-checkout-1

# API Backend Logs
docker logs gateway_api

```

**Restart a service:**

```bash
docker-compose restart checkout

```

**Stop and Clean Up:**

```bash
docker-compose down

```

---

## 📜 Project Structure

```plaintext
payment_gateway/
├── sdk/                  # The Merchant JavaScript SDK
│   ├── src/              # Source code (index.js, modal.js)
│   ├── dist/             # Compiled output (checkout.js)
│   └── build.js          # Custom build script
├── frontend/             # The Checkout UI Service
│   ├── public/           # HTML/CSS for the payment page
│   └── server.js         # Express server & Proxy logic
├── backend/              # Main API Logic
├── docker-compose.yml    # Orchestration config
└── test-merchant.html    # Demo website to test the integration

```

---