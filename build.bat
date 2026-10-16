@echo off
setlocal enabledelayedexpansion
title Build Standalone JAR - Smart Student Expense Splitter
echo ============================================================
echo      BUILD STANDALONE EXECUTABLE JAR
echo ============================================================
echo.

set JAVAC_CMD=javac
set JAR_CMD=jar

%JAVAC_CMD% -version >nul 2>&1
if %errorlevel% neq 0 (
    if defined JAVA_HOME (
        if exist "%JAVA_HOME%\bin\javac.exe" (
            set "JAVAC_CMD=%JAVA_HOME%\bin\javac.exe"
            set "JAR_CMD=%JAVA_HOME%\bin\jar.exe"
        )
    )
)

echo [1/4] Cleaning build directory...
if exist "build" rmdir /s /q "build"
mkdir "build\classes"
mkdir "build\classes\frontend"

echo [2/4] Compiling Java classes...
"%JAVAC_CMD%" -encoding UTF-8 -d "build\classes" -cp "backend\lib\mysql-connector-j-8.3.0.jar" backend\src\Student.java backend\src\Expense.java backend\src\DBConnection.java backend\src\ExpenseServer.java
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed.
    pause
    exit /b 1
)

echo [3/4] Bundling MySQL driver and frontend assets...
cd build\classes
"%JAR_CMD%" xf "..\..\backend\lib\mysql-connector-j-8.3.0.jar"
cd ..\..
xcopy /e /i /y "frontend" "build\classes\frontend" >nul

echo [4/4] Creating standalone executable JAR (smart-student-expense-splitter.jar)...
"%JAR_CMD%" cfe "smart-student-expense-splitter.jar" ExpenseServer -C "build\classes" .

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo SUCCESS! Standalone JAR created: smart-student-expense-splitter.jar
    echo You can run this JAR on ANY computer or cloud server with:
    echo.
    echo    java -jar smart-student-expense-splitter.jar
    echo ============================================================
) else (
    echo [ERROR] Failed to create JAR file.
)

pause
