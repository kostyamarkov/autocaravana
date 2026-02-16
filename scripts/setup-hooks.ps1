# Setup script to install Git hooks for version management

$hooksDir = ".git\hooks"

# Create pre-commit hook for Windows (batch file)
$preCommitContent = @'
@echo off
REM Git pre-commit hook to update version.js
REM This hook runs before each commit to ensure version file is up-to-date

setlocal enabledelayedexpansion

for /f "delims=" %%i in ('git rev-parse --show-toplevel') do set "REPO_ROOT=%%i"

REM Run PowerShell script to update version
powershell -NoProfile -ExecutionPolicy Bypass -File "!REPO_ROOT!\scripts\update-version.ps1"

if errorlevel 1 (
    echo Failed to update version
    exit /b 1
)

REM Stage the updated version file
git add "!REPO_ROOT!\js\version.js"

exit /b 0
'@

$preCommitFile = Join-Path $hooksDir "pre-commit"

# Ensure hooks directory exists
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
}

# Create the pre-commit hook
Set-Content -Path $preCommitFile -Value $preCommitContent -Encoding ASCII -Force
Write-Host "[OK] Git pre-commit hook installed at $preCommitFile"

# Make it executable (if on Windows/PowerShell, this is implicit)
Write-Host "[OK] Hook setup complete. Version will auto-update on each commit."
