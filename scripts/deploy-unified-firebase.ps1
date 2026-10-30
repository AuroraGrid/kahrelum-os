[CmdletBinding()]
param(
    [switch]$Plan,
    [switch]$Preview,
    [switch]$Promote,
    [switch]$Deploy,
    [string]$FirebaseRoot
)

$ErrorActionPreference = "Stop"

if ($Deploy -or $FirebaseRoot) {
    throw "The stale-directory deployment path has been removed. Use -Preview, review the verified preview, then use -Promote."
}

$selectedModes = @($Plan, $Preview, $Promote | Where-Object { $_ }).Count
if ($selectedModes -gt 1) {
    throw "Choose exactly one mode: -Plan, -Preview, or -Promote."
}

$node = Get-Command node.exe -ErrorAction SilentlyContinue
$firebase = Get-Command firebase.cmd -ErrorAction SilentlyContinue
if ($null -eq $node -or $null -eq $firebase) {
    throw "Authenticated Firebase CLI and Node.js are required."
}

$firebaseToolsRoot = Join-Path (Split-Path -Parent $firebase.Source) "node_modules\firebase-tools"
if (-not (Test-Path -LiteralPath (Join-Path $firebaseToolsRoot "lib\hosting\api.js") -PathType Leaf)) {
    throw "The installed Firebase CLI module could not be located at $firebaseToolsRoot."
}

$script = Join-Path $PSScriptRoot "firebase-overlay-release.cjs"
$env:FIREBASE_TOOLS_ROOT = $firebaseToolsRoot

$mode = "--plan"
if ($Preview) { $mode = "--preview" }
if ($Promote) { $mode = "--promote" }

& $node.Source $script $mode
if ($LASTEXITCODE -ne 0) {
    throw "Firebase overlay release failed with exit code $LASTEXITCODE."
}
