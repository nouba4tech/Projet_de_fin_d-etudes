# Rend l'application accessible sur Internet depuis CE PC, en une commande, sans compte ni carte bancaire
# (tunnel temporaire Cloudflare "trycloudflare.com").
#
# Usage :   powershell -ExecutionPolicy Bypass -File .\partager-en-ligne.ps1
#
# - Le lien ne fonctionne QUE tant que ce PC est allume, connecte, et que cette fenetre reste ouverte.
# - L'adresse change a chaque lancement.
# - Fermer la fenetre (ou Ctrl+C) coupe le lien.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$front = Join-Path (Split-Path -Parent $root) 'frontend'

function Test-Port([int]$port) {
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}
function Wait-Port([int]$port, [int]$seconds) {
    for ($i = 0; $i -lt $seconds / 2; $i++) { if (Test-Port $port) { return $true }; Start-Sleep 2 }
    return $false
}

Write-Host "`n=== Mirador Hotel : mise en ligne temporaire ===`n" -ForegroundColor Cyan

# 1) les services (gateway sur 8080)
if (-not (Test-Port 8080)) {
    Write-Host 'Demarrage des microservices (environ 1 minute)...'
    & (Join-Path $root 'start-all.ps1') | Out-Null
    if (-not (Wait-Port 8080 180)) { throw 'La gateway (port 8080) ne repond pas. Voir microservices\logs.' }
}
Write-Host 'Microservices : OK' -ForegroundColor Green

# 2) le site (serveur de developpement sur 3000)
if (-not (Test-Port 3000)) {
    Write-Host 'Demarrage du site...'
    Start-Process npm.cmd -ArgumentList 'run', 'dev' -WorkingDirectory $front -WindowStyle Hidden
    if (-not (Wait-Port 3000 60)) { throw 'Le site (port 3000) ne demarre pas. Lance "npm.cmd install" dans le dossier frontend.' }
}
Write-Host 'Site : OK' -ForegroundColor Green

# 3) mot de passe administrateur : le compte noubasra a, par defaut, un mot de passe devinable
Write-Host "`nLe lien sera PUBLIC. Le compte administrateur 'noubasra' a pour mot de passe 'noubasra' : change-le." -ForegroundColor Yellow
$secure = Read-Host "Nouveau mot de passe administrateur (Entree = ne rien changer, deconseille)" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
if ($plain) {
    $esc = $plain.Replace('\', '\\').Replace("'", "''")
    & mysql -u root -e "UPDATE mirador_utilisateurs.utilisateur SET psw = MD5('$esc') WHERE compte = 'noubasra';"
    if ($LASTEXITCODE -ne 0) { throw 'Impossible de changer le mot de passe (MySQL). Rien n est ouvert.' }
    Write-Host "Mot de passe administrateur change." -ForegroundColor Green
} else {
    Write-Host "Mot de passe inchange : n'importe qui avec le lien pourra se connecter en administrateur !" -ForegroundColor Red
}
Write-Host "Les comptes de demonstration (akono, mballa... mot de passe Mirador123) restent actifs." -ForegroundColor Yellow

# 4) l'outil de tunnel (telecharge une fois, signature verifiee)
$tools = Join-Path $root '.tools'
$exe = Join-Path $tools 'cloudflared.exe'
if (-not (Test-Path $exe)) {
    Write-Host "`nTelechargement de cloudflared (une seule fois, environ 55 Mo)..."
    New-Item -ItemType Directory -Force $tools | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile $exe -UseBasicParsing
    $signer = (Get-AuthenticodeSignature $exe).SignerCertificate.Subject
    if ($signer -notlike '*Cloudflare*') { Remove-Item $exe -Force; throw "Signature inattendue ($signer) : fichier supprime." }
}

# 5) le tunnel
$log = Join-Path $tools 'tunnel.log'
Remove-Item $log -ErrorAction SilentlyContinue
$tunnel = Start-Process $exe -ArgumentList 'tunnel', '--url', 'http://localhost:3000', '--no-autoupdate' `
    -WindowStyle Hidden -PassThru -RedirectStandardError $log -RedirectStandardOutput (Join-Path $tools 'tunnel.out')
try {
    $url = $null
    for ($i = 0; $i -lt 30 -and -not $url; $i++) {
        Start-Sleep 2
        if (Test-Path $log) {
            $m = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
            if ($m) { $url = $m.Matches[0].Value }
        }
    }
    if (-not $url) { throw 'Le tunnel ne s est pas ouvert (pas de connexion Internet ?).' }

    # le lien met parfois quelques secondes a etre actif : on attend qu'il reponde vraiment
    Write-Host "`nVerification du lien (jusqu'a 2 minutes)..."
    $ok = $false
    for ($i = 0; $i -lt 40 -and -not $ok; $i++) {
        try { $ok = ((Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15).StatusCode -eq 200) } catch { Start-Sleep 3 }
    }

    Write-Host ''
    if ($ok) {
        Set-Clipboard -Value $url
        Write-Host '  ===========================================================' -ForegroundColor Green
        Write-Host "   LIEN DE L'APPLICATION :  $url" -ForegroundColor Green
        Write-Host '   (copie dans le presse-papiers)' -ForegroundColor Green
        Write-Host '  ===========================================================' -ForegroundColor Green
        Write-Host "  Connexion : utilisateur noubasra + le mot de passe choisi ci-dessus."
    } else {
        Write-Host "Le lien $url n'a pas repondu a temps. Reessaie dans une minute (meme adresse), ou relance ce script." -ForegroundColor Red
    }
    Write-Host "`nGARDE CETTE FENETRE OUVERTE. Ctrl+C ou fermeture = le lien est coupe.`n"
    Wait-Process -Id $tunnel.Id
} finally {
    if ($tunnel -and -not $tunnel.HasExited) { Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue }
}
