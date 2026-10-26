-- Continuation of demo-load-1m-per-db.sql after users, rooms, and clients
-- have reached 1,000,000 demo rows. Run once; it fills the remaining 8 DBs.
SET NAMES utf8mb4;
USE mirador_utilisateurs;

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
       CONCAT('D26RS', LPAD(s.n, 6, '0')),
       CONCAT('DEMO-RESERVATION-2026-', LPAD(s.n, 6, '0'))
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
SELECT CONCAT('DEMO-PAY-2026-', LPAD(s.n, 7, '0')),
       CONCAT('D26I', LPAD(s.n, 7, '0')), NULL, 0, 'DEMO', 'FAILED',
       'DEMO-2026: aucune transaction reelle'
FROM demo_load_numbers s
WHERE s.n BETWEEN 92 AND 1000000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_paiements.paiement p
    WHERE p.reference = CONCAT('DEMO-PAY-2026-', LPAD(s.n, 7, '0'))
  );

-- facturation: 90 existing inactive accounts + 999,910 zero-balance accounts.
INSERT INTO mirador_facturation.account_plan
  (code, name, type, class_name, balance, status, created_at, updated_at)
SELECT CONCAT('DA', LPAD(s.n, 8, '0')), CONCAT('DEMO compte inactif ', s.n),
       'DEMO', 'DEMO', 0, 'Inactif', NOW(), NOW()
FROM demo_load_numbers s
WHERE s.n BETWEEN 91 AND 1000000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_facturation.account_plan a
    WHERE a.code = CONCAT('DA', LPAD(s.n, 8, '0'))
  );

-- personnel: 90 existing inactive employees + 999,910 new inactive employees.
INSERT INTO mirador_personnel.app_employee
  (code_user, first_name, last_name, email, phone, position_name,
   department_name, hire_date, salary_amount, status_label, role_name)
SELECT NULL, CONCAT('Demo', s.n), 'Employe',
       CONCAT('demo-employee-2026-', LPAD(s.n, 7, '0'), '@example.invalid'),
       NULL, 'DEMO', 'DEMO', CURDATE(), 0, 'Inactif', 'DEMO'
FROM demo_load_numbers s
WHERE s.n BETWEEN 91 AND 1000000;

-- promotions: 91 existing disabled codes + 999,909 new disabled codes.
INSERT INTO mirador_promotions.promotion
  (code, libelle, discount_type, discount_value, min_amount, start_date,
   end_date, usage_limit, used_count, active)
SELECT CONCAT('DEMO-2026-', LPAD(s.n, 7, '0')), CONCAT('DEMO offre inactive ', s.n),
       'FIXED', 0, 0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 0, 0, 0
FROM demo_load_numbers s
WHERE s.n BETWEEN 92 AND 1000000
  AND NOT EXISTS (
    SELECT 1 FROM mirador_promotions.promotion p
    WHERE p.code = CONCAT('DEMO-2026-', LPAD(s.n, 7, '0'))
  );

-- avis: 90 existing rejected/flagged reviews + 999,910 new rejected/flagged reviews.
INSERT INTO mirador_avis.avis
  (client_id, reservation_id, rating, title, comment_text, status, flagged,
   moderation_comment, moderated_by, moderated_at)
SELECT c.code_client, NULL, 3, CONCAT('DEMO-2026-', LPAD(s.n, 7, '0')),
       'Enregistrement fictif de demonstration.', 'REJETE', 1,
       'DEMO: donnees fictives', 'DEMO', NOW()
FROM demo_load_numbers s
JOIN demo_client_map c ON c.n = MOD(s.n - 1, 500000) + 1
WHERE s.n BETWEEN 91 AND 1000000;

-- notifications: 90 existing cancelled rows + 999,910 cancelled rows to .invalid recipients.
INSERT INTO mirador_notifications.notification
  (channel, recipient, template_code, reference_key, subject, body, status)
SELECT 'EMAIL', CONCAT('demo-notification-2026-', LPAD(s.n, 7, '0'), '@example.invalid'),
       'DEMO_RECORD', CONCAT('DEMO-2026-', LPAD(s.n, 7, '0')),
       'DEMO - notification annulee', 'Enregistrement fictif; aucun envoi.', 'CANCELLED'
FROM demo_load_numbers s
WHERE s.n BETWEEN 91 AND 1000000
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
       CONCAT('DEMO-2026-', LPAD(s.n, 7, '0'), ': aucune demande reelle'),
       'Annulée', NOW(), NOW(), 0
FROM demo_load_numbers s
JOIN demo_client_map c ON c.n = MOD(s.n - 1, 500000) + 1
WHERE s.n BETWEEN 98 AND 1000000;

DROP TEMPORARY TABLE demo_client_map;
DROP TEMPORARY TABLE demo_load_numbers;
