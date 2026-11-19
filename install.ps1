# Devcord Installer - PowerShell one-liner
# Usage: irm https://raw.githubusercontent.com/kisamedevv/Devcord/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  Devcord Installer" -ForegroundColor Cyan
Write-Host "  =================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "  Node.js bulunamadi. Lutfen https://nodejs.org adresinden kurun." -ForegroundColor Red
    exit 1
}
$nodeVer = (node --version).TrimStart("v").Split(".")[0]
if ([int]$nodeVer -lt 22) {
    Write-Host "  Node.js 22+ gerekli. Mevcut: v$nodeVer" -ForegroundColor Red
    exit 1
}

# Check pnpm
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpm) {
    Write-Host "  pnpm kuruluyor..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Check git
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "  Git bulunamadi. Lutfen https://git-scm.com adresinden kurun." -ForegroundColor Red
    exit 1
}

# Clone or update
$installDir = "$env:USERPROFILE\Devcord"
if (Test-Path "$installDir\.git") {
    Write-Host "  Mevcut kurulum guncelleniyor..." -ForegroundColor Yellow
    Set-Location $installDir
    git pull --ff-only
} else {
    Write-Host "  Devcord indiriliyor..." -ForegroundColor Yellow
    git clone https://github.com/kisamedevv/Devcord.git $installDir
    Set-Location $installDir
}

# Install dependencies
Write-Host "  Bagimliliklar kuruluyor..." -ForegroundColor Yellow
pnpm install --frozen-lockfile

# Build
Write-Host "  Derleniyor..." -ForegroundColor Yellow
pnpm build --standalone

# Inject
Write-Host "  Discord'a enjekte ediliyor..." -ForegroundColor Yellow
node scripts/install-desktop.mjs --install --all

Write-Host ""
Write-Host "  Devcord kuruldu! Discord'u yeniden baslatin." -ForegroundColor Green
Write-Host ""
