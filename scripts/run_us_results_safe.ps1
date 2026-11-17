# Stable scheduled-task entrypoint. It executes a verified worker copy OUTSIDE the Git tree.
# No credentials are stored in this wrapper. The repository worker owns source verification and release gates.
[CmdletBinding()]
param([switch]$DryRun)
$ErrorActionPreference='Stop'
$StateDir=Join-Path $env:USERPROFILE 'Documents\KAHRELUM_Custody\us-results-daemon-2026'
$Repo=Join-Path $StateDir 'repo'
$relative='scripts/refresh_us_results_task.ps1'
$source=Join-Path $Repo 'scripts\refresh_us_results_task.ps1'
$copy=Join-Path $StateDir 'worker-active.ps1'
$logdir=Join-Path $StateDir 'runner-logs'
New-Item -ItemType Directory -Path $logdir -Force|Out-Null
if(-not (Test-Path -LiteralPath (Join-Path $Repo '.git'))){throw 'Source Git checkout missing'}
$branch=(git -C $Repo branch --show-current).Trim()
if($LASTEXITCODE -ne 0 -or $branch -ne 'auto/us-results-2026'){throw 'Unexpected Git source branch'}
$GitSource=(git -C $Repo rev-parse HEAD).Trim()
if($LASTEXITCODE -ne 0 -or $GitSource -notmatch '^[a-f0-9]{40}$'){throw 'Source commit identity unavailable'}
$expectedBlob=(git -C $Repo rev-parse "HEAD:$relative").Trim()
if($LASTEXITCODE -ne 0 -or $expectedBlob -notmatch '^[a-f0-9]{40}$'){throw 'Committed worker blob missing'}
if(-not (Test-Path -LiteralPath $source)){
  Write-Output 'RECOVERY: Tracked worker missing prior to launch; restore from exact HEAD'
  git -C $Repo restore --source=HEAD -- $relative
  if($LASTEXITCODE -ne 0){throw 'Unable to restore committed worker'}
}
$actualBlob=(git -C $Repo hash-object -- $source).Trim()
if($LASTEXITCODE -ne 0 -or $actualBlob -ne $expectedBlob){throw 'Worker source differs from exact Git commit'}
if(@(git -C $Repo status --porcelain).Count -ne 0){throw 'Working tree not clean before scheduled run'}
Copy-Item -LiteralPath $source -Destination $copy -Force
$sourceSha=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash
$copySha=(Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash
if($sourceSha -ne $copySha){throw 'External worker differs from audited Git file'}
$stamp=(Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$stdout=Join-Path $logdir ($stamp+'-stdout.log')
$stderr=Join-Path $logdir ($stamp+'-stderr.log')
$exe=(Get-Command powershell.exe -ErrorAction Stop).Source
$arg='-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "'+$copy+'" -RepoRoot "'+$Repo+'"'
if($DryRun){$arg+=' -DryRun'}
Write-Output ('RUNNER_START commit='+$GitSource+' dryRun='+[bool]$DryRun)
try{
  $child=Start-Process -FilePath $exe -ArgumentList $arg -PassThru -Wait -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  $code=$child.ExitCode
  $out=(Get-Content -LiteralPath $stdout -Raw -ErrorAction SilentlyContinue)
  if($out){Write-Output $out}
  $err=(Get-Content -LiteralPath $stderr -Raw -ErrorAction SilentlyContinue)
  if($err){Write-Output ('RUNNER_STDERR '+$err.Substring(0,[Math]::Min(4000,$err.Length)))}
  if(-not (Test-Path -LiteralPath $source)){
    Write-Output 'RECOVERY: Tracked worker disappeared during run; restoring exact committed copy'
    git -C $Repo restore --source=HEAD -- $relative
    if($LASTEXITCODE -ne 0){throw 'Post-run worker restoration failed'}
  }
  if($code -ne 0){throw ('Worker returned exit code '+$code+'; full logs preserved')}
  Write-Output ('RUNNER_PASS commit='+$GitSource+' exit='+$code)
} catch {
  Write-Output ('RUNNER_FAILED '+$_.Exception.Message)
  throw
}
