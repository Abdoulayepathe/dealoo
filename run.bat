@echo off
echo ================================
echo     DEALOO — Lancement...
echo ================================

:: Aller dans le dossier du script
cd /d "%~dp0"

:: Installer si node_modules manquant
if not exist "node_modules" (
    echo Installation des dependances...
    npm install
)

:: Lancer le serveur
echo.
echo Ouverture sur http://localhost:5173
echo.
npm run dev
