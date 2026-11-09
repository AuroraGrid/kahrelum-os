[CmdletBinding()]
param(
    [switch]$Plan,
    [switch]$Preview,
    [switch]$Promote,
    [switch]$Deploy,
    [string]$FirebaseRoot,
    [ValidateSet("full", "election-challenge", "election-challenge-data", "sports-intelligence", "publishing", "social-previews", "desk-upgrade", "portraits", "candidate-portraits", "investigations", "lead-magnet", "poliwave-watch", "results-verified", "us-results-data", "us-results-ui", "nfl-sourcegrid-data", "case-share-cards", "site-makeover", "commercial-readiness", "israel-c7", "ai-evaluation", "opticodds-market-integrity", "buyer-discovery")]
    [string]$Profile = "full"
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
$publisherAuthRoot = Join-Path $env:LOCALAPPDATA "KAHRELUM\publisher-auth"
$publisherCredential = Join-Path $publisherAuthRoot "publisher-service-account.json"
$publisherConfigRoot = Join-Path $publisherAuthRoot "isolated-config"
$credentialExists = Test-Path -LiteralPath $publisherCredential -PathType Leaf
$configRootExists = Test-Path -LiteralPath $publisherConfigRoot -PathType Container
if ($credentialExists -xor $configRootExists) {
    throw "Dedicated publisher authentication is incomplete; refusing to fall back silently."
}

$mode = "--plan"
if ($Preview) { $mode = "--preview" }
if ($Promote) { $mode = "--promote" }
$nodeArguments = @('"' + $script + '"', $mode, "--profile", $Profile)

if ($credentialExists) {
    $previousGoogleCredential = [Environment]::GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", "Process")
    $previousXdgConfig = [Environment]::GetEnvironmentVariable("XDG_CONFIG_HOME", "Process")
    try {
        $env:GOOGLE_APPLICATION_CREDENTIALS = $publisherCredential
        $env:XDG_CONFIG_HOME = $publisherConfigRoot
        $nodeProcess = Start-Process -FilePath $node.Source -ArgumentList $nodeArguments -Wait -PassThru -NoNewWindow
        $overlayExitCode = $nodeProcess.ExitCode
    } finally {
        if ($null -eq $previousGoogleCredential) { Remove-Item Env:\GOOGLE_APPLICATION_CREDENTIALS -ErrorAction SilentlyContinue } else { $env:GOOGLE_APPLICATION_CREDENTIALS = $previousGoogleCredential }
        if ($null -eq $previousXdgConfig) { Remove-Item Env:\XDG_CONFIG_HOME -ErrorAction SilentlyContinue } else { $env:XDG_CONFIG_HOME = $previousXdgConfig }
    }
} else {
    $nodeProcess = Start-Process -FilePath $node.Source -ArgumentList $nodeArguments -Wait -PassThru -NoNewWindow
    $overlayExitCode = $nodeProcess.ExitCode
}
if ($overlayExitCode -ne 0) {
    throw "Firebase overlay release failed with exit code $overlayExitCode."
}
