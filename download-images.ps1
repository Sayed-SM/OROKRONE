$ErrorActionPreference = 'Continue'
$dir = "assets\img\watches"
New-Item -ItemType Directory -Force $dir | Out-Null
$images = [ordered]@{
  'w1'    = '1524592094714-0f0654e20314'
  'w2'    = '1522312346375-d1a52e2b99b3'
  'w3'    = '1547996160-81dfa63595aa'
  'w4'    = '1524805444758-089113d48a6d'
  'w5'    = '1533139502658-0198f920d8e8'
  'w6'    = '1526045431048-f857369baa09'
  'w7'    = '1548171915-e79a380a2a4b'
  'w8'    = '1539874754764-5a96559165b0'
  'w9'    = '1434056886845-dac89ffe9b56'
  'w10'   = '1594534475808-b18fc33b045e'
  'acc1'  = '1508057198894-247b23fe5ade'
  'acc2'  = '1622434641406-a158123450f9'
  'acc3'  = '1612817159949-195b6eb9e31a'
  'hero'  = '1441984904996-e0b6ba687e04'
  'craft' = '1495856458515-0637185db551'
}
foreach ($key in $images.Keys) {
  $url = "https://images.unsplash.com/photo-$($images[$key])?auto=format&fit=crop&w=1000&h=1200&q=80"
  try {
    Invoke-WebRequest -Uri $url -OutFile "$dir\$key.jpg" -TimeoutSec 40
    Write-Host "OK $key"
  } catch {
    Write-Host "FAIL $key $($_.Exception.Message)"
  }
}
Get-ChildItem $dir | Select-Object Name, Length | Format-Table -AutoSize
