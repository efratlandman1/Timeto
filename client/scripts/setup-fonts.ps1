Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info([string]$msg) {
	Write-Host "[INFO] $msg"
}
function Write-Ok([string]$msg) {
	Write-Host "[ OK ] $msg" -ForegroundColor Green
}
function Write-Warn([string]$msg) {
	Write-Host "[WARN] $msg" -ForegroundColor Yellow
}
function Write-Err([string]$msg) {
	Write-Host "[ERR ] $msg" -ForegroundColor Red
}

try {
	$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
	$clientRoot = Resolve-Path (Join-Path $scriptDir "..")
	Set-Location $clientRoot
	Write-Info "Working directory: $clientRoot"

	# Ensure package.json exists
	if (-not (Test-Path -Path "package.json")) {
		Write-Info "package.json not found. Initializing npm project..."
		npm init -y
		if ($LASTEXITCODE -ne 0) { throw "npm init failed." }
		Write-Ok "npm project initialized."
	} else {
		Write-Info "package.json found."
	}

	# Install converter
	Write-Info "Installing dev dependency: ttf2woff2"
	npm i -D ttf2woff2
	if ($LASTEXITCODE -ne 0) { throw "npm install ttf2woff2 failed." }
	Write-Ok "ttf2woff2 installed."

	# Run normalization
	Write-Info "Running normalization script..."
	node scripts/normalize-fonts.js
	if ($LASTEXITCODE -ne 0) { throw "normalize-fonts.js failed." }
	Write-Ok "Fonts normalization completed."

	# Verify outputs
	$cssOut = Join-Path $clientRoot "src/styles/global/fonts.generated.css"
	$normDir = Join-Path $clientRoot "src/assets/fonts/_normalized"
	if (Test-Path $cssOut) {
		Write-Ok "CSS generated: $cssOut"
	} else {
		Write-Warn "CSS file not found at expected path: $cssOut"
	}
	if (Test-Path $normDir) {
		Write-Ok "Normalized fonts directory: $normDir"
	} else {
		Write-Warn "Normalized fonts directory not found: $normDir"
	}

	Write-Host ""
	Write-Host "Next steps:" -ForegroundColor Cyan
	Write-Host "1) Import the generated CSS once in your app entry or global styles:"
	Write-Host "   import './styles/global/fonts.generated.css';"
	Write-Host "2) Use the families in CSS/Tailwind/MUI as usual (font-family: 'FamilyName')."
	Write-Host ""
}
catch {
	Write-Err $_
	exit 1
}

exit 0


