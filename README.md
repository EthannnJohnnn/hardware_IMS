# MaxC Hardware Inventory Management System (IMS)

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite3-Database-003B57?logo=sqlite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-Visualization-FF6384?logo=chart.js&logoColor=white)
![License](https://img.shields.io/badge/License-Educational%2FPersonal%20Use-blue)

A full-stack, web-based Inventory Management and Accounting System built specifically for hardware stores. This application streamlines product tracking, financial reporting, transaction ledgers, and day-to-day administrative tasks into a single, highly responsive Single Page Application (SPA).

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack & Architecture](#️-tech-stack--architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Database Reset](#-database-reset)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Key Features

* **Interactive Financial Dashboard:** Real-time visualization of Sales Revenue, Net Profit, and Cost of Goods Sold (COGS) utilizing Chart.js.
* **Inventory Management:** Track hardware items, monitor stock levels, and set Cost Prices vs. Suggested Retail Prices (SRP).
* **Transaction Ledgers (Sales & Purchases):** Dedicated, separated ledgers that mimic Excel accounting workflows, tracking money coming in and money going out.
* **Master Financial Reports:**
  * Generate aggregate daily or monthly purchase reports.
  * Generate an **Executive Summary** P&L (Profit and Loss) report for specific date ranges, dynamically calculating Net Amount and Current Inventory Value.
* **Operating Expenses & Accounts Receivable:** Log daily store expenses and track unpaid customer debts (with the ability to mark them as settled).
* **Admin Workspace:** A built-in, database-persistent rich-text editor for the admin to track daily to-do lists, hardware restock orders, and reminders.
* **Excel Exporting:** Instantly generate and download beautifully formatted `.xlsx` spreadsheet reports for both Sales and Purchase ledgers.

---

## 🛠️ Tech Stack & Architecture

This project is built using a clean **Model-View-Controller (MVC)** architecture to ensure the code is scalable, maintainable, and highly organized.

**Frontend (View)**
* HTML5 & CSS3 (Custom UI with premium styling and responsive design)
* Vanilla JavaScript (ES6+) for DOM manipulation and SPA routing
* [Bootstrap 5](https://getbootstrap.com/) (For Modals, Grid layouts, and Utility classes)
* [Chart.js](https://www.chartjs.org/) (For interactive data visualization)

**Backend (Controller & Route)**
* [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) (RESTful API foundation)
* [ExcelJS](https://github.com/exceljs/exceljs) (For in-memory `.xlsx` generation)

**Database (Model)**
* [SQLite3](https://www.sqlite.org/index.html) (Lightweight, serverless relational database)

---

## 📁 Project Structure

```text
hardware_ims/
├── public/                  # Frontend Application (Views)
│   ├── css/
│   │   └── style.css        # Premium custom UI tokens & styling
│   ├── js/
│   │   └── app.js           # Frontend logic, SPA routing, & API fetching
│   └── index.html           # Main application interface
├── src/                     # Backend Application
│   ├── config/
│   │   └── database.js      # SQLite initialization and table creation
│   ├── controllers/         # Handles HTTP requests & responses
│   │   ├── arController.js
│   │   ├── expenseController.js
│   │   ├── exportController.js
│   │   ├── ledgerController.js
│   │   ├── noteController.js
│   │   ├── productController.js
│   │   ├── reportController.js
│   │   └── transactionController.js
│   ├── model/               # Handles raw SQLite database queries
│   │   ├── arModel.js
│   │   ├── expenseModel.js
│   │   ├── ledgerModel.js
│   │   ├── noteModel.js
│   │   ├── productModel.js
│   │   ├── reportModel.js
│   │   └── transactionModel.js
│   └── routes/              # URL Endpoint definitions (The "Traffic Cops")
├── server.js                # Express Server Entry Point
└── package.json             # Project dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18 or higher recommended) installed on your machine.

### Installation

1. Clone the repository to your local machine.
2. Open a terminal in the root folder of the project.
3. Install the required dependencies:

```bash
npm install
```

### Running the Application

To start the application in development mode (which auto-restarts when you save files):

```bash
npm run dev
```

Alternatively, you can run `npm start` for a standard production start.

The server will automatically generate the `inventory.sqlite` database file and create all necessary tables upon first boot.

### Accessing the System

Once the server is running, open your web browser and navigate to:

```text
http://localhost:3000
```

---

## 🔑 Environment Variables

The app runs with sensible defaults out of the box, but you can customize behavior using an optional `.env` file in the project root:

| Variable   | Description                          | Default        |
|------------|---------------------------------------|----------------|
| `PORT`     | Port the Express server runs on       | `3000`         |
| `DB_PATH`  | Path to the SQLite database file      | `inventory.sqlite` |
| `NODE_ENV` | Application environment mode          | `development`  |

---

## 🔌 API Overview

The backend exposes a RESTful API consumed by the SPA frontend. Endpoints are grouped by resource, following the MVC structure above:

| Resource         | Base Route          | Description                                  |
|------------------|----------------------|-----------------------------------------------|
| Products         | `/api/products`      | CRUD operations for hardware inventory items  |
| Transactions     | `/api/transactions`  | Sales & purchase ledger entries               |
| Reports          | `/api/reports`       | Daily/monthly summaries & P&L reports         |
| Expenses         | `/api/expenses`       | Operating expense logging                     |
| Accounts Receivable | `/api/ar`          | Track and settle unpaid customer debts        |
| Notes            | `/api/notes`         | Admin workspace to-do/reminder persistence    |
| Export           | `/api/export`        | Generate `.xlsx` sales & purchase reports     |

> Detailed request/response schemas can be added here as the API stabilizes.

---

## 💾 Database Reset

If you ever need to completely wipe the database and start fresh (e.g., clearing out test data), simply delete the `inventory.sqlite` file and restart the Node server. The system will automatically construct a fresh, empty database.

---

## 🩹 Troubleshooting

| Issue                                   | Possible Fix                                                        |
|------------------------------------------|----------------------------------------------------------------------|
| Port `3000` already in use               | Set a different `PORT` in `.env` or stop the conflicting process    |
| `inventory.sqlite` locked or corrupted   | Stop the server, delete the file, and restart to regenerate it      |
| Dependencies fail to install             | Delete `node_modules` and `package-lock.json`, then re-run `npm install` |
| Excel export downloads a blank file      | Confirm ExcelJS is installed and ledger data exists for the selected range |

---

## 🗺️ Roadmap

- [ ] User authentication & role-based access (admin vs. staff)
- [ ] Barcode scanning support for faster product entry
- [ ] Low-stock email/SMS alerts
- [ ] Multi-branch inventory support

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to fork the repository, create a feature branch, and submit a pull request.

---

## 📜 License

This project was created for educational and practical business management purposes. Feel free to fork, modify, and utilize it for your own inventory needs!
