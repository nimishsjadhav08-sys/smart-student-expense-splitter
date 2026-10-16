#!/usr/bin/env bash
# Smart Student Expense Splitter - Linux / macOS Launcher

set -e

echo "============================================================"
echo "     SMART STUDENT EXPENSE SPLITTER - COLLEGE PROJECT       "
echo "============================================================"
echo ""

# 1. Check for javac
echo "[1/3] Checking Java Development Kit (JDK)..."
if ! command -v javac &> /dev/null; then
    echo "[ERROR] 'javac' compiler was not found."
    echo "Please install JDK 11 or higher (e.g., sudo apt install openjdk-17-jdk or brew install openjdk@17)."
    exit 1
fi

JAVA_VER=$(javac -version 2>&1)
echo "      Found: $JAVA_VER"

# 2. Compile Java sources
echo ""
echo "[2/3] Compiling Java backend files..."
rm -f backend/src/*.class
javac -encoding UTF-8 -cp "backend/lib/mysql-connector-j-8.3.0.jar" backend/src/Student.java backend/src/Expense.java backend/src/DBConnection.java backend/src/ExpenseServer.java
echo "      Compilation successful!"

# 3. Check MySQL Status (optional)
echo ""
echo "[3/3] Checking MySQL port 3306..."
if nc -z -w 1 127.0.0.1 3306 2>/dev/null; then
    echo "      MySQL detected on port 3306."
else
    echo "      MySQL is not running on port 3306 -> In-Memory Demo Mode will be active."
fi

echo ""
echo "------------------------------------------------------------"
echo "Server starting at: http://localhost:3000/"
echo "Press Ctrl + C to stop the server."
echo "------------------------------------------------------------"
echo ""

# Open browser if possible
if command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open "http://localhost:3000/") &> /dev/null &
elif command -v open &> /dev/null; then
    (sleep 2 && open "http://localhost:3000/") &> /dev/null &
fi

java -cp "backend/src:backend/lib/mysql-connector-j-8.3.0.jar" ExpenseServer 3000
