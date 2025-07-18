@echo off
echo 🚀 KDU Student System - Local Development Setup

echo.
echo 📋 Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 📋 Checking npm version...
npm --version

echo.
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 📄 Checking environment file...
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo.
    echo ⚠️  Please edit .env file with your configuration values:
    echo    - MONGODB_URI
    echo    - JWT_SECRET
    echo    - Cloudinary credentials
    echo    - Firebase credentials
    echo.
    echo 📖 See DEPLOYMENT.md for detailed setup instructions
) else (
    echo ✅ .env file exists
)

echo.
echo 🔧 Validating environment...
node -e "require('./config/environment').validate()"

echo.
echo ✅ Setup complete! 
echo.
echo 🏃‍♂️ To start development server: npm run dev
echo 📖 Read DEPLOYMENT.md for deployment instructions
echo.
pause
