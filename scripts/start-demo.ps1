# Run from any directory. This script uses the existing Node.js installation.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $projectRoot 'frontend'
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue

if (-not $npmCommand) {
  throw 'Node.js 22.12+ and npm are required. Install Node.js, then reopen the terminal.'
}
if (-not (Test-Path -LiteralPath (Join-Path $frontendPath 'node_modules/@angular/cli/bin/ng.js'))) {
  throw 'Frontend dependencies are missing. Run cd frontend, then npm ci, then run this script again.'
}

Push-Location -LiteralPath $frontendPath
try {
  Write-Host 'Qamqor demo: http://localhost:4200 (Ctrl+C to stop)'
  & $npmCommand.Source start
  $commandExitCode = $LASTEXITCODE
} finally {
  Pop-Location
}
exit $commandExitCode

