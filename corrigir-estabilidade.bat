@echo off
title Otimizacao e Estabilidade do Windows
color 0B
echo ======================================================================
echo    CORRECAO DE ESTABILIDADE DO WINDOWS (ANTI-TELA AZUL)
echo ======================================================================
echo.
echo Verificando permissoes de Administrador...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Por favor, clique com o BOTAO DIREITO neste arquivo e escolha:
    echo         "EXECUTAR COMO ADMINISTRADOR"
    echo.
    pause
    exit /b
)

echo [1/3] Desativando Inicializacao Rapida (Fast Startup / Hiberboot)...
echo      (Impede que drivers em segundo plano fiquem com memoria corrompida)
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Power" /v HiberbootEnabled /t REG_DWORD /d 0 /f >nul
powercfg -h off >nul 2>&1
echo      [OK] Inicializacao limpa do kernel ativada com sucesso!

echo.
echo [2/3] Verificando e reparando arquivos corrompidos do sistema (SFC)...
sfc /scannow

echo.
echo [3/3] Reparando a imagem de componentes do Windows (DISM)...
dism /online /cleanup-image /restorehealth

echo.
echo ======================================================================
echo    [CONCLUIDO] SEU SISTEMA FOI REPARADO E ESTABILIZADO COM SUCESSO!
echo ======================================================================
echo.
pause
