@echo off
setlocal enabledelayedexpansion
title Smart Student Expense Splitter
color 0B

echo ============================================================
echo      SMART STUDENT EXPENSE SPLITTER - COLLEGE PROJECT
echo ============================================================
echo.

:: 1. Check for javac
echo [1/3] Checking Java Development Kit (JDK)...
set JAVAC_CMD=javac
set JAVA_CMD=java

%JAVAC_CMD% -version >nul 2>&1
if %errorlevel% neq 0 (
    if defined JAVA_HOME (
        if exist "%JAVA_HOME%\bin\javac.exe" (
            set "JAVAC_CMD=%JAVA_HOME%\bin\javac.exe"
            set "JAVA_CMD=%JAVA_HOME%\bin\java.exe"
        )
    )
)

%JAVAC_CMD% -version >nul 2>&1
if %errorlevel% neq 0 (
    for /d %%D in ("C:\Program Files\Java\jdk*" "C:\Program Files\Eclipse Adoptium\jdk*" "C:\Program Files\Amazon Corretto\jdk*") do (
        if exist "%%D\bin\javac.exe" (
            set "JAVAC_CMD=%%D\bin\javac.exe"
            set "JAVA_CMD=%%D\bin\java.exe"
        )
    )
)

%JAVAC_CMD% -version >nul 2>&1
if %errorlevel% neq 0 (
    if exist "backend\src\ExpenseServer.class" (
        echo       [NOTE] 'javac' compiler not detected, but precompiled classes are ready!
        echo       Will run server using 'java'.
        goto skip_compile
    )
    echo [ERROR] 'javac' compiler was not found.
    echo.
    echo Please install Java JDK 11 or higher and add it to your PATH:
    echo https://www.oracle.com/java/technologies/downloads/
    echo Or install OpenJDK via winget: winget install EclipseAdoptium.Temurin.17.jdk
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('%JAVAC_CMD% -version 2^>^&1') do echo       Found: %%v

:: 2. Compile Java sources
echo.
echo [2/3] Compiling Java backend files...
"%JAVAC_CMD%" -encoding UTF-8 -cp "backend\lib\mysql-connector-j-8.3.0.jar" backend\src\Student.java backend\src\Expense.java backend\src\DBConnection.java backend\src\ExpenseServer.java

if %errorlevel% neq 0 (
    if exist "backend\src\ExpenseServer.class" (
        echo       [WARNING] Compilation returned an error, but previous working class files exist.
        echo       Attempting to run with existing classes...
    ) else (
        echo [ERROR] Compilation failed. Please check the error messages above.
        pause
        exit /b 1
    )
) else (
    echo       Compilation successful!
)

:skip_compile

:: 3. Check optional MySQL
echo.
echo [3/3] Checking MySQL status...
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo       MySQL service detected running on port 3306.
    set "SKIP_MYSQL=false"
) else (
    echo       MySQL is not running on port 3306.
    echo       No problem! The application will run instantly in IN-MEMORY DEMO MODE.
    set "SKIP_MYSQL=true"
)

echo.
echo ============================================================
echo   SERVER RUNNING: http://localhost:3000/
echo   Directly opening web application in your browser...
echo.
echo   [IMPORTANT] Keep this black CMD window OPEN!
echo   Closing this window will shut down the server.
echo   To stop the server safely, press Ctrl + C here.
echo ============================================================
echo.

set PORT=3000

:: Open browser after 2 seconds so Java server has time to bind
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000/"

"%JAVA_CMD%" -cp "backend\src;backend\lib\mysql-connector-j-8.3.0.jar" ExpenseServer 3000

pause
