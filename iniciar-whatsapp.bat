@echo off
title Studio Bruna Meireles - WhatsApp Worker (Manu IA)
color 0A
echo ======================================================================
echo    INICIANDO O WHATSAPP DO STUDIO BRUNA MEIRELES (MANU IA 24/7)
echo ======================================================================
echo.
cd /d "%~dp0worker-whatsapp"

if not exist node_modules (
    echo Instalando dependencias do worker pela primeira vez...
    call npm install
)

echo Iniciando conexao com o WhatsApp...
node index.mjs

pause
