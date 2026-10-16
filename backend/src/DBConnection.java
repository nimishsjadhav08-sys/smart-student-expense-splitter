// DBConnection.java
// Handles MySQL Database Connection using JDBC
// Includes an automatic in-memory fallback so the project always runs smoothly in college viva demos

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DBConnection {

    // Standard MySQL Configuration
    private static final String DB_URL = "jdbc:mysql://localhost:3306/student_expense_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = ""; // Common default in XAMPP; can be changed to "root" or custom

    private static boolean useMySQL = false;
    private static Connection connection = null;

    // In-Memory Fallback Storage (Used if MySQL is not installed or not running)
    private static final List<Student> memStudents = new ArrayList<>();
    private static final List<Expense> memExpenses = new ArrayList<>();
    private static int nextStudentId = 5;
    private static int nextExpenseId = 4;

    static {
        initDatabase();
    }

    public static synchronized void initDatabase() {
        try {
            // Try loading the MySQL JDBC Driver
            Class.forName("com.mysql.cj.jdbc.Driver");
            connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);

            if (connection != null && !connection.isClosed()) {
                useMySQL = true;
                System.out.println("[Database] Successfully connected to MySQL database: student_expense_db");
                createTablesIfNotExist();
            }
        } catch (Exception e) {
            useMySQL = false;
            System.out.println("[Database] MySQL not reachable (" + e.getMessage() + ").");
            System.out.println("[Database] -> Running in IN-MEMORY MODE (Built-in Demo Data active for viva presentation).");
            loadSeedDataInMemory();
        }
    }

    private static void createTablesIfNotExist() {
        try (Statement stmt = connection.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS students ("
                    + "id INT AUTO_INCREMENT PRIMARY KEY, "
                    + "name VARCHAR(100) NOT NULL, "
                    + "email VARCHAR(100) NOT NULL UNIQUE, "
                    + "password VARCHAR(100) NOT NULL)");

            stmt.execute("CREATE TABLE IF NOT EXISTS expenses ("
                    + "id INT AUTO_INCREMENT PRIMARY KEY, "
                    + "title VARCHAR(150) NOT NULL, "
                    + "amount DOUBLE NOT NULL, "
                    + "paid_by_id INT NOT NULL, "
                    + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "FOREIGN KEY (paid_by_id) REFERENCES students(id) ON DELETE CASCADE)");

            stmt.execute("CREATE TABLE IF NOT EXISTS expense_splits ("
                    + "id INT AUTO_INCREMENT PRIMARY KEY, "
                    + "expense_id INT NOT NULL, "
                    + "student_id INT NOT NULL, "
                    + "split_amount DOUBLE NOT NULL, "
                    + "FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE, "
                    + "FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE)");

            // Check if students table has data, if not seed it
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM students");
            if (rs.next() && rs.getInt(1) == 0) {
                seedMySQLData(stmt);
            }
        } catch (SQLException e) {
            System.err.println("[Database] Error creating tables: " + e.getMessage());
        }
    }

    private static void seedMySQLData(Statement stmt) throws SQLException {
        stmt.execute("INSERT INTO students (id, name, email, password) VALUES "
                + "(1, 'Rahul Sharma', 'rahul@college.edu', 'pass123'), "
                + "(2, 'Priya Patel', 'priya@college.edu', 'pass123'), "
                + "(3, 'Amit Verma', 'amit@college.edu', 'pass123'), "
                + "(4, 'Sneha Rao', 'sneha@college.edu', 'pass123')");

        stmt.execute("INSERT INTO expenses (id, title, amount, paid_by_id) VALUES "
                + "(1, 'Hostel Room Wi-Fi Bill', 1200.00, 1), "
                + "(2, 'Saturday Dinner & Swiggy', 1800.00, 2), "
                + "(3, 'Project Printouts & Stationery', 350.00, 3)");

        stmt.execute("INSERT INTO expense_splits (expense_id, student_id, split_amount) VALUES "
                + "(1, 1, 300.00), (1, 2, 300.00), (1, 3, 300.00), (1, 4, 300.00), "
                + "(2, 1, 600.00), (2, 2, 600.00), (2, 3, 600.00), "
                + "(3, 1, 175.00), (3, 3, 175.00)");
        System.out.println("[Database] Seed data successfully inserted into MySQL.");
    }

    private static void loadSeedDataInMemory() {
        memStudents.clear();
        memExpenses.clear();

        memStudents.add(new Student(1, "Rahul Sharma", "rahul@college.edu", "pass123"));
        memStudents.add(new Student(2, "Priya Patel", "priya@college.edu", "pass123"));
        memStudents.add(new Student(3, "Amit Verma", "amit@college.edu", "pass123"));
        memStudents.add(new Student(4, "Sneha Rao", "sneha@college.edu", "pass123"));

        // Expense 1
        Expense exp1 = new Expense(1, "Hostel Room Wi-Fi Bill", 1200.00, 1, "Rahul Sharma", "2026-10-01 10:00:00");
        exp1.setPerPersonAmount(300.00);
        exp1.getSplitStudentIds().addAll(Arrays.asList(1, 2, 3, 4));
        exp1.getSplitStudentNames().addAll(Arrays.asList("Rahul Sharma", "Priya Patel", "Amit Verma", "Sneha Rao"));
        memExpenses.add(exp1);

        // Expense 2
        Expense exp2 = new Expense(2, "Saturday Dinner & Swiggy", 1800.00, 2, "Priya Patel", "2026-10-03 20:30:00");
        exp2.setPerPersonAmount(600.00);
        exp2.getSplitStudentIds().addAll(Arrays.asList(1, 2, 3));
        exp2.getSplitStudentNames().addAll(Arrays.asList("Rahul Sharma", "Priya Patel", "Amit Verma"));
        memExpenses.add(exp2);

        // Expense 3
        Expense exp3 = new Expense(3, "Project Printouts & Stationery", 350.00, 3, "Amit Verma", "2026-10-05 14:15:00");
        exp3.setPerPersonAmount(175.00);
        exp3.getSplitStudentIds().addAll(Arrays.asList(1, 3));
        exp3.getSplitStudentNames().addAll(Arrays.asList("Rahul Sharma", "Amit Verma"));
        memExpenses.add(exp3);
    }

    public static boolean isUsingMySQL() {
        return useMySQL;
    }

    // ==========================================
    // Student Operations
    // ==========================================

    public static synchronized Student login(String email, String password) {
        if (useMySQL) {
            String sql = "SELECT id, name, email, password FROM students WHERE email = ? AND password = ?";
            try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
                pstmt.setString(1, email);
                pstmt.setString(2, password);
                try (ResultSet rs = pstmt.executeQuery()) {
                    if (rs.next()) {
                        return new Student(rs.getInt("id"), rs.getString("name"), rs.getString("email"), rs.getString("password"));
                    }
                }
            } catch (SQLException e) {
                System.err.println("[Database] Login query error: " + e.getMessage());
            }
            return null;
        } else {
            for (Student s : memStudents) {
                if (s.getEmail().equalsIgnoreCase(email) && s.getPassword().equals(password)) {
                    return s;
                }
            }
            return null;
        }
    }

    public static synchronized Student register(String name, String email, String password) {
        if (useMySQL) {
            String checkSql = "SELECT id FROM students WHERE email = ?";
            try (PreparedStatement checkStmt = connection.prepareStatement(checkSql)) {
                checkStmt.setString(1, email);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next()) return null; // Email already registered
                }
            } catch (SQLException e) {
                return null;
            }

            String insertSql = "INSERT INTO students (name, email, password) VALUES (?, ?, ?)";
            try (PreparedStatement insertStmt = connection.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {
                insertStmt.setString(1, name);
                insertStmt.setString(2, email);
                insertStmt.setString(3, password);
                insertStmt.executeUpdate();
                try (ResultSet generatedKeys = insertStmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        return new Student(generatedKeys.getInt(1), name, email, password);
                    }
                }
            } catch (SQLException e) {
                System.err.println("[Database] Registration error: " + e.getMessage());
            }
            return null;
        } else {
            for (Student s : memStudents) {
                if (s.getEmail().equalsIgnoreCase(email)) {
                    return null; // Already exists
                }
            }
            Student newStudent = new Student(nextStudentId++, name, email, password);
            memStudents.add(newStudent);
            return newStudent;
        }
    }

    public static synchronized List<Student> getAllStudents() {
        List<Student> list = new ArrayList<>();
        if (useMySQL) {
            String sql = "SELECT id, name, email, password FROM students ORDER BY id ASC";
            try (Statement stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    list.add(new Student(rs.getInt("id"), rs.getString("name"), rs.getString("email"), rs.getString("password")));
                }
            } catch (SQLException e) {
                System.err.println("[Database] Fetch students error: " + e.getMessage());
            }
        } else {
            list.addAll(memStudents);
        }
        return list;
    }

    public static synchronized Student getStudentById(int id) {
        for (Student s : getAllStudents()) {
            if (s.getId() == id) return s;
        }
        return null;
    }

    // ==========================================
    // Expense Operations
    // ==========================================

    public static synchronized List<Expense> getAllExpenses() {
        if (useMySQL) {
            List<Expense> expenses = new ArrayList<>();
            String sql = "SELECT e.id, e.title, e.amount, e.paid_by_id, e.created_at, s.name as paid_by_name "
                    + "FROM expenses e JOIN students s ON e.paid_by_id = s.id ORDER BY e.id DESC";
            try (Statement stmt = connection.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    int expenseId = rs.getInt("id");
                    Expense exp = new Expense(
                            expenseId,
                            rs.getString("title"),
                            rs.getDouble("amount"),
                            rs.getInt("paid_by_id"),
                            rs.getString("paid_by_name"),
                            rs.getString("created_at")
                    );

                    // Fetch splits for this expense
                    String splitSql = "SELECT es.student_id, es.split_amount, s.name FROM expense_splits es "
                            + "JOIN students s ON es.student_id = s.id WHERE es.expense_id = ?";
                    try (PreparedStatement pstmt = connection.prepareStatement(splitSql)) {
                        pstmt.setInt(1, expenseId);
                        try (ResultSet splitRs = pstmt.executeQuery()) {
                            while (splitRs.next()) {
                                exp.getSplitStudentIds().add(splitRs.getInt("student_id"));
                                exp.getSplitStudentNames().add(splitRs.getString("name"));
                                exp.setPerPersonAmount(splitRs.getDouble("split_amount"));
                            }
                        }
                    }
                    expenses.add(exp);
                }
            } catch (SQLException e) {
                System.err.println("[Database] Fetch expenses error: " + e.getMessage());
            }
            return expenses;
        } else {
            // Return reverse copy so newest is first
            List<Expense> list = new ArrayList<>(memExpenses);
            Collections.reverse(list);
            return list;
        }
    }

    public static synchronized boolean addExpense(String title, double amount, int paidById, List<Integer> studentIds) {
        if (studentIds == null || studentIds.isEmpty() || amount <= 0) {
            return false;
        }
        double perPerson = amount / studentIds.size();

        if (useMySQL) {
            String insertExpense = "INSERT INTO expenses (title, amount, paid_by_id) VALUES (?, ?, ?)";
            try (PreparedStatement pstmt = connection.prepareStatement(insertExpense, Statement.RETURN_GENERATED_KEYS)) {
                pstmt.setString(1, title);
                pstmt.setDouble(2, amount);
                pstmt.setInt(3, paidById);
                pstmt.executeUpdate();

                int expenseId = -1;
                try (ResultSet keys = pstmt.getGeneratedKeys()) {
                    if (keys.next()) {
                        expenseId = keys.getInt(1);
                    }
                }

                if (expenseId != -1) {
                    String insertSplit = "INSERT INTO expense_splits (expense_id, student_id, split_amount) VALUES (?, ?, ?)";
                    try (PreparedStatement splitStmt = connection.prepareStatement(insertSplit)) {
                        for (int sid : studentIds) {
                            splitStmt.setInt(1, expenseId);
                            splitStmt.setInt(2, sid);
                            splitStmt.setDouble(3, perPerson);
                            splitStmt.addBatch();
                        }
                        splitStmt.executeBatch();
                    }
                    return true;
                }
            } catch (SQLException e) {
                System.err.println("[Database] Add expense error: " + e.getMessage());
            }
            return false;
        } else {
            Student payer = getStudentById(paidById);
            String payerName = (payer != null) ? payer.getName() : "Unknown";
            String now = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());

            Expense exp = new Expense(nextExpenseId++, title, amount, paidById, payerName, now);
            exp.setPerPersonAmount(perPerson);
            for (int sid : studentIds) {
                exp.getSplitStudentIds().add(sid);
                Student s = getStudentById(sid);
                if (s != null) {
                    exp.getSplitStudentNames().add(s.getName());
                }
            }
            memExpenses.add(exp);
            return true;
        }
    }

    public static synchronized boolean deleteExpense(int expenseId) {
        if (useMySQL) {
            String sql = "DELETE FROM expenses WHERE id = ?";
            try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
                pstmt.setInt(1, expenseId);
                int rows = pstmt.executeUpdate();
                return rows > 0;
            } catch (SQLException e) {
                System.err.println("[Database] Delete expense error: " + e.getMessage());
                return false;
            }
        } else {
            return memExpenses.removeIf(e -> e.getId() == expenseId);
        }
    }

    // ==========================================
    // Summary & Settlement Calculation Logic
    // ==========================================

    public static synchronized String calculateSummaryJson(int currentStudentId) {
        List<Student> students = getAllStudents();
        List<Expense> expenses = getAllExpenses();

        double totalGroupExpense = 0.0;
        Map<Integer, Double> paidMap = new HashMap<>();
        Map<Integer, Double> shareMap = new HashMap<>();

        for (Student s : students) {
            paidMap.put(s.getId(), 0.0);
            shareMap.put(s.getId(), 0.0);
        }

        for (Expense exp : expenses) {
            totalGroupExpense += exp.getAmount();
            paidMap.put(exp.getPaidById(), paidMap.getOrDefault(exp.getPaidById(), 0.0) + exp.getAmount());

            for (int sid : exp.getSplitStudentIds()) {
                shareMap.put(sid, shareMap.getOrDefault(sid, 0.0) + exp.getPerPersonAmount());
            }
        }

        // Student's own numbers
        double myPaid = paidMap.getOrDefault(currentStudentId, 0.0);
        double myShare = shareMap.getOrDefault(currentStudentId, 0.0);
        double myNet = myPaid - myShare;

        // Balances breakdown per student
        StringBuilder studentsSummary = new StringBuilder("[");
        for (int i = 0; i < students.size(); i++) {
            Student s = students.get(i);
            double paid = paidMap.getOrDefault(s.getId(), 0.0);
            double share = shareMap.getOrDefault(s.getId(), 0.0);
            double net = paid - share;

            studentsSummary.append("{")
                    .append("\"id\":").append(s.getId()).append(",")
                    .append("\"name\":\"").append(escapeJson(s.getName())).append("\",")
                    .append("\"totalPaid\":").append(String.format(java.util.Locale.US, "%.2f", paid)).append(",")
                    .append("\"totalShare\":").append(String.format(java.util.Locale.US, "%.2f", share)).append(",")
                    .append("\"netBalance\":").append(String.format(java.util.Locale.US, "%.2f", net))
                    .append("}");

            if (i < students.size() - 1) studentsSummary.append(",");
        }
        studentsSummary.append("]");

        // Simplified Settlement: Who owes whom
        // Debtors have negative balance, Creditors have positive balance
        List<DebtNode> debtors = new ArrayList<>();
        List<DebtNode> creditors = new ArrayList<>();

        for (Student s : students) {
            double net = paidMap.getOrDefault(s.getId(), 0.0) - shareMap.getOrDefault(s.getId(), 0.0);
            // Round to 2 decimal places to avoid floating point precision artifacts
            net = Math.round(net * 100.0) / 100.0;
            if (net < -0.01) {
                debtors.add(new DebtNode(s.getId(), s.getName(), -net)); // owes positive amount
            } else if (net > 0.01) {
                creditors.add(new DebtNode(s.getId(), s.getName(), net)); // to receive positive amount
            }
        }

        StringBuilder settlements = new StringBuilder("[");
        int dIndex = 0, cIndex = 0;
        boolean first = true;

        while (dIndex < debtors.size() && cIndex < creditors.size()) {
            DebtNode debtor = debtors.get(dIndex);
            DebtNode creditor = creditors.get(cIndex);

            double settleAmount = Math.min(debtor.amount, creditor.amount);

            if (!first) settlements.append(",");
            settlements.append("{")
                    .append("\"fromId\":").append(debtor.studentId).append(",")
                    .append("\"fromName\":\"").append(escapeJson(debtor.name)).append("\",")
                    .append("\"toId\":").append(creditor.studentId).append(",")
                    .append("\"toName\":\"").append(escapeJson(creditor.name)).append("\",")
                    .append("\"amount\":").append(String.format(java.util.Locale.US, "%.2f", settleAmount))
                    .append("}");
            first = false;

            debtor.amount -= settleAmount;
            creditor.amount -= settleAmount;

            if (debtor.amount < 0.01) dIndex++;
            if (creditor.amount < 0.01) cIndex++;
        }
        settlements.append("]");

        return "{"
                + "\"databaseMode\":\"" + (useMySQL ? "MySQL Connected" : "In-Memory Demo Mode") + "\","
                + "\"totalGroupExpense\":" + String.format(java.util.Locale.US, "%.2f", totalGroupExpense) + ","
                + "\"myPaid\":" + String.format(java.util.Locale.US, "%.2f", myPaid) + ","
                + "\"myShare\":" + String.format(java.util.Locale.US, "%.2f", myShare) + ","
                + "\"myNetBalance\":" + String.format(java.util.Locale.US, "%.2f", myNet) + ","
                + "\"studentSummaries\":" + studentsSummary.toString() + ","
                + "\"settlements\":" + settlements.toString()
                + "}";
    }

    private static class DebtNode {
        int studentId;
        String name;
        double amount;

        DebtNode(int studentId, String name, double amount) {
            this.studentId = studentId;
            this.name = name;
            this.amount = amount;
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
