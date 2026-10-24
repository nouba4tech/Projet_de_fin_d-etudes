# End-to-end smoke test of the whole system through the API gateway.
# Usage:  .\smoke-test.ps1 [-Gateway http://localhost:8080]
# It CREATES test data (client, reservation, invoice, payments, promo, reviews, notifications, shift) tagged SMOKE.
# The saga compensation scenario needs the payment service started with PAIEMENTS_SAGA_FAULT_INJECTION=true;
# otherwise that single scenario is reported as skipped.
param([string]$Gateway = 'http://localhost:8080')
$ErrorActionPreference = 'Stop'
$script:pass = 0; $script:fail = 0
$ts = [DateTimeOffset]::Now.ToUnixTimeSeconds()

function Read-Utf8([System.IO.Stream]$stream) {
    $ms = New-Object System.IO.MemoryStream; $stream.CopyTo($ms)
    return [Text.Encoding]::UTF8.GetString($ms.ToArray())
}
function Call([string]$Method, [string]$Path, $Body = $null, [string]$Token = $null, [string]$Base = $Gateway) {
    $headers = @{}
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }
    $req = @{ Uri = "$Base$Path"; Method = $Method; Headers = $headers; UseBasicParsing = $true }
    if ($null -ne $Body) {
        $req['ContentType'] = 'application/json; charset=utf-8'
        $req['Body'] = [Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 8 -Compress))
    }
    try {
        $r = Invoke-WebRequest @req
        $text = Read-Utf8 $r.RawContentStream; $code = [int]$r.StatusCode
    } catch [System.Net.WebException] {
        if (-not $_.Exception.Response) { return @{ Status = 0; Body = $null; Text = $_.Exception.Message } }
        $code = [int]$_.Exception.Response.StatusCode
        $text = Read-Utf8 $_.Exception.Response.GetResponseStream()
    }
    $json = $null
    if ($text -and ($text.TrimStart().StartsWith('{') -or $text.TrimStart().StartsWith('['))) { $json = $text | ConvertFrom-Json }
    return @{ Status = $code; Body = $json; Text = $text }
}
function Check([string]$Name, [bool]$Condition, [string]$Detail = '') {
    if ($Condition) { $script:pass++; Write-Host "  [ OK ] $Name" -ForegroundColor Green }
    else { $script:fail++; Write-Host "  [FAIL] $Name  $Detail" -ForegroundColor Red }
}
function Section([string]$t) { Write-Host "`n== $t" -ForegroundColor Cyan }

Section 'Utilisateurs / securite'
$login = Call POST '/api/auth/login' @{ username = 'noubasra'; password = 'noubasra' }
Check 'login admin' ($login.Status -eq 200 -and $login.Body.token) "status=$($login.Status)"
$T = $login.Body.token
$demo = (Call POST '/api/auth/login' @{ username = 'akono'; password = 'Mirador123' }).Status
if ($demo -eq 401) {
    # the demo accounts are locked (random password) whenever the app is exposed publicly
    Write-Host '  [SKIP] login utilisateur de demo (akono) : comptes de demonstration verrouilles' -ForegroundColor Yellow
} else {
    Check 'login utilisateur de demo (akono)' ($demo -eq 200) "status=$demo"
}
Check 'mauvais mot de passe -> 401' ((Call POST '/api/auth/login' @{ username = 'noubasra'; password = 'x' }).Status -eq 401)
Check 'route metier sans token -> 403' ((Call GET '/api/clients').Status -eq 403)
Check '/internal non expose par la gateway' ((Call GET '/internal/clients/count').Status -eq 404)
Check '/internal sans jeton refuse (acces direct)' ((Call GET '/internal/clients/count' $null $null 'http://localhost:8083').Status -eq 403)

Section 'Lecture des 11 services (GET 200)'
$gets = '/api/security/users','/api/chambres','/api/clients','/api/reservations','/api/visits','/api/paiements','/api/finances/transactions',
  '/api/cash/registers','/api/factures','/api/factures/stats','/api/accounting/accounts','/api/employees','/api/planning',
  '/api/promotions','/api/avis','/api/avis/public','/api/avis/public/summary','/api/notifications','/api/notifications/templates',
  '/api/stock/items','/api/fournisseurs','/api/restaurant/orders','/api/bar/products','/api/services','/api/main-courante',
  '/api/dashboard','/api/dashboard/revenue-chart','/api/parametres/room-types','/api/parametres/rooms','/api/parametres/clients',
  '/api/parametres/personnel','/api/parametres/cash-registers','/api/parametres/suppliers','/api/parametres/services','/api/parametres/parameters'
foreach ($p in $gets) {
    $tok = $T; if ($p -like '/api/avis/public*') { $tok = $null }   # public endpoints must work without a token
    $r = Call GET $p $null $tok
    Check "GET $p" ($r.Status -eq 200) "status=$($r.Status)"
}
$dash = (Call GET '/api/dashboard' $null $T).Body
Check 'tableau de bord : chiffres composes depuis 5 services' ($dash.totalRooms -gt 0 -and $null -ne $dash.revenueToday -and $dash.activeClients -gt 0)

Section 'Promotions'
$code = "SMOKE$ts"
$promo = Call POST '/api/promotions' @{ code = $code; label = 'Smoke test -10%'; discountType = 'PERCENT'; discountValue = 10; minAmount = 0;
    startDate = (Get-Date).AddDays(-1).ToString('yyyy-MM-dd'); endDate = (Get-Date).AddDays(30).ToString('yyyy-MM-dd'); usageLimit = 5 } $T
Check 'creer une promotion' ($promo.Status -eq 201) "status=$($promo.Status) $($promo.Text)"
$promoId = $promo.Body.id
Check 'code en double -> 409' ((Call POST '/api/promotions' @{ code = $code; label = 'x'; discountType = 'FIXED'; discountValue = 1; startDate = '2026-01-01'; endDate = '2026-12-31' } $T).Status -eq 409)
Check 'pourcentage > 100 -> 400' ((Call POST '/api/promotions' @{ code = "BAD$ts"; label = 'x'; discountType = 'PERCENT'; discountValue = 150; startDate = '2026-01-01'; endDate = '2026-12-31' } $T).Status -eq 400)
$v = Call POST '/api/promotions/validate' @{ code = $code; amount = 100000 } $T
Check 'validate : remise de 10 000 sur 100 000' ($v.Body.valid -and [decimal]$v.Body.discount -eq 10000 -and [decimal]$v.Body.finalAmount -eq 90000)
Check 'validate : code inconnu -> invalide' (-not (Call POST '/api/promotions/validate' @{ code = 'NOPE'; amount = 1000 } $T).Body.valid)

Section 'Clients -> Facturation (compte client 411 ouvert chez facturation)'
$client = Call POST '/api/clients' @{ firstName = 'Smoke'; lastName = "Test$ts"; phone = "+23769$($ts.ToString().Substring(3))"; email = "smoke$ts@test.cm"; clientType = 'Personne physique' } $T
Check 'creer un client' ($client.Status -eq 201) "status=$($client.Status) $($client.Text)"
$clientId = $client.Body.id
$acc = & mysql -u root -N -e "select count(*) from mirador_facturation.lescompte where libelle_compte like '%Test$ts%'" 2>$null
Check 'le compte comptable du client existe dans mirador_facturation' ($acc -eq '1') "count=$acc"

Section 'Reservations (+ promo, facture, notification)'
# a different far-future window on every run, so the test can be re-run without room conflicts
$off = 400 + ([int][math]::Floor($ts / 4) % 8000)
$ci = (Get-Date).AddDays($off).ToString('yyyy-MM-dd'); $co = (Get-Date).AddDays($off + 3).ToString('yyyy-MM-dd')
$resv = Call POST '/api/reservations' @{ clientId = $clientId; roomId = '101'; checkIn = $ci; checkOut = $co; status = 'En attente'; totalAmount = 100000;
    occupantFirstName = 'Smoke'; occupantLastName = "Test$ts"; promoCode = $code } $T
Check 'creer une reservation avec code promo' ($resv.Status -eq 201) "status=$($resv.Status) $($resv.Text)"
$resId = $resv.Body.id
Check 'montant remise : 90 000' ([decimal]$resv.Body.totalAmount -eq 90000) "montant=$($resv.Body.totalAmount)"
Check 'reservation enrichie par clients/chambres (nom du client)' ($resv.Body.clientName -like '*Smoke*')
Check 'chambre deja prise sur la periode -> 409' ((Call POST '/api/reservations' @{ clientId = $clientId; roomId = '101'; checkIn = $ci; checkOut = $co; occupantFirstName = 'A'; occupantLastName = 'B' } $T).Status -eq 409)
Check 'depart avant arrivee -> 400' ((Call POST '/api/reservations' @{ clientId = $clientId; roomId = '102'; checkIn = $co; checkOut = $ci; occupantFirstName = 'A'; occupantLastName = 'B'; totalAmount = 1 } $T).Status -eq 400)
Check 'supprimer un client qui a des reservations -> 409' ((Call DELETE "/api/clients/$clientId" $null $T).Status -eq 409)
Check 'supprimer une chambre reservee -> 409' ((Call DELETE '/api/chambres/101' $null $T).Status -eq 409)
Check 'client inconnu -> 404' ((Call POST '/api/reservations' @{ clientId = 99999999; roomId = '102'; checkIn = $ci; checkOut = $co; occupantFirstName = 'A'; occupantLastName = 'B'; totalAmount = 1 } $T).Status -eq 404)
Check 'la promotion a ete consommee (usedCount = 1)' ((Call GET "/api/promotions/$promoId" $null $T).Body.usedCount -eq 1)
$inv = (Call GET "/api/factures?clientId=$clientId" $null $T).Body | Select-Object -First 1
Check 'une facture a ete creee chez facturation (90 000, EMISE)' ($inv -and [decimal]$inv.net -eq 90000 -and $inv.status -eq 'EMISE')
$invCode = $inv.code
$notes = (Call GET '/api/notifications?limit=200' $null $T).Body | Where-Object { $_.referenceKey -eq "RES-$resId" }
Check 'confirmation de reservation envoyee (e-mail + SMS)' (($notes | Measure-Object).Count -eq 2) "n=$(($notes | Measure-Object).Count)"

Section 'Paiements : Saga'
$p1 = Call POST '/api/paiements' @{ invoiceCode = $invCode; amount = 30000; method = 'CARTE' } $T
Check 'paiement partiel 30 000 -> COMPLETED' ($p1.Status -eq 201 -and $p1.Body.status -eq 'COMPLETED') "status=$($p1.Status) $($p1.Text)"
Check 'saga : 5 etapes DONE' ((($p1.Body.saga.steps | Where-Object { $_.status -eq 'DONE' }) | Measure-Object).Count -eq 5)
$i1 = (Call GET "/api/factures/$invCode" $null $T).Body
Check 'facture PARTIELLEMENT_PAYEE, reste 60 000' ($i1.status -eq 'PARTIELLEMENT_PAYEE' -and [decimal]$i1.remaining -eq 60000)
Check 'reservation inchangee apres un paiement partiel' ((Call GET "/api/reservations/$resId" $null $T).Body.status -eq 'En attente')

$p2 = Call POST '/api/paiements' @{ invoiceCode = $invCode; amount = 100000; method = 'ESPECES' } $T
Check 'surpaiement refuse (422 FAILED, etape VALIDATE_INVOICE)' ($p2.Status -eq 422 -and $p2.Body.status -eq 'FAILED' -and $p2.Body.failureReason -like '*VALIDATE_INVOICE*') "status=$($p2.Status)"
Check 'surpaiement : facture inchangee' ([decimal](Call GET "/api/factures/$invCode" $null $T).Body.totalPaid -eq 30000)
Check 'mode de paiement inconnu -> 400' ((Call POST '/api/paiements' @{ invoiceCode = $invCode; amount = 10; method = 'TROC' } $T).Status -eq 400)
Check 'facture inconnue -> 422' ((Call POST '/api/paiements' @{ invoiceCode = 'NOPE'; amount = 10; method = 'ESPECES' } $T).Status -eq 422)

$p3 = Call POST '/api/paiements' @{ invoiceCode = $invCode; amount = 60000; method = 'VIREMENT'; simulateFailureAt = 'CONFIRM_RESERVATION' } $T
if ($p3.Body.status -eq 'COMPLETED') {
    Write-Host '  [SKIP] compensation du Saga (injection de panne desactivee sur paiements-service)' -ForegroundColor Yellow
    $skippedCompensation = $true
    # the payment went through for real: the invoice is now fully paid, the next step is skipped accordingly
} else {
    Check 'panne simulee a CONFIRM_RESERVATION -> 422 FAILED' ($p3.Status -eq 422 -and $p3.Body.status -eq 'FAILED') "status=$($p3.Status)"
    $st = @{}; $p3.Body.saga.steps | ForEach-Object { $st[$_.name] = $_.status }
    Check 'saga : REGISTER_PAYMENT_ON_INVOICE et RECORD_FINANCE_TRANSACTION COMPENSATED' ($st['REGISTER_PAYMENT_ON_INVOICE'] -eq 'COMPENSATED' -and $st['RECORD_FINANCE_TRANSACTION'] -eq 'COMPENSATED') ($st | Out-String)
    Check 'saga : etape en echec = CONFIRM_RESERVATION' ($st['CONFIRM_RESERVATION'] -eq 'FAILED')
    Check 'saga terminee en COMPENSATED' ($p3.Body.saga.status -eq 'COMPENSATED')
    Check 'compensation : facture revenue a 30 000 paye' ([decimal](Call GET "/api/factures/$invCode" $null $T).Body.totalPaid -eq 30000)
    $fin = (Call GET '/api/finances/transactions' $null $T).Body | Where-Object { $_.reference -eq $p3.Body.reference }
    Check 'compensation : aucune ecriture financiere restante' (($fin | Measure-Object).Count -eq 0)
    Check 'compensation : reservation toujours En attente' ((Call GET "/api/reservations/$resId" $null $T).Body.status -eq 'En attente')
}

$p4 = Call POST '/api/paiements' @{ invoiceCode = $invCode; amount = 60000; method = 'VIREMENT' } $T
if ($skippedCompensation) {
    Check 'facture deja soldee par le paiement precedent -> 422' ($p4.Status -eq 422)
    $p4 = $p3
} else {
    Check 'solde du reste 60 000 -> COMPLETED' ($p4.Status -eq 201 -and $p4.Body.status -eq 'COMPLETED') "status=$($p4.Status) $($p4.Text)"
}
$i2 = (Call GET "/api/factures/$invCode" $null $T).Body
Check 'facture PAYEE' ($i2.status -eq 'PAYEE' -and $i2.paid)
Check 'reservation passee a Confirmee (via le Saga)' ((Call GET "/api/reservations/$resId" $null $T).Body.status -like 'Confirm*')
$fin2 = (Call GET '/api/finances/transactions' $null $T).Body | Where-Object { $_.reference -eq $p4.Body.reference }
Check 'ecriture financiere (Recette) enregistree' (($fin2 | Measure-Object).Count -eq 1)
Check 'historique des paiements de la facture' (((Call GET "/api/paiements?invoiceCode=$invCode" $null $T).Body | Measure-Object).Count -ge 3)
Check 'journal de saga consultable' (((Call GET "/api/paiements/$($p4.Body.id)/saga" $null $T).Body.steps | Measure-Object).Count -ge 5)
Check 'recus de paiement envoyes' ((((Call GET '/api/notifications?limit=200' $null $T).Body | Where-Object { $_.templateCode -eq 'PAYMENT_RECEIPT' -and $_.referenceKey -eq $p4.Body.reference }) | Measure-Object).Count -eq 2)

Section 'Facturation : document, archivage, suivi'
$doc = Call GET "/api/factures/$invCode/document" $null $T
Check 'document imprimable (HTML)' ($doc.Status -eq 200 -and $doc.Text -like "*$invCode*" -and $doc.Text -like '*MIRADOR*')
$unpaid = (Call GET '/api/factures?status=EMISE' $null $T).Body | Select-Object -First 1
if ($unpaid) { Check 'archiver une facture non soldee -> 409' ((Call POST "/api/factures/$($unpaid.code)/archive" $null $T).Status -eq 409) }
Check 'archiver la facture soldee' ((Call POST "/api/factures/$invCode/archive" $null $T).Body.status -eq 'ARCHIVEE')
Check 'archiver deux fois -> 409' ((Call POST "/api/factures/$invCode/archive" $null $T).Status -eq 409)
Check 'payer une facture archivee refuse (422)' ((Call POST '/api/paiements' @{ invoiceCode = $invCode; amount = 1; method = 'ESPECES' } $T).Status -eq 422)
$trk = (Call GET "/api/factures/$invCode/suivi" $null $T).Body
$types = @($trk.events | ForEach-Object { $_.type })
Check 'suivi : CREATED, PAYMENT, ARCHIVED' (($types -contains 'CREATED') -and ($types -contains 'PAYMENT') -and ($types -contains 'ARCHIVED')) ($types -join ',')
Check 'statistiques de facturation' ((Call GET '/api/factures/stats' $null $T).Body.total -gt 0)

Section 'Avis'
Check 'note 6 -> 400' ((Call POST '/api/avis' @{ clientId = $clientId; rating = 6 } $T).Status -eq 400)
Check 'client inconnu -> 404' ((Call POST '/api/avis' @{ clientId = 99999999; rating = 5 } $T).Status -eq 404)
Check 'sejour non termine -> 400' ((Call POST '/api/avis' @{ clientId = $clientId; reservationId = $resId; rating = 5 } $T).Status -eq 400)
$a1 = Call POST '/api/avis' @{ clientId = $clientId; rating = 5; title = "SMOKE $ts"; comment = 'Excellent sejour, personnel adorable.' } $T
Check 'collecte : avis cree EN_ATTENTE' ($a1.Status -eq 201 -and $a1.Body.status -eq 'EN_ATTENTE' -and -not $a1.Body.flagged)
$a2 = Call POST '/api/avis' @{ clientId = $clientId; rating = 1; title = 'SMOKE spam'; comment = "C'est une arnaque" } $T
Check 'mot interdit -> avis signale (flagged)' ($a2.Body.flagged -eq $true)
$pub = (Call GET '/api/avis/public?limit=100').Body
Check 'public : un avis en attente n est pas visible' (-not ($pub | Where-Object { $_.title -eq "SMOKE $ts" }))
Check 'moderation : approuver' ((Call PUT "/api/avis/$($a1.Body.id)/moderation" @{ decision = 'APPROUVE'; comment = 'ok' } $T).Body.status -eq 'APPROUVE')
Check 'moderation : rejouer -> 409' ((Call PUT "/api/avis/$($a1.Body.id)/moderation" @{ decision = 'REJETE' } $T).Status -eq 409)
Check 'moderation : decision invalide -> 400' ((Call PUT "/api/avis/$($a2.Body.id)/moderation" @{ decision = 'PEUT-ETRE' } $T).Status -eq 400)
Check 'moderation : rejeter l avis signale' ((Call PUT "/api/avis/$($a2.Body.id)/moderation" @{ decision = 'REJETE'; comment = 'injurieux' } $T).Body.status -eq 'REJETE')
$pub2 = (Call GET '/api/avis/public?limit=100').Body
$mine = $pub2 | Where-Object { $_.title -eq "SMOKE $ts" }
Check 'public : l avis approuve apparait, prenom seul, sans clientId' ($mine -and $mine.author -eq 'Smoke' -and ($mine.PSObject.Properties.Name -notcontains 'clientId'))
Check 'public : l avis rejete n apparait pas' (-not ($pub2 | Where-Object { $_.title -eq 'SMOKE spam' }))
$sum = (Call GET '/api/avis/public/summary').Body
Check 'synthese des notes (moyenne, repartition)' ($sum.count -gt 0 -and $sum.average -ge 1 -and $sum.distribution)

Section 'Notifications'
$n1 = Call POST '/api/notifications' @{ channel = 'EMAIL'; recipient = "smoke$ts@test.cm"; templateCode = 'PAYMENT_RECEIPT'; referenceKey = "SMOKE-$ts";
    variables = @{ name = 'Smoke'; amount = '1000'; method = 'ESPECES'; invoice = 'X'; reference = 'R' } } $T
Check 'envoi manuel via un modele -> 201 SENT' ($n1.Status -eq 201 -and $n1.Body.status -eq 'SENT' -and $n1.Body.body -notlike '*{{*')
$n2 = Call POST '/api/notifications' @{ channel = 'EMAIL'; recipient = "smoke$ts@test.cm"; templateCode = 'PAYMENT_RECEIPT'; referenceKey = "SMOKE-$ts" } $T
Check 'meme reference -> 200 et meme notification (idempotence)' ($n2.Status -eq 200 -and $n2.Body.id -eq $n1.Body.id)
Check 'modele inconnu -> 400' ((Call POST '/api/notifications' @{ channel = 'EMAIL'; recipient = 'a@b.cm'; templateCode = 'NOPE' } $T).Status -eq 400)
Check 'e-mail invalide -> 400' ((Call POST '/api/notifications' @{ channel = 'EMAIL'; recipient = 'pas-un-email'; subject = 's'; body = 'b' } $T).Status -eq 400)
Check 'canal inconnu -> 400' ((Call POST '/api/notifications' @{ channel = 'PIGEON'; recipient = 'x'; body = 'b' } $T).Status -eq 400)
Check 'renvoyer une notification SENT -> 409' ((Call POST "/api/notifications/$($n1.Body.id)/retry" $null $T).Status -eq 409)
$rem = Call POST '/api/notifications/reminders/run' $null $T
Check 'rappels d arrivee (job manuel)' ($rem.Status -eq 200 -and $null -ne $rem.Body.reservations) "status=$($rem.Status) $($rem.Text)"

Section 'Personnel : plannings'
$emp = (Call GET '/api/employees' $null $T).Body | Select-Object -First 1
$day = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
$s1 = Call POST "/api/employees/$($emp.id)/planning" @{ date = $day; startTime = '08:00:00'; endTime = '12:00:00'; post = 'Reception SMOKE' } $T
Check 'creer un creneau' ($s1.Status -eq 201 -and $s1.Body.hours -eq 4) "status=$($s1.Status) $($s1.Text)"
Check 'creneau chevauchant -> 409' ((Call POST "/api/employees/$($emp.id)/planning" @{ date = $day; startTime = '10:00:00'; endTime = '14:00:00'; post = 'x' } $T).Status -eq 409)
Check 'fin avant debut -> 400' ((Call POST "/api/employees/$($emp.id)/planning" @{ date = $day; startTime = '12:00:00'; endTime = '08:00:00'; post = 'x' } $T).Status -eq 400)
Check 'employe inconnu -> 404' ((Call POST '/api/employees/99999999/planning' @{ date = $day; startTime = '08:00:00'; endTime = '09:00:00'; post = 'x' } $T).Status -eq 404)
Check 'creneau adjacent accepte' ((Call POST "/api/employees/$($emp.id)/planning" @{ date = $day; startTime = '12:00:00'; endTime = '14:00:00'; post = 'Reception SMOKE' } $T).Status -eq 201)
Check 'planning de l employe' ((((Call GET "/api/planning?employeeId=$($emp.id)&from=$day&to=$day" $null $T).Body) | Measure-Object).Count -ge 2)
foreach ($s in (Call GET "/api/planning?employeeId=$($emp.id)&from=$day&to=$day" $null $T).Body) { [void](Call DELETE "/api/planning/$($s.id)" $null $T) }

Section 'Chambres : disponibilites'
$free = (Call GET "/api/chambres/disponibles?from=$ci&to=$co" $null $T).Body
Check 'recherche de chambres libres sur la periode' ($free.Count -gt 0)
Check 'la chambre reservee (101) n est pas proposee' (-not ($free | Where-Object { $_.number -eq '101' }))
Check 'periode invalide -> 400' ((Call GET "/api/chambres/disponibles?from=$co&to=$ci" $null $T).Status -eq 400)

Section 'Reservations : annulation'
$r2 = Call POST '/api/reservations' @{ clientId = $clientId; roomId = '102'; checkIn = $ci; checkOut = $co; status = 'En attente'; totalAmount = 50000;
    occupantFirstName = 'Smoke'; occupantLastName = "Annul$ts" } $T
Check 'reservation a annuler creee' ($r2.Status -eq 201) "status=$($r2.Status) $($r2.Text)"
Check '102 n est plus libre' (-not ((Call GET "/api/chambres/disponibles?from=$ci&to=$co" $null $T).Body | Where-Object { $_.number -eq '102' }))
$c2 = Call POST "/api/reservations/$($r2.Body.id)/annulation" @{ reason = 'Changement de dates' } $T
Check 'annulation -> statut Annulee' ($c2.Status -eq 200 -and $c2.Body.status -like 'Annul*') "status=$($c2.Status) $($c2.Text)"
$inv2 = (Call GET "/api/factures?clientId=$clientId" $null $T).Body | Where-Object { [decimal]$_.net -eq 50000 } | Select-Object -First 1
Check 'sa facture est ANNULEE' ($inv2.status -eq 'ANNULEE') "statut=$($inv2.status)"
Check 'la chambre 102 redevient libre' ([bool]((Call GET "/api/chambres/disponibles?from=$ci&to=$co" $null $T).Body | Where-Object { $_.number -eq '102' }))
Check 'annuler deux fois -> 409' ((Call POST "/api/reservations/$($r2.Body.id)/annulation" @{ reason = 'x' } $T).Status -eq 409)
Check 'annuler une reservation deja payee -> 409' ((Call POST "/api/reservations/$resId/annulation" @{ reason = 'x' } $T).Status -eq 409)
Check 'le client est prevenu de l annulation' ((((Call GET '/api/notifications?limit=200' $null $T).Body | Where-Object { $_.templateCode -eq 'RESERVATION_CANCELLATION' -and $_.referenceKey -eq "RES-$($r2.Body.id)-ANNULATION" }) | Measure-Object).Count -eq 2)

Section 'Clients : historique et fidelite'
$h = (Call GET "/api/clients/$clientId/historique" $null $T).Body
Check 'historique : 2 reservations dont 1 annulee' ($h.reservations -eq 2 -and $h.cancelled -eq 1) "reservations=$($h.reservations) annulees=$($h.cancelled)"
$f = (Call GET "/api/clients/$clientId/fidelite" $null $T).Body
Check 'fidelite : nouveau client au niveau BRONZE' ($f.tier -eq 'BRONZE' -and $f.points -eq 0 -and $f.nextTier -eq 'ARGENT')
$best = (Call GET '/api/clients' $null $T).Body | ForEach-Object { (Call GET "/api/clients/$($_.id)/fidelite" $null $T).Body } | Sort-Object points -Descending | Select-Object -First 1
Check 'fidelite : un client avec des sejours passes a des points' ($best.points -gt 0) "max points=$($best.points) ($($best.clientName), $($best.tier))"
Check 'client inconnu -> 404' ((Call GET '/api/clients/99999999/fidelite' $null $T).Status -eq 404)

Section 'Utilisateurs : roles appliques par le serveur'
$rec = "smokerec$ts"
& mysql -u root -e "INSERT INTO mirador_utilisateurs.utilisateur (compte, psw, nom, prenom, code_groupe, statut) VALUES ('$rec', MD5('Rec-$ts'), 'SMOKE', 'Reception', 28, 'Actif'); INSERT INTO mirador_utilisateurs.app_user_profile (code_user, role_name) SELECT code_user, 'Reception' FROM mirador_utilisateurs.utilisateur WHERE compte = '$rec';" 2>$null
$R = (Call POST '/api/auth/login' @{ username = $rec; password = "Rec-$ts" }).Body.token
Check 'connexion d un compte Reception' ([bool]$R)
Check 'Reception : liste des utilisateurs -> 403' ((Call GET '/api/security/users' $null $R).Status -eq 403)
Check 'Reception : creer un employe -> 403' ((Call POST '/api/employees' @{ firstName = 'x' } $R).Status -eq 403)
Check 'Reception : ecriture financiere -> 403' ((Call POST '/api/finances/transactions' @{ amount = 1 } $R).Status -eq 403)
Check 'Reception : creer un client -> autorise' ((Call POST '/api/clients' @{ firstName = 'Rec'; lastName = "Smoke$ts"; clientType = 'Personne physique' } $R).Status -eq 201)
Check 'Reception : lecture des factures -> autorisee' ((Call GET '/api/factures' $null $R).Status -eq 200)
Check 'Reception : operation comptable (ecran Reception) -> pas bloquee' ((Call POST '/api/accounting/sqlite/operations' @{} $R).Status -ne 403)
Check 'Reception : mouvement de stock (ecran Reception) -> pas bloque' ((Call POST '/api/stock/movements' @{} $R).Status -ne 403)
Check 'Reception : changer son mot de passe -> pas bloque' ((Call POST '/api/security/change-password' @{ currentPassword = 'faux'; newPassword = 'x'; confirmPassword = 'x' } $R).Status -ne 403)
Check 'Admin : liste des utilisateurs -> 200' ((Call GET '/api/security/users' $null $T).Status -eq 200)
& mysql -u root -D mirador_utilisateurs -e "DELETE p FROM mirador_utilisateurs.app_user_profile p JOIN mirador_utilisateurs.utilisateur u ON u.code_user = p.code_user WHERE u.compte = '$rec'; DELETE FROM mirador_utilisateurs.utilisateur WHERE compte = '$rec';" 2>$null

Section 'Nettoyage'
Check 'supprimer la promotion de test' ((Call DELETE "/api/promotions/$promoId" $null $T).Status -eq 204)

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "Reussis : $script:pass   Echecs : $script:fail" -ForegroundColor $(if ($script:fail -eq 0) { 'Green' } else { 'Red' })
if ($skippedCompensation) { Write-Host '(compensation du Saga non verifiee : injection de panne desactivee)' -ForegroundColor Yellow }
exit $(if ($script:fail -eq 0) { 0 } else { 1 })
