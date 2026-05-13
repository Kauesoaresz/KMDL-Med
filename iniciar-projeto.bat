@echo off
cd /d "f:\01 - PROGRAMAÇÃO\00 - Estudos Definitivo\KMDL-Med"
start /b npm run dev
timeout /t 5 /nobreak >nul
start chrome "http://localhost:3000"