@echo off
REM Setup script for installing test dependencies
REM This script installs Vitest and related testing libraries

echo Installing Vitest and testing dependencies...
echo.

npm install -D vitest @vitest/ui @testing-library/react @testing-library/vitest happy-dom @types/vitest

if errorlevel 1 (
    echo.
    echo Error: npm installation failed
    exit /b 1
)

echo.
echo Installation complete!
echo.
echo Available test commands:
echo   npm test              - Run all tests
echo   npm test:ui           - Run tests with UI
echo   npm test:coverage     - Run tests with coverage report
echo.
echo Next steps:
echo 1. Run "npm test" to execute all test suites
echo 2. Check TESTING.md for detailed documentation
echo.
