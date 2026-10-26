# Lance le test de charge JMeter (sans interface) a plusieurs niveaux d'utilisateurs simultanes et produit,
# pour chacun, le rapport HTML de JMeter dans performance\resultats\<horodatage>\<n>-utilisateurs\.
#
# Usage :  powershell -ExecutionPolicy Bypass -File .\run-performance.ps1 [-Users 10,50,100] [-Duration 60]
# Prerequis : les microservices tournent (start-all.ps1) et JMeter est dans ..\.tools\apache-jmeter-5.6.3.
param(
    [int[]]$Users = @(10, 50, 100),
    [int]$Duration = 60,
    [string]$TargetHost = 'localhost',
    [int]$Port = 8080
)
$ErrorActionPreference = 'Stop'
$jmeter = Join-Path $PSScriptRoot '..\.tools\apache-jmeter-5.6.3\bin\jmeter.bat'
if (-not (Test-Path $jmeter)) { throw "JMeter introuvable : $jmeter" }
$plan = Join-Path $PSScriptRoot 'mirador-charge.jmx'
$out = Join-Path $PSScriptRoot ("resultats\" + (Get-Date -Format 'yyyy-MM-dd_HH-mm'))
New-Item -ItemType Directory -Force $out | Out-Null
# JMeter writes harmless JVM warnings on stderr: they must not stop the script
$ErrorActionPreference = 'Continue'

foreach ($n in $Users) {
    $dir = Join-Path $out "$n-utilisateurs"
    Write-Host "`n=== $n utilisateurs simultanes pendant $Duration s ===" -ForegroundColor Cyan
    & $jmeter -n -t $plan -l "$dir.jtl" -j "$dir.log" -e -o $dir `
        "-Jhost=$TargetHost" "-Jport=$Port" "-Jusers=$n" "-Jrampup=$([math]::Min(10, $n))" "-Jduration=$Duration" 2>&1 |
        Select-String 'summary =|end of run'
}
Write-Host "`nRapports : $out\<n>-utilisateurs\index.html" -ForegroundColor Green
