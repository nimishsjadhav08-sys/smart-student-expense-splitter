# 🎓 Smart Student Expense Splitter
> **Academic Mini Project** | 2nd Year Computer Engineering / Information Technology  
> **Core Technologies:** HTML5, CSS3, JavaScript (Frontend) &bull; Core Java (`com.sun.net.httpserver`, JDBC) &bull; MySQL &bull; Docker

---

## 📋 Table of Contents
1. [Problem Statement & Objectives](#1-problem-statement--objectives)
2. [Key Features](#2-key-features)
3. [Project Folder Structure](#3-project-folder-structure)
4. [System Architecture & Data Flow](#4-system-architecture--data-flow)
5. [Database Design & SQL Schema](#5-database-design--sql-schema)
6. [How to Run Locally](#6-how-to-run-locally)
   - [Method 1: Windows One-Click (run.bat)](#method-1-windows-one-click-runbat)
   - [Method 2: Windows PowerShell (run.ps1)](#method-2-windows-powershell-runps1)
   - [Method 3: Linux / macOS (run.sh)](#method-3-linux--macos-runsh)
   - [Method 4: Manual Terminal / Command Line](#method-4-manual-terminal--command-line)
   - [Method 5: Standalone Executable JAR (build.bat / build.sh)](#method-5-standalone-executable-jar)
7. [Docker & Containerized Deployment](#7-docker--containerized-deployment)
   - [Option A: One-Command Stack with Docker Compose](#option-a-one-command-stack-with-docker-compose)
   - [Option B: Standalone Docker Container](#option-b-standalone-docker-container)
8. [Cloud Deployment Process (Production)](#8-cloud-deployment-process-production)
   - [Deploying to Render (Free Cloud Hosting)](#a-deploying-to-render-free-cloud-hosting)
   - [Deploying to Railway.app](#b-deploying-to-railwayapp)
   - [Deploying to Linux Cloud VPS (AWS EC2 / DigitalOcean)](#c-deploying-to-linux-cloud-vps-aws-ec2--digitalocean)
9. [Setting up MySQL Database (XAMPP / Workbench)](#9-setting-up-mysql-database)
10. [REST API Documentation](#10-rest-api-documentation)
11. [College Viva & Lab Examination Q&A](#11-college-viva--lab-examination-qa)
12. [Troubleshooting & FAQs](#12-troubleshooting--faqs)

---

## 1. Problem Statement & Objectives

### Problem Statement
In college hostels, shared apartments, and study groups, students frequently split daily living costs—such as hostel room Wi-Fi, electricity, canteen meals, groceries, stationery printouts, and weekend dinners. Keeping track of who paid for what in paper notebooks or messy WhatsApp groups leads to errors, awkward payment reminders, and delayed reimbursements.

Existing commercial platforms (like Splitwise) are complex, ad-heavy, enforce internet cloud accounts, and have unnecessary paywalled features. Students need a **lightweight, privacy-friendly, zero-friction expense splitter** tailored to their college life.

### Objectives
1. **Zero-Overhead Interface:** Simple tabbed dashboard for quick expense logging without complicated setup.
2. **Fair Equal Splitting:** Divide bills equally among selected group members automatically.
3. **Optimized Debt Settlement:** Clearly determine **"Who owes money to whom"** using a two-pointer greedy debt-minimization algorithm that reduces the total number of financial transactions.
4. **Resilient Architecture:** Grounded in core 2nd-year computer science principles (pure Core Java, JDBC, and Vanilla Web technologies) with an **automatic in-memory fallback** so the project never crashes during college evaluation even if MySQL is offline.
5. **Production & Cloud Ready:** Support environment variables, Docker containers, single-click JAR bundling, and cloud deployment on platforms like Render, Railway, or AWS.

---

## 2. Key Features

- ⚡ **Zero External Framework Overhead:** Built using Java's high-performance built-in `com.sun.net.httpserver.HttpServer`—no Spring Boot, Tomcat, or Node.js required!
- 🤝 **Smart Settlement Engine:** Minimizes debt transactions using a greedy two-pointer matching algorithm.
- 👥 **Student Auth & Quick Demo Mode:** Full registration & login, plus one-click demo login buttons for viva evaluators.
- 💾 **Dual-Mode Database Architecture:**
  - **MySQL Mode (Primary):** Persists all students, expenses, and splits into relational tables via JDBC.
  - **In-Memory Mode (Automatic Fallback):** Pre-loaded sample demo data activates seamlessly if MySQL is stopped or not installed.
- 📥 **CSV Expense Report Export:** Download all group expenses as a `.csv` file for lab record keeping and WhatsApp sharing.
- 🐳 **Full Dockerization:** Multi-stage `Dockerfile` and `docker-compose.yml` for 1-command complete stack deployment.
- ☁️ **Cloud Native:** Automatic detection of `$PORT` and `$DATABASE_URL` environment variables for seamless deployment on Render, Railway, Heroku, or AWS.

---

## 3. Project Folder Structure

```text
smart-student-expense-splitter/
│
├── frontend/                     # User Interface (HTML5, CSS3, Vanilla JS)
│   ├── index.html                # Main application page (Dashboard, Add Expense, History)
│   ├── css/
│   │   └── style.css             # Responsive college design styling
│   └── js/
│       └── app.js                # Frontend controller, fetch() REST calls, CSV export
│
├── backend/                      # Java Backend
│   ├── src/
│   │   ├── Student.java          # Student model (POJO) with JSON serializer
│   │   ├── Expense.java          # Expense & split model (POJO) with JSON serializer
│   │   ├── DBConnection.java     # JDBC connection manager, env config, auto-reconnect & in-memory fallback
│   │   └── ExpenseServer.java    # Standalone HTTP Server, routing, static server & health check
│   └── lib/
│       └── mysql-connector-j-8.3.0.jar # Official MySQL JDBC Driver
│
├── database/                     # SQL Scripts
│   └── schema.sql                # Table definitions and seed data for MySQL
│
├── Dockerfile                    # Multi-stage production container build
├── docker-compose.yml            # Docker Compose orchestration (App + MySQL)
├── .dockerignore                 # Excluded files for Docker build context
├── Procfile                      # Cloud process configuration (Railway / Render / Heroku)
├── render.yaml                   # 1-Click Render Cloud Blueprint
│
├── run.bat                       # Windows Command Prompt launcher (with JDK auto-detection)
├── run.ps1                       # Windows PowerShell launcher (with port 3306 check)
├── run.sh                        # Linux & macOS shell launcher
├── build.bat                     # Packages application into standalone fat JAR (Windows)
├── build.sh                      # Packages application into standalone fat JAR (Linux/macOS)
└── README.md                     # Comprehensive documentation & Viva guide
```

---

## 4. System Architecture & Data Flow

The project follows a clean **3-Tier Client-Server Architecture**:

```
+-----------------------------------------------------------------+
|                          CLIENT TIER                            |
|             Browser (HTML5 + CSS3 + Vanilla JavaScript)         |
|  - Tabs: Dashboard, Add Expense, History                        |
|  - Live split calculations & CSV export                         |
+--------------------------------+--------------------------------+
                                 |  HTTP Requests (fetch API)
                                 |  JSON Payloads (REST)
                                 v
+-----------------------------------------------------------------+
|                        APPLICATION TIER                         |
|           ExpenseServer.java (Core Java HttpServer)             |
|  - Port: 3000 (or $PORT environment variable)                   |
|  - Endpoints: /api/login, /api/students, /api/expenses,         |
|               /api/summary, /api/health                         |
|  - Settlement Algorithm: Greedy Two-Pointer Debt Simplification  |
+--------------------------------+--------------------------------+
                                 |  JDBC Protocol (Type-4 Driver)
                                 |  Parameterized PreparedStatements
                                 v
+-----------------------------------------------------------------+
|                          DATA TIER                              |
|           Primary: MySQL Database (student_expense_db)          |
|           Fallback: In-Memory Java Collection Data Store        |
+-----------------------------------------------------------------+
```

### End-to-End Request Lifecycle:
1. **User Submission:** A student adds an expense (e.g., ₹1200 Wi-Fi bill paid by Rahul, split among 4 students).
2. **Frontend Dispatch:** `app.js` captures input, validates fields, and sends a `POST` request to `/api/expenses` with JSON payload `{ title, amount, paidById, studentIds }`.
3. **Backend Processing:** `ExpenseServer.java` parses the request body, computes `split_amount = amount / studentIds.size()`, and calls `DBConnection.addExpense()`.
4. **Database Execution:** `DBConnection.java` inserts a record into `expenses`, retrieves the generated primary key `id`, and batch-inserts the shares into `expense_splits`.
5. **Real-time Recalculation:** The browser calls `/api/summary?studentId=...`. The backend runs the debt minimization algorithm and returns the updated net balances and who owes whom.

---

## 5. Database Design & SQL Schema

The database uses three normalized relational tables (`student_expense_db`):

```sql
-- 1. Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- 2. Expenses Table (Parent Table)
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    amount DOUBLE NOT NULL,
    paid_by_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paid_by_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 3. Expense Splits Table (Child Table - Normalized 1:N Relationship)
CREATE TABLE expense_splits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    student_id INT NOT NULL,
    split_amount DOUBLE NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

---

## 6. How to Run Locally

### Prerequisites
- **Java Development Kit (JDK 11 or higher)**: Check with `javac -version` in terminal.
- **MySQL Server (Optional)**: Via XAMPP, WAMP, or standalone MySQL. *(If not running, the app automatically switches to in-memory demo mode!)*

---

### Method 1: Windows One-Click (run.bat)
1. Open the project folder in Windows File Explorer.
2. Double-click `run.bat`.
3. The script will:
   - Auto-detect your JDK installation.
   - Compile all Java source files.
   - Detect if MySQL is active on port 3306.
   - Start the HTTP server on `http://localhost:3000/`.
   - Automatically launch your default web browser!

---

### Method 2: Windows PowerShell (run.ps1)
Right-click on `run.ps1` and select **Run with PowerShell**, or in PowerShell terminal:
```powershell
.\run.ps1
```

---

### Method 3: Linux / macOS (run.sh)
1. Open terminal in the project directory.
2. Grant execution permission and run:
```bash
chmod +x run.sh
./run.sh
```

---

### Method 4: Manual Terminal / Command Line

#### On Windows (Command Prompt / PowerShell):
```cmd
# 1. Compile Java files
javac -encoding UTF-8 -cp "backend\lib\mysql-connector-j-8.3.0.jar" backend\src\*.java

# 2. Run the HTTP Server
java -cp "backend\src;backend\lib\mysql-connector-j-8.3.0.jar" ExpenseServer
```

#### On Linux / macOS:
```bash
# 1. Compile Java files
javac -encoding UTF-8 -cp "backend/lib/mysql-connector-j-8.3.0.jar" backend/src/*.java

# 2. Run the HTTP Server (Note colon ':' classpath separator on Unix)
java -cp "backend/src:backend/lib/mysql-connector-j-8.3.0.jar" ExpenseServer
```

Visit: **`http://localhost:3000/`** in Google Chrome, Microsoft Edge, or Firefox.

---

### Method 5: Standalone Executable JAR

You can package the entire application—including all compiled Java classes, the MySQL JDBC driver, and the HTML/CSS/JS frontend—into a single `.jar` file!

#### To Build:
- On Windows: Run `build.bat`
- On Linux/macOS: Run `chmod +x build.sh && ./build.sh`

#### To Run:
```bash
java -jar smart-student-expense-splitter.jar
```
*You can copy this single JAR file to any machine with Java installed and run it directly!*

---

## 7. Docker & Containerized Deployment

Docker allows you to spin up the entire application and a pre-configured MySQL database in seconds without installing anything except Docker.

### Option A: One-Command Stack with Docker Compose (Recommended)
From the root directory:
```bash
docker compose up --build
```
This will:
1. Pull the official `mysql:8.0` image.
2. Automatically execute `database/schema.sql` to create tables and seed demo data.
3. Build the lightweight multi-stage Java container.
4. Connect the application to the MySQL container over a private Docker bridge network.
5. Expose the web app on **`http://localhost:3000/`**.

To run in the background (detached mode):
```bash
docker compose up -d
```
To stop the services:
```bash
docker compose down
```

---

### Option B: Standalone Docker Container
```bash
# 1. Build the Docker image
docker build -t student-expense-splitter .

# 2. Run the container (works in in-memory mode or connects to external DB)
docker run -p 3000:3000 student-expense-splitter
```

---

## 8. Cloud Deployment Process (Production)

### A. Deploying to Render (Free Cloud Hosting)

Render provides free hosting with automatic Docker builds directly from GitHub.

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Smart Student Expense Splitter"
   git branch -M main
   git remote add origin https://github.com/your-username/smart-student-expense-splitter.git
   git push -u origin main
   ```
2. **Create Web Service on Render:**
   - Log into [Render.com](https://render.com/).
   - Click **New +** &rarr; **Web Service**.
   - Connect your GitHub repository.
   - Render will detect the `Dockerfile` automatically (or select **Runtime: Docker**).
3. **Configure Environment Variables (Optional):**
   - If using Render's Managed MySQL:
     - `DB_HOST`: Your MySQL host
     - `DB_USER`: Your MySQL username
     - `DB_PASSWORD`: Your MySQL password
     - `DB_NAME`: Your MySQL database name
   - If not connecting an external database, the app will run safely in **In-Memory Mode**!
4. **Deploy:** Click **Create Web Service**. Your live public URL (e.g., `https://smart-student-expense-splitter.onrender.com`) will be active in 1-2 minutes!

---

### B. Deploying to Railway.app

1. Go to [Railway.app](https://railway.app/) and click **New Project** &rarr; **Deploy from GitHub repo**.
2. Select your repository.
3. Click **Add a Service** &rarr; **Database** &rarr; **MySQL**.
4. Railway will automatically link the database. Under the app's **Variables**, set:
   - `PORT`: `3000`
   - `DATABASE_URL`: `${{MySQL.MYSQL_URL}}`
5. Click **Deploy**. Your app is live with persistent cloud MySQL!

---

### C. Deploying to Linux Cloud VPS (AWS EC2 / DigitalOcean)

1. **Connect to your VPS:**
   ```bash
   ssh ubuntu@your-server-ip
   ```
2. **Install Java & Git:**
   ```bash
   sudo apt update
   sudo apt install -y openjdk-17-jdk git
   ```
3. **Clone and Package the App:**
   ```bash
   git clone https://github.com/your-username/smart-student-expense-splitter.git
   cd smart-student-expense-splitter
   chmod +x build.sh
   ./build.sh
   ```
4. **Set Up a Systemd Service (Auto-restart on reboot):**
   ```bash
   sudo nano /etc/systemd/system/expensesplitter.service
   ```
   Paste the following:
   ```ini
   [Unit]
   Description=Smart Student Expense Splitter Service
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/smart-student-expense-splitter
   ExecStart=/usr/bin/java -jar /home/ubuntu/smart-student-expense-splitter/smart-student-expense-splitter.jar
   Restart=always
   RestartSec=5
   Environment=PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```
5. **Start and Enable Service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable expensesplitter
   sudo systemctl start expensesplitter
   ```
6. **(Optional) Configure Nginx Reverse Proxy for Domain & SSL:**
   ```nginx
   server {
       server_name expenses.yourdomain.com;
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## 9. Setting up MySQL Database

If you want to use MySQL locally via XAMPP or phpMyAdmin:

1. Open **XAMPP Control Panel** and click **Start** next to **MySQL** and **Apache**.
2. Open your browser and navigate to `http://localhost/phpmyadmin/`.
3. Click on the **SQL** tab.
4. Open `database/schema.sql`, copy all contents, paste into phpMyAdmin, and click **Go**.
5. The database `student_expense_db` with `students`, `expenses`, and `expense_splits` will be created.
6. The app will automatically connect to it on startup!

---

## 10. REST API Documentation

| HTTP Method | Endpoint | Description | Sample Request / Query | Sample Response |
|---|---|---|---|---|
| `GET` | `/api/health` | Health check for Docker / Cloud probes | None | `{"status":"UP","database":"MySQL"}` |
| `POST` | `/api/login` | Authenticate student | `{"email":"...","password":"..."}` | `{"success":true,"student":{...}}` |
| `POST` | `/api/register` | Register new student | `{"name":"...","email":"...","password":"..."}` | `{"success":true,"student":{...}}` |
| `GET` | `/api/students` | List all students | None | `[{"id":1,"name":"Rahul Sharma",...}]` |
| `GET` | `/api/expenses` | List all recorded expenses & splits | None | `[{"id":1,"title":"Wi-Fi",...}]` |
| `POST` | `/api/expenses` | Add a new group expense | `{"title":"Dinner","amount":600,"paidById":1,"studentIds":[1,2]}` | `{"success":true,"message":"Expense added"}` |
| `DELETE` | `/api/expenses?id=X` | Delete an expense and recalculate | `id=1` | `{"success":true,"message":"Deleted"}` |
| `GET` | `/api/summary?studentId=X` | Get balances and simplified settlements | `studentId=1` | `{"totalGroupExpense":3350,"settlements":[...]}` |

---

## 11. College Viva & Lab Examination Q&A

### Q1: Why did you not use Spring Boot or Tomcat?
> **Answer:** Spring Boot and Tomcat add heavy abstractions, auto-configuration magic, and high memory overhead that are unnecessary for a focused mini project. Using Java's built-in `com.sun.net.httpserver.HttpServer` and pure JDBC demonstrates our understanding of core network communication, HTTP request-response cycles, multithreading, and relational database connectivity from first principles.

### Q2: How does the "Who owes money to whom" settlement algorithm work?
> **Answer:** We implemented a **Greedy Two-Pointer Balance Simplification Algorithm**:
> 1. For every student, calculate: $\text{Net Balance} = \text{Total Amount Paid} - \text{Total Fair Share}$.
> 2. Classify students into two lists:
>    - **Debtors:** Students with negative balance ($\text{Net} < 0$).
>    - **Creditors:** Students with positive balance ($\text{Net} > 0$).
> 3. Use two pointers ($i$ for debtors, $j$ for creditors):
>    - Settle $\min(\text{debt}, \text{credit})$ between the largest debtor and largest creditor.
>    - Subtract the settled amount from both.
>    - Increment pointer when an individual's balance reaches zero.
> 4. This mathematically minimizes the total physical transactions needed to settle all debts in the group.

### Q3: Why is the `expense_splits` bridge table necessary?
> **Answer:** To satisfy **1st Normal Form (1NF)**. An expense can be split among an arbitrary subset of students. Storing multiple student IDs in a comma-separated string inside `expenses` violates atomicity (1NF). The `expense_splits` table establishes a clean 1-to-many relationship between an expense and participating members.

### Q4: How does the project prevent SQL Injection?
> **Answer:** We used JDBC `PreparedStatement` with parameterized placeholders (`?`) instead of concatenating raw strings into SQL statements. The database driver treats parameters strictly as data values, preventing malicious SQL instructions from executing.

### Q5: What happens if MySQL crashes or is not installed?
> **Answer:** Resiliency is built directly into `DBConnection.java`. If the MySQL connection fails, the application catches the `SQLException` and automatically activates an **In-Memory Demo Data Store** populated with sample student records. This guarantees that viva and lab demonstrations never crash.

---

## 12. Troubleshooting & FAQs

- **Issue:** `'javac' compiler was not found.`
  - **Fix:** Install JDK 11+ and add `bin` folder (e.g. `C:\Program Files\Java\jdk-17\bin`) to your system `PATH` environment variable.
- **Issue:** `Port 3000 is already in use by another process.`
  - **Fix:** The server automatically checks and binds to the next available port (e.g., 8081, 8082). Alternatively, terminate the conflicting process or pass a custom port: `java -cp ... ExpenseServer 9000`.
- **Issue:** `MySQL connection refused.`
  - **Fix:** Ensure MySQL service is running in XAMPP or Windows Services. If not running, the application will simply operate in in-memory mode without issues.

---

### 👨‍💻 Project Team & Academic Credits
- **Course:** Mini Project (Semester IV / 2nd Year)
- **Department:** Computer Science & Engineering / Information Technology
- **License:** Open Source for Academic & Educational Use
