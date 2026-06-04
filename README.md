<div align="center">

# 🍽️ E-Canteen
### *A Smart Digital Canteen Management System*

[![PHP](https://img.shields.io/badge/PHP-7.4+-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> **Eliminate canteen queues. Digitize orders. Delight students.**  
> E-Canteen is a full-stack web application that transforms the traditional college canteen experience into a seamless, paperless, and efficient digital workflow for students, staff, and administrators.

[🚀 Live Demo](#) · [📖 Documentation](#table-of-contents) · [🐛 Report Bug](../../issues) · [✨ Request Feature](../../issues)

---

</div>

## 📋 Table of Contents

- [✨ About The Project](#-about-the-project)
- [🌟 Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🗄️ Database Schema](#️-database-schema)
- [🔄 User Flow Diagrams](#-user-flow-diagrams)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚙️ Installation & Setup](#️-installation--setup)
- [🖥️ Screenshots & Usage](#️-screenshots--usage)
- [🔐 Roles & Permissions](#-roles--permissions)
- [📊 Feature Overview](#-feature-overview)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👥 Authors](#-authors)

---

## ✨ About The Project

The **E-Canteen** system was born out of a simple frustration: long queues, lost paper tokens, and wasted lunch breaks. This project digitizes the entire canteen workflow — from browsing the menu to placing orders and tracking delivery — reducing wait times and eliminating manual errors.

### 🎯 Problem Statement

```
Traditional Canteen Problems:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ❌  Long physical queues during peak hours
  ❌  Manual billing errors and cash management
  ❌  No visibility into order status
  ❌  Difficult inventory and stock management
  ❌  No data-driven insights for canteen owners

E-Canteen Solutions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  Pre-order food from anywhere on campus
  ✅  Automated digital billing and receipts
  ✅  Real-time order tracking
  ✅  Stock alerts and inventory dashboard
  ✅  Sales reports and analytics for admins
```

---

## 🌟 Key Features

### 👨‍🎓 Student Features
| Feature | Description |
|---|---|
| 🔐 **Secure Registration & Login** | Email-verified accounts with session management |
| 🍕 **Browse Menu** | View categorized food items with prices and availability |
| 🛒 **Smart Cart** | Add/remove items, adjust quantity, view live total |
| 📦 **Place Orders** | Submit orders with preferred pickup slot |
| 📱 **Order Tracking** | Real-time status updates (Pending → Preparing → Ready) |
| 📜 **Order History** | Full history of past orders with receipts |

### 👨‍💼 Admin Features
| Feature | Description |
|---|---|
| 🔑 **Admin Dashboard** | Bird's-eye view of daily operations |
| 🍽️ **Menu Management** | Add, edit, delete food items and categories |
| 📋 **Order Management** | View, accept, and update order statuses |
| 📊 **Sales Reports** | Daily, weekly, monthly revenue analytics |
| 👥 **User Management** | View and manage registered students |
| 🏪 **Inventory Control** | Stock tracking with low-stock alerts |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│   ┌──────────────────┐        ┌──────────────────────────┐  │
│   │   Student Portal  │        │      Admin Dashboard     │  │
│   │  (HTML/CSS/JS)    │        │     (HTML/CSS/JS)        │  │
│   └────────┬─────────┘        └───────────┬──────────────┘  │
└────────────┼─────────────────────────────┼────────────────── ┘
             │  HTTP Requests              │  HTTP Requests
             ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                                                             │
│   ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│   │   Auth     │  │   Order    │  │      Menu          │   │
│   │  Module    │  │  Module    │  │     Module         │   │
│   └────────────┘  └────────────┘  └────────────────────┘   │
│                                                             │
│   ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│   │   Cart     │  │  Reports   │  │    Inventory       │   │
│   │  Module    │  │  Module    │  │     Module         │   │
│   └────────────┘  └────────────┘  └────────────────────┘   │
│                                                             │
│                    PHP Backend (Apache)                     │
└─────────────────────────────────┬───────────────────────── ┘
                                  │  SQL Queries
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│                                                             │
│        ┌─────────────────────────────────────┐             │
│        │           MySQL Database             │             │
│        │  users │ menu │ orders │ cart │ ...  │             │
│        └─────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

```sql
┌──────────────────┐        ┌──────────────────────┐
│      users       │        │       menu_items     │
├──────────────────┤        ├──────────────────────┤
│ id (PK)          │        │ id (PK)              │
│ name             │        │ name                 │
│ email (UNIQUE)   │        │ description          │
│ password (hash)  │        │ price                │
│ phone            │        │ category             │
│ role             │        │ stock_quantity       │
│ created_at       │        │ image_url            │
└────────┬─────────┘        │ is_available         │
         │                  │ created_at           │
         │  1               └──────────┬───────────┘
         │                             │
         │  ┌──────────────────┐  1    │
         │  │      cart        ├───────┘ M
         │  ├──────────────────┤
         └──┤ user_id (FK)     │
            │ item_id (FK)     │
            │ quantity         │
            └──────────────────┘

┌──────────────────────────┐     ┌─────────────────────┐
│         orders           │     │    order_items      │
├──────────────────────────┤     ├─────────────────────┤
│ id (PK)                  │  1  │ id (PK)             │
│ user_id (FK)             ├────►│ order_id (FK)       │
│ total_amount             │  M  │ item_id (FK)        │
│ status                   │     │ quantity            │
│   (Pending/Preparing/    │     │ unit_price          │
│    Ready/Delivered)      │     └─────────────────────┘
│ created_at               │
│ pickup_time              │
└──────────────────────────┘
```

---

## 🔄 User Flow Diagrams

### 🎓 Student Order Flow

```
  [Student Opens App]
         │
         ▼
  ┌─────────────┐    NO    ┌───────────────┐
  │  Logged In? ├─────────►│  Login/Signup │
  └──────┬──────┘          └───────┬───────┘
         │ YES                     │
         ▼                         ▼
  ┌─────────────────┐       ┌─────────────┐
  │   View Menu     │◄──────┤  Auth OK?   │
  └──────┬──────────┘       └─────────────┘
         │
         ▼
  ┌─────────────────┐
  │  Add to Cart    │
  └──────┬──────────┘
         │
         ▼
  ┌─────────────────┐    MODIFY   ┌────────────────┐
  │  Review Cart    ├────────────►│ Update/Remove  │
  └──────┬──────────┘             └────────────────┘
         │ CONFIRM
         ▼
  ┌─────────────────┐
  │   Place Order   │
  └──────┬──────────┘
         │
         ▼
  ┌─────────────────┐
  │  Order Placed ✅ │
  │  (Token/ID)     │
  └──────┬──────────┘
         │
         ▼
  ┌──────────────────────────────────────┐
  │         Live Status Tracking         │
  │  Pending → Preparing → Ready → Done  │
  └──────────────────────────────────────┘
```

### 👨‍💼 Admin Order Management Flow

```
  [Admin Logs In]
        │
        ▼
  ┌─────────────────┐
  │ Admin Dashboard │
  └──────┬──────────┘
         │
    ┌────┴──────────────────┐
    │                       │
    ▼                       ▼
┌──────────┐          ┌───────────┐
│ New Order│          │  Manage   │
│ Arrives  │          │  Menu     │
└────┬─────┘          └─────┬─────┘
     │                      │
     ▼                      ▼
┌──────────┐          ┌───────────┐
│  Accept  │          │Add/Edit/  │
│  Order   │          │Delete Item│
└────┬─────┘          └───────────┘
     │
     ▼
┌──────────────────┐
│ Mark "Preparing" │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Mark "Ready"    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Order Delivered  │
│ → Update Reports │
└──────────────────┘
```

---

## 🛠️ Tech Stack

```
Frontend                    Backend                     Database
─────────────────           ─────────────────           ─────────────────
HTML5          ████████     PHP 7.4+       ████████     MySQL 5.7+  ████████
CSS3           ████████     Apache/XAMPP   ████████     phpMyAdmin  ██████
Bootstrap 5    ███████      Sessions/Auth  ███████      SQL Queries ████████
JavaScript     ██████       PDO/MySQLi     ████████
jQuery         █████
```

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | HTML5 + CSS3 | Latest | Structure & Styling |
| **UI Framework** | Bootstrap | 5.x | Responsive layout |
| **Scripting** | JavaScript / jQuery | Latest | Dynamic interactions |
| **Backend** | PHP | 7.4+ | Server-side logic |
| **Database** | MySQL | 5.7+ | Data persistence |
| **Server** | Apache (XAMPP) | 3.x | Local development |

---

## 📁 Project Structure

```
e-canteen/
│
├── 📁 admin/
│   ├── dashboard.php          # Admin overview & stats
│   ├── manage_menu.php        # Add/edit/delete food items
│   ├── manage_orders.php      # View & update order status
│   ├── manage_users.php       # Student account management
│   └── reports.php            # Sales & revenue reports
│
├── 📁 student/
│   ├── home.php               # Browse menu items
│   ├── cart.php               # Shopping cart
│   ├── order.php              # Place order
│   ├── track_order.php        # Live order status
│   └── history.php            # Past orders
│
├── 📁 auth/
│   ├── login.php              # Login page
│   ├── register.php           # Student registration
│   ├── logout.php             # Session destroy
│   └── verify.php             # Account verification
│
├── 📁 assets/
│   ├── 📁 css/                # Custom stylesheets
│   ├── 📁 js/                 # JavaScript files
│   └── 📁 images/             # Food & UI images
│
├── 📁 includes/
│   ├── db_connect.php         # Database connection
│   ├── header.php             # Common header
│   ├── footer.php             # Common footer
│   └── functions.php          # Helper functions
│
├── 📁 sql/
│   └── e_canteen.sql          # Database schema & seed data
│
├── index.php                  # Landing/home page
└── README.md                  # You are here 📍
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have the following installed:

```
✅ XAMPP (Apache + PHP + MySQL)   https://www.apachefriends.org/
✅ Git                             https://git-scm.com/
✅ A modern web browser            Chrome/Firefox/Edge
```

### Step-by-Step Installation

**1. Clone the Repository**
```bash
git clone https://github.com/leevanshi/e-canteen.git
```

**2. Move to XAMPP `htdocs`**
```bash
# Windows
move e-canteen C:\xampp\htdocs\e-canteen

# macOS/Linux
cp -r e-canteen /opt/lampp/htdocs/e-canteen
```

**3. Start XAMPP Services**
```
1. Open XAMPP Control Panel
2. Start → Apache ✅
3. Start → MySQL ✅
```

**4. Import the Database**
```
1. Open browser → http://localhost/phpmyadmin
2. Click "New" → Create database named: e_canteen
3. Select the database → click "Import"
4. Choose file: e-canteen/sql/e_canteen.sql
5. Click "Go" ✅
```

**5. Configure Database Connection**
```php
// includes/db_connect.php
$host     = "localhost";
$username = "root";       // your MySQL username
$password = "";           // your MySQL password (empty for XAMPP default)
$database = "e_canteen";
```

**6. Launch the Application**
```
🌐 Open: http://localhost/e-canteen/
```

### Default Credentials

```
┌────────────────────────────────────────────┐
│  ADMIN ACCESS                              │
│  URL:      http://localhost/e-canteen/admin│
│  Email:    admin@ecanteen.com              │
│  Password: admin123                        │
├────────────────────────────────────────────┤
│  STUDENT ACCESS                            │
│  Register a new account, or use:           │
│  Email:    student@test.com                │
│  Password: student123                      │
└────────────────────────────────────────────┘
```

> ⚠️ **Change default passwords immediately in production!**

---

## 🖥️ Screenshots & Usage

### 🏠 Home / Menu Page
```
┌──────────────────────────────────────────────────────────┐
│  🍽️ E-CANTEEN           [Home] [Cart 🛒(3)] [Logout]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Today's Menu                  🔍 Search items...       │
│  ─────────────────                                       │
│  [All] [Breakfast] [Lunch] [Snacks] [Beverages]         │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  🍛       │  │  🥗       │  │  ☕       │              │
│  │ Veg Rice  │  │  Salad   │  │  Coffee  │              │
│  │  ₹45     │  │   ₹30    │  │   ₹20   │              │
│  │[Add Cart]│  │[Add Cart]│  │[Add Cart]│              │
│  └──────────┘  └──────────┘  └──────────┘              │
└──────────────────────────────────────────────────────────┘
```

### 📊 Admin Dashboard
```
┌──────────────────────────────────────────────────────────┐
│  🔑 ADMIN DASHBOARD                          [Logout]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Today's  │  │ Pending  │  │ Total    │  │Revenue │ │
│  │ Orders   │  │ Orders   │  │ Users    │  │ Today  │ │
│  │   42     │  │    8     │  │  350     │  │ ₹3,280 │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                          │
│  Recent Orders                         [View All →]     │
│  ─────────────────────────────────────────────────────  │
│  #1042  Rahul S.   Veg Rice + Coffee    ₹65   [READY✅] │
│  #1041  Priya M.   Salad + Juice        ₹55   [PREP 🔄] │
│  #1040  Amit K.    Samosa x2            ₹30   [PEND ⏳] │
└──────────────────────────────────────────────────────────┘
```

---

## 🔐 Roles & Permissions

```
┌──────────────────────────────────────────────────────────────┐
│                     PERMISSION MATRIX                         │
├───────────────────────────┬─────────────┬────────────────────┤
│ Action                    │  Student 👨‍🎓│  Admin 👨‍💼          │
├───────────────────────────┼─────────────┼────────────────────┤
│ View Menu                 │     ✅      │        ✅           │
│ Place Order               │     ✅      │        ❌           │
│ Track Own Orders          │     ✅      │        ❌           │
│ View Order History        │     ✅      │        ❌           │
│ Manage Menu Items         │     ❌      │        ✅           │
│ View All Orders           │     ❌      │        ✅           │
│ Update Order Status       │     ❌      │        ✅           │
│ Manage Users              │     ❌      │        ✅           │
│ View Sales Reports        │     ❌      │        ✅           │
│ Manage Inventory          │     ❌      │        ✅           │
└───────────────────────────┴─────────────┴────────────────────┘
```

---

## 📊 Feature Overview

### Order Status Lifecycle

```
   ┌──────────┐     ┌────────────┐     ┌─────────┐     ┌───────────┐
   │  PENDING  │────►│ PREPARING  │────►│  READY  │────►│ DELIVERED │
   │  (⏳)     │     │   (🔄)    │     │  (✅)   │     │   (🎉)    │
   └──────────┘     └────────────┘     └─────────┘     └───────────┘
   Admin accepts     Canteen staff       Student        Order
   the order         is cooking it       notified       complete
```

### Revenue Visualization (Sample Data)

```
Monthly Orders (Sample)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jan  │████████████████░░░░│  320 orders
Feb  │████████████████████│  400 orders  ← Peak
Mar  │██████████████░░░░░░│  280 orders
Apr  │█████████████████░░░│  360 orders
May  │███████████░░░░░░░░░│  220 orders
Jun  │████████████████████│  410 orders  ← Peak
     └────────────────────┘
       0                 500
```

---

## 🤝 Contributing

Contributions make open source an amazing place to learn, inspire, and create. Any contributions are **greatly appreciated**!

### How to Contribute

```bash
# 1. Fork the Project
# Click the "Fork" button at the top right of this page

# 2. Create your Feature Branch
git checkout -b feature/AmazingFeature

# 3. Commit your Changes
git commit -m 'Add some AmazingFeature'

# 4. Push to the Branch
git push origin feature/AmazingFeature

# 5. Open a Pull Request
# Go to https://github.com/leevanshi/e-canteen/pulls
```

### 📋 Contribution Guidelines

- Follow existing code style and naming conventions
- Write meaningful commit messages
- Test your changes before submitting a PR
- Update documentation if you add new features
- Be respectful in code reviews and discussions

### 🐛 Reporting Bugs

1. Go to [Issues](../../issues)
2. Click **New Issue**
3. Use the **Bug Report** template
4. Include steps to reproduce, expected vs. actual behavior

---

## 🗺️ Roadmap

```
  ✅ v1.0  Core ordering & admin dashboard
  ✅ v1.1  Order history & status tracking
  🔄 v1.2  Email/SMS notifications (In Progress)
  📌 v1.3  Online payment gateway (Planned)
  📌 v1.4  Mobile app (React Native) (Planned)
  📌 v1.5  AI-based demand forecasting (Future)
  📌 v2.0  Multi-canteen support (Future)
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

```
MIT License — Copyright (c) 2024 leevanshi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👥 Authors

<div align="center">

**leevanshi**  
[![GitHub](https://img.shields.io/badge/GitHub-leevanshi-181717?style=for-the-badge&logo=github)](https://github.com/leevanshi)

</div>

---

## 🙏 Acknowledgements

- [Bootstrap](https://getbootstrap.com/) — Responsive UI components
- [Font Awesome](https://fontawesome.com/) — Icons
- [XAMPP](https://www.apachefriends.org/) — Local development environment
- [PHP](https://www.php.net/) — Server-side language
- [MySQL](https://www.mysql.com/) — Database engine

---

<div align="center">

**⭐ If this project helped you, please give it a star! ⭐**

Made with ❤️ by [leevanshi](https://github.com/leevanshi)

</div>

