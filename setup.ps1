# =============================================================
#  CX Review Tool — Full Setup & Run Script (Windows PowerShell)
#  Run from the project root: .\setup.ps1
# =============================================================

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host ""
Write-Host "=== CX Review Intelligence - Setup ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check prerequisites ────────────────────────────────────
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$PythonExe = $null
foreach ($candidate in @("python", "python3")) {
    try {
        $ver = & $candidate --version 2>&1
        if ($ver -match "Python 3") { $PythonExe = $candidate; break }
    } catch {}
}
if (-not $PythonExe) {
    Write-Host "[ERROR] Python 3 not found. Install from https://python.org" -ForegroundColor Red
    Write-Host "  Make sure to check 'Add Python to PATH' during install." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] $PythonExe found: $(& $PythonExe --version)" -ForegroundColor Green

$NodeOk = $false
try { & node --version | Out-Null; $NodeOk = $true } catch {}
if (-not $NodeOk) {
    Write-Host "[ERROR] Node.js not found. Install from https://nodejs.org (LTS)" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] node $(node --version)" -ForegroundColor Green

# ── 2. Check .env ─────────────────────────────────────────────
$EnvFile = Join-Path $Root ".env"
if (-not (Test-Path $EnvFile)) {
    Copy-Item (Join-Path $Root ".env.example") $EnvFile
    Write-Host "  Created .env from .env.example" -ForegroundColor Yellow
}

$envContent = Get-Content $EnvFile -Raw
if ($envContent -match "your_api_key_here") {
    Write-Host ""
    Write-Host "[ACTION REQUIRED] Open .env and replace 'your_api_key_here' with your Anthropic API key." -ForegroundColor Red
    Write-Host "  Get your key at: https://console.anthropic.com" -ForegroundColor Yellow
    $key = Read-Host "  Or paste your ANTHROPIC_API_KEY now (leave blank to skip)"
    if ($key) {
        $envContent = $envContent -replace "your_api_key_here", $key.Trim()
        Set-Content $EnvFile $envContent -Encoding UTF8
        Write-Host "  [OK] API key saved to .env" -ForegroundColor Green
    }
}

# ── 3. Backend venv + install ─────────────────────────────────
Write-Host ""
Write-Host "Setting up Python virtual environment..." -ForegroundColor Yellow

$BackendDir = Join-Path $Root "backend"
$VenvDir = Join-Path $BackendDir "venv"

if (-not (Test-Path $VenvDir)) {
    & $PythonExe -m venv $VenvDir
    Write-Host "  [OK] venv created at backend/venv" -ForegroundColor Green
} else {
    Write-Host "  [OK] venv already exists" -ForegroundColor Green
}

$PipExe   = Join-Path $VenvDir "Scripts\pip.exe"
$PythonV  = Join-Path $VenvDir "Scripts\python.exe"
$UvicornExe = Join-Path $VenvDir "Scripts\uvicorn.exe"

Write-Host "  Installing Python dependencies..." -ForegroundColor Yellow
& $PipExe install -r (Join-Path $BackendDir "requirements.txt") --quiet
Write-Host "  [OK] Backend dependencies installed" -ForegroundColor Green

# ── 4. Frontend install ───────────────────────────────────────
Write-Host ""
Write-Host "Installing frontend dependencies (npm install)..." -ForegroundColor Yellow
$FrontendDir = Join-Path $Root "frontend"
Push-Location $FrontendDir
npm install --silent
Pop-Location
Write-Host "  [OK] Frontend dependencies installed" -ForegroundColor Green

# ── 5. Frontend build (validates the code compiles) ───────────
Write-Host ""
Write-Host "Building frontend (npm run build)..." -ForegroundColor Yellow
Push-Location $FrontendDir
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Frontend build failed. Run 'npm run build' in frontend/ to see errors." -ForegroundColor Red
} else {
    Write-Host "  [OK] Frontend built successfully" -ForegroundColor Green
}
Pop-Location

# ── 6. Start backend ──────────────────────────────────────────
Write-Host ""
Write-Host "Starting backend on http://localhost:8000 ..." -ForegroundColor Yellow

$BackendProcess = Start-Process -FilePath $UvicornExe `
    -ArgumentList "main:app", "--port", "8000", "--log-level", "error" `
    -WorkingDirectory $BackendDir `
    -PassThru -WindowStyle Hidden

# Wait for backend to be ready
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
}

if ($ready) {
    Write-Host "  [OK] Backend is running" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Backend did not start. Check your ANTHROPIC_API_KEY and requirements." -ForegroundColor Red
}

# ── 7. Run pytest ─────────────────────────────────────────────
Write-Host ""
Write-Host "Running integration tests..." -ForegroundColor Yellow
$pytestResult = & $PythonV -m pytest (Join-Path $Root "tests\test_api.py") -v --tb=short 2>&1 | Out-String
Write-Host $pytestResult

# ── 8. Start frontend dev server ──────────────────────────────
Write-Host ""
Write-Host "Starting frontend dev server on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $FrontendDir -WindowStyle Normal

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "  When done, run: .\scripts\check.ps1" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to stop the backend process..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

if ($BackendProcess -and !$BackendProcess.HasExited) {
    Stop-Process -Id $BackendProcess.Id -Force
    Write-Host "Backend stopped."
}
