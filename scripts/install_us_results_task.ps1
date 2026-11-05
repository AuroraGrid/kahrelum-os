# One-time installation of the KAHRELUM source-bound 15-minute results publisher.
# This task runs only when the authorized Dell user is signed in; never store secrets in the task.
$ErrorActionPreference='Stop'
$TaskName='KAHRELUM-US-Results-15Min'
$state=Join-Path $env:USERPROFILE 'Documents\KAHRELUM_Custody\us-results-daemon-2026'
$repo=Join-Path $state 'repo'
$sourceBranch='auto/us-results-2026'
New-Item -ItemType Directory -Path $state -Force|Out-Null
$existing=Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if($existing){throw 'Existing results task found; refusing overwrite. Inspect before changing.'}
if(-not (Test-Path (Join-Path $repo '.git'))){
  git -c core.autocrlf=false clone --depth 1 --branch main https://github.com/AuroraGrid/kahrelum-os.git $repo
  if($LASTEXITCODE -ne 0){throw 'Failed to clone clean source'}
  git -C $repo config core.autocrlf false
  git -C $repo checkout -b $sourceBranch
  if($LASTEXITCODE -ne 0){throw 'Failed to create source custody branch'}
}
if((git -C $repo branch --show-current).Trim() -ne $sourceBranch){throw 'Results worktree on wrong branch'}
if(@(git -C $repo status --porcelain).Count -ne 0){throw 'Results worktree must be clean'}
if(-not (Test-Path (Join-Path $repo 'scripts/refresh_us_results_task.ps1'))){throw 'Updater script not yet committed to main; stop'}
if(-not (Test-Path (Join-Path $repo 'election/results-2026-snapshot.json'))){throw 'Initial published snapshot missing; stop'}
$runnerSource=Join-Path $repo 'scripts/run_us_results_safe.ps1'
$updater=Join-Path $state 'run_us_results_safe.ps1'
if(-not (Test-Path -LiteralPath $runnerSource)){throw 'Approved external runner source missing'}
Copy-Item -LiteralPath $runnerSource -Destination $updater -Force
if((Get-FileHash -LiteralPath $runnerSource -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $updater -Algorithm SHA256).Hash){throw 'Outside-repo runner copy mismatch'}
$quote='"'
$arguments='-NoProfile -NonInteractive -ExecutionPolicy Bypass -File '+$quote+$updater+$quote
$action=New-ScheduledTaskAction -Execute 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -Argument $arguments -WorkingDirectory $repo
$trigger=New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration (New-TimeSpan -Days 30)
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 9) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$user=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'Every 15m: validate 506 unofficial election race results from credited sources; only changed snapshots published via protected Firebase plan/preview/promote while preserving C0 and other site files.' -ErrorAction Stop |Out-Null
$task=Get-ScheduledTask -TaskName $TaskName
$info=Get-ScheduledTaskInfo -TaskName $TaskName
$receipt=@{task=$TaskName;createdAtUtc=(Get-Date).ToUniversalTime().ToString('o');user=$user;state=$task.State;nextRunTime=$info.NextRunTime.ToString('o');startBoundary=$trigger.StartBoundary;interval=$trigger.Repetition.Interval;duration=$trigger.Repetition.Duration;repo=$repo;script=$updater;branch=$sourceBranch;needsDellSignedIn=$true;interferenceGuard='Suspends election-live publisher only for changed data release; always attempts to restore in finally';source='Polling Desk CSV / civicAPI credited'}
$receipt|ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $state 'installer-receipt.json') -Encoding UTF8
Write-Output ($receipt |ConvertTo-Json -Depth 4)
