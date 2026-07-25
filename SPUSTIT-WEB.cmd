@echo off
title TCG Ceny - lokalni web
cd /d "%~dp0"
set "PATH=C:\Users\mlade\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
echo.
echo Spoustim lokalni web TCG Ceny...
echo Po spusteni otevri: http://localhost:3000
echo Toto okno nech otevrene.
echo.
call "C:\Users\mlade\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd" run dev
echo.
echo Web byl ukoncen nebo se jej nepodarilo spustit.
pause
