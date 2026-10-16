@echo off
title Smart Student Expense Splitter - Direct Browser Mode
echo ============================================================
echo   SMART STUDENT EXPENSE SPLITTER - DIRECT BROWSER MODE
echo ============================================================
echo.
echo Opening index.html directly in your default web browser...
echo No Java or MySQL installation required!
echo.
start "" "%~dp0frontend\index.html"
exit /b 0
