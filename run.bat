@echo off
title Smart Student Expense Splitter
color 0B
echo ============================================================
echo      SMART STUDENT EXPENSE SPLITTER - COLLEGE PROJECT
echo ============================================================
echo.
echo [1/3] Checking Java installation...
javac -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 'javac' compiler was not found.
    echo Please install JDK 8+ and make sure 'java' and 'javac' are added to your PATH.
    pause
    exit /b
)

echo [2/3] Compiling Java backend files...
if exist "backend\src\*.class" del /q "backend\src\*.class" >nul 2>&1
javac -encoding UTF-8 -cp "backend\lib\mysql-connector-j-8.3.0.jar" backend\src\Student.java backend\src\Expense.java backend\src\DBConnection.java backend\src\ExpenseServer.java
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed.
    pause
    exit /b
)
echo       Compilation successful!

echo [3/3] Starting Expense Server on http://localhost:8080/ ...
echo.
echo ------------------------------------------------------------
echo Server is running!
echo Open your browser and go to: http://localhost:8080/
echo Press Ctrl + C in this window to stop the server.
echo ------------------------------------------------------------
echo.

start http://localhost:8080/
java -cp "backend\src;backend\lib\mysql-connector-j-8.3.0.jar" ExpenseServer
pause
