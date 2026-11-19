@echo off
setlocal enableextensions
title Endcord - inject
cd /d "%~dp0"

set "MODE=%~1"
if "%MODE%"=="" set "MODE=full"

echo(
echo  ============================================
echo   Endcord - Discord enjeksiyon araci
echo  ============================================
echo(

where node >nul 2>nul
if errorlevel 1 (
    echo  [HATA] Node.js bulunamadi. https://nodejs.org adresinden kur.
    goto :fail
)

if /i "%MODE%"=="uninstall" goto :uninstall
if /i "%MODE%"=="remove" goto :uninstall

if /i "%MODE%"=="quick" goto :inject

echo  [1/4] Bagimliliklar kontrol ediliyor...
if not exist "node_modules\.modules.yaml" (
    call pnpm install --frozen-lockfile
    if errorlevel 1 goto :fail
) else (
    echo        zaten kurulu, atlandi
)
echo(

echo  [2/4] Derleniyor...
call pnpm build --standalone
if errorlevel 1 goto :fail
echo(

:inject
echo  [3/4] Discord'a enjekte ediliyor...
node scripts\install-desktop.mjs --install
if errorlevel 1 goto :fail
echo(

echo  [4/4] Tema ve eklentiler kuruluyor...
node scripts\install-theme.mjs
if errorlevel 1 goto :fail

echo(
echo  ============================================
echo   TAMAM. Discord'u kapat, yeniden ac.
echo   Baslik: Endcord · Tema: Endcord Soft
echo  ============================================
echo(
start "" "%LOCALAPPDATA%\Discord\Discord.exe" >nul 2>&1
pause
exit /b 0

:uninstall
echo  Endcord kaldiriliyor...
node scripts\install-desktop.mjs --uninstall
if errorlevel 1 goto :fail
echo(
echo  Enjeksiyon kaldirildi. Discord'u yeniden baslat.
echo  (Tema dosyalari %%APPDATA%%\Endcord altinda kalir.)
echo(
pause
exit /b 0

:fail
echo(
echo  [HATA] Islem tamamlanamadi. Yukaridaki mesaji kontrol et.
echo(
pause
exit /b 1
