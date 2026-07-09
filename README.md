# Lithum Furniture Management System 🪑

Welcome to the **Lithum Furniture Management System**, a fully modernized, full-stack enterprise web application designed to streamline point-of-sale (POS) operations, inventory tracking, and complex credit-based sales management for Lithum Furniture.

## 🚀 Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Lucide Icons, SweetAlert2.
- **Backend**: NestJS, TypeScript, TypeORM.
- **Database**: PostgreSQL (Relational Database).
- **Styling**: Custom modern CSS (Glassmorphism, dynamic animations, CSS Variables for seamless theming).

## ✨ Key Features

### 1. Point of Sale (Cashier Checkout)
- Seamless transaction process for direct cash sales.
- Dynamic stock querying and price auto-filling.
- Flexible discount application (Fixed Amount or Percentage).
- **Advanced Receipt Printing**: Isolated iframe-based printing ensures perfect receipt formatting and PDF exports every time.

### 2. Advanced Credit System (Provide Goods on Credit)
- Provides long-term payment plans for customers.
- **Smart NIC Customer Management**: Automatically validates and searches existing customers using Sri Lankan NIC formats (9-digit V/X or 12-digit). Auto-fills details and displays their previous credit transaction history.
- **Dynamic Interest Calculation**: Automatically scales interest based on the chosen month duration.
- **KYC & Security Verification**: Live webcam integration allows cashiers to capture customer faces directly from the browser, along with uploading NIC images.
- **Printable Agreements**: Generates a professional credit agreement upon submission.

### 3. Credit History & Debt Management
- Centralized dashboard to track active loans, pending balances, and paid amounts.
- **Advanced Date Filtering**: Filter credit records by Today, This Month, or Specific Dates with dynamically updating summary totals (Period Loans Generated, Period Downpayments).
- **Early Settlement Support**: Robust backend recalculation that allows customers to settle their debts early, updating the final due amounts accurately to zero.
- Image verification lightboxes (Click-to-zoom for customer identity validation).

### 4. Inventory, Workshop & Supplier Management
- **Raw Stock Management**: Track in-house manufactured furniture with live search filtering.
- **Workshop Inventory**: Dedicated management for work-in-progress goods. Easily transfer completed products directly from the workshop to the main shop floor.
- **Supplier Ecosystem**: Register external distributor companies and distinctly track supplier-provided inventory.
- One-click restock features and instant search across all inventory tables.

### 5. Financial Analytics Dashboard
- Comprehensive multi-source analytics combining POS direct sales and Credit down payments.
- Real-time calculations of **Global Earnings** and **Outstanding Customer Payables**.
- **POS Transaction History**: Robust date filtering with a dynamic summary banner that instantly recalculates Period Revenue and Profit based on the selected timeframe.

## 🛠️ How to Run Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally.

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend-shop-api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the database connection in `src/app.module.ts`.
4. Start the backend server:
   ```bash
   npm run start:dev
   ```
   *The API will run on `http://localhost:4000`.*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend-shop-admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The Dashboard will be accessible at `http://localhost:3000`.*

## 🔒 Security Notes
- Large payload limits are configured on the backend (`body-parser`) to gracefully handle high-resolution Base64 security images from the webcam and file uploads.
- Destructive actions (Deletions, checkouts, form resets) are protected by robust **SweetAlert2** confirmation dialogs to prevent accidental data loss.

---
*Built with ❤️ for Lithum Furniture.*
