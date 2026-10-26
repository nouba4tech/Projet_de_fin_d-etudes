-- Add exactly 1,000 clearly marked, inert demo rows across the 11 service databases.
-- Safe to re-run: every batch checks its DEMO-2026 key before inserting.
-- Demo users are suspended; demo rooms are under maintenance; reservations are cancelled;
-- payments are failed; promotions are disabled; reviews are rejected; notifications cancelled.
SET NAMES utf8mb4;
START TRANSACTION;

-- utilisateurs: 91 suspended demo accounts
INSERT INTO mirador_utilisateurs.utilisateur (compte, psw, nom, prenom, code_groupe, statut)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 91
)
SELECT CONCAT('demo_mirador_2026_', LPAD(n, 4, '0')),
       MD5(CONCAT('disabled-demo-', LPAD(n, 4, '0'))),
       'DEMO', CONCAT('Utilisateur ', LPAD(n, 4, '0')), 6, 'Suspendu'
FROM seq
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_utilisateurs.utilisateur
  WHERE compte = CONCAT('demo_mirador_2026_', LPAD(n, 4, '0'))
);

-- chambres: 45 maintenance rooms + 45 matching status rows = 90
INSERT INTO mirador_chambres.chambre (code_chambre, numero, code_type, type, prix)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 45
)
SELECT CONCAT('DEMO-ROOM-2026-', LPAD(n, 4, '0')),
       CONCAT('D', LPAD(n, 4, '0')), NULL, 'DEMO', 0
FROM seq
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_chambres.chambre
  WHERE code_chambre = CONCAT('DEMO-ROOM-2026-', LPAD(n, 4, '0'))
);

INSERT INTO mirador_chambres.app_room_status
  (code_chambre, status_label, cleaning_status, description_text, capacity_value)
SELECT r.code_chambre, 'Maintenance', 'Non applicable',
       'DEMO-2026: chambre fictive, indisponible', 1
FROM mirador_chambres.chambre r
WHERE r.code_chambre LIKE 'DEMO-ROOM-2026-%'
  AND NOT EXISTS (
    SELECT 1 FROM mirador_chambres.app_room_status s
    WHERE s.code_chambre = r.code_chambre
  );

-- clients: 45 fictitious profiles + 45 profile rows = 90
INSERT INTO mirador_clients.client
  (nom, nom_client, contact, type_client, solde, email, numero)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 45
)
SELECT CONCAT('DEMO Client ', LPAD(n, 4, '0')),
       CONCAT('DEMO ', LPAD(n, 4, '0')),
       '+237000000000', 'DEMO', 0,
       CONCAT('demo-client-2026-', LPAD(n, 4, '0'), '@example.invalid'),
       CONCAT('DEMO-CLI-', LPAD(n, 4, '0'))
FROM seq
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_clients.client
  WHERE email = CONCAT('demo-client-2026-', LPAD(n, 4, '0'), '@example.invalid')
);

INSERT INTO mirador_clients.app_client_profile
  (code_client, email, address_line, id_document, company_name, status_label)
SELECT c.code_client, c.email, 'DEMO-2026', NULL, 'DEMO', 'Inactif'
FROM mirador_clients.client c
WHERE c.email LIKE 'demo-client-2026-%@example.invalid'
  AND NOT EXISTS (
    SELECT 1 FROM mirador_clients.app_client_profile p
    WHERE p.code_client = c.code_client
  );

-- reservations: 45 cancelled stays + 45 matching zero-value state rows = 90
INSERT INTO mirador_reservations.occupation
  (code_client, code_chambre, date_debut, date_fin, status, type_service,
   qte, code_occupant, code_facture, observation)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 45
)
SELECT c.code_client, r.code_chambre,
       DATE_SUB(NOW(), INTERVAL n DAY), DATE_SUB(NOW(), INTERVAL (n - 1) DAY),
       'Annulée', 'HEBERGEMENT', 1, NULL,
       CONCAT('DEMO-RES-2026-', LPAD(n, 4, '0')),
       CONCAT('DEMO-RESERVATION-2026-', LPAD(n, 4, '0'))
FROM seq
JOIN mirador_clients.client c
  ON c.email = CONCAT('demo-client-2026-', LPAD(n, 4, '0'), '@example.invalid')
JOIN mirador_chambres.chambre r
  ON r.code_chambre = CONCAT('DEMO-ROOM-2026-', LPAD(n, 4, '0'))
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_reservations.occupation o
  WHERE o.observation = CONCAT('DEMO-RESERVATION-2026-', LPAD(n, 4, '0'))
);

INSERT INTO mirador_reservations.app_reservation_state
  (occupation_code, status_label, total_amount)
SELECT o.code, 'Annulée', 0
FROM mirador_reservations.occupation o
WHERE o.observation LIKE 'DEMO-RESERVATION-2026-%'
  AND NOT EXISTS (
    SELECT 1 FROM mirador_reservations.app_reservation_state s
    WHERE s.occupation_code = o.code
  );

-- paiements: 91 failed demo attempts; no money was collected
INSERT INTO mirador_paiements.paiement
  (reference, invoice_code, client_id, amount, method, status, failure_reason)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 91
)
SELECT CONCAT('DEMO-PAY-2026-', LPAD(n, 4, '0')),
       CONCAT('DEMO-INV-', LPAD(n, 4, '0')),
       NULL, 0, 'DEMO', 'FAILED', 'DEMO-2026: aucune transaction reelle'
FROM seq
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_paiements.paiement
  WHERE reference = CONCAT('DEMO-PAY-2026-', LPAD(n, 4, '0'))
);

-- facturation: 90 inactive, zero-balance demo accounts
INSERT INTO mirador_facturation.account_plan
  (code, name, type, class_name, balance, status, created_at, updated_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 90
)
SELECT CONCAT('D26A', LPAD(n, 6, '0')),
       CONCAT('DEMO compte inactif ', LPAD(n, 4, '0')),
       'DEMO', 'DEMO', 0, 'Inactif', NOW(), NOW()
FROM seq
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_facturation.account_plan
  WHERE code = CONCAT('D26A', LPAD(n, 6, '0'))
);

-- personnel: 90 inactive demo employee records, no schedules or access accounts
INSERT INTO mirador_personnel.app_employee
  (code_user, first_name, last_name, email, phone, position_name,
   department_name, hire_date, salary_amount, status_label, role_name)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 90
)
SELECT NULL, CONCAT('Demo', LPAD(n, 4, '0')), 'Employe',
       CONCAT('demo-employee-2026-', LPAD(n, 4, '0'), '@example.invalid'),
       NULL, 'DEMO', 'DEMO', CURDATE(), 0, 'Inactif', 'DEMO'
FROM seq
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_personnel.app_employee
  WHERE email = CONCAT('demo-employee-2026-', LPAD(n, 4, '0'), '@example.invalid')
);

-- promotions: 91 disabled demo codes
INSERT INTO mirador_promotions.promotion
  (code, libelle, discount_type, discount_value, min_amount, start_date,
   end_date, usage_limit, used_count, active)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 91
)
SELECT CONCAT('DEMO-2026-', LPAD(n, 4, '0')),
       CONCAT('DEMO offre inactive ', LPAD(n, 4, '0')),
       'FIXED', 0, 0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 0, 0, 0
FROM seq
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_promotions.promotion
  WHERE code = CONCAT('DEMO-2026-', LPAD(n, 4, '0'))
);

-- avis: 90 rejected and flagged demo reviews, not visible as approved reviews
INSERT INTO mirador_avis.avis
  (client_id, reservation_id, rating, title, comment_text, status, flagged,
   moderation_comment, moderated_by, moderated_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 90
)
SELECT c.code_client, NULL, 3,
       CONCAT('DEMO-2026-', LPAD(n, 4, '0')),
       'Enregistrement fictif de demonstration.', 'REJETE', 1,
       'DEMO: donnees fictives', 'DEMO', NOW()
FROM seq
JOIN mirador_clients.client c
  ON c.email = CONCAT('demo-client-2026-', LPAD(MOD(n - 1, 45) + 1, 4, '0'), '@example.invalid')
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_avis.avis a
  WHERE a.title = CONCAT('DEMO-2026-', LPAD(n, 4, '0'))
);

-- notifications: 90 cancelled records addressed to reserved .invalid domains; none are sent
INSERT INTO mirador_notifications.notification
  (channel, recipient, template_code, reference_key, subject, body, status)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 90
)
SELECT 'EMAIL', CONCAT('demo-notification-2026-', LPAD(n, 4, '0'), '@example.invalid'),
       'DEMO_RECORD', CONCAT('DEMO-2026-', LPAD(n, 4, '0')),
       'DEMO - notification annulee', 'Enregistrement fictif; aucun envoi.', 'CANCELLED'
FROM seq
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_notifications.notification
  WHERE reference_key = CONCAT('DEMO-2026-', LPAD(n, 4, '0'))
);

-- exploitation: 97 completed, zero-value demo service requests linked to demo clients
INSERT INTO mirador_exploitation.app_service_request
  (code_client, service_type, description_text, status_label,
   requested_at, completed_at, price_amount)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 97
)
SELECT c.code_client, 'DEMO',
       CONCAT('DEMO-2026-', LPAD(n, 4, '0'), ': aucune demande reelle'),
       'Annulée', NOW(), NOW(), 0
FROM seq
JOIN mirador_clients.client c
  ON c.email = CONCAT('demo-client-2026-', LPAD(MOD(n - 1, 45) + 1, 4, '0'), '@example.invalid')
WHERE NOT EXISTS (
  SELECT 1 FROM mirador_exploitation.app_service_request r
  WHERE r.description_text = CONCAT('DEMO-2026-', LPAD(n, 4, '0'), ': aucune demande reelle')
);

COMMIT;
