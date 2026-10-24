# Mirador Hôtel – architecture microservices

Le monolithe `../backend` est conservé intact (retour arrière possible). Cette version le découpe en **11 services
métier + une API Gateway**. Le frontend ne change pas : il appelle toujours `/api/...` sur le port **8080**.

```
 frontend :3000 ──► api-gateway :8080 ─┬─► utilisateurs-service  :8081  (mirador_utilisateurs)
                                       ├─► chambres-service      :8082  (mirador_chambres)
                                       ├─► clients-service       :8083  (mirador_clients)
                                       ├─► reservations-service  :8084  (mirador_reservations)
                                       ├─► paiements-service     :8085  (mirador_paiements)    ← Saga
                                       ├─► facturation-service   :8086  (mirador_facturation)
                                       ├─► personnel-service     :8087  (mirador_personnel)
                                       ├─► promotions-service    :8088  (mirador_promotions)
                                       ├─► avis-service          :8089  (mirador_avis)
                                       ├─► notifications-service :8090  (mirador_notifications)
                                       └─► exploitation-service  :8091  (mirador_exploitation)
```

## Écrans du frontend

Les services récents ont leur écran dans le menu (droits d'accès par rôle, voir `utils/accessControl.ts` et `RoleAccess`) :

| Écran | Route | Service |
|---|---|---|
| Factures et paiements (document, suivi, encaissement avec déroulé du Saga, archivage) | `#/invoices` | facturation + paiements |
| Promotions (CRUD, simulation d'un code) | `#/promotions` | promotions |
| Avis des clients (file de modération, note moyenne, répartition) | `#/reviews` | avis |
| Notifications (historique, envoi manuel, renvoi, rappels d'arrivée) | `#/notifications` | notifications |
| Planning du personnel (vue hebdomadaire, ajout/modification de créneaux) | `#/planning` | personnel |

> Ces écrans compilent (`npm run build`) et utilisent les mêmes routes API que `smoke-test.ps1` vérifie, mais
> **ils n'ont pas été parcourus à la main dans un navigateur**.

## Les 10 services du schéma + 1

| Service | Rôle | Routes `/api/...` |
|---|---|---|
| **chambres** | catalogue, types, tarifs, statut ; **recherche des chambres libres** sur une période (`GET /chambres/disponibles?from&to&capacite`) | `chambres`, `parametres/room-types`, `parametres/rooms` |
| **clients** | profils, compte client, **historique** (`GET /clients/{id}/historique`) et **fidélité** (`GET /clients/{id}/fidelite` : 1 point / 1 000 FCFA de séjours réalisés, niveaux Bronze → Argent 100 → Or 500 → Platine 1 500) | `clients`, `parametres/clients` |
| **réservations** | création, modification, **annulation** (`POST /reservations/{id}/annulation` : facture annulée, chambre libérée, client prévenu ; refusée si déjà payée ou terminée), occupants, visites, code promo | `reservations`, `visits` |
| **paiements** | transactions, caisses, **Saga de paiement** | `paiements`, `finances`, `cash` |
| **facturation** | génération (document imprimable), archivage, suivi, comptabilité | `factures`, `accounting`, `comptabilite`, `parametres/cash-registers` |
| **utilisateurs** | authentification, rôles **appliqués par le serveur** (voir « Rôles » plus bas) | `auth`, `security` |
| **personnel** | employés et **plannings** | `employees`, `planning`, `parametres/personnel` |
| **promotions** | offres tarifaires, codes promo | `promotions` |
| **avis** | collecte, **modération**, affichage public | `avis` (`avis/public` sans token) |
| **notifications** | e-mails, SMS, rappels | `notifications` |
| **exploitation** *(11ᵉ, hors schéma)* | stock, restaurant, bar, fournisseurs, main courante, services client, tableau de bord | `stock`, `restaurant`, `bar`, `fournisseurs`, `services`, `main-courante`, `dashboard`, `parametres/(suppliers\|services\|parameters)` |

*exploitation* regroupe les modules qui existaient déjà dans l'application et n'ont pas de place dans les 10 services
du schéma ; les supprimer aurait cassé des écrans. Pour présenter strictement 10 services, on peut l'annoncer comme
« services support » ou le fusionner ailleurs.

Chaque service a **sa propre base MySQL** (même serveur) : aucune jointure SQL entre services. Le module `common`
partage le JWT (même secret → un token est valable partout), la sécurité, les erreurs et le client inter-services.

## Rôles (contrôlés par chaque service)

Le rôle est lu dans le JWT. **Toute lecture (GET) est permise à un utilisateur connecté**, sauf le module sécurité.
Les écritures (POST/PUT/PATCH/DELETE) sont réservées :

| Domaine | Admin | Comptable | Réception |
|---|---|---|---|
| sécurité (utilisateurs, groupes, sauvegardes) — lecture comprise | ✓ | | |
| paramètres, personnel, plannings, stock, fournisseurs, restaurant, bar | ✓ | | |
| comptabilité, finances, caisse | ✓ | ✓ | |
| opérations comptables et mouvements de stock saisis depuis l'écran Réception | ✓ | ✓ (opérations) | ✓ |
| factures, paiements | ✓ | ✓ | ✓ |
| réservations, clients, chambres, visites, services, promotions, avis, notifications | ✓ | | ✓ |
| main courante | ✓ | ✓ | ✓ |

Changer son propre mot de passe reste possible pour tous. Un appel interdit renvoie **403**.

## Communication entre services

REST synchrone sur des routes `/internal/**` : jamais routées par la gateway, protégées par l'en-tête
`X-Internal-Token`. Tout passe par `common/.../client/RemoteApi.java`.

| Appelant → appelé | Pourquoi |
|---|---|
| réservations → clients, chambres | noms de clients, types et tarifs de chambre |
| réservations → facturation | création / mise à jour / suppression de la facture |
| réservations → promotions | application d'un code promo (consomme une utilisation) |
| réservations → notifications | confirmation de réservation (e-mail + SMS) |
| chambres → réservations | chambres occupées aujourd'hui, suppression refusée si réservée |
| clients → réservations / facturation | statistiques de séjours / ouverture du compte client 411… |
| paiements → facturation, réservations, notifications | étapes du Saga |
| avis → clients, réservations | un avis ne porte que sur un séjour terminé du bon client |
| notifications → réservations, clients | rappels d'arrivée |
| exploitation → chambres, clients, réservations, facturation, paiements | tableau de bord ; achats comptabilisés dans paiements |

Les lectures « d'enrichissement » (tableau de bord, noms de clients) **dégradent** sans échouer si un service est
arrêté ; les écritures renvoient `503`.

## Saga de paiement (`POST /api/paiements`)

Orchestration par `paiements-service` (`saga/SagaOrchestrator`), chaque étape journalisée (`saga_execution`, `saga_step`) :

| # | Étape | Compensation |
|---|---|---|
| 1 | `VALIDATE_INVOICE` (facture payable, montant ≤ reste, réservation non annulée) | – |
| 2 | `REGISTER_PAYMENT_ON_INVOICE` (facturation) | annuler le paiement sur la facture |
| 3 | `RECORD_FINANCE_TRANSACTION` (recette + règlement) | supprimer les écritures |
| 4 | `CONFIRM_RESERVATION` (si facture soldée) | restaurer l'ancien statut |
| 5 | `NOTIFY_CLIENT` (reçu) | non critique : un échec n'annule rien |

Si une étape critique échoue, les étapes déjà faites sont compensées **dans l'ordre inverse** : le paiement est
`FAILED` (HTTP 422, avec le journal dans le corps) et la saga `COMPENSATED`. Les appels de facturation sont
idempotents sur la référence du paiement. `GET /api/paiements/{id}/saga` donne le détail.

Pour la démonstration, `PAIEMENTS_SAGA_FAULT_INJECTION=true` permet de forcer l'échec d'une étape
(`"simulateFailureAt": "CONFIRM_RESERVATION"` dans le corps). **Désactivé par défaut.**

## Lancer en local (Windows)

Prérequis : Java 17+, MySQL démarré (`root` sans mot de passe par défaut, voir les variables plus bas).

```powershell
cd microservices
.\start-all.ps1            # compile si besoin, démarre les 12 processus (logs dans .\logs, ~40 s)
.\stop-all.ps1
.\start-all.ps1 -Rebuild   # après une modification du code
```

Les schémas se créent au premier démarrage (`schema.sql` de chaque service, idempotent). L'utilisateur par défaut
`noubasra` est créé dans `mirador_utilisateurs`. Douze JVM tournent côte à côte : prévoir ~3 Go de RAM libre
(`-Xmx192m` chacune).

### Reprendre les données de l'ancienne base `bd_mirador`

Une seule fois, **après** le premier démarrage :

```powershell
mysql -u root -p --force < migrate-data.sql
```

### Données de démonstration

```powershell
mysql -u root -p --default-character-set=utf8mb4 < sample-data.sql
```

Complète chaque table jusqu'à ~10 lignes. Relançable : une table n'est remplie que si elle est vide. Les utilisateurs
de démo (`akono`, `mballa`, `fotso`, `ngono`, `essama`, `tabi`, `biloa`, `onana`, `ateba`) ont le mot de passe
`Mirador123`. Les paiements et journaux de saga ne sont pas pré-remplis : ils se créent avec `POST /api/paiements`
(ou en lançant `smoke-test.ps1`). Le bouton « données de démonstration » de l'écran Paramètres renvoie désormais vers
ce script (l'ancien effaçait tous les modules d'un coup, ce qui n'a plus de sens avec une base par service).

## Tests

```powershell
.\mvnw.cmd test            # 26 tests unitaires
.\smoke-test.ps1           # ~110 contrôles de bout en bout à travers la gateway (système démarré)
```

* Unitaires : orchestrateur du Saga (ordre, compensation inverse, étape non critique, échec de compensation),
  étapes du paiement (Mockito), calcul des promotions, règles des avis, modèles de notification.
* `smoke-test.ps1` : login, sécurité, lecture des 11 services, promotion → client → réservation → facture →
  notification → paiements (partiel, surpaiement, compensation, solde) → document, archivage, suivi → avis (collecte,
  modération, public) → notifications (idempotence, rappels) → plannings. Il **crée** des données marquées `SMOKE` et
  peut être relancé. La compensation du Saga n'y est vérifiée que si l'injection de panne est activée.

## Docker

```powershell
docker compose up --build      # MySQL + 11 services + gateway (nommée "backend") + frontend
```

> **Non testé** : Docker n'est pas installé sur la machine de développement ; le fichier est cohérent avec la
> configuration locale mais n'a jamais été exécuté.

## Configuration (variables d'environnement)

`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `MYSQL_SSL_MODE`, `JWT_SECRET`, `INTERNAL_TOKEN`
(à changer en production), `<SERVICE>_URL` (ex. `FACTURATION_URL`), `SERVER_PORT`,
`PAIEMENTS_SAGA_FAULT_INJECTION`, `NOTIFICATIONS_SMTP_ENABLED` + `SPRING_MAIL_*` (e-mail réel).

## Limites connues

- **Notifications simulées par défaut** : les messages sont enregistrés et journalisés mais pas envoyés. L'e-mail réel
  est prévu (`notifications.smtp.enabled=true` + `spring.mail.*`) mais **n'a pas été testé** contre un vrai serveur
  SMTP ; pour les SMS il faut implémenter `DeliveryChannel` avec le fournisseur choisi.
- **Pas de transaction distribuée générale** : seul le paiement est une saga. Ailleurs (ex. création d'un client dont
  l'ouverture du compte comptable réussit puis dont l'insertion échoue), une compensation manuelle limitée existe
  (réservations) ou un enregistrement orphelin peut subsister (clients).
- **Pas de découverte de services** (Eureka) : adresses statiques par variables d'environnement.
- Sauvegardes de l'écran Sécurité : elles n'exportent que `mirador_utilisateurs`. Pour tout sauvegarder, `mysqldump`
  des 11 bases `mirador_*`.
- Les `Dto` partagés (`OperationsDtos`, `ParametresDtos`, `HotelDtos`) sont dupliqués par service : chacun possède son contrat.
- Codes d'erreur : saisie invalide → 400, conflit métier (chambre déjà réservée, suppression impossible…) → 409, service distant indisponible → 503. Les « Impossible de récupérer l'identifiant… » restent des 500 (vraies pannes internes).
