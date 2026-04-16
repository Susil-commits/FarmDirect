@echo off
REM Cloudinary Integration Setup Script for Windows
REM This script automates the Cloudinary setup process

echo.
echo.
echo ===================================================
echo   Cloud Marketplace - Cloudinary Integration Setup
echo ===================================================
echo.

REM Colors simulation (basic for Windows)
setlocal enabledelayedexpansion

echo Step 1: Cloudinary Credentials
echo.
echo Please go to https://cloudinary.com/console to get:
echo   - Cloud Name
echo   - API Key
echo   - API Secret
echo.

set /p CLOUD_NAME="Enter your Cloudinary Cloud Name: "
set /p API_KEY="Enter your Cloudinary API Key: "
set /p API_SECRET="Enter your Cloudinary API Secret: "
set /p UPLOAD_PRESET="Enter your Upload Preset (optional): "

echo.
echo Step 2: Updating .env file
echo.

cd backend

REM Create or update .env file
if exist .env (
    REM Backup existing .env
    copy .env .env.backup >nul
    
    REM Update values or add them
    (
        for /f "delims=" %%A in (.env) do (
            if "%%A"=="" echo.
            if not "%%A:~0,21%"=="CLOUDINARY_CLOUD_NAME" (
                if not "%%A:~0,19%"=="CLOUDINARY_API_KEY" (
                    if not "%%A:~0,22%"=="CLOUDINARY_API_SECRET" (
                        if not "%%A:~0,26%"=="CLOUDINARY_UPLOAD_PRESET" (
                            echo %%A
                        )
                    )
                )
            )
        )
        echo CLOUDINARY_CLOUD_NAME=%CLOUD_NAME%
        echo CLOUDINARY_API_KEY=%API_KEY%
        echo CLOUDINARY_API_SECRET=%API_SECRET%
        if not "%UPLOAD_PRESET%"=="" echo CLOUDINARY_UPLOAD_PRESET=%UPLOAD_PRESET%
    ) > .env.new
    
    del .env
    ren .env.new .env
    echo [OK] .env updated
) else (
    (
        echo # Cloudinary Configuration
        echo CLOUDINARY_CLOUD_NAME=%CLOUD_NAME%
        echo CLOUDINARY_API_KEY=%API_KEY%
        echo CLOUDINARY_API_SECRET=%API_SECRET%
        if not "%UPLOAD_PRESET%"=="" echo CLOUDINARY_UPLOAD_PRESET=%UPLOAD_PRESET%
    ) > .env
    echo [OK] .env created
)

echo.
echo Step 3: Installing dependencies
echo.

if exist package.json (
    findstr /M "cloudinary" package.json >nul
    if !errorlevel! equ 0 (
        echo Cloudinary already installed
    ) else (
        echo Installing Cloudinary...
        call npm install cloudinary multer-storage-cloudinary --save
        echo [OK] Dependencies installed
    )
)

echo.
echo Step 4: Verifying installation
echo.

if exist "config\cloudinary.js" (
    echo [OK] Cloudinary config file exists
) else (
    echo [WARNING] Cloudinary config file not found
    echo          Make sure backend\config\cloudinary.js exists
)

if exist "middleware\cloudinaryUpload.js" (
    echo [OK] Cloudinary middleware exists
) else (
    echo [WARNING] Cloudinary middleware not found
    echo           Make sure backend\middleware\cloudinaryUpload.js exists
)

echo.
echo ===================================================
echo   Cloudinary Integration Setup Complete!
echo ===================================================
echo.
echo Next steps:
echo 1. Update your route files to use uploadMiddleware
echo 2. Create controllers to handle uploads
echo 3. Test uploads with the upload component
echo.
echo Documentation: See CLOUDINARY_INTEGRATION_GUIDE.md
echo.

cd..
pause
