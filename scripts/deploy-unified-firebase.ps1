# Safe, additive KAHRELUM Firebase Hosting deployment
# Target project: kahrelum-public-hosting. No DNS, billing, Vercel or frozen runtime changes.
# Run from cloned AuroraGrid/kahrelum-os on the computer already authenticated with Firebase CLI:
# .\scripts\deploy-unified-firebase.ps1 -FirebaseRoot "C:\path\to\kahrelum-firebase-seo-20261021" -Deploy
param([Parameter(Mandatory=$true)][string]$FirebaseRoot,[switch]$Deploy)
$ErrorActionPreference='Stop'
$sourceRoot=Split-Path -Parent $PSScriptRoot
$root=(Resolve-Path -LiteralPath $FirebaseRoot).Path
$cfgFile=Join-Path $root 'firebase.json'
if(!(Test-Path $cfgFile -PathType Leaf)){throw 'Existing Firebase project firebase.json missing. No changes made.'}
$cfg=Get-Content -LiteralPath $cfgFile -Raw -Encoding UTF8 | ConvertFrom-Json
$hosting=$cfg.hosting
if($hosting -is [array]){$hosting=@($hosting | Where-Object {$_.public} | Select-Object -First 1)[0]}
if(!$hosting -or !$hosting.public){throw 'Existing hosting.public not identified. No changes made.'}
if($hosting.cleanUrls -ne $true){throw 'cleanUrls is not true; refusing to break clean routes.'}
$pub=Join-Path $root ([string]$hosting.public)
$home=Join-Path $pub 'index.html'
if(!(Test-Path $home -PathType Leaf)){throw 'Existing Firebase homepage missing. No changes made.'}
$items=@('divisions.css','assurance.html','investigations.html','forecasting.html','digital-id.html','one.html','os.html')
foreach($f in $items){if(!(Test-Path (Join-Path $sourceRoot $f) -PathType Leaf)){throw "Missing repo source file: $f"}}
$back=Join-Path $root ('.kahrelum-backups\divisions-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $back -Force|Out-Null
Copy-Item -LiteralPath $home -Destination (Join-Path $back 'index.html')
Copy-Item -LiteralPath $cfgFile -Destination (Join-Path $back 'firebase.json')
$map=Join-Path $pub 'sitemap.xml'
if(Test-Path $map -PathType Leaf){Copy-Item -LiteralPath $map -Destination (Join-Path $back 'sitemap.xml')}
foreach($f in $items){$t=Join-Path $pub $f;if(Test-Path $t){Copy-Item -LiteralPath $t -Destination (Join-Path $back $f)};Copy-Item -LiteralPath (Join-Path $sourceRoot $f) -Destination $t -Force}
$raw=Get-Content -LiteralPath $home -Raw -Encoding UTF8
if(!$raw.Contains('id="kahrelum-divisions-update"')){
  $section=@'
<section id="kahrelum-divisions-update" aria-label="KAHRELUM divisions" style="border:1px solid #c8bfae;background:#f6f0e4;padding:1.5rem;margin:2rem auto;max-width:980px;color:#1b2426;font-family:system-ui,sans-serif">
<p style="letter-spacing:.1em;font-size:.75rem">KAHRELUM · ONE SYSTEM, FOUR DIVISIONS</p>
<h2 style="font-family:Georgia,serif">AI &amp; Agent Assurance · Investigations · Forecasting · KAHRELUM ONE</h2>
<p>Independent evidence-to-decision research, with clear uncertainty and preserved corrections. Choose your division:</p>
<nav style="display:flex;gap:.8rem;flex-wrap:wrap"><a href="/assurance">AI Assurance</a><a href="/investigations">Investigations &amp; OSINT</a><a href="/forecasting">Forecasting &amp; Intelligence</a><a href="/digital-id">Worldwide Digital ID</a><a href="/one">KAHRELUM ONE (in development)</a><a href="/os">OS &amp; Method</a></nav>
<p><a href="/pilot#request">$750 three-case Fit Check / $2,500 Founding Pilot</a> remain the original enterprise entry point. No licensed private-investigator or independent forecasting superiority claim is made.</p>
</section>
'@
  $m=[regex]::Match($raw,'<main\b[^>]*>','IgnoreCase')
  if(!$m.Success){throw "No main element in Firebase homepage; backup at $back. Cannot safely inject."}
  $raw=$raw.Insert($m.Index+$m.Length,[Environment]::NewLine+$section+[Environment]::NewLine)
  [System.IO.File]::WriteAllText($home,$raw,(New-Object System.Text.UTF8Encoding($false)))
}
if(Test-Path $map -PathType Leaf){
 $sm=Get-Content -LiteralPath $map -Raw -Encoding UTF8
 if($sm.Contains('</urlset>')){
  $extra=''
  foreach($route in @('/assurance','/investigations','/forecasting','/digital-id','/one','/os')){
    $url='https://kahrelum.com'+$route
    if(!$sm.Contains('<loc>'+$url+'</loc>')){$extra+='<url><loc>'+$url+'</loc></url>'+[Environment]::NewLine}
  }
  if($extra){$sm=$sm.Replace('</urlset>',$extra+'</urlset>');[System.IO.File]::WriteAllText($map,$sm,(New-Object System.Text.UTF8Encoding($false)))}
 }
}
Write-Host "STAGED. Backups in $back. Existing Firebase config and pilot/API routes untouched."
if(!$Deploy){Write-Host 'No deployment requested. Rerun with -Deploy after reviewing the staged source.';exit 0}
$originalScript=Join-Path $root 'scripts\deploy_hosting.ps1'
Push-Location $root
try{
 if(Test-Path $originalScript){& $originalScript -Message 'Publish KAHRELUM divisions, forecasting and digital ID';if($LASTEXITCODE -and $LASTEXITCODE -ne 0){throw "Deploy script exited $LASTEXITCODE"}}
 else{if(!(Get-Command firebase -ErrorAction SilentlyContinue)){throw 'Firebase CLI missing or not authenticated.'}; & firebase deploy --only hosting --project kahrelum-public-hosting;if($LASTEXITCODE -ne 0){throw "Firebase deploy failed: $LASTEXITCODE"}}
}finally{Pop-Location}
$errors=@()
foreach($route in @('/','/pilot','/demo','/sample','/connect','/api/v1','/api/v1/release','/api/v1/example','/assurance','/investigations','/forecasting','/digital-id','/one','/os')){
 try{$r=Invoke-WebRequest -Uri ('https://kahrelum.com'+$route) -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 25;if($r.StatusCode -ne 200){$errors+=($route+': HTTP '+$r.StatusCode)}}catch{$errors+=($route+': '+$_.Exception.Message)}
}
if($errors.Count){throw ('Hosting deploy ran, but route checks failed: '+($errors -join '; '))}
Write-Host 'Firebase deploy completed and old/new route checks passed.'
