# Prefer an existing portable toolchain, otherwise use JAVA_HOME and Maven on PATH.
# Examples: .\scripts\start-backend.ps1
#           .\scripts\start-backend.ps1 -MavenArguments test
param(
  [string[]]$MavenArguments = @('spring-boot:run')
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backend'
$toolRoots = @(
  (Join-Path $projectRoot '.tools'),
  (Join-Path (Split-Path -Parent $projectRoot) '.tools')
)
$selectedJavaHome = $null
$mavenCommand = $null
$mavenToolRoot = $null

foreach ($toolRoot in $toolRoots) {
  if (-not (Test-Path -LiteralPath $toolRoot -PathType Container)) { continue }
  $toolDirectories = Get-ChildItem -LiteralPath $toolRoot -Directory
  if (-not $selectedJavaHome) {
    $jdkDirectory = $toolDirectories |
      Where-Object { $_.Name -like 'jdk-21*' -and (Test-Path -LiteralPath (Join-Path $_.FullName 'bin/java.exe')) } |
      Sort-Object Name -Descending | Select-Object -First 1
    if ($jdkDirectory) { $selectedJavaHome = $jdkDirectory.FullName }
  }
  if (-not $mavenCommand) {
    $mavenDirectory = $toolDirectories |
      Where-Object { $_.Name -like 'apache-maven-*' -and (Test-Path -LiteralPath (Join-Path $_.FullName 'bin/mvn.cmd')) } |
      Sort-Object Name -Descending | Select-Object -First 1
    if ($mavenDirectory) {
      $mavenCommand = Join-Path $mavenDirectory.FullName 'bin/mvn.cmd'
      $mavenToolRoot = $toolRoot
    }
  }
}

if (-not $selectedJavaHome -and $env:JAVA_HOME) {
  if (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin/java.exe')) {
    $selectedJavaHome = $env:JAVA_HOME
  }
}
if (-not $selectedJavaHome) {
  throw 'JDK 21 is required. Set JAVA_HOME to its directory or provide an existing .tools/jdk-21* toolchain.'
}
if (-not $mavenCommand) {
  $globalMaven = Get-Command mvn.cmd -ErrorAction SilentlyContinue
  if ($globalMaven) { $mavenCommand = $globalMaven.Source }
}
if (-not $mavenCommand) {
  throw 'Maven 3.9+ is required on PATH or in an existing .tools/apache-maven-* directory.'
}

$launchArguments = @('--batch-mode', '--no-transfer-progress')
if ($mavenToolRoot) {
  $portableCache = Join-Path $mavenToolRoot 'm2'
  if (Test-Path -LiteralPath $portableCache -PathType Container) {
    $launchArguments += "-Dmaven.repo.local=$portableCache"
  }
}
$launchArguments += $MavenArguments
$previousJavaHome = $env:JAVA_HOME
$previousPath = $env:PATH

Push-Location -LiteralPath $backendPath
try {
  $env:JAVA_HOME = $selectedJavaHome
  $env:PATH = (Join-Path $selectedJavaHome 'bin') + [IO.Path]::PathSeparator + $previousPath
  Write-Host "Java: $selectedJavaHome"
  Write-Host "Maven: $mavenCommand"
  & $mavenCommand @launchArguments
  $commandExitCode = $LASTEXITCODE
} finally {
  $env:JAVA_HOME = $previousJavaHome
  $env:PATH = $previousPath
  Pop-Location
}
exit $commandExitCode

