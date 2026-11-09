# Expense Tracker Website - Full-Stack Web Application

A complete, fully functional, responsive Full-Stack Expense Tracker **WEBSITE** developed for personal financial management and academic evaluation (MCA project).

Built using **Node.js, Express.js, MongoDB (Mongoose ODM), JWT Authentication, Bootstrap 5, and Chart.js**.

---

## 🌟 Key Features

### 1. Multi-Page Responsive Web Architecture (9 Pages)
- **Home / Landing Page (`index.html`)**: Modern financial SaaS introduction, features overview, workflow steps, and calls-to-action.
- **User Registration Page (`register.html`)**: Account creation with name, email, secure password hashing, and preferred currency selector (₹, $, €, £, ¥).
- **User Login Page (`login.html`)**: JWT authentication, password toggle visibility, and **1-Click Demo Credentials Filler** for instant evaluation.
- **User Dashboard (`dashboard.html`)**: 
  - 4 Live Metric Cards: Total Cumulative Expenses, Today's Spend, This Month's Spend, Total Transactions.
  - Interactive **Chart.js Category Doughnut Chart** with percentages and legend.
  - Interactive **Chart.js Monthly Spending Bar Chart**.
  - Recent Transactions table with category badges, payment methods, and dates.
  - Quick-Add Expense modal for fast logging.
- **Add Expense Page (`add-expense.html`)**: Dedicated expense entry form with title, amount, category, date, payment method, and description notes.
- **View All Expenses Page (`expenses.html`)**:
  - Live keyword search by title and description.
  - Category dropdown filter.
  - Date-range filter (Start Date / End Date).
  - Quick filter presets (Today, This Month, Last 30 Days, All Time).
  - Sorting options (Date newest/oldest, Amount high-to-low / low-to-high).
  - Detailed Expense View Modal.
  - Edit and Delete operations with confirmation modal.
  - **Export to CSV Spreadsheet** button.
- **Edit Expense Page (`edit-expense.html`)**: Dedicated editing interface pre-populated with existing transaction data.
- **Monthly Reports Page (`reports.html`)**:
  - Month and Year selector dropdowns.
  - Metric cards: Monthly total, Daily average, Highest expense, Top category.
  - Category breakdown with colored progress bars and percentage weights.
  - Day-by-Day spending trend line chart.
  - Printable monthly statement with `@media print` support (Print / Save as PDF).
- **User Profile Page (`profile.html`)**: View account statistics, update display name and preferred currency symbol, and change password securely.

### 2. Comprehensive Security & Authentication
- **Password Security**: Passwords hashed with `bcryptjs` using 10 salt rounds before storage.
- **Stateless Authentication**: Signed JSON Web Tokens (`jsonwebtoken`) with configurable expiration.
- **Authorization Middleware**: Express middleware verifies `Bearer <token>` on all private API endpoints.
- **Data Isolation**: All expense and analytics queries are strictly scoped to the authenticated user (`req.user._id`).

### 3. Expense Categories Supported
- 🍔 **Food**: Groceries, dining, snacks, delivery
- ✈️ **Travel**: Fuel, metro, flights, cabs, trains
- 🛍️ **Shopping**: Apparel, electronics, gadgets
- 📚 **Education**: Books, courses, tuition, supplies
- 💊 **Health**: Medicines, doctor visits, fitness/gym
- 🎬 **Entertainment**: Movies, games, OTT streaming
- 🧾 **Bills**: Electricity, rent, water, mobile, broadband
- 📦 **Others**: Miscellaneous expenditures

---

## 🏗️ System Architecture

```
+---------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                  |
|   (Chrome, Edge, Firefox - Desktop, Tablet, Mobile)                             |
|                                                                                 |
|   HTML5 + CSS3 + Bootstrap 5.3 + Bootstrap Icons + Chart.js                     |
|   Vanilla JavaScript (ES6 Modules & Fetch API)                                  |
|   JWT Token Stored in localStorage                                              |
+--------------------------------------^------------------------------------------+
                                       |
                                       | HTTP REST API (JSON)
                                       v
+---------------------------------------------------------------------------------+
|                             NODE.JS / EXPRESS BACKEND                           |
|                                                                                 |
|   [Static Server]        -> Serves frontend/ pages (index, dashboard, etc.)     |
|   [Auth Middleware]      -> Verifies JWT Authorization: Bearer <token>          |
|   [Controllers & Routes] -> /register, /login, /expenses, /expense, /profile   |
|   [Mongoose ODM]         -> Schema validation, hooks, aggregation pipelines     |
+--------------------------------------^------------------------------------------+
                                       |
                                       v
+---------------------------------------------------------------------------------+
|                             MONGODB DATABASE                                    |
|                                                                                 |
|   Collections:                                                                  |
|   - Users       (name, email, password [hash], currency, timestamps)            |
|   - Expenses    (user [ref], title, amount, category, date, paymentMethod)     |
|   - Categories  (name, icon, color, description)                                |
+---------------------------------------------------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3.3, Bootstrap Icons, Chart.js 4.4 |
| **Backend** | Node.js (v20+ / v22+), Express.js (v4.19+), REST API Architecture |
| **Database** | MongoDB, Mongoose ODM (v8+) |
| **Security** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS (`cors`) |
| **Environment** | `dotenv` configuration management, `morgan` HTTP logger |

---

## 📂 Project Directory Structure

```
expense-tracker-website/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & category auto-seeding
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, and token generation
│   │   ├── expenseController.js  # CRUD operations, filters, and aggregations
│   │   └── userController.js     # Profile updates and password changes
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification middleware
│   │   └── errorMiddleware.js    # Global centralized error handler
│   ├── models/
│   │   ├── Category.js           # Mongoose category schema
│   │   ├── Expense.js            # Mongoose expense schema with compound indexes
│   │   └── User.js               # Mongoose user schema with bcrypt hooks
│   ├── routes/
│   │   ├── authRoutes.js         # Auth routes (/api/auth)
│   │   ├── expenseRoutes.js      # Expense routes (/api/expenses)
│   │   └── userRoutes.js         # User profile routes (/api/users)
│   ├── utils/
│   │   └── seedData.js           # Database seeder with realistic demo data
│   └── server.js                 # Express server & static frontend serving
├── frontend/
│   ├── css/
│   │   └── style.css             # Custom design system, badges, and responsive sidebar
│   ├── js/
│   │   ├── api.js                # Centralized API fetch client, formatters, and toasts
│   │   ├── auth.js               # Auth handlers and route protection guards
│   │   ├── dashboard.js          # Dashboard summary metrics and Chart.js graphs
│   │   ├── expenses.js           # Expense CRUD, filters, search, CSV export
│   │   ├── reports.js            # Monthly reports, daily curves, printable view
│   │   └── profile.js            # User profile and password management
│   ├── index.html                # 1. Landing / Home page
│   ├── register.html             # 2. Registration page
│   ├── login.html                # 3. Login page
│   ├── dashboard.html            # 4. User dashboard
│   ├── add-expense.html          # 5. Add expense page
│   ├── expenses.html             # 6. View all expenses page
│   ├── edit-expense.html         # 7. Edit expense page
│   ├── reports.html              # 8. Monthly reports page
│   └── profile.html              # 9. User profile page
├── .env.example                  # Environment configuration template
├── .env                          # Active environment variables
├── package.json                  # Dependencies and execution scripts
└── README.md                     # Comprehensive academic project documentation
```

---

## 🚀 Installation & Execution Guide

### Prerequisites
1. **Node.js**: Version 18.x, 20.x, or 22.x installed.
2. **MongoDB**: Local MongoDB Community Server running (`mongod`) or a MongoDB Atlas URI.

### Step 1: Clone or Navigate to the Project
```bash
cd "expense taracker"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` (or use the preconfigured `.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/expense_tracker
JWT_SECRET=supersecretjwtkey_mcademo_2026_expense_tracker
JWT_EXPIRE=30d
```

### Step 4: Seed Demo Data (Optional but Recommended for Evaluation)
Populate realistic demo records and predefined categories:
```bash
npm run seed
```
This automatically provisions:
- **Demo User Email**: `demo@expensetracker.com`
- **Demo User Password**: `Password@123`
- **25+ realistic expense records** across different categories and dates.

### Step 5: Start the Server
```bash
npm start
```
Or for development with automatic restart on file changes:
```bash
npm run dev
```

### Step 6: Access the Website
Open your browser and visit:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 📡 REST API Reference

All requests and responses use standard `application/json`. Private endpoints require the header `Authorization: Bearer <token>`.

### Authentication Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register new user account |
| `POST` | `/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Private | Get current authenticated user details |

### Expense Management Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/expenses` | Private | Get all expenses (supports `search`, `category`, `startDate`, `endDate`, `sort`) |
| `POST` | `/expense` | Private | Create a new expense record |
| `GET` | `/expense/:id` | Private | Retrieve a single expense by ID |
| `PUT` | `/expense/:id` | Private | Update an existing expense by ID |
| `DELETE` | `/expense/:id` | Private | Permanently delete an expense by ID |

### Analytics & Reports Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/expense/total` | Private | Get summary totals (Total, Today, Month, Transactions Count) |
| `GET` | `/expense/monthly` | Private | Get 12-month expense trends for specified year (`?year=2026`) |
| `GET` | `/expense/category` | Private | Get category distribution with percentages (`?month=10&year=2026`) |

### User Profile Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/profile` | Private | Get profile details and lifetime spending stats |
| `PUT` | `/profile` | Private | Update user name and preferred currency symbol |
| `PUT` | `/api/users/change-password` | Private | Change account password |

---

## 🧪 Evaluation & Testing Checklist

| Test Item | Expected Result | Verified |
|---|---|---|
| **Landing Page** | Responsive layout, navigation links, and call-to-actions work | ✅ |
| **Registration** | Creates new user in MongoDB, hashes password, returns JWT | ✅ |
| **Login** | Validates email/password, stores token, redirects to dashboard | ✅ |
| **Demo Login** | "Fill Demo" button automatically populates credentials | ✅ |
| **Dashboard Metrics** | Live calculation of Total, Today, and Monthly expenses | ✅ |
| **Category Chart** | Chart.js doughnut chart renders proportions with tooltips | ✅ |
| **Monthly Chart** | Chart.js bar chart displays spending history across months | ✅ |
| **Add Expense** | Saves new record, updates dashboard metrics immediately | ✅ |
| **Filter & Search** | Live keyword search and category filtering work accurately | ✅ |
| **Edit Expense** | Pre-fills existing data and persists updates | ✅ |
| **Delete Expense** | Shows confirmation modal and removes expense record | ✅ |
| **Monthly Reports** | Month/Year picker recalculates daily spend and category weights | ✅ |
| **CSV Export** | Downloads formatted `.csv` spreadsheet of transactions | ✅ |
| **Print Statement** | Clean print layout hiding sidebars and buttons | ✅ |
| **Profile & Currency** | Changes to currency (₹, $, €, £) reflect instantly across UI | ✅ |
| **Security Guards** | Unauthorized access to `/dashboard.html` redirects to login | ✅ |

---

## 👨‍💻 Author & Academic Project Information
- **Project**: Full-Stack Expense Tracker Website
- **Degree / Course**: MCA (Master of Computer Applications)
- **Year**: 2026
