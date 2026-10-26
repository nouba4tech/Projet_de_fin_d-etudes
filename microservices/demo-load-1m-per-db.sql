-- Grow the marked 2026 demo set to exactly 1,000,000 inserted demo rows
-- in each of the 11 microservice databases (11,000,000 total).
-- Existing live records are untouched. Demo status values are inert:
-- users suspended, rooms in maintenance, reservations cancelled, payments failed
-- at zero, plans/promotions disabled, reviews rejected, notifications cancelled.
-- Re-runnable: every insert skips its already-created demo key.
SET NAMES utf8mb4;
USE mirador_utilisateurs;

-- A session-local sequence avoids recursive CTE limits and leaves no helper table behind.
CREATE TEMPORARY TABLE demo_load_numbers (
  n INT NOT NULL PRIMARY KEY
) ENGINE=InnoDB;

INSERT INTO demo_load_numbers (n)
SELECT 1 + d0.v + d1.v * 10 + d2.v * 100 + d3.v * 1000
         + d4.v * 10000 + d5.v * 100000
FROM (SELECT 0 v UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d0
CROSS JOIN (SELECT 0 v UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d1
CROSS JOIN (SELECT 0 v UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d2
CROSS JOIN (SELECT 0 v UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d3
CROSS JOIN (SELECT 0 v UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d4
CROSS JOIN (SELECT 0 v UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d5;

-- utilisateurs: 91 existing suspended demo accounts + 999,909 new ones.
INSERT INTO mirador_utilisateurs.utilisateur (compte, psw, nom, prenom, code_groupe, statut)
SELECT CONCAT('demo_mirador_load_', LPAD(n, 7, '0')),
       MD5(CONCAT('disabled-demo-', n)),
       'DEMO', CONCAT('Utilisateur ', n), 6, 'Suspendu'
FROM demo_load_numbers s
WHERE n BETWEEN 92 AND 1000000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_utilisateurs.utilisateur u
    WHERE u.compte = CONCAT('demo_mirador_load_', LPAD(s.n, 7, '0'))
  );

-- chambres: 45 existing room/status pairs + 499,955 new pairs = 1,000,000 rows.
INSERT INTO mirador_chambres.chambre (code_chambre, numero, code_type, type, prix)
SELECT CONCAT('D26R', LPAD(n, 6, '0')), CONCAT('D', LPAD(n, 6, '0')),
       NULL, 'DEMO', 0
FROM demo_load_numbers s
WHERE n BETWEEN 46 AND 500000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_chambres.chambre r
    WHERE r.code_chambre = CONCAT('D26R', LPAD(s.n, 6, '0'))
  );

INSERT INTO mirador_chambres.app_room_status
  (code_chambre, status_label, cleaning_status, description_text, capacity_value)
SELECT r.code_chambre, 'Maintenance', 'Non applicable',
       'DEMO-2026: chambre fictive, indisponible', 1
FROM mirador_chambres.chambre r
WHERE r.code_chambre LIKE 'D26R%'
  AND NOT EXISTS (
    SELECT 1 FROM mirador_chambres.app_room_status s
    WHERE s.code_chambre = r.code_chambre
  );

-- clients: 45 existing client/profile pairs + 499,955 new pairs = 1,000,000 rows.
INSERT INTO mirador_clients.client
  (nom, nom_client, contact, type_client, solde, email, numero)
SELECT CONCAT('DEMO Client ', n), CONCAT('DEMO ', n), '+237000000000',
       'DEMO', 0,
       CONCAT('demo-client-2026-', LPAD(n, 6, '0'), '@example.invalid'),
       CONCAT('DCLI', LPAD(n, 6, '0'))
FROM demo_load_numbers s
WHERE n BETWEEN 46 AND 500000;

INSERT INTO mirador_clients.app_client_profile
  (code_client, email, address_line, id_document, company_name, status_label)
SELECT c.code_client, c.email, 'DEMO-2026', NULL, 'DEMO', 'Inactif'
FROM mirador_clients.client c
WHERE c.email LIKE 'demo-client-2026-%@example.invalid'
  AND NOT EXISTS (
    SELECT 1 FROM mirador_clients.app_client_profile p
    WHERE p.code_client = c.code_client
  );

-- Map demo client sequence numbers to their generated database IDs once, avoiding
-- repeated full scans of the unindexed legacy email column in linked demo rows.
CREATE TEMPORARY TABLE demo_client_map (
  n INT NOT NULL PRIMARY KEY,
  code_client INT NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO demo_client_map (n, code_client)
SELECT CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(c.email, '@', 1), '-', -1) AS UNSIGNED),
       c.code_client
FROM mirador_clients.client c
WHERE c.email LIKE 'demo-client-2026-%@example.invalid';

-- reservations: 45 existing cancelled occupancy/state pairs + 499,955 new pairs.
INSERT INTO mirador_reservations.occupation
  (code_client, code_chambre, date_debut, date_fin, status, type_service,
   qte, code_occupant, code_facture, observation)
SELECT c.code_client, r.code_chambre, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY),
       'Annulée', 'HEBERGEMENT', 1, NULL,
       CONCAT('D26RS', LPAD(n, 6, '0')),
       CONCAT('DEMO-RESERVATION-2026-', LPAD(n, 6, '0'))
FROM demo_load_numbers s
JOIN demo_client_map c ON c.n = s.n
JOIN mirador_chambres.chambre r
  ON r.code_chambre = CONCAT('D26R', LPAD(s.n, 6, '0'))
WHERE s.n BETWEEN 46 AND 500000;

INSERT INTO mirador_reservations.app_reservation_state
  (occupation_code, status_label, total_amount)
SELECT o.code, 'Annulée', 0
FROM mirador_reservations.occupation o
WHERE o.observation LIKE 'DEMO-RESERVATION-2026-%'
  AND NOT EXISTS (
    SELECT 1 FROM mirador_reservations.app_reservation_state st
    WHERE st.occupation_code = o.code
  );

-- paiements: 91 existing failed attempts + 999,909 new failed zero-value attempts.
INSERT INTO mirador_paiements.paiement
  (reference, invoice_code, client_id, amount, method, status, failure_reason)
SELECT CONCAT('DEMO-PAY-2026-', LPAD(n, 7, '0')),
       CONCAT('D26I', LPAD(n, 7, '0')), NULL, 0, 'DEMO', 'FAILED',
       'DEMO-2026: aucune transaction reelle'
FROM demo_load_numbers s
WHERE n BETWEEN 92 AND 1000000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_paiements.paiement p
    WHERE p.reference = CONCAT('DEMO-PAY-2026-', LPAD(s.n, 7, '0'))
  );

-- facturation: 90 existing inactive accounts + 999,910 zero-balance accounts.
INSERT INTO mirador_facturation.account_plan
  (code, name, type, class_name, balance, status, created_at, updated_at)
SELECT CONCAT('DA', LPAD(n, 8, '0')), CONCAT('DEMO compte inactif ', n),
       'DEMO', 'DEMO', 0, 'Inactif', NOW(), NOW()
FROM demo_load_numbers s
WHERE n BETWEEN 91 AND 1000000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_facturation.account_plan a
    WHERE a.code = CONCAT('DA', LPAD(s.n, 8, '0'))
  );

-- personnel: 90 existing inactive employees + 999,910 new inactive employees.
INSERT INTO mirador_personnel.app_employee
  (code_user, first_name, last_name, email, phone, position_name,
   department_name, hire_date, salary_amount, status_label, role_name)
SELECT NULL, CONCAT('Demo', n), 'Employe',
       CONCAT('demo-employee-2026-', LPAD(n, 7, '0'), '@example.invalid'),
       NULL, 'DEMO', 'DEMO', CURDATE(), 0, 'Inactif', 'DEMO'
FROM demo_load_numbers s
WHERE n BETWEEN 91 AND 1000000;

-- promotions: 91 existing disabled codes + 999,909 new disabled codes.
INSERT INTO mirador_promotions.promotion
  (code, libelle, discount_type, discount_value, min_amount, start_date,
   end_date, usage_limit, used_count, active)
SELECT CONCAT('DEMO-2026-', LPAD(n, 7, '0')), CONCAT('DEMO offre inactive ', n),
       'FIXED', 0, 0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 0, 0, 0
FROM demo_load_numbers s
WHERE n BETWEEN 92 AND 1000000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_promotions.promotion p
    WHERE p.code = CONCAT('DEMO-2026-', LPAD(s.n, 7, '0'))
  );

-- avis: 90 existing rejected/flagged reviews + 999,910 new rejected/flagged reviews.
INSERT INTO mirador_avis.avis
  (client_id, reservation_id, rating, title, comment_text, status, flagged,
   moderation_comment, moderated_by, moderated_at)
SELECT c.code_client, NULL, 3, CONCAT('DEMO-2026-', LPAD(n, 7, '0')),
       'Enregistrement fictif de demonstration.', 'REJETE', 1,
       'DEMO: donnees fictives', 'DEMO', NOW()
FROM demo_load_numbers s
JOIN demo_client_map c ON c.n = MOD(s.n - 1, 500000) + 1
WHERE n BETWEEN 91 AND 1000000;

-- notifications: 90 existing cancelled rows + 999,910 cancelled rows to .invalid recipients.
INSERT INTO mirador_notifications.notification
  (channel, recipient, template_code, reference_key, subject, body, status)
SELECT 'EMAIL', CONCAT('demo-notification-2026-', LPAD(n, 7, '0'), '@example.invalid'),
       'DEMO_RECORD', CONCAT('DEMO-2026-', LPAD(n, 7, '0')),
       'DEMO - notification annulee', 'Enregistrement fictif; aucun envoi.', 'CANCELLED'
FROM demo_load_numbers s
WHERE n BETWEEN 91 AND 1000000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_notifications.notification x
    WHERE x.template_code = 'DEMO_RECORD'
      AND x.recipient = CONCAT('demo-notification-2026-', LPAD(s.n, 7, '0'), '@example.invalid')
      AND x.reference_key = CONCAT('DEMO-2026-', LPAD(s.n, 7, '0'))
  );

-- exploitation: 97 existing cancelled requests + 999,903 new zero-value requests.
INSERT INTO mirador_exploitation.app_service_request
  (code_client, service_type, description_text, status_label,
   requested_at, completed_at, price_amount)
SELECT c.code_client, 'DEMO',
       CONCAT('DEMO-2026-', LPAD(n, 7, '0'), ': aucune demande reelle'),
       'Annulée', NOW(), NOW(), 0
FROM demo_load_numbers s
JOIN demo_client_map c ON c.n = MOD(s.n - 1, 500000) + 1
WHERE n BETWEEN 98 AND 1000000;

DROP TEMPORARY TABLE demo_client_map;
DROP TEMPORARY TABLE demo_load_numbers;
