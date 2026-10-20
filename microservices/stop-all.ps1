# Stops the processes started by start-all.ps1.
Set-Location $PSScriptRoot
if (-not (Test-Path .pids)) { Write-Host 'No .pids file.'; exit 0 }
foreach ($line in Get-Content .pids) {
    $name, $id = $line -split '='
    Stop-Process -Id ([int]$id) -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped $name ($id)"
}
Remove-Item .pids
