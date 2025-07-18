@echo off
echo 🚀 Deploying KDU Student System Backend to Vercel

echo.
echo 📋 Pre-deployment checks...

echo 🔧 Validating environment variables...
node -e "require('./config/environment').validate()" 2>nul
if %errorlevel% neq 0 (
    echo ❌ Environment validation failed
    echo Please check your environment variables
    pause
    exit /b 1
)

echo.
echo 📦 Installing production dependencies...
npm ci --only=production
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🧪 Testing server startup...
set NODE_ENV=production
node -e "const app = require('./server'); console.log('✅ Server can start successfully')"
if %errorlevel% neq 0 (
    echo ❌ Server startup test failed
    pause
    exit /b 1
)

echo.
echo 📤 Deploying to Vercel...
vercel --prod
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo.
echo ✅ Deployment completed successfully!
echo 🌍 Your API is now live on Vercel
echo 🔍 Check the deployment URL provided above
echo 📊 Test health endpoint: [URL]/api/health

pause
