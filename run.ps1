# Smart Student Expense Splitter - PowerShell Launcher
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     SMART STUDENT EXPENSE SPLITTER - COLLEGE PROJECT       " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Java
if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] 'javac' compiler was not found. Please ensure JDK is installed and in PATH." -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] Java detected successfully." -ForegroundColor Green
Write-Host "[2/3] Compiling Java backend files..." -ForegroundColor Yellow

Remove-Item "backend\src\*.class" -ErrorAction SilentlyContinue
javac -encoding UTF-8 -cp "backend\lib\mysql-connector-j-8.3.0.jar" backend\src\Student.java backend\src\Expense.java backend\src\DBConnection.java backend\src\ExpenseServer.java

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Compilation failed." -ForegroundColor Red
    exit 1
}

Write-Host "      Compilation successful!" -ForegroundColor Green
Write-Host "[3/3] Starting Expense Server on http://localhost:8080/ ..." -ForegroundColor Yellow
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Server is running! Open http://localhost:8080/ in your browser" -ForegroundColor White
Write-Host "Press Ctrl + C in this terminal to stop the server." -ForegroundColor Gray
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan

Start-Process "http://localhost:8080/"
java -cp "backend\src;backend\lib\mysql-connector-j-8.3.0.jar" ExpenseServer
