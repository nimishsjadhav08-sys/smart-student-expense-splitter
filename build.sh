#!/usr/bin/env bash
# Smart Student Expense Splitter - Linux/macOS JAR Builder
set -e

echo "============================================================"
echo "      BUILD STANDALONE EXECUTABLE JAR (LINUX / MACOS)       "
echo "============================================================"
echo ""

echo "[1/4] Cleaning build directory..."
rm -rf build smart-student-expense-splitter.jar
mkdir -p build/classes/frontend

echo "[2/4] Compiling Java classes..."
javac -encoding UTF-8 -d build/classes -cp "backend/lib/mysql-connector-j-8.3.0.jar" backend/src/*.java

echo "[3/4] Bundling MySQL driver and frontend assets..."
cd build/classes
jar xf ../../backend/lib/mysql-connector-j-8.3.0.jar
cd ../..
cp -r frontend/* build/classes/frontend/

echo "[4/4] Creating standalone executable JAR (smart-student-expense-splitter.jar)..."
jar cfe smart-student-expense-splitter.jar ExpenseServer -C build/classes .

echo ""
echo "============================================================"
echo "SUCCESS! Standalone JAR created: smart-student-expense-splitter.jar"
echo "Run anywhere with:"
echo ""
echo "   java -jar smart-student-expense-splitter.jar"
echo "============================================================"
