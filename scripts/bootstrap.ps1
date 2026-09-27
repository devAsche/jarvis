# Dry-run friendly environment report. Does not install packages or modify global config.
param([switch]$InitGit)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repo
Write-Host "JARVIS local setup check: $repo" -ForegroundColor Cyan
foreach ($tool in @('git','node','npm','python','py')) {
    $command = Get-Command $tool -ErrorAction SilentlyContinue
    if ($null -eq $command) { Write-Host "  $tool : unavailable / optional (check prerequisites)" -ForegroundColor Yellow; continue }
    switch ($tool) {
        'git' { $version = (& git --version) }
        'node' { $version = (& node --version) }
        'npm' { $version = (& npm --version) }
        'python' { $version = (& python --version 2>&1) }
        'py' { $version = (& py --version 2>&1) }
    }
    Write-Host "  $tool : $version"
}
Write-Host "  Reference prototype: $repo\prototype\index.html"
Write-Host "  Mode from .env.example: DEMO; NO EXTERNAL EFFECTS"
if ($InitGit) {
    if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) {
        if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is not available.' }
        & git init
    } else { Write-Host 'Git repository already exists; skipping init.' }
}
Write-Host 'No dependencies installed and no paid APIs connected.' -ForegroundColor Green
