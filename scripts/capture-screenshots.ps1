# JARVIS UI Visual Verification Script using Windows Local Microsoft Edge (Headless)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repo

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
if (-not (Test-Path $edgePath)) {
    throw "Microsoft Edge executable not found for visual capture."
}

$screenshotDir = Join-Path $repo "screenshots"
if (-not (Test-Path $screenshotDir)) {
    New-Item -ItemType Directory -Path $screenshotDir -Force | Out-Null
}

Write-Host "Starting Next.js production server for QA capture on port 3000..." -ForegroundColor Cyan
$serverProcess = Start-Process "cmd.exe" -ArgumentList "/c", "npm", "run", "start" -WorkingDirectory $repo -PassThru -WindowStyle Hidden

try {
    # Wait for server to be responsive
    $ready = $false
    $timeout = 25
    $elapsed = 0
    while (-not $ready -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $ready = $true
            }
        } catch {
            # Continue waiting
        }
    }

    if (-not $ready) {
        throw "Next.js server failed to respond on http://localhost:3000 within $timeout seconds."
    }
    Write-Host "Next.js server ready. Capturing screenshots..." -ForegroundColor Green

    # Desktop 1440x900
    $desktopOut = Join-Path $screenshotDir "nextjs_desktop_1440x900.png"
    Write-Host "Capturing desktop viewport (1440x900) -> $desktopOut"
    Start-Process $edgePath -ArgumentList "--headless=new", "--disable-gpu", "--window-size=1440,900", "--screenshot=$desktopOut", "http://localhost:3000" -Wait

    # Mobile 390x844
    $mobileOut = Join-Path $screenshotDir "nextjs_mobile_390x844.png"
    Write-Host "Capturing mobile viewport (390x844) -> $mobileOut"
    Start-Process $edgePath -ArgumentList "--headless=new", "--disable-gpu", "--window-size=390,844", "--screenshot=$mobileOut", "http://localhost:3000" -Wait

    Write-Host "Screenshots captured successfully." -ForegroundColor Green
} finally {
    Write-Host "Shutting down Next.js server process..." -ForegroundColor Yellow
    if ($serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
    # Kill any lingering node processes on port 3000 if needed
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt (Get-Date).AddMinutes(-2) } | ForEach-Object {
        try { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
}
