# Publie Mirador Hotel sur un Space Hugging Face existant (SDK Docker), en une commande.
#
# Usage :  powershell -ExecutionPolicy Bypass -File .\publier.ps1 -Space <pseudo>/<nom> -TokenFile <fichier> -AdminPassword <mdp>
#   -TokenFile : fichier texte contenant un jeton Hugging Face "Write" (hf_...), jamais commite.
#
# Le script : passe le Space en SDK Docker (README), y depose le Dockerfile de ce dossier, et enregistre le secret
# ADMIN_PASSWORD. Le Space se reconstruit alors tout seul (20 a 30 minutes la premiere fois).
param(
    [Parameter(Mandatory)][string]$Space,
    [Parameter(Mandatory)][string]$TokenFile,
    [Parameter(Mandatory)][string]$AdminPassword
)
$ErrorActionPreference = 'Stop'
$token = (Get-Content -Raw $TokenFile).Trim()
$user = $Space.Split('/')[0]
$headers = @{ Authorization = "Bearer $token" }

# 1) secret ADMIN_PASSWORD (avant les fichiers : la construction qui suit le lira)
$body = @{ key = 'ADMIN_PASSWORD'; value = $AdminPassword } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://huggingface.co/api/spaces/$Space/secrets" -Headers $headers `
    -ContentType 'application/json' -Body $body | Out-Null
Write-Host 'Secret ADMIN_PASSWORD enregistre.' -ForegroundColor Green

# 2) README (SDK Docker) + Dockerfile, envoyes par git
$work = Join-Path $env:TEMP "hf-space-$(Get-Random)"
git clone -q "https://${user}:$token@huggingface.co/spaces/$Space" $work
if ($LASTEXITCODE -ne 0) { throw 'Clonage du Space impossible (jeton ou nom du Space incorrect ?).' }
try {
    $title = ($Space.Split('/')[1] -replace '-', ' ')
    $emoji = [char]::ConvertFromUtf32(0x1F3E8)   # hotel ; ecrit ainsi car PowerShell 5.1 lit ce script en ANSI
    $readme = "---`ntitle: $title`nemoji: $emoji`ncolorFrom: yellow`ncolorTo: green`nsdk: docker`napp_port: 7860`npinned: false`n---`n`nMirador Hotel : gestion hoteliere (microservices).`n"
    [IO.File]::WriteAllText((Join-Path $work 'README.md'), $readme, (New-Object Text.UTF8Encoding $false))
    $dockerfile = (Get-Content -Raw (Join-Path $PSScriptRoot 'Dockerfile')) -replace "`r`n", "`n"
    [IO.File]::WriteAllText((Join-Path $work 'Dockerfile'), $dockerfile, (New-Object Text.UTF8Encoding $false))
    Remove-Item (Join-Path $work 'index.html'), (Join-Path $work 'style.css') -ErrorAction SilentlyContinue

    git -C $work add -A
    git -C $work -c user.name=$user -c user.email="$user@users.noreply.huggingface.co" commit -q -m 'Deploy Mirador Hotel (Docker)'
    git -C $work push -q origin main
    if ($LASTEXITCODE -ne 0) { throw 'Envoi des fichiers impossible.' }
} finally {
    Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
}

$url = "https://$($Space.Replace('/', '-').ToLower()).hf.space"
Write-Host "`nC'est parti : le Space se construit (20 a 30 minutes)." -ForegroundColor Green
Write-Host "Suivi : https://huggingface.co/spaces/$Space   Application : $url"
