# Builds (if needed) and starts the 11 microservices + the gateway as background processes.
# Usage:  .\start-all.ps1 [-Rebuild]      Stop with:  .\stop-all.ps1
param([switch]$Rebuild)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# Optional local settings (e.g. a remote database such as TiDB Cloud): KEY=VALUE lines of .env (never committed)
# become environment variables of the services. Remove or rename .env to go back to the local MySQL.
if (Test-Path .env) {
    Get-Content .env | Where-Object { $_ -match '^\s*[A-Za-z_][A-Za-z0-9_]*\s*=' } | ForEach-Object {
        $name, $value = $_ -split '=', 2
        Set-Item -Path "Env:$($name.Trim())" -Value $value.Trim()
    }
    Write-Host "Configuration chargee depuis .env (base : $env:MYSQL_HOST)"
}

$modules = @(
    @{ Name = 'utilisateurs-service'; Port = 8081 },
    @{ Name = 'chambres-service'; Port = 8082 },
    @{ Name = 'clients-service'; Port = 8083 },
    @{ Name = 'reservations-service'; Port = 8084 },
    @{ Name = 'paiements-service'; Port = 8085 },
    @{ Name = 'facturation-service'; Port = 8086 },
    @{ Name = 'personnel-service'; Port = 8087 },
    @{ Name = 'promotions-service'; Port = 8088 },
    @{ Name = 'avis-service'; Port = 8089 },
    @{ Name = 'notifications-service'; Port = 8090 },
    @{ Name = 'exploitation-service'; Port = 8091 },
    @{ Name = 'api-gateway'; Port = 8080 }
)

if ($Rebuild -or -not (Test-Path 'api-gateway\target\api-gateway.jar')) {
    Write-Host 'Building all modules...'
    & .\mvnw.cmd -q -DskipTests package
    if ($LASTEXITCODE -ne 0) { throw 'Maven build failed' }
}

New-Item -ItemType Directory -Force logs | Out-Null
Remove-Item .pids -ErrorAction SilentlyContinue

# small heaps: 12 JVMs run side by side on a development machine
$jvm = @('-Xms48m', '-Xmx192m', '-XX:+UseSerialGC', '-XX:TieredStopAtLevel=1')

foreach ($m in $modules) {
    $busy = Get-NetTCPConnection -LocalPort $m.Port -State Listen -ErrorAction SilentlyContinue
    if ($busy) { throw "Port $($m.Port) already in use (needed by $($m.Name)). Stop the old process first." }
    $jar = "$($m.Name)\target\$($m.Name).jar"
    $p = Start-Process java -ArgumentList ($jvm + @('-jar', $jar)) -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput "logs\$($m.Name).log" -RedirectStandardError "logs\$($m.Name).err.log"
    "$($m.Name)=$($p.Id)" | Add-Content .pids
    Write-Host ("Started {0,-22} port {1}  (pid {2})" -f $m.Name, $m.Port, $p.Id)
}
Write-Host "`nGateway: http://localhost:8080   Logs: .\logs   (give the services ~40 s to finish starting)"
