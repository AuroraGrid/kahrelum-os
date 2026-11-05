# KAHRELUM AutoResults: US election results, source-bound autonomous refresh.
# Designed to run in a dedicated, clean Git branch checkout on the Dell.
param([switch]$DryRun)
$ErrorActionPreference = 'Stop'
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$TaskName = 'KAHRELUM-Israel-Live-2026'
$SourceTag = 'KAHRELUM-US-Results-15Min'
$StateDir = Join-Path $env:USERPROFILE 'Documents\KAHRELUM_Custody\us-results-daemon-2026'
$Log = Join-Path $StateDir 'events.jsonl'
$ReceiptDir = Join-Path $StateDir 'receipts'
New-Item -ItemType Directory -Path $StateDir, $ReceiptDir -Force | Out-Null
$GitSource = ''
$phase = 'START'
function Log([string]$state,[string]$detail) {
  $entry=[ordered]@{utc=(Get-Date).ToUniversalTime().ToString('o');state=$state;phase=$phase;detail=$detail;gitSha=$GitSource}
  Add-Content -LiteralPath $Log -Value ($entry|ConvertTo-Json -Compress -Depth 4) -Encoding UTF8
  Write-Output ($state+' '+$detail)
}
$mutex = New-Object System.Threading.Mutex($false, 'Local\KAHRELUM_US_RESULTS_2026')
$owns=$false
$electionPaused=$false
$pendingSourceFileUpdate=$false
try {
  $owns=$mutex.WaitOne(0)
  if(-not $owns){Log 'BUSY' 'Another US-results refresh is already running';exit 0}
  $phase='PREFLIGHT'
  if(-not (Test-Path (Join-Path $Repo '.git'))){throw 'Expected a dedicated Git worktree'}
  $GitSource=(git -C $Repo rev-parse HEAD).Trim()
  if($LASTEXITCODE -ne 0){throw 'Git identity missing'}
  $branch=(git -C $Repo branch --show-current).Trim()
  if($branch -ne 'auto/us-results-2026'){throw 'Unsafe branch: '+$branch}
  if(@(git -C $Repo status --porcelain).Count -ne 0){throw 'Git source not clean'}
  $auth=Join-Path $env:LOCALAPPDATA 'KAHRELUM\publisher-auth'
  $cred=Join-Path $auth 'publisher-service-account.json'
  $xdg=Join-Path $auth 'isolated-config'
  if(-not (Test-Path $cred) -or -not (Test-Path $xdg)){throw 'Dedicated publisher credential/config unavailable'}
  $old=Get-Content -LiteralPath (Join-Path $Repo 'election/results-2026-snapshot.json') -Raw | ConvertFrom-Json
  if($old.schema -ne 'KAHRELUM_US_ELECTION_2026_SOURCE_SNAPSHOT_V1'){throw 'Prior snapshot schema changed'}
  $phase='FETCH'
  $tmp=Join-Path $StateDir 'download'
  New-Item -ItemType Directory -Force -Path $tmp |Out-Null
  $suffix=Get-Date -Format 'yyyyMMddHHmm'
  foreach($file in @('house-districts.csv','results.csv')){
    $uri='https://polling-desk.com/'+$file+'?kahrelum_refresh='+$suffix
    Invoke-WebRequest -Uri $uri -UseBasicParsing -OutFile (Join-Path $tmp $file) -TimeoutSec 35 -ErrorAction Stop
    if((Get-Item (Join-Path $tmp $file)).Length -lt 10000){throw 'Source download suspiciously short: '+$file}
  }
  $phase='REBUILD'
  $python=Get-Command python.exe -ErrorAction Stop
  & $python.Source (Join-Path $Repo 'scripts/build_election_results_snapshot.py') '--source-dir' $tmp
  if($LASTEXITCODE -ne 0){throw '506-race data validation failed'}
  $pendingSourceFileUpdate=$true
  $candidate=Get-Content -LiteralPath (Join-Path $Repo 'election/results-2026-snapshot.json') -Raw | ConvertFrom-Json
  if($candidate.house.Count -ne 435 -or $candidate.senate.Count -ne 35 -or $candidate.governor.Count -ne 36){throw 'Missing race family after import'}
  if($candidate.resultStatus -ne 'UNOFFICIAL_CALLS_AND_COUNTS_NOT_CERTIFIED'){throw 'Unofficial label missing'}
  $sourceTime=[DateTimeOffset]::Parse($candidate.sourceLatestResultUpdatedUtc).UtcDateTime
  if($sourceTime -gt [datetime]::UtcNow.AddMinutes(30)){throw 'Source timestamp unexpectedly in the future'}
  # Check all 506 contests against last published custody, not just House races.
  # A correction to a called winner needs a human review, never a silent overwrite.
  foreach($office in @('house','senate','governor')){
    $before=@{};foreach($race in $old.$office){$before[[string]$race.id]=$race}
    foreach($race in $candidate.$office){
      if(-not $before.ContainsKey([string]$race.id)){throw 'Unexpected race ID '+$race.id}
      $prior=$before[[string]$race.id]
      if($prior.status -eq 'CALLED' -and $race.status -eq 'COUNTING'){throw 'CALLED to COUNTING anomaly; manual review required for '+$race.id}
      if($prior.status -eq 'CALLED' -and (($race.party -ne $prior.party) -or ($race.winnerOrLeader -ne $prior.winnerOrLeader))){
        throw 'Previously called winner changed; manual verification required for '+$race.id
      }
    }
  }
  $oldHash=($old.sourceSha256|ConvertTo-Json -Compress)
  $newHash=($candidate.sourceSha256|ConvertTo-Json -Compress)
  if($newHash -ne $oldHash){
    $previousSourceTime=[datetime]::Parse($old.sourceLatestResultUpdatedUtc)
    if($sourceTime -le $previousSourceTime){throw 'Changed source with non-increasing timestamp; review required'}
  }
  $phase='DETERMINE'
  $deployed=$null
  try{
    $url='https://kahrelum.com/election/results-2026-snapshot.json?kahrelum_verify='+([datetime]::UtcNow.Ticks)
    $public=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    $deployed=$public.Content|ConvertFrom-Json
  }catch{Log 'PUBLIC_READ_ERROR' $_.Exception.Message}
  $publishedHash=if($deployed){$deployed.sourceSha256|ConvertTo-Json -Compress}else{'UNKNOWN'}
  if($newHash -eq $oldHash){
    git -C $Repo restore -- election/results-2026-snapshot.json
    if($LASTEXITCODE -ne 0){throw 'Failed to restore unchanged snapshot'}
    $pendingSourceFileUpdate=$false
    if($publishedHash -eq $newHash){Log 'NO_CHANGE' 'Sources unchanged; published version already matches';exit 0}
    Log 'RETRY' 'Sources unchanged but published content differs; attempt a safe retry'
  } else {
    if($DryRun){git -C $Repo restore -- election/results-2026-snapshot.json;Log 'DRY_RUN' 'Source changed; publication withheld';exit 0}
    $phase='CUSTODY_COMMIT'
    git -C $Repo add -- election/results-2026-snapshot.json
    if($LASTEXITCODE -ne 0){throw 'Git staging failed'}
    git -C $Repo -c user.name='KAHRELUM Data Publisher' -c user.email='noreply@users.noreply.github.com' commit -m ('data: US election results updated '+$candidate.sourceLatestResultUpdatedUtc)
    if($LASTEXITCODE -ne 0){throw 'Git custody commit failed'}
    $GitSource=(git -C $Repo rev-parse HEAD).Trim()
    $pendingSourceFileUpdate=$false
    if($LASTEXITCODE -ne 0){throw 'Post-commit Git identity missing'}
  }
  if($DryRun){Log 'DRY_RUN' 'No publishing attempted';exit 0}
  $phase='PUBLIC_CUSTODY'
  $env:GCM_INTERACTIVE='Never'
  git -C $Repo -c credential.interactive=never push origin 'HEAD:refs/heads/auto/us-results-2026'
  if($LASTEXITCODE -ne 0){throw 'Public Git receipt/push failed, no deployment performed'}
  $remoteLine=(git -C $Repo ls-remote origin refs/heads/auto/us-results-2026)
  if($LASTEXITCODE -ne 0 -or -not $remoteLine.StartsWith($GitSource)){throw 'Public Git commit not verified, no deployment'}
  $phase='PUBLISH'
  $live=Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
  if($live.State -eq 'Disabled'){throw 'Israel publisher already disabled by another operator'}
  if(-not (Test-Path (Join-Path $StateDir 'israel-publisher-task-original.xml'))){
    [System.IO.File]::WriteAllText((Join-Path $StateDir 'israel-publisher-task-original.xml'),(Export-ScheduledTask -TaskName $TaskName),(New-Object System.Text.UTF8Encoding($false)))
  }
  Disable-ScheduledTask -TaskName $TaskName -ErrorAction Stop |Out-Null
  $electionPaused=$true
  for($i=0;$i -lt 45;$i++){
    if((Get-ScheduledTask -TaskName $TaskName).State -ne 'Running'){break}
    Start-Sleep -Seconds 2
  }
  if((Get-ScheduledTask -TaskName $TaskName).State -eq 'Running'){throw 'Ongoing Israel publisher did not finish'}
  $env:GOOGLE_APPLICATION_CREDENTIALS=$cred;$env:XDG_CONFIG_HOME=$xdg
  foreach($mode in @('Plan','Preview','Promote')){
    $phase=$mode.ToUpper()
    Log 'PHASE_START' $mode
    if($mode -eq 'Plan'){ & (Join-Path $Repo 'scripts/deploy-unified-firebase.ps1') -Plan -Profile us-results-data }
    if($mode -eq 'Preview'){ & (Join-Path $Repo 'scripts/deploy-unified-firebase.ps1') -Preview -Profile us-results-data }
    if($mode -eq 'Promote'){ & (Join-Path $Repo 'scripts/deploy-unified-firebase.ps1') -Promote -Profile us-results-data }
    if(-not $?){throw 'Firebase '+$mode+' failed'}
    Log 'PHASE_COMPLETE' $mode
  }
  $receiptFile=Join-Path $Repo '.firebase-deploy/production-receipt.json'
  if(-not (Test-Path $receiptFile)){throw 'Production receipt missing after promotion'}
  $receipt=Get-Content $receiptFile -Raw|ConvertFrom-Json
  if($receipt.sourceCommit -ne $GitSource -or $receipt.configUnchanged -ne $true){throw 'Production receipt source or config mismatch'}
  Copy-Item -LiteralPath $receiptFile -Destination (Join-Path $ReceiptDir ($candidate.sourceLatestResultUpdatedUtc.Replace(':','-')+'.json')) -Force
  $phase='VERIFY'
  $final=(Invoke-WebRequest -Uri ('https://kahrelum.com/election/results-2026-snapshot.json?verify='+([datetime]::UtcNow.Ticks)) -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop).Content|ConvertFrom-Json
  if(($final.sourceSha256|ConvertTo-Json -Compress) -ne $newHash){throw 'Live race dataset content differs from deployed source'}
  Log 'SUCCESS' ('Published source SHA '+$GitSource+'; update '+$candidate.sourceLatestResultUpdatedUtc)
} catch {
  Log 'ERROR' $_.Exception.Message
  if($pendingSourceFileUpdate){
    git -C $Repo restore --staged -- election/results-2026-snapshot.json 2>$null
    git -C $Repo restore -- election/results-2026-snapshot.json 2>$null
    Log 'SOURCE_RESTORE' 'Restored uncommitted source snapshot after failure'
  }
  throw
} finally {
  if($electionPaused){
    try{Enable-ScheduledTask -TaskName $TaskName -ErrorAction Stop|Out-Null;Log 'RESTORED' $TaskName}catch{Log 'CRITICAL_RESTORE_FAILED' $_.Exception.Message;throw}
  }
  if($owns){$mutex.ReleaseMutex()}
  $mutex.Dispose()
}
