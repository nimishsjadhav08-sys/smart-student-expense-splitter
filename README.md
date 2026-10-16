# 🎓 Smart Student Expense Splitter
> **Academic Mini Project** | 2nd Year Computer Engineering / IT  
> **Technologies:** HTML, CSS, JavaScript (Frontend) &bull; Core Java (`HttpServer`, JDBC) &bull; MySQL

---

## 1. Problem Statement & Objectives

### Problem Statement
In hostels, flats, and college groups, students frequently share daily living costs such as room rent, Wi-Fi bills, canteen meals, groceries, and study photocopy expenses. Keeping track of who paid for what in messy notebooks or chat messages leads to miscalculations, awkward arguments, and delayed reimbursements. 

Existing commercial apps (like Splitwise) are complex, ad-heavy, require internet cloud logins, and have unnecessary features. Students need a straightforward, transparent, and private group expense calculator tailored to their college lifestyle.

### Objectives
1. Provide a clean, minimal interface for students to log in, record expenses, and select who shares each bill.
2. Calculate fair equal splits automatically without manual math.
3. Clearly calculate **"Who owes money to whom"** with a simplified balance settlement algorithm so debts are settled with minimum transactions.
4. Keep the software architecture simple, transparent, and grounded in core second-year computer science subjects (Core Java, Web Basics, Relational Databases).

---

## 2. Project Folder Structure

```text
smart-student-expense-splitter/
│
├── frontend/                     # Frontend User Interface
│   ├── index.html                # Main web page (Login, Dashboard, Add Expense, History)
│   ├── css/
│   │   └── style.css             # Clean, responsive student-project styling
│   └── js/
│       └── app.js                # Form handling, fetch() API calls, DOM manipulation
│
├── backend/                      # Java Backend (No heavy frameworks or Tomcat)
│   ├── src/
│   │   ├── Student.java          # Student model class (POJO)
│   │   ├── Expense.java          # Expense & split model class (POJO)
│   │   ├── DBConnection.java     # JDBC connection manager & In-Memory fallback demo
│   │   └── ExpenseServer.java    # HTTP Server (built-in com.sun.net.httpserver) & REST handlers
│   └── lib/
│       └── mysql-connector-j-8.3.0.jar # Official MySQL JDBC Driver
│
├── database/                     # Database scripts
│   └── schema.sql                # MySQL tables and initial college demo seed data
│
├── run.bat                       # One-click Windows runner
├── run.ps1                       # PowerShell runner
└── README.md                     # Documentation, Viva Guide & Report Notes
```

### Explanation of Key Files
* **`frontend/index.html`**: Structured into 3 clear tabs: *Dashboard & Balances*, *Add Expense*, and *Expense History*, plus an initial student login/registration screen.
* **`frontend/css/style.css`**: Standard CSS3 using clean college blue and gray colors. Does not rely on heavy external frameworks like Bootstrap or Tailwind, making it lightweight and easy to modify.
* **`frontend/js/app.js`**: Pure JavaScript using the native `fetch()` API. Handles form submissions, live calculation preview (`amount / students`), and updates the dashboard asynchronously.
* **`backend/src/Student.java`**: Simple POJO class holding student data (`id`, `name`, `email`, `password`) with a clean `toJson()` method.
* **`backend/src/Expense.java`**: Holds expense data (`title`, `amount`, `paidById`, `splitStudentIds`, `perPersonAmount`).
* **`backend/src/DBConnection.java`**: Contains JDBC code (`Connection`, `PreparedStatement`, `ResultSet`). **Viva Bonus Feature:** If MySQL is not running or not installed, it automatically switches to an in-memory demo database so the project never crashes during an evaluation!
* **`backend/src/ExpenseServer.java`**: Uses Java's built-in `HttpServer` (standard since Java 6). Listens on port `8080`, serves static HTML/CSS/JS files, and routes REST endpoints (`/api/login`, `/api/expenses`, `/api/summary`).
* **`database/schema.sql`**: Contains the SQL commands to create `students`, `expenses`, and `expense_splits` tables with sample records.

---

## 3. Database Design & Tables

The project uses three normalized relational tables in MySQL (`student_expense_db`):

```sql
-- 1. Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- 2. Expenses Table
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    amount DOUBLE NOT NULL,
    paid_by_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paid_by_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 3. Expense Splits Table (Child table for equal share tracking)
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

## 4. How Frontend, Backend, and Database Communicate

The project follows a standard **Client-Server 3-Tier Architecture**:

```
+------------------------------------+
|            FRONTEND                |
|  (HTML5 + CSS3 + Vanilla JS)       |
|  Browser running at localhost:8080 |
+-----------------+------------------+
                  |  HTTP Requests (fetch API)
                  |  JSON Data Transfer
                  v
+------------------------------------+
|          JAVA BACKEND              |
|  ExpenseServer (Java HttpServer)   |
|  Routes: /api/login, /api/expenses |
|  Calculates Net Balances & Splits  |
+-----------------+------------------+
                  |  JDBC Driver (SQL Queries)
                  |  PreparedStatement & ResultSet
                  v
+------------------------------------+
|            DATABASE                |
|  MySQL Server (student_expense_db) |
|  Tables: students, expenses, splits|
+------------------------------------+
```

### Communication Flow:
1. **User Action**: The user fills out an expense form on the frontend and clicks **"Save & Split Expense"**.
2. **Frontend Request**: `app.js` captures the input, formats it as a JSON payload (`{ title, amount, paidById, studentIds }`), and sends a `POST` request to `http://localhost:8080/api/expenses`.
3. **Backend Processing**: `ExpenseServer.java` receives the HTTP POST request, parses the JSON payload, computes the per-person split (`amount / studentIds.size()`), and invokes `DBConnection.java`.
4. **Database Execution**: `DBConnection.java` uses JDBC `PreparedStatement` to insert the main record into `expenses` and runs a batch insert into `expense_splits`.
5. **Response**: The Java server responds with `{ "success": true }`. The browser frontend catches this and immediately calls `loadDashboard()`, refreshing the summary cards and the settlement list without reloading the page.

---

## 5. How to Run the Project Locally

### Prerequisites
* **Java Development Kit (JDK 11 or higher)**: Check with `javac -version` in command prompt.
* **MySQL Server (Optional / Recommended)**: Via XAMPP, WAMP, or standalone MySQL Server. (If MySQL is not running, the application will automatically run in demo in-memory mode).

### Method A: One-Click Execution (Windows)
Double-click `run.bat` in the project folder.  
It will:
1. Compile the Java files automatically.
2. Start the HTTP server on port `8080`.
3. Automatically open your browser to `http://localhost:8080/`.

---

### Method B: Manual Command Line Execution
Open PowerShell or Command Prompt in the project root directory:

```bash
# 1. Compile the Java files
javac -encoding UTF-8 -cp "backend/lib/mysql-connector-j-8.3.0.jar" backend/src/*.java

# 2. Run the Expense Server
java -cp "backend/src;backend/lib/mysql-connector-j-8.3.0.jar" ExpenseServer
```

Now open `http://localhost:8080/` in Google Chrome or Microsoft Edge.

---

### Method C: Setting up MySQL in XAMPP / phpMyAdmin (Optional)
1. Open XAMPP Control Panel and start **MySQL**.
2. Go to `http://localhost/phpmyadmin/` in your browser.
3. Click on the **SQL** tab.
4. Copy and paste the contents of `database/schema.sql` and click **Go**.
5. The database `student_expense_db` will be created with sample data.

---

## 6. College Viva Questions & Answers

### Q1: Why did you not use Spring Boot or Tomcat?
> **Answer:** Spring Boot and Tomcat add heavy abstractions, auto-configuration magic, and high memory overhead that are unnecessary for a focused mini project. Using Java's built-in `com.sun.net.httpserver.HttpServer` and pure JDBC demonstrates our understanding of core network communication, HTTP request-response cycles, and database connectivity from first principles.

### Q2: How does the "Who owes whom" settlement algorithm work?
> **Answer:** We use a balance simplification algorithm:
> 1. For each student, we calculate `Net Balance = Total Amount Paid - Total Fair Share`.
> 2. Students with a positive balance are creditors (they are owed money). Students with a negative balance are debtors (they owe money).
> 3. We use a two-pointer greedy matching approach: match the largest debtor with the largest creditor, settle `min(debt, credit)`, and advance pointers until all debts are zero. This minimizes the total number of physical money transactions.

### Q3: What is the purpose of the `expense_splits` table? Why not just store the split in the `expenses` table?
> **Answer:** This is database normalization (1st and 2nd Normal Form). Since an expense can be split among an arbitrary number of students, storing multiple student IDs in a single column violates 1NF (atomicity). The `expense_splits` bridge table creates a clean one-to-many relationship between one expense and many participating students.

### Q4: What is JDBC and what role does `mysql-connector-j.jar` play?
> **Answer:** JDBC (Java Database Connectivity) is a standard Java API that defines how a Java application interacts with relational databases. `mysql-connector-j.jar` is the official MySQL Type-4 JDBC driver that translates generic JDBC calls into MySQL-specific network protocols.

### Q5: How do you prevent SQL Injection in your project?
> **Answer:** We used `PreparedStatement` with parameterized placeholders (`?`) instead of concatenating raw strings into SQL queries. This ensures that user inputs are treated strictly as data literals and not executable SQL commands.

### Q6: What happens if MySQL is turned off when running the project?
> **Answer:** In `DBConnection.java`, we wrote an exception handler that catches the database connection failure and automatically falls back to an in-memory data store with pre-populated demo records. This ensures that the system is resilient and can be reliably demonstrated during an evaluation even without an active database server.
