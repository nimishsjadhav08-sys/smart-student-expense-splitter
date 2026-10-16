# Smart Student Expense Splitter - PowerShell Launcher
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "     SMART STUDENT EXPENSE SPLITTER - COLLEGE PROJECT       " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for javac in PATH, JAVA_HOME, or standard directories
$javacCmd = "javac"
$javaCmd = "java"

if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\javac.exe")) {
        $javacCmd = "$env:JAVA_HOME\bin\javac.exe"
        $javaCmd = "$env:JAVA_HOME\bin\java.exe"
    } else {
        $foundJavac = Get-ChildItem -Path "C:\Program Files\Java", "C:\Program Files\Eclipse Adoptium", "C:\Program Files\Amazon Corretto" -Filter "javac.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($foundJavac) {
            $javacCmd = $foundJavac.FullName
            $javaCmd = Join-Path (Split-Path $foundJavac.FullName) "java.exe"
        } else {
            Write-Host "[ERROR] 'javac' compiler was not found." -ForegroundColor Red
            Write-Host "Please ensure JDK 11+ is installed and in your PATH or JAVA_HOME." -ForegroundColor Yellow
            Write-Host "Download JDK: https://adoptium.net/" -ForegroundColor Yellow
            exit 1
        }
    }
}

$jdkVersion = & $javacCmd -version 2>&1
Write-Host "[1/3] Java detected: $jdkVersion" -ForegroundColor Green

# 2. Compile Java sources
Write-Host "[2/3] Compiling Java backend files..." -ForegroundColor Yellow
Remove-Item "backend\src\*.class" -ErrorAction SilentlyContinue

& $javacCmd -encoding UTF-8 -cp "backend\lib\mysql-connector-j-8.3.0.jar" backend\src\Student.java backend\src\Expense.java backend\src\DBConnection.java backend\src\ExpenseServer.java

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Compilation failed. Please inspect the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "      Compilation successful!" -ForegroundColor Green

# 3. Check MySQL Status
Write-Host "[3/3] Checking MySQL port 3306..." -ForegroundColor Yellow
$mysqlActive = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 3306)
    $mysqlActive = $true
    $tcp.Close()
} catch {
    $mysqlActive = $false
}

if ($mysqlActive) {
    Write-Host "      MySQL server detected running on port 3306." -ForegroundColor Green
    $env:SKIP_MYSQL = "false"
} else {
    Write-Host "      MySQL not detected on port 3306 -> In-Memory Demo Mode will be active." -ForegroundColor Gray
    $env:SKIP_MYSQL = "true"
}

Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Server running at: http://localhost:3000/" -ForegroundColor White
Write-Host "Press Ctrl + C in this terminal to stop the server." -ForegroundColor Gray
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

Start-Job -ScriptBlock { Start-Sleep -Seconds 2; Start-Process "http://localhost:3000/" } | Out-Null
& $javaCmd -cp "backend\src;backend\lib\mysql-connector-j-8.3.0.jar" ExpenseServer 3000
