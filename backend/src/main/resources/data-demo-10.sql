-- =============================================
-- DONNEES DEMO - 10 lignes par module applicatif
-- Prerequis : data-seed.sql (clients, chambres, plats, boissons, employes)
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM app_restaurant_order_item;
DELETE FROM app_restaurant_order;
DELETE FROM app_service_request;
DELETE FROM app_finance_transaction;
DELETE FROM app_stock_item;
DELETE FROM app_database_backup;
DELETE FROM app_reservation_state;
DELETE FROM occupation;
DELETE FROM visite;
DELETE FROM autre_service;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Profils clients (10)
INSERT INTO app_client_profile (code_client, email, address_line, id_document, company_name, status_label, created_at) VALUES
(1, 'abakar@mirador.cm', 'Quartier Moursal, N''Djamena', 'NIN-TD-001', NULL, 'Actif', '2026-01-05 10:00:00'),
(2, 'etoa@mirador.cm', 'Bastos, Yaoundé', 'NIN-CM-002', NULL, 'Actif', '2026-01-08 11:00:00'),
(3, 'cotontchad@mirador.cm', 'Avenue Charles de Gaulle', 'RC-TD-003', 'SOCIETE COTONTCHAD', 'Actif', '2026-01-10 09:00:00'),
(4, 'total@mirador.cm', 'Bonanjo, Douala', 'RC-CM-004', 'TOTAL CAMEROUN', 'Actif', '2026-01-12 14:00:00'),
(5, 'ngando@mirador.cm', 'Mvog-Ada, Yaoundé', 'NIN-CM-005', NULL, 'Actif', '2026-01-15 08:30:00'),
(6, 'tfouda@mirador.cm', 'Essos, Yaoundé', 'NIN-CM-006', NULL, 'Actif', '2026-01-18 16:00:00'),
(7, 'htchak@mirador.cm', 'Nlongkak, Yaoundé', 'NIN-CM-007', NULL, 'Actif', '2026-01-20 10:00:00'),
(8, 'sabc@mirador.cm', 'Zone Industrielle', 'RC-CM-008', 'SOCIETE SABC', 'Actif', '2026-01-22 12:00:00'),
(9, 'iomar@mirador.cm', 'Chagoua, N''Djamena', 'NIN-TD-009', NULL, 'Actif', '2026-01-25 09:00:00'),
(10, 'sbella@mirador.cm', 'Mendong, Yaoundé', 'NIN-CM-010', NULL, 'Actif', '2026-01-28 15:00:00')
ON DUPLICATE KEY UPDATE email = VALUES(email), status_label = VALUES(status_label);

-- 2. Statuts chambres (10)
INSERT INTO app_room_status (code_chambre, status_label, cleaning_status, description_text, capacity_value) VALUES
('101', 'Occupée', 'Prêt', 'Standard vue jardin', 2),
('102', 'Disponible', 'Prêt', 'Standard calme', 2),
('103', 'Occupée', 'En cours', 'Standard étage 1', 2),
('104', 'Disponible', 'Prêt', 'Studio affaires', 1),
('105', 'Maintenance', 'Sale', 'Twin en rénovation', 2),
('201', 'Occupée', 'Prêt', 'Double confort', 2),
('202', 'Disponible', 'Prêt', 'Double standard', 2),
('203', 'Occupée', 'Prêt', 'Luxe simple', 2),
('204', 'Disponible', 'Prêt', 'Luxe double', 2),
('205', 'Occupée', 'Prêt', 'Case VIP', 2)
ON DUPLICATE KEY UPDATE status_label = VALUES(status_label), cleaning_status = VALUES(cleaning_status);

-- 3. Réservations hébergement (10) — test impression facture Réception
INSERT INTO occupation (code_client, code_chambre, date_debut, date_fin, status, type_service, qte, code_occupant, code_facture, observation) VALUES
(1, '101', '2026-06-05 14:00:00', '2026-06-08 11:00:00', 'Actif', 'NUITE', 3, 1, 'F26-001', 'Client régulier'),
(2, '102', '2026-06-06 14:00:00', '2026-06-09 11:00:00', 'Actif', 'NUITE', 3, 2, 'F26-002', NULL),
(3, '103', '2026-06-07 14:00:00', '2026-06-10 11:00:00', 'Actif', 'NUITE', 3, 3, 'F26-003', 'Séjour entreprise'),
(4, '104', '2026-06-08 14:00:00', '2026-06-11 11:00:00', 'Actif', 'NUITE', 3, 4, 'F26-004', NULL),
(5, '105', '2026-06-09 14:00:00', '2026-06-12 11:00:00', 'Actif', 'NUITE', 3, 5, 'F26-005', 'Famille'),
(6, '201', '2026-06-10 14:00:00', '2026-06-13 11:00:00', 'Actif', 'NUITE', 3, 6, 'F26-006', NULL),
(7, '202', '2026-06-11 14:00:00', '2026-06-14 11:00:00', 'Actif', 'NUITE', 3, 7, 'F26-007', 'Late check-in'),
(8, '203', '2026-06-12 14:00:00', '2026-06-15 11:00:00', 'Actif', 'NUITE', 3, 8, 'F26-008', NULL),
(9, '204', '2026-06-13 14:00:00', '2026-06-16 11:00:00', 'Actif', 'NUITE', 3, 9, 'F26-009', 'Suite affaires'),
(10, '205', '2026-06-14 14:00:00', '2026-06-17 11:00:00', 'Actif', 'NUITE', 3, 10, 'F26-010', 'VIP');

INSERT INTO app_reservation_state (occupation_code, status_label, total_amount, created_at)
SELECT o.code,
       ELT(MOD(o.code, 5) + 1, 'Confirmée', 'Check-in', 'Check-out', 'Payée', 'Confirmée'),
       25000 * GREATEST(1, DATEDIFF(DATE(o.date_fin), DATE(o.date_debut))),
       o.date_debut
FROM occupation o;

-- 4. Visites (10)
INSERT INTO visite (code_occupant, nom, prenom, observation, date_debut, date_fin) VALUES
(1, 'DANG', 'ALAIN', 'Réunion commerciale', '2026-06-10 09:00:00', '2026-06-10 11:30:00'),
(2, 'MBOUM', 'CLAIRE', 'Livraison fournisseur', '2026-06-10 10:00:00', NULL),
(3, 'NDJOCK', 'PIERRE', 'Entretien maintenance', '2026-06-10 14:00:00', '2026-06-10 16:00:00'),
(4, 'FOTSING', 'MARIE', 'Visite famille client', '2026-06-11 08:30:00', NULL),
(5, 'ABENA', 'PAUL', 'Audit interne', '2026-06-11 09:00:00', '2026-06-11 12:00:00'),
(6, 'TCHOUA', 'ERIC', 'Prospection événementielle', '2026-06-11 15:00:00', NULL),
(7, 'MANGA', 'SYLVIE', 'Formation personnel', '2026-06-12 08:00:00', '2026-06-12 17:00:00'),
(8, 'OUMAR', 'HASSAN', 'Contrôle qualité', '2026-06-12 10:30:00', NULL),
(9, 'BELLO', 'GRACE', 'Visite agence voyage', '2026-06-12 14:00:00', '2026-06-12 15:30:00'),
(10, 'KAMGA', 'JOSEPH', 'Réunion direction', '2026-06-13 09:00:00', NULL);

-- 5. Stock économat (10)
INSERT INTO app_stock_item (item_code, item_name, category_name, quantity_value, unit_name, unit_price, min_threshold, supplier_name, entity_scope, entity_reference, last_updated) VALUES
('ART-001', 'Serviettes bain blanches', 'Linge', 120, 'pièces', 3500, 30, 'BLANCHISSERIE MIRADOR', 'STOCK_MODULE', 'MAG-01', NOW()),
('ART-002', 'Draps king size', 'Linge', 80, 'pièces', 8500, 20, 'BLANCHISSERIE MIRADOR', 'STOCK_MODULE', 'MAG-01', NOW()),
('ART-003', 'Gel douche 250ml', 'Consommables', 200, 'unités', 1200, 50, 'GLOBAL NET', 'STOCK_MODULE', 'MAG-02', NOW()),
('ART-004', 'Shampoing 250ml', 'Consommables', 180, 'unités', 1200, 50, 'GLOBAL NET', 'STOCK_MODULE', 'MAG-02', NOW()),
('ART-005', 'Papier toilette', 'Consommables', 500, 'rouleaux', 450, 100, 'CADY SERVICES', 'STOCK_MODULE', 'MAG-02', NOW()),
('ART-006', 'Café moulu 1kg', 'Restauration', 45, 'sachets', 6500, 10, 'CHOCOCAM', 'STOCK_MODULE', 'CUIS-01', NOW()),
('ART-007', 'Huile végétale 5L', 'Restauration', 25, 'bidons', 8500, 5, 'CHOCOCAM', 'STOCK_MODULE', 'CUIS-01', NOW()),
('ART-008', 'Détergent sol', 'Entretien', 35, 'litres', 2800, 8, 'GLOBAL NET', 'STOCK_MODULE', 'MAG-03', NOW()),
('ART-009', 'Ampoules LED 9W', 'Maintenance', 60, 'pièces', 1500, 15, 'TECH SERVICES', 'STOCK_MODULE', 'TECH-01', NOW()),
('ART-010', 'Sacs poubelle 100L', 'Entretien', 90, 'paquets', 2200, 20, 'CADY SERVICES', 'STOCK_MODULE', 'MAG-03', NOW());

-- 6. Transactions financières (10)
INSERT INTO app_finance_transaction (transaction_type, category_name, description_text, amount_value, transaction_date, reference_code, created_at) VALUES
('Entrée', 'Hébergement', 'Encaissement chambre 101', 75000, '2026-06-05', 'ENC-001', NOW()),
('Entrée', 'Restaurant', 'Ticket restaurant table 3', 18500, '2026-06-05', 'ENC-002', NOW()),
('Entrée', 'Bar', 'Vente bar soirée', 42000, '2026-06-06', 'ENC-003', NOW()),
('Sortie', 'Achats', 'Facture SABC boissons', 125000, '2026-06-06', 'DEC-001', NOW()),
('Sortie', 'Salaires', 'Avance personnel juin', 85000, '2026-06-07', 'DEC-002', NOW()),
('Entrée', 'Services', 'Blanchisserie client 204', 12000, '2026-06-07', 'ENC-004', NOW()),
('Sortie', 'Entretien', 'Maintenance climatisation', 45000, '2026-06-08', 'DEC-003', NOW()),
('Entrée', 'Hébergement', 'Groupe entreprise COTONTCHAD', 350000, '2026-06-08', 'ENC-005', NOW()),
('Sortie', 'Fournitures', 'Produits d''entretien', 28000, '2026-06-09', 'DEC-004', NOW()),
('Entrée', 'Bar', 'Événement cocktail VIP', 95000, '2026-06-09', 'ENC-006', NOW());

-- 7. Demandes de services clients (10)
INSERT INTO app_service_request (code_client, service_type, description_text, status_label, requested_at, completed_at, price_amount) VALUES
(1, 'housekeeping', 'Changement draps et serviettes', 'Terminé', '2026-06-10 08:00:00', '2026-06-10 09:30:00', 0),
(2, 'room_service', 'Petit-déjeuner en chambre', 'En cours', '2026-06-10 07:30:00', NULL, 8500),
(3, 'laundry', 'Pressing costume 2 pièces', 'Demandé', '2026-06-10 10:00:00', NULL, 12000),
(4, 'transport', 'Navette aéroport 06h00', 'Confirmé', '2026-06-10 18:00:00', NULL, 25000),
(5, 'maintenance', 'Climatisation bruyante ch.105', 'En cours', '2026-06-11 09:00:00', NULL, 0),
(6, 'housekeeping', 'Nettoyage supplémentaire', 'Terminé', '2026-06-11 11:00:00', '2026-06-11 12:00:00', 5000),
(7, 'room_service', 'Dîner room service', 'Demandé', '2026-06-11 19:00:00', NULL, 22000),
(8, 'laundry', 'Blanchisserie express', 'Terminé', '2026-06-12 08:00:00', '2026-06-12 14:00:00', 8000),
(9, 'transport', 'Taxi centre-ville', 'Confirmé', '2026-06-12 16:00:00', NULL, 5000),
(10, 'maintenance', 'Réparation serrure', 'En cours', '2026-06-13 07:00:00', NULL, 0);

-- 8. Services hôtel catalogue (10)
INSERT INTO autre_service (numero, libelle, prix_service) VALUES
('SRV-001', 'Blanchisserie express', 8000),
('SRV-002', 'Pressing complet', 12000),
('SRV-003', 'Navette aéroport', 25000),
('SRV-004', 'Room service petit-déjeuner', 8500),
('SRV-005', 'Massage spa 1h', 35000),
('SRV-006', 'Location salle réunion', 150000),
('SRV-007', 'Parking sécurisé / jour', 5000),
('SRV-008', 'Baby-sitting 2h', 15000),
('SRV-009', 'Late check-out 14h', 20000),
('SRV-010', 'Décoration anniversaire', 45000);

-- 9. Commandes restaurant / bar (10) — test impression facture Bar
INSERT INTO app_restaurant_order (table_number, status_label, total_amount, created_at, served_at) VALUES
(1, 'Payé', 8500, '2026-06-10 12:30:00', '2026-06-10 13:00:00'),
(2, 'Payé', 12000, '2026-06-10 13:15:00', '2026-06-10 13:45:00'),
(3, 'Payé', 15500, '2026-06-10 19:00:00', '2026-06-10 19:40:00'),
(4, 'Payé', 9800, '2026-06-11 12:00:00', '2026-06-11 12:35:00'),
(5, 'Payé', 22000, '2026-06-11 20:00:00', '2026-06-11 21:00:00'),
(6, 'Servi', 7500, '2026-06-12 12:30:00', '2026-06-12 13:00:00'),
(7, 'En attente', 6500, '2026-06-12 13:00:00', NULL),
(8, 'Payé', 18500, '2026-06-12 20:30:00', '2026-06-12 21:15:00'),
(9, 'Payé', 14200, '2026-06-13 12:00:00', '2026-06-13 12:45:00'),
(10, 'Payé', 31000, '2026-06-13 21:00:00', '2026-06-13 22:00:00');

INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 1, 2, 3500 FROM app_restaurant_order o WHERE o.table_number = 1;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 2, 1, 4500 FROM app_restaurant_order o WHERE o.table_number = 2;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 3, 2, 5500 FROM app_restaurant_order o WHERE o.table_number = 3;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 4, 1, 3800 FROM app_restaurant_order o WHERE o.table_number = 4;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 5, 3, 4500 FROM app_restaurant_order o WHERE o.table_number = 5;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 6, 1, 7500 FROM app_restaurant_order o WHERE o.table_number = 6;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 7, 1, 6500 FROM app_restaurant_order o WHERE o.table_number = 7;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 8, 2, 4200 FROM app_restaurant_order o WHERE o.table_number = 8;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 9, 2, 3500 FROM app_restaurant_order o WHERE o.table_number = 9;
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, 10, 4, 4500 FROM app_restaurant_order o WHERE o.table_number = 10;

-- 10. Sauvegardes système (10)
INSERT INTO app_database_backup (label, created_at, status, size_in_bytes, file_name) VALUES
('Sauvegarde quotidienne 01/06', '2026-06-01 02:00:00', 'Disponible', 52428800, 'mirador_2026-06-01.sql'),
('Sauvegarde quotidienne 02/06', '2026-06-02 02:00:00', 'Disponible', 52531200, 'mirador_2026-06-02.sql'),
('Sauvegarde quotidienne 03/06', '2026-06-03 02:00:00', 'Disponible', 52633600, 'mirador_2026-06-03.sql'),
('Sauvegarde hebdomadaire S22', '2026-06-04 03:00:00', 'Disponible', 62914560, 'mirador_week_22.sql'),
('Sauvegarde quotidienne 05/06', '2026-06-05 02:00:00', 'Disponible', 52736000, 'mirador_2026-06-05.sql'),
('Sauvegarde avant migration', '2026-06-08 23:00:00', 'Disponible', 73400320, 'mirador_pre_migration.sql'),
('Sauvegarde quotidienne 09/06', '2026-06-09 02:00:00', 'Disponible', 52838400, 'mirador_2026-06-09.sql'),
('Sauvegarde quotidienne 10/06', '2026-06-10 02:00:00', 'Disponible', 52940800, 'mirador_2026-06-10.sql'),
('Sauvegarde manuelle test', '2026-06-11 10:30:00', 'Disponible', 41943040, 'mirador_manual_test.sql'),
('Sauvegarde quotidienne 11/06', '2026-06-11 02:00:00', 'Disponible', 53043200, 'mirador_2026-06-11.sql');
