-- ============================================================
-- SMART STUDENT EXPENSE SPLITTER
-- Database Schema for MySQL
-- Created for 2nd Year Mini Project
-- ============================================================

CREATE DATABASE IF NOT EXISTS student_expense_db;
USE student_expense_db;

-- 1. Table for Students (Users)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL
);

-- 2. Table for Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    amount DOUBLE NOT NULL,
    paid_by_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paid_by_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 3. Table for Splits (Tracks each student's share for an expense)
CREATE TABLE IF NOT EXISTS expense_splits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    student_id INT NOT NULL,
    split_amount DOUBLE NOT NULL,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================================
-- Sample Seed Data for Testing & College Viva Demo
-- ============================================================

-- Insert 4 Students
INSERT INTO students (id, name, email, password) VALUES
(1, 'Rahul Sharma', 'rahul@college.edu', 'pass123'),
(2, 'Priya Patel', 'priya@college.edu', 'pass123'),
(3, 'Amit Verma', 'amit@college.edu', 'pass123'),
(4, 'Sneha Rao', 'sneha@college.edu', 'pass123')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Expense 1: Hostel Room Wi-Fi Bill (Rs 1200 paid by Rahul, split among all 4)
INSERT INTO expenses (id, title, amount, paid_by_id) VALUES
(1, 'Hostel Room Wi-Fi Bill', 1200.00, 1)
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO expense_splits (expense_id, student_id, split_amount) VALUES
(1, 1, 300.00),
(1, 2, 300.00),
(1, 3, 300.00),
(1, 4, 300.00)
ON DUPLICATE KEY UPDATE split_amount=VALUES(split_amount);

-- Expense 2: Saturday Dinner & Swiggy (Rs 1800 paid by Priya, split among Rahul, Priya, Amit)
INSERT INTO expenses (id, title, amount, paid_by_id) VALUES
(2, 'Saturday Dinner & Swiggy', 1800.00, 2)
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO expense_splits (expense_id, student_id, split_amount) VALUES
(2, 1, 600.00),
(2, 2, 600.00),
(2, 3, 600.00)
ON DUPLICATE KEY UPDATE split_amount=VALUES(split_amount);

-- Expense 3: Project Printouts & Stationery (Rs 350 paid by Amit, split between Amit and Rahul)
INSERT INTO expenses (id, title, amount, paid_by_id) VALUES
(3, 'Project Printouts & Stationery', 350.00, 3)
ON DUPLICATE KEY UPDATE title=VALUES(title);

INSERT INTO expense_splits (expense_id, student_id, split_amount) VALUES
(3, 1, 175.00),
(3, 3, 175.00)
ON DUPLICATE KEY UPDATE split_amount=VALUES(split_amount);
