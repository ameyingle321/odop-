@echo off
setlocal EnableDelayedExpansion

REM ===========================================================================
REM ODOP Nexus - District-Aware Artisan Marketplace
REM Windows Development and Management Console Script
REM Location: Docs/run.bat
REM ===========================================================================

title ODOP Nexus Marketplace Manager

REM ---------------------------------------------------------------------------
REM 1. Resolve Project Root Directory
REM ---------------------------------------------------------------------------
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%..\package.json" (
    for %%I in ("%SCRIPT_DIR%..") do set "PROJECT_ROOT=%%~fI"
) else if exist "%SCRIPT_DIR%package.json" (
    set "PROJECT_ROOT=%SCRIPT_DIR%"
) else (
    echo [ERROR] Cannot locate project root containing package.json!
    echo Checked: "%SCRIPT_DIR%.." and "%SCRIPT_DIR%"
    pause
    exit /b 1
)

cd /d "%PROJECT_ROOT%"

REM ---------------------------------------------------------------------------
REM 2. Check Prerequisites (Node.js and npm)
REM ---------------------------------------------------------------------------
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your PATH!
    echo Please install Node.js v18.x or v20.x+ from https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not found in your PATH!
    echo Please ensure npm is installed alongside Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VERSION=%%v"
for /f "tokens=*" %%v in ('npm -v 2^>nul') do set "NPM_VERSION=%%v"

REM ---------------------------------------------------------------------------
REM 3. Process Command Line Arguments
REM ---------------------------------------------------------------------------
if not "%~1"=="" (
    set "CMD=%~1"
    if /i "!CMD!"=="dev"        goto cmd_dev
    if /i "!CMD!"=="start"      goto cmd_dev
    if /i "!CMD!"=="backend"    goto cmd_backend
    if /i "!CMD!"=="api"        goto cmd_backend
    if /i "!CMD!"=="frontend"   goto cmd_frontend
    if /i "!CMD!"=="client"     goto cmd_frontend
    if /i "!CMD!"=="split"      goto cmd_separate
    if /i "!CMD!"=="windows"    goto cmd_separate
    if /i "!CMD!"=="install"    goto cmd_install
    if /i "!CMD!"=="env"        goto cmd_env_check
    if /i "!CMD!"=="verify"     goto cmd_db_verify
    if /i "!CMD!"=="migrate"    goto cmd_db_migrate
    if /i "!CMD!"=="test"       goto cmd_test_all
    if /i "!CMD!"=="test:e2e"   goto cmd_test_e2e
    if /i "!CMD!"=="build"      goto cmd_build
    if /i "!CMD!"=="help"       goto cmd_help
    if /i "!CMD!"=="/?"         goto cmd_help
    if /i "!CMD!"=="-h"         goto cmd_help
    if /i "!CMD!"=="--help"     goto cmd_help

    echo [ERROR] Unknown command: %~1
    echo.
    goto cmd_help
)

REM ---------------------------------------------------------------------------
REM 4. Interactive Main Menu
REM ---------------------------------------------------------------------------
:main_menu
cls
echo ===============================================================================
echo                      ODOP NEXUS - MANAGEMENT CONSOLE
echo                District-Aware Artisan Marketplace Platform
echo ===============================================================================
echo  Project Root : %PROJECT_ROOT%
echo  Node.js      : %NODE_VERSION%  ^|  npm: %NPM_VERSION%
echo -------------------------------------------------------------------------------

set "BE_ENV=[MISSING]"
set "FE_ENV=[MISSING]"
set "ROOT_NM=[MISSING]"
set "BE_NM=[MISSING]"
set "FE_NM=[MISSING]"

if exist "%PROJECT_ROOT%\backend\.env" set "BE_ENV=[OK]"
if exist "%PROJECT_ROOT%\frontend\.env" set "FE_ENV=[OK]"
if exist "%PROJECT_ROOT%\node_modules" set "ROOT_NM=[OK]"
if exist "%PROJECT_ROOT%\backend\node_modules" set "BE_NM=[OK]"
if exist "%PROJECT_ROOT%\frontend\node_modules" set "FE_NM=[OK]"

echo  Status: Backend .env %BE_ENV% ^| Frontend .env %FE_ENV%
echo  Deps  : Root %ROOT_NM% ^| Backend %BE_NM% ^| Frontend %FE_NM%
echo ===============================================================================
echo.
echo  DEVELOPMENT SERVERS:
echo    [1] Start Full Application (Backend + Frontend concurrently)
echo    [2] Start Backend API Server Only (Express on http://localhost:3000)
echo    [3] Start Frontend Client Only (Vite Dev Server on http://localhost:5173)
echo    [4] Start Both in Separate Windows (Dedicated backend and frontend consoles)
echo.
echo  PROJECT SETUP AND CONFIGURATION:
echo    [5] Install All Dependencies (Root, Backend, and Frontend)
echo    [6] Environment Check and Setup (Generate .env from .env.example)
echo.
echo  DATABASE AND TESTING:
echo    [7] Database Tools (Verify connection / Run migrations)
echo    [8] Test Runner (Integration and E2E test suites)
echo    [9] Build Frontend for Production (Vite production build)
echo.
echo    [0] Exit
echo.
echo ===============================================================================
set /p MENU_CHOICE="Enter choice [0-9]: "

if "%MENU_CHOICE%"=="1" goto cmd_dev
if "%MENU_CHOICE%"=="2" goto cmd_backend
if "%MENU_CHOICE%"=="3" goto cmd_frontend
if "%MENU_CHOICE%"=="4" goto cmd_separate
if "%MENU_CHOICE%"=="5" goto cmd_install
if "%MENU_CHOICE%"=="6" goto cmd_env_interactive
if "%MENU_CHOICE%"=="7" goto menu_database
if "%MENU_CHOICE%"=="8" goto menu_tests
if "%MENU_CHOICE%"=="9" goto cmd_build
if "%MENU_CHOICE%"=="0" goto cmd_exit

echo.
echo [!] Invalid selection. Please choose a number between 0 and 9.
timeout /t 2 >nul
goto main_menu

REM ---------------------------------------------------------------------------
REM Command: Start Full Application
REM ---------------------------------------------------------------------------
:cmd_dev
cls
echo ===============================================================================
echo  Starting ODOP Nexus - Full Stack Application (Concurrent Mode)
echo ===============================================================================
echo  - Backend API : http://localhost:3000
echo  - Frontend UI : http://localhost:5173
echo.
echo  Press Ctrl+C to stop both servers.
echo ===============================================================================
echo.
call npm run dev
if not "%~1"=="" exit /b %ERRORLEVEL%
echo.
echo [Service stopped.]
pause
goto main_menu

REM ---------------------------------------------------------------------------
REM Command: Start Backend Only
REM ---------------------------------------------------------------------------
:cmd_backend
cls
echo ===============================================================================
echo  Starting ODOP Nexus - Backend REST API Server
echo ===============================================================================
echo  Server URL : http://localhost:3000
echo  Press Ctrl+C to stop the backend.
echo ===============================================================================
echo.
if not exist "%PROJECT_ROOT%\backend\.env" (
    echo [WARNING] backend\.env file not found! Server may fail to connect to Supabase.
    echo Run Option [6] from the main menu to generate .env from .env.example.
    echo.
)
call npm run dev:backend
if not "%~1"=="" exit /b %ERRORLEVEL%
echo.
echo [Backend stopped.]
pause
goto main_menu

REM ---------------------------------------------------------------------------
REM Command: Start Frontend Only
REM ---------------------------------------------------------------------------
:cmd_frontend
cls
echo ===============================================================================
echo  Starting ODOP Nexus - Frontend Client (Vite Dev Server)
echo ===============================================================================
echo  Client URL : http://localhost:5173
echo  Press Ctrl+C to stop the frontend.
echo ===============================================================================
echo.
if not exist "%PROJECT_ROOT%\frontend\.env" (
    echo [WARNING] frontend\.env file not found! API calls may not route correctly.
    echo Run Option [6] from the main menu to generate .env from .env.example.
    echo.
)
call npm run dev:frontend
if not "%~1"=="" exit /b %ERRORLEVEL%
echo.
echo [Frontend stopped.]
pause
goto main_menu

REM ---------------------------------------------------------------------------
REM Command: Start Both in Separate Windows
REM ---------------------------------------------------------------------------
:cmd_separate
cls
echo ===============================================================================
echo  Launching ODOP Nexus in Separate Windows
echo ===============================================================================
echo.
echo  [1/2] Launching Backend API in new window...
start "ODOP Nexus - Backend Server (Port 3000)" cmd /k "cd /d ""%PROJECT_ROOT%\backend"" && echo Starting Backend... && npm run dev"

echo  [2/2] Launching Frontend Client in new window...
start "ODOP Nexus - Frontend Client (Port 5173)" cmd /k "cd /d ""%PROJECT_ROOT%\frontend"" && echo Starting Frontend... && npm run dev"

echo.
echo  Both windows have been spawned:
echo   * Backend API : http://localhost:3000
echo   * Frontend UI : http://localhost:5173
echo.
if not "%~1"=="" exit /b 0
pause
goto main_menu

REM ---------------------------------------------------------------------------
REM Command: Install Dependencies
REM ---------------------------------------------------------------------------
:cmd_install
cls
echo ===============================================================================
echo  Installing All Dependencies (Root, Backend, and Frontend)
echo ===============================================================================
echo.
echo  [Step 1/3] Installing Root dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Root npm install failed!
    if not "%~1"=="" exit /b %ERRORLEVEL%
    pause
    goto main_menu
)

echo.
echo  [Step 2/3] Installing Backend dependencies...
call npm --prefix backend install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend npm install failed!
    if not "%~1"=="" exit /b %ERRORLEVEL%
    pause
    goto main_menu
)

echo.
echo  [Step 3/3] Installing Frontend dependencies...
call npm --prefix frontend install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend npm install failed!
    if not "%~1"=="" exit /b %ERRORLEVEL%
    pause
    goto main_menu
)

echo.
echo  [SUCCESS] All dependencies installed successfully!
echo ===============================================================================
if not "%~1"=="" exit /b 0
pause
goto main_menu

REM ---------------------------------------------------------------------------
REM Command: Environment Check and Setup
REM ---------------------------------------------------------------------------
:cmd_env_check
:cmd_env_interactive
cls
echo ===============================================================================
echo  ODOP Nexus - Environment Configuration Check
echo ===============================================================================
echo.

set "BE_EXISTS=1"
set "FE_EXISTS=1"

if not exist "%PROJECT_ROOT%\backend\.env" set "BE_EXISTS=0"
if not exist "%PROJECT_ROOT%\frontend\.env" set "FE_EXISTS=0"

if "!BE_EXISTS!"=="1" (
    echo  [OK] backend\.env exists.
) else (
    echo  [MISSING] backend\.env not found.
    if exist "%PROJECT_ROOT%\backend\.env.example" (
        set /p COPY_BE="Copy backend\.env.example to backend\.env? [Y/N]: "
        if /i "!COPY_BE!"=="Y" (
            copy "%PROJECT_ROOT%\backend\.env.example" "%PROJECT_ROOT%\backend\.env" >nul
            echo         -^> Copied backend\.env successfully. Please configure your secrets.
        )
    )
)

echo.
if "!FE_EXISTS!"=="1" (
    echo  [OK] frontend\.env exists.
) else (
    echo  [MISSING] frontend\.env not found.
    if exist "%PROJECT_ROOT%\frontend\.env.example" (
        set /p COPY_FE="Copy frontend\.env.example to frontend\.env? [Y/N]: "
        if /i "!COPY_FE!"=="Y" (
            copy "%PROJECT_ROOT%\frontend\.env.example" "%PROJECT_ROOT%\frontend\.env" >nul
            echo         -^> Copied frontend\.env successfully. Please configure your secrets.
        )
    )
)

echo.
echo ===============================================================================
if not "%~1"=="" exit /b 0
pause
goto main_menu

REM ---------------------------------------------------------------------------
REM Submenu: Database Tools
REM ---------------------------------------------------------------------------
:menu_database
cls
echo ===============================================================================
echo  ODOP Nexus - Database Tools (Supabase / PostgreSQL)
echo ===============================================================================
echo.
echo    [1] Verify Database Connection and Schema (verify-database.js)
echo    [2] Run All Database Migrations (run-migrations.js)
echo    [3] Apply Single Migration File (apply-migration.js)
echo    [0] Back to Main Menu
echo.
echo ===============================================================================
set /p DB_CHOICE="Enter choice [0-3]: "

if "%DB_CHOICE%"=="1" goto cmd_db_verify
if "%DB_CHOICE%"=="2" goto cmd_db_migrate
if "%DB_CHOICE%"=="3" goto cmd_db_apply
if "%DB_CHOICE%"=="0" goto main_menu

echo.
echo [!] Invalid selection.
timeout /t 2 >nul
goto menu_database

:cmd_db_verify
cls
echo ===============================================================================
echo  Verifying Database Connection and Schema
echo ===============================================================================
echo.
call npm run db:verify
echo.
if not "%~1"=="" exit /b %ERRORLEVEL%
pause
goto menu_database

:cmd_db_migrate
cls
echo ===============================================================================
echo  Running Database Migrations
echo ===============================================================================
echo.
call npm run db:migrate
echo.
if not "%~1"=="" exit /b %ERRORLEVEL%
pause
goto menu_database

:cmd_db_apply
cls
echo ===============================================================================
echo  Apply Single Migration File
echo ===============================================================================
echo.
node database/apply-migration.js
echo.
pause
goto menu_database

REM ---------------------------------------------------------------------------
REM Submenu: Test Runner
REM ---------------------------------------------------------------------------
:menu_tests
cls
echo ===============================================================================
echo  ODOP Nexus - Test Suite Runner
echo ===============================================================================
echo.
echo    [1] Run All Backend Integration Tests (Full Test Suite)
echo    [2] Run End-to-End Full Journey Test (e2e_full_journey.test.js)
echo    [3] Run Authentication Tests (auth.test.js)
echo    [4] Run Artisan / Seller Tests (seller.test.js)
echo    [5] Run Cart and Order Tests (cart_order.test.js)
echo    [6] Run Razorpay Payment Tests (payment.test.js)
echo    [7] Run Verified Review Tests (review.test.js)
echo    [8] Run Product Discovery Tests (discovery.test.js)
echo    [0] Back to Main Menu
echo.
echo ===============================================================================
set /p TEST_CHOICE="Enter choice [0-8]: "

if "%TEST_CHOICE%"=="1" goto cmd_test_all
if "%TEST_CHOICE%"=="2" goto cmd_test_e2e
if "%TEST_CHOICE%"=="3" goto test_auth
if "%TEST_CHOICE%"=="4" goto test_seller
if "%TEST_CHOICE%"=="5" goto test_cart
if "%TEST_CHOICE%"=="6" goto test_payment
if "%TEST_CHOICE%"=="7" goto test_review
if "%TEST_CHOICE%"=="8" goto test_discovery
if "%TEST_CHOICE%"=="0" goto main_menu

echo.
echo [!] Invalid selection.
timeout /t 2 >nul
goto menu_tests

:test_auth
cls
call npm --prefix backend run test:auth
pause
goto menu_tests

:test_seller
cls
call npm --prefix backend run test:seller
pause
goto menu_tests

:test_cart
cls
call npm --prefix backend run test:cart
pause
goto menu_tests

:test_payment
cls
call npm --prefix backend run test:payment
pause
goto menu_tests

:test_review
cls
call npm --prefix backend run test:review
pause
goto menu_tests

:test_discovery
cls
call npm --prefix backend run test:discovery
pause
goto menu_tests

:cmd_test_all
cls
echo ===============================================================================
echo  Running Complete Backend Test Suite
echo ===============================================================================
echo.
call npm --prefix backend test
echo.
if not "%~1"=="" exit /b %ERRORLEVEL%
pause
goto menu_tests

:cmd_test_e2e
cls
echo ===============================================================================
echo  Running End-to-End Full Journey Test (e2e_full_journey.test.js)
echo ===============================================================================
echo.
call npm --prefix backend run test:e2e
echo.
if not "%~1"=="" exit /b %ERRORLEVEL%
pause
goto menu_tests

REM ---------------------------------------------------------------------------
REM Command: Build Frontend for Production
REM ---------------------------------------------------------------------------
:cmd_build
cls
echo ===============================================================================
echo  Building Frontend Client for Production (Vite)
echo ===============================================================================
echo.
call npm --prefix frontend run build
echo.
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Frontend production build completed. Output in frontend/dist/
) else (
    echo [ERROR] Frontend build failed!
)
echo.
if not "%~1"=="" exit /b %ERRORLEVEL%
pause
goto main_menu

REM ---------------------------------------------------------------------------
REM Command: Help / Usage
REM ---------------------------------------------------------------------------
:cmd_help
echo ===============================================================================
echo  ODOP Nexus Management Script - CLI Usage
echo ===============================================================================
echo.
echo  Interactive Menu:
echo    run.bat                      Launch interactive management console
echo.
echo  Direct CLI Commands:
echo    run.bat dev                  Start backend and frontend concurrently
echo    run.bat backend              Start backend server only (port 3000)
echo    run.bat frontend             Start frontend client only (port 5173)
echo    run.bat split                Launch both in separate cmd windows
echo    run.bat install              Install root, backend, and frontend dependencies
echo    run.bat env                  Check and configure .env files
echo    run.bat verify               Verify Supabase connection and schema
echo    run.bat migrate              Execute database migrations
echo    run.bat test                 Run complete backend test suite
echo    run.bat test:e2e             Run E2E full journey test
echo    run.bat build                Build frontend for production
echo    run.bat help                 Display this help message
echo.
echo ===============================================================================
exit /b 0

REM ---------------------------------------------------------------------------
REM Command: Exit
REM ---------------------------------------------------------------------------
:cmd_exit
cls
echo Exiting ODOP Nexus Console. Goodbye!
exit /b 0
