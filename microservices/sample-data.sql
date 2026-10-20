-- Sample data: ~10 rows in every business table of the 4 microservice databases.
-- Run with:  mysql -u root -p --default-character-set=utf8mb4 < sample-data.sql
-- Run it AFTER the services have started once (they create the schemas) and after migrate-data.sql if you
-- come from the monolith. Re-runnable: a table is only filled when it is empty (or topped up with fixed keys).
-- Existing rows are never modified or deleted. Dates are relative to today.
-- Payments / saga logs are NOT seeded here: create them through POST /api/paiements (see smoke-test.ps1).
-- The demo users all use the password  Mirador123  (change it before any real use).

SET NAMES utf8mb4;

-- ===== mirador_utilisateurs =====
USE mirador_utilisateurs;
INSERT INTO utilisateur (compte, psw, nom, prenom, code_groupe, statut)
SELECT v.compte, MD5('Mirador123'), v.nom, v.prenom, v.code_groupe, v.statut
FROM (VALUES
    ROW('akono',  'AKONO',  'Jean',     28, 'Actif'),
    ROW('mballa', 'MBALLA', 'Christelle', 29, 'Actif'),
    ROW('fotso',  'FOTSO',  'Patrick',  30, 'Actif'),
    ROW('ngono',  'NGONO',  'Berthe',   31, 'Actif'),
    ROW('essama', 'ESSAMA', 'Gaston',   32, 'Actif'),
    ROW('tabi',   'TABI',   'Roméo',    33, 'Actif'),
    ROW('biloa',  'BILOA',  'Sandrine', 34, 'Actif'),
    ROW('onana',  'ONANA',  'Felix',    36, 'Actif'),
    ROW('ateba',  'ATEBA',  'Mireille', 37, 'Inactif')
) AS v(compte, nom, prenom, code_groupe, statut)
WHERE NOT EXISTS (SELECT 1 FROM utilisateur u WHERE u.compte = v.compte);
INSERT IGNORE INTO app_user_profile (code_user, email, role_name)
SELECT u.code_user, v.email, v.role_name
FROM utilisateur u
JOIN (VALUES
    ROW('akono',  'akono@mirador-hotel.cm',  'Reception'),
    ROW('mballa', 'mballa@mirador-hotel.cm', 'Comptable'),
    ROW('fotso',  'fotso@mirador-hotel.cm',  'Reception'),
    ROW('ngono',  'ngono@mirador-hotel.cm',  'Admin'),
    ROW('essama', 'essama@mirador-hotel.cm', 'Reception'),
    ROW('tabi',   'tabi@mirador-hotel.cm',   'Reception'),
    ROW('biloa',  'biloa@mirador-hotel.cm',  'Reception'),
    ROW('onana',  'onana@mirador-hotel.cm',  'Comptable'),
    ROW('ateba',  'ateba@mirador-hotel.cm',  'Comptable')
) AS v(compte, email, role_name) ON v.compte = u.compte;
INSERT INTO app_database_backup (label, created_at, status, size_in_bytes, file_name)
SELECT v.* FROM (VALUES
    ROW('Sauvegarde auto J-1',  NOW() - INTERVAL 1 DAY,  'Terminée', 482113, 'mirador_auth_j1.sql'),
    ROW('Sauvegarde auto J-2',  NOW() - INTERVAL 2 DAY,  'Terminée', 481530, 'mirador_auth_j2.sql'),
    ROW('Sauvegarde auto J-3',  NOW() - INTERVAL 3 DAY,  'Terminée', 480977, 'mirador_auth_j3.sql'),
    ROW('Sauvegarde auto J-4',  NOW() - INTERVAL 4 DAY,  'Terminée', 479204, 'mirador_auth_j4.sql'),
    ROW('Sauvegarde auto J-5',  NOW() - INTERVAL 5 DAY,  'Terminée', 478866, 'mirador_auth_j5.sql'),
    ROW('Sauvegarde auto J-6',  NOW() - INTERVAL 6 DAY,  'Terminée', 478120, 'mirador_auth_j6.sql'),
    ROW('Sauvegarde auto J-7',  NOW() - INTERVAL 7 DAY,  'Terminée', 477951, 'mirador_auth_j7.sql'),
    ROW('Avant mise à jour',    NOW() - INTERVAL 10 DAY, 'Terminée', 470332, 'mirador_auth_maj.sql'),
    ROW('Test restauration',    NOW() - INTERVAL 14 DAY, 'Échouée',  0,      'mirador_auth_test.sql'),
    ROW('Sauvegarde mensuelle', NOW() - INTERVAL 30 DAY, 'Terminée', 455018, 'mirador_auth_mois.sql')
) AS v(label, created_at, status, size_in_bytes, file_name)
WHERE NOT EXISTS (SELECT 1 FROM app_database_backup);

-- ===== mirador_clients =====
USE mirador_clients;
INSERT IGNORE INTO app_client_profile (code_client, email, address_line, id_document, company_name, status_label)
SELECT * FROM (VALUES
    ROW(26, 'abakar.mahamat@mail.cm',  'Quartier Bastos, Yaoundé',   'CNI 100234561', NULL,           'Actif'),
    ROW(27, 'etoa.severin@mail.cm',    'Bonanjo, Douala',            'CNI 100234562', NULL,           'Actif'),
    ROW(28, 'contact@cotontchad.td',   'Avenue Charles de Gaulle, N''Djamena', 'RC TD-2011-B-044', 'COTONTCHAD', 'Actif'),
    ROW(29, 'achats@total.cm',         'Boulevard de la Liberté, Douala', 'RC CM-DLA-2004-B-112', 'TOTAL',  'Actif'),
    ROW(30, 'ngando.mbia@mail.cm',     'Mvog-Ada, Yaoundé',          'CNI 100234565', NULL,           'Actif'),
    ROW(31, 'fouda.therese@mail.cm',   'Akwa, Douala',               'Passeport 07AB12345', NULL,     'VIP'),
    ROW(32, 'tchakounte@mail.cm',      'Bafoussam centre',           'CNI 100234567', NULL,           'Actif'),
    ROW(33, 'reservation@sabc.cm',     'Rue Drouot, Douala',         'RC CM-DLA-1990-B-001', 'SABC',  'Actif'),
    ROW(34, 'idriss.oumar@mail.cm',    'Maroua, Extrême-Nord',       'CNI 100234569', NULL,           'Actif'),
    ROW(35, 'bella@mail.cm',           'Nlongkak, Yaoundé',          'CNI 100234570', NULL,           'Inactif')
) AS v(code_client, email, address_line, id_document, company_name, status_label);

-- ===== mirador_chambres =====
USE mirador_chambres;
INSERT IGNORE INTO app_room_status (code_chambre, status_label, cleaning_status, description_text, capacity_value)
SELECT * FROM (VALUES
    ROW('101', 'Disponible',  'Pret',      'Chambre standard simple, vue jardin',   1),
    ROW('102', 'Occupé',      'Pret',      'Chambre standard simple, vue cour',     1),
    ROW('103', 'Nettoyage',   'Nettoyage', 'Chambre standard simple, rez-de-chaussée', 1),
    ROW('201', 'Occupé',      'Pret',      'Chambre standard double, balcon',       2),
    ROW('202', 'Disponible',  'Pret',      'Chambre standard double, balcon',       2),
    ROW('203', 'Maintenance', 'Pret',      'Chambre luxe simple, climatisation en réparation', 1),
    ROW('204', 'Disponible',  'Pret',      'Chambre luxe double, vue piscine',      2),
    ROW('301', 'Occupé',      'Pret',      'Suite junior, salon séparé',            3),
    ROW('302', 'Disponible',  'Pret',      'Suite junior, salon séparé',            3),
    ROW('303', 'Nettoyage',   'Nettoyage', 'Suite exécutive, vue panoramique',      4)
) AS v(code_chambre, status_label, cleaning_status, description_text, capacity_value);

-- ===== mirador_exploitation =====
USE mirador_exploitation;
INSERT INTO parametre (idparametre, raison_sociale, activite, contact, ville, niu)
SELECT v.* FROM (VALUES
    ROW(3,  'MIRADOR DOUALA',      'Hôtellerie d''affaires',  '+237 233 44 55 66', 'DOUALA',     'M0234567891'),
    ROW(4,  'MIRADOR KRIBI',       'Resort balnéaire',        '+237 233 11 22 33', 'KRIBI',      'M0345678912'),
    ROW(5,  'MIRADOR BAFOUSSAM',   'Hôtel et restaurant',     '+237 233 22 33 44', 'BAFOUSSAM',  'M0456789123'),
    ROW(6,  'MIRADOR GAROUA',      'Hôtellerie et conférences','+237 222 27 11 00', 'GAROUA',     'M0567891234'),
    ROW(7,  'MIRADOR BERTOUA',     'Auberge et restaurant',   '+237 222 24 55 66', 'BERTOUA',    'M0678912345'),
    ROW(8,  'MIRADOR LIBREVILLE',  'Hôtellerie de luxe',      '+241 01 44 55 66',  'LIBREVILLE', 'GAB-554433'),
    ROW(9,  'MIRADOR BRAZZAVILLE', 'Lodge & Business',        '+242 06 612 34 56', 'BRAZZAVILLE','CG-778899'),
    ROW(10, 'MIRADOR BANGUI',      'Hôtel et événements',     '+236 72 12 34 56',  'BANGUI',     'CF-334455')
) AS v(idparametre, raison_sociale, activite, contact, ville, niu)
WHERE NOT EXISTS (SELECT 1 FROM parametre p WHERE p.idparametre = v.idparametre);

-- ===== mirador_reservations =====
USE mirador_reservations;
INSERT INTO occupation (code_client, code_chambre, date_debut, date_fin, type_service, qte, code_occupant, code_facture, observation)
SELECT v.* FROM (VALUES
    ROW(26, '102', CURDATE() - INTERVAL 2 DAY, CURDATE() + INTERVAL 1 DAY, 'HEBERGEMENT', 3, 26, 'F26-001', 'DEMO-RES-01'),
    ROW(27, '201', CURDATE() - INTERVAL 1 DAY, CURDATE() + INTERVAL 2 DAY, 'HEBERGEMENT', 3, 27, 'F26-002', 'DEMO-RES-02'),
    ROW(28, '301', CURDATE(),                  CURDATE() + INTERVAL 4 DAY, 'HEBERGEMENT', 4, 28, 'F26-003', 'DEMO-RES-03'),
    ROW(29, '101', CURDATE() + INTERVAL 1 DAY, CURDATE() + INTERVAL 3 DAY, 'HEBERGEMENT', 2, 29, 'F26-004', 'DEMO-RES-04'),
    ROW(30, '202', CURDATE() + INTERVAL 2 DAY, CURDATE() + INTERVAL 5 DAY, 'HEBERGEMENT', 3, 30, 'F26-005', 'DEMO-RES-05'),
    ROW(31, '204', CURDATE() + INTERVAL 3 DAY, CURDATE() + INTERVAL 7 DAY, 'HEBERGEMENT', 4, 31, 'F26-006', 'DEMO-RES-06'),
    ROW(32, '302', CURDATE() - INTERVAL 8 DAY, CURDATE() - INTERVAL 5 DAY, 'HEBERGEMENT', 3, 32, 'F26-007', 'DEMO-RES-07'),
    ROW(33, '303', CURDATE() - INTERVAL 6 DAY, CURDATE() - INTERVAL 4 DAY, 'HEBERGEMENT', 2, 33, 'F26-008', 'DEMO-RES-08'),
    ROW(34, '103', CURDATE() + INTERVAL 6 DAY, CURDATE() + INTERVAL 8 DAY, 'HEBERGEMENT', 2, 34, 'F26-009', 'DEMO-RES-09'),
    ROW(35, '203', CURDATE() + INTERVAL 9 DAY, CURDATE() + INTERVAL 10 DAY,'HEBERGEMENT', 1, 35, 'F26-010', 'DEMO-RES-10')
) AS v(code_client, code_chambre, date_debut, date_fin, type_service, qte, code_occupant, code_facture, observation)
WHERE NOT EXISTS (SELECT 1 FROM occupation);
INSERT IGNORE INTO app_reservation_state (occupation_code, status_label, total_amount)
SELECT o.code, v.status_label, v.total_amount
FROM occupation o
JOIN (VALUES
    ROW('DEMO-RES-01', 'En cours',   75000.00),
    ROW('DEMO-RES-02', 'En cours',  105000.00),
    ROW('DEMO-RES-03', 'Confirmée', 260000.00),
    ROW('DEMO-RES-04', 'Confirmée',  50000.00),
    ROW('DEMO-RES-05', 'En attente', 105000.00),
    ROW('DEMO-RES-06', 'Confirmée', 240000.00),
    ROW('DEMO-RES-07', 'Terminé',   135000.00),
    ROW('DEMO-RES-08', 'Terminé',   160000.00),
    ROW('DEMO-RES-09', 'Annulée',    50000.00),
    ROW('DEMO-RES-10', 'En attente',  45000.00)
) AS v(observation, status_label, total_amount) ON v.observation = o.observation;

-- ===== mirador_facturation =====
USE mirador_facturation;
INSERT INTO detail_facture (code_facture, service, reference, pu, libelle, qte, total, date_detail)
SELECT v.* FROM (VALUES
    ROW('F26-001', 'HEBERGEMENT', 1, 25000.00, 'Nuitée chambre standard simple', 3,  75000.00, NOW() - INTERVAL 2 DAY),
    ROW('F26-002', 'HEBERGEMENT', 2, 35000.00, 'Nuitée chambre standard double', 3, 105000.00, NOW() - INTERVAL 1 DAY),
    ROW('F26-003', 'HEBERGEMENT', 3, 65000.00, 'Nuitée suite junior',            4, 260000.00, NOW()),
    ROW('F26-004', 'RESTAURANT',  4,  6000.00, 'Petit-déjeuner',                 4,  24000.00, NOW() - INTERVAL 1 DAY),
    ROW('F26-005', 'BAR',         5,  1500.00, 'Boisson gazeuse',                8,  12000.00, NOW() - INTERVAL 1 DAY),
    ROW('F26-006', 'SERVICE',     6,  5000.00, 'Blanchisserie',                  2,  10000.00, NOW() - INTERVAL 3 DAY),
    ROW('F26-007', 'HEBERGEMENT', 7, 45000.00, 'Nuitée suite junior',            3, 135000.00, NOW() - INTERVAL 8 DAY),
    ROW('F26-008', 'SERVICE',     8, 15000.00, 'Navette aéroport',               2,  30000.00, NOW() - INTERVAL 6 DAY),
    ROW('F26-009', 'RESTAURANT',  9,  8500.00, 'Plat du jour',                   5,  42500.00, NOW() - INTERVAL 5 DAY),
    ROW('F26-010', 'BAR',        10,  2500.00, 'Bière locale',                  10,  25000.00, NOW() - INTERVAL 4 DAY)
) AS v(code_facture, service, reference, pu, libelle, qte, total, date_detail)
WHERE NOT EXISTS (SELECT 1 FROM detail_facture);

-- ===== mirador_exploitation =====
USE mirador_exploitation;
INSERT INTO autre_service (numero, libelle, prix_service)
SELECT v.* FROM (VALUES
    ROW('S01', 'Blanchisserie',          5000.00),
    ROW('S02', 'Petit-déjeuner',         6000.00),
    ROW('S03', 'Navette aéroport',      15000.00),
    ROW('S04', 'Massage',               20000.00),
    ROW('S05', 'Location de voiture',   40000.00),
    ROW('S06', 'Salle de conférence',  150000.00),
    ROW('S07', 'Mini-bar',               8000.00),
    ROW('S08', 'Repassage',              2000.00),
    ROW('S09', 'Baby-sitting',          10000.00),
    ROW('S10', 'Excursion guidée',      35000.00)
) AS v(numero, libelle, prix_service)
WHERE NOT EXISTS (SELECT 1 FROM autre_service);
INSERT INTO app_service_request (code_client, service_type, description_text, status_label, requested_at, completed_at, price_amount)
SELECT v.* FROM (VALUES
    ROW(26, 'Blanchisserie',      '3 chemises et 2 pantalons à laver',        'Terminé',  NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY, 5000.00),
    ROW(27, 'Navette aéroport',   'Transfert vers l''aéroport de Nsimalen',    'Demande',  NOW() - INTERVAL 3 HOUR, NULL, 15000.00),
    ROW(28, 'Salle de conférence','Réunion de 12 personnes, vidéoprojecteur',  'En cours', NOW() - INTERVAL 1 DAY, NULL, 150000.00),
    ROW(29, 'Petit-déjeuner',     'Petit-déjeuner en chambre à 7h',            'Terminé',  NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 6000.00),
    ROW(30, 'Massage',            'Massage relaxant 1h',                       'Demande',  NOW() - INTERVAL 5 HOUR, NULL, 20000.00),
    ROW(31, 'Location de voiture','Berline avec chauffeur pour la journée',    'En cours', NOW() - INTERVAL 6 HOUR, NULL, 40000.00),
    ROW(32, 'Repassage',          '4 vêtements',                               'Terminé',  NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY, 2000.00),
    ROW(33, 'Excursion guidée',   'Visite de la ville, 4 personnes',           'Terminé',  NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, 35000.00),
    ROW(34, 'Baby-sitting',       'Garde de 2 enfants, soirée',                'Demande',  NOW() - INTERVAL 2 HOUR, NULL, 10000.00),
    ROW(35, 'Mini-bar',           'Réassort du mini-bar',                      'Terminé',  NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY, 8000.00)
) AS v(code_client, service_type, description_text, status_label, requested_at, completed_at, price_amount)
WHERE NOT EXISTS (SELECT 1 FROM app_service_request);

-- ===== mirador_reservations =====
USE mirador_reservations;
INSERT INTO visite (code_occupant, nom, prenom, observation, date_debut, date_fin)
SELECT v.* FROM (VALUES
    ROW(26, 'ABAKAR',  'Issa',    'Frère du client, visite familiale',   NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 2 HOUR),
    ROW(27, 'MVONDO',  'Pierre',  'Partenaire commercial',               NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 1 HOUR),
    ROW(28, 'NDI',     'Alice',   'Réunion de travail en salon',         NOW(),                  NOW() + INTERVAL 3 HOUR),
    ROW(29, 'KAMGA',   'Paul',    'Livraison de documents',              NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 2 HOUR),
    ROW(30, 'EYENGA',  'Rose',    'Visite amicale',                      NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 90 MINUTE),
    ROW(31, 'OWONA',   'Daniel',  'Chauffeur personnel',                 NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 4 HOUR),
    ROW(32, 'SIMO',    'Carine',  'Coiffeuse à domicile',                NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY + INTERVAL 2 HOUR),
    ROW(33, 'MOUSSA',  'Hamidou', 'Interprète',                          NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY + INTERVAL 4 HOUR),
    ROW(34, 'BASSOLE', 'Aminata', 'Cousine',                             NOW() - INTERVAL 1 HOUR, NULL),
    ROW(35, 'ZE',      'Michel',  'Collègue de bureau',                  NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY + INTERVAL 1 HOUR)
) AS v(code_occupant, nom, prenom, observation, date_debut, date_fin)
WHERE NOT EXISTS (SELECT 1 FROM visite);

-- ===== mirador_exploitation =====
USE mirador_exploitation;
INSERT INTO main_courante (entry_date, entry_time, category, priority, title, description, location, reported_by, assigned_to, status, resolution, resolved_by, resolved_at)
SELECT v.* FROM (VALUES
    ROW(CURDATE(),                  '07:15:00', 'Maintenance', 'high',   'Climatisation en panne chambre 203', 'La climatisation ne démarre plus, client mécontent.', 'Chambre 203', 'akono', 'Technicien', 'in_progress', NULL, NULL, NULL),
    ROW(CURDATE(),                  '08:40:00', 'Menage',      'medium', 'Chambre 103 non prête',              'Retard de nettoyage avant arrivée de 11h.',          'Chambre 103', 'akono', 'Gouvernante', 'open', NULL, NULL, NULL),
    ROW(CURDATE() - INTERVAL 1 DAY, '22:10:00', 'Securite',    'high',   'Porte de service mal fermée',        'Porte arrière retrouvée entrouverte à la ronde de nuit.', 'Cour arrière', 'onana', 'Chef sécurité', 'resolved', 'Serrure vérifiée et verrouillée.', 'Chef sécurité', NOW() - INTERVAL 20 HOUR),
    ROW(CURDATE() - INTERVAL 1 DAY, '14:25:00', 'Client',      'low',    'Demande d''oreillers supplémentaires', 'Chambre 201, deux oreillers demandés.',            'Chambre 201', 'akono', 'Gouvernante', 'resolved', 'Oreillers livrés.', 'Gouvernante', NOW() - INTERVAL 1 DAY),
    ROW(CURDATE() - INTERVAL 2 DAY, '19:00:00', 'Technique',   'medium', 'Wifi instable au restaurant',        'Coupures répétées pendant le service du soir.',     'Restaurant', 'essama', 'Informaticien', 'in_progress', NULL, NULL, NULL),
    ROW(CURDATE() - INTERVAL 3 DAY, '10:05:00', 'Maintenance', 'low',    'Ampoule grillée couloir 3e étage',   'À remplacer.',                                      'Couloir étage 3', 'biloa', 'Technicien', 'resolved', 'Ampoule remplacée.', 'Technicien', NOW() - INTERVAL 3 DAY),
    ROW(CURDATE() - INTERVAL 3 DAY, '16:45:00', 'Client',      'high',   'Plainte bruit chambre 302',          'Le client de la 301 se plaint du bruit.',           'Chambre 302', 'akono', 'Maître d''hôtel', 'resolved', 'Clients prévenus, calme revenu.', 'Maître d''hôtel', NOW() - INTERVAL 3 DAY),
    ROW(CURDATE() - INTERVAL 4 DAY, '06:30:00', 'Technique',   'high',   'Coupure d''eau chaude',              'Chauffe-eau principal à l''arrêt.',                 'Local technique', 'tabi', 'Plombier', 'resolved', 'Résistance remplacée.', 'Plombier', NOW() - INTERVAL 4 DAY),
    ROW(CURDATE() - INTERVAL 5 DAY, '21:15:00', 'Securite',    'medium', 'Personne non identifiée au parking', 'Rôdeur signalé, vérification faite.',               'Parking', 'onana', 'Chef sécurité', 'resolved', 'Aucun incident.', 'Chef sécurité', NOW() - INTERVAL 5 DAY),
    ROW(CURDATE() - INTERVAL 6 DAY, '09:00:00', 'Menage',      'low',    'Stock de linge à renouveler',        'Draps usés à remplacer.',                           'Lingerie', 'biloa', 'Gouvernante', 'open', NULL, NULL, NULL)
) AS v(entry_date, entry_time, category, priority, title, description, location, reported_by, assigned_to, status, resolution, resolved_by, resolved_at)
WHERE NOT EXISTS (SELECT 1 FROM main_courante);

-- ===== mirador_facturation =====
USE mirador_facturation;
INSERT INTO caisse (numero, libelle)
SELECT v.* FROM (VALUES
    ROW('C01', 'Caisse Réception'),         ROW('C02', 'Caisse Restaurant'),
    ROW('C03', 'Caisse Bar'),               ROW('C04', 'Caisse Principale'),
    ROW('C05', 'Caisse Économat'),          ROW('C06', 'Caisse Spa'),
    ROW('C07', 'Caisse Boutique'),          ROW('C08', 'Caisse Conférences'),
    ROW('C09', 'Caisse Menues Dépenses'),   ROW('C10', 'Caisse Banquet')
) AS v(numero, libelle)
WHERE NOT EXISTS (SELECT 1 FROM caisse);
INSERT INTO depot (libelle)
SELECT v.* FROM (VALUES
    ROW('Réception'), ROW('Bar'), ROW('Restaurant'), ROW('Cuisine'), ROW('Économat'),
    ROW('Lingerie'), ROW('Cave'), ROW('Housekeeping'), ROW('Maintenance'), ROW('Direction')
) AS v(libelle)
WHERE NOT EXISTS (SELECT 1 FROM depot);
INSERT IGNORE INTO lescompte (numcompte, numero, libelle_compte, solde, cumul_depot, cumul_retrait, type_compte)
SELECT * FROM (VALUES
    ROW('401001',   '401', 'Fournisseurs - Brasseries du Cameroun', -450000.00,  0.00,  450000.00, 'F'),
    ROW('401002',   '401', 'Fournisseurs - Marché central',         -185000.00,  0.00,  185000.00, 'F'),
    ROW('512001',   '512', 'Banque - Compte courant',               3250000.00, 5200000.00, 1950000.00, 'B'),
    ROW('571001',   '571', 'Caisse principale',                      820000.00, 1500000.00,  680000.00, 'K'),
    ROW('701001',   '701', 'Ventes hébergement',                    -980000.00,  0.00,  980000.00, 'P'),
    ROW('706001',   '706', 'Prestations de services',               -215000.00,  0.00,  215000.00, 'P'),
    ROW('707001',   '707', 'Ventes restaurant et bar',              -640000.00,  0.00,  640000.00, 'P'),
    ROW('411000002','411', 'Client - COTONTCHAD',                    350000.00, 350000.00,  0.00, 'C'),
    ROW('411000003','411', 'Client - TOTAL',                         260000.00, 260000.00,  0.00, 'C')
) AS v(numcompte, numero, libelle_compte, solde, cumul_depot, cumul_retrait, type_compte);
INSERT INTO operation (date_op, heure_op, numcompte, credit, debit, type_operation, num_transaction, numpiece, libelle, codejournal, code_depot)
SELECT v.* FROM (VALUES
    ROW(CURDATE() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY, '701001', 75000.00,      0.00, 'VENTE',    1001, 'F26-001', 'Hébergement chambre 102',            'VT', 1),
    ROW(CURDATE() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY, '571001',     0.00,  75000.00, 'ENCAISSEMENT', 1002, 'R26-001', 'Règlement facture F26-001',    'CA', 1),
    ROW(CURDATE() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY, '707001', 42500.00,      0.00, 'VENTE',    1003, 'F26-009', 'Restaurant - plats du jour',         'VT', 3),
    ROW(CURDATE() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY, '401001',     0.00, 450000.00, 'ACHAT',     1004, 'FA-0457', 'Achat boissons Brasseries',          'AC', 2),
    ROW(CURDATE() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, '512001', 500000.00,      0.00, 'DEPOT',     1005, 'BQ-0211', 'Versement en banque',               'BQ', 10),
    ROW(CURDATE() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY, '706001', 30000.00,       0.00, 'VENTE',    1006, 'F26-008', 'Navette aéroport',                   'VT', 1),
    ROW(CURDATE() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY, '401002',     0.00, 185000.00, 'ACHAT',     1007, 'FA-0458', 'Achat légumes et viande',            'AC', 5),
    ROW(CURDATE() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY, '571001', 120000.00,      0.00, 'RETRAIT',   1008, 'CP-0033', 'Retrait pour menues dépenses',       'CA', 10),
    ROW(CURDATE() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, '701001',105000.00,       0.00, 'VENTE',    1009, 'F26-002', 'Hébergement chambre 201',            'VT', 1),
    ROW(CURDATE(),                  NOW(),                  '411000002', 0.00, 260000.00, 'VENTE',    1010, 'F26-003', 'Facture société COTONTCHAD',         'VT', 1)
) AS v(date_op, heure_op, numcompte, credit, debit, type_operation, num_transaction, numpiece, libelle, codejournal, code_depot)
WHERE NOT EXISTS (SELECT 1 FROM operation);

-- ===== mirador_paiements =====
USE mirador_paiements;
INSERT INTO reglement (code_reg, code_facture, code_client, date_reglement, montant, libelle, type_reg, code_caisse, letype, code_depot)
SELECT v.* FROM (VALUES
    ROW('R26-001', 'F26-001', 26, NOW() - INTERVAL 8 DAY, 75000, 'Règlement séjour',          'Espèces',      1, 'Client', 1),
    ROW('R26-002', 'F26-002', 27, NOW() - INTERVAL 1 DAY, 105000, 'Règlement séjour',         'Mobile Money', 1, 'Client', 1),
    ROW('R26-003', 'F26-003', 28, NOW(),                  100000, 'Acompte société',         'Virement',     4, 'Client', 1),
    ROW('R26-004', 'F26-004', 29, NOW() - INTERVAL 1 DAY, 24000, 'Restaurant',               'Carte',        2, 'Client', 3),
    ROW('R26-005', 'F26-005', 30, NOW() - INTERVAL 1 DAY, 12000, 'Bar',                      'Espèces',      3, 'Client', 2),
    ROW('R26-006', 'F26-006', 31, NOW() - INTERVAL 3 DAY, 10000, 'Blanchisserie',            'Espèces',      1, 'Client', 1),
    ROW('R26-007', 'F26-007', 32, NOW() - INTERVAL 5 DAY, 135000, 'Règlement séjour',        'Carte',        1, 'Client', 1),
    ROW('R26-008', 'F26-008', 33, NOW() - INTERVAL 4 DAY, 30000, 'Navette aéroport',         'Virement',     4, 'Client', 1),
    ROW('R26-009', 'F26-009', 34, NOW() - INTERVAL 5 DAY, 42500, 'Restaurant',               'Mobile Money', 2, 'Client', 3),
    ROW('R26-010', 'F26-010', 35, NOW() - INTERVAL 4 DAY, 25000, 'Bar',                      'Espèces',      3, 'Client', 2)
) AS v(code_reg, code_facture, code_client, date_reglement, montant, libelle, type_reg, code_caisse, letype, code_depot)
WHERE NOT EXISTS (SELECT 1 FROM reglement);
INSERT INTO app_finance_transaction (transaction_type, category_name, description_text, amount_value, transaction_date, reference_code)
SELECT v.* FROM (VALUES
    ROW('Recette', 'Hébergement', 'Séjour chambre 102',                 75000.00,  CURDATE() - INTERVAL 8 DAY, 'F26-001'),
    ROW('Recette', 'Restaurant',  'Service du déjeuner',                 142500.00, CURDATE() - INTERVAL 6 DAY, 'RES-0612'),
    ROW('Recette', 'Bar',         'Ventes de la soirée',                  96000.00, CURDATE() - INTERVAL 5 DAY, 'BAR-0613'),
    ROW('Sortie',  'Achats',      'Achat boissons - Brasseries du Cameroun', 450000.00, CURDATE() - INTERVAL 6 DAY, 'FA-0457'),
    ROW('Sortie',  'Salaires',    'Avance sur salaires - personnel',     300000.00, CURDATE() - INTERVAL 4 DAY, 'SAL-1002'),
    ROW('Recette', 'Hébergement', 'Séjour chambre 201',                  105000.00, CURDATE() - INTERVAL 1 DAY, 'F26-002'),
    ROW('Sortie',  'Entretien',   'Réparation climatisation 203',         85000.00, CURDATE() - INTERVAL 2 DAY, 'ENT-0098'),
    ROW('Sortie',  'Énergie',     'Facture électricité du mois',         275000.00, CURDATE() - INTERVAL 3 DAY, 'ELEC-1010'),
    ROW('Recette', 'Services',    'Salle de conférence COTONTCHAD',      150000.00, CURDATE(),                  'CONF-0007'),
    ROW('Recette', 'Hébergement', 'Acompte réservation suite 301',       100000.00, CURDATE(),                  'F26-003')
) AS v(transaction_type, category_name, description_text, amount_value, transaction_date, reference_code)
WHERE NOT EXISTS (SELECT 1 FROM app_finance_transaction);

-- ===== mirador_facturation =====
USE mirador_facturation;
INSERT INTO account_plan (balance, class_name, code, created_at, name, status, type, updated_at)
SELECT v.balance, v.class_name, v.code, NOW(6), v.name, 'Actif', v.type, NOW(6)
FROM (VALUES
    ROW(3250000, 'Classe 5 - Trésorerie', '512', 'Banque',                        'Actif'),
    ROW(820000,  'Classe 5 - Trésorerie', '571', 'Caisse',                        'Actif'),
    ROW(610000,  'Classe 4 - Tiers',      '411', 'Clients',                       'Actif'),
    ROW(-635000, 'Classe 4 - Tiers',      '401', 'Fournisseurs',                  'Passif'),
    ROW(-980000, 'Classe 7 - Produits',   '701', 'Ventes d''hébergement',         'Produit'),
    ROW(-640000, 'Classe 7 - Produits',   '707', 'Ventes restaurant et bar',      'Produit'),
    ROW(-215000, 'Classe 7 - Produits',   '706', 'Prestations de services',       'Produit'),
    ROW(450000,  'Classe 6 - Charges',    '601', 'Achats de marchandises',        'Charge'),
    ROW(300000,  'Classe 6 - Charges',    '661', 'Charges de personnel',          'Charge'),
    ROW(275000,  'Classe 6 - Charges',    '605', 'Énergie et eau',                'Charge')
) AS v(balance, class_name, code, name, type)
WHERE NOT EXISTS (SELECT 1 FROM account_plan);
INSERT INTO accounting_operations (account_code, created_at, created_by, credit_amount, date, debit_amount, journal_code, label, reference, status, updated_at)
SELECT v.account_code, NOW(6), v.created_by, v.credit_amount, v.date, v.debit_amount, v.journal_code, v.label, v.reference, v.status, NOW(6)
FROM (VALUES
    ROW('701', 'mballa', 75000,  NOW() - INTERVAL 9 DAY, 0,      'VT', 'Vente hébergement F26-001',      'OP-0001', 'Valide'),
    ROW('571', 'mballa', 0,      NOW() - INTERVAL 8 DAY, 75000,  'CA', 'Encaissement F26-001',           'OP-0002', 'Valide'),
    ROW('707', 'mballa', 142500, NOW() - INTERVAL 6 DAY, 0,      'VT', 'Ventes restaurant',              'OP-0003', 'Valide'),
    ROW('601', 'mballa', 0,      NOW() - INTERVAL 6 DAY, 450000, 'AC', 'Achat boissons',                 'OP-0004', 'Valide'),
    ROW('512', 'mballa', 500000, NOW() - INTERVAL 5 DAY, 0,      'BQ', 'Versement banque',               'OP-0005', 'Valide'),
    ROW('661', 'onana',  0,      NOW() - INTERVAL 4 DAY, 300000, 'OD', 'Avance sur salaires',            'OP-0006', 'Valide'),
    ROW('605', 'onana',  0,      NOW() - INTERVAL 3 DAY, 275000, 'AC', 'Électricité',                    'OP-0007', 'Brouillon'),
    ROW('706', 'mballa', 30000,  NOW() - INTERVAL 2 DAY, 0,      'VT', 'Navette aéroport',               'OP-0008', 'Brouillon'),
    ROW('701', 'mballa', 105000, NOW() - INTERVAL 1 DAY, 0,      'VT', 'Vente hébergement F26-002',      'OP-0009', 'Brouillon'),
    ROW('411', 'mballa', 0,      NOW(),                  260000, 'VT', 'Facture société COTONTCHAD',     'OP-0010', 'Brouillon')
) AS v(account_code, created_by, credit_amount, date, debit_amount, journal_code, label, reference, status)
WHERE NOT EXISTS (SELECT 1 FROM accounting_operations);
INSERT INTO cash_book (amount, balance, created_at, created_by, date, description, time, type, updated_at)
SELECT v.amount, v.balance, NOW(6), v.created_by, v.date, v.description, v.time, v.type, NOW(6)
FROM (VALUES
    ROW(75000,   75000,   'akono',  CURDATE() - INTERVAL 8 DAY, 'Règlement séjour chambre 102', '10:15:00', 'Entrée'),
    ROW(12000,   87000,   'tabi',   CURDATE() - INTERVAL 7 DAY, 'Ventes bar',                   '23:30:00', 'Entrée'),
    ROW(20000,   67000,   'akono',  CURDATE() - INTERVAL 6 DAY, 'Achat fournitures réception', '09:05:00', 'Sortie'),
    ROW(142500,  209500,  'essama', CURDATE() - INTERVAL 6 DAY, 'Recette restaurant',           '15:00:00', 'Entrée'),
    ROW(50000,   159500,  'mballa', CURDATE() - INTERVAL 5 DAY, 'Versement en banque',          '11:40:00', 'Sortie'),
    ROW(10000,   169500,  'akono',  CURDATE() - INTERVAL 3 DAY, 'Blanchisserie',                '17:20:00', 'Entrée'),
    ROW(35000,   134500,  'biloa',  CURDATE() - INTERVAL 3 DAY, 'Produits d''entretien',        '08:30:00', 'Sortie'),
    ROW(105000,  239500,  'akono',  CURDATE() - INTERVAL 1 DAY, 'Règlement séjour chambre 201', '12:00:00', 'Entrée'),
    ROW(15000,   224500,  'akono',  CURDATE(),                  'Frais de navette',             '07:45:00', 'Sortie'),
    ROW(100000,  324500,  'mballa', CURDATE(),                  'Acompte réservation suite',    '09:30:00', 'Entrée')
) AS v(amount, balance, created_by, date, description, time, type)
WHERE NOT EXISTS (SELECT 1 FROM cash_book);

-- ===== mirador_paiements =====
USE mirador_paiements;
INSERT INTO app_cash_register_state (cash_in, cash_out, closed_at, closed_by, created_at, current_balance, opened_at, opened_by,
                                     opening_balance, register_number, scope_name, status_label, total_sales, updated_at)
SELECT v.cash_in, v.cash_out, v.closed_at, v.closed_by, NOW(6), v.current_balance, v.opened_at, v.opened_by,
       v.opening_balance, v.register_number, v.scope_name, v.status_label, v.total_sales, NOW(6)
FROM (VALUES
    ROW(185000.00, 20000.00,  NULL,                    NULL,     330000.00, NOW() - INTERVAL 6 HOUR, 'akono',  165000.00, 'C01-RECEPTION', 'RECEPTION',  'open',   185000.00),
    ROW(96000.00,  12000.00,  NULL,                    NULL,     184000.00, NOW() - INTERVAL 5 HOUR, 'essama', 100000.00, 'C02-RESTAURANT','RESTAURANT', 'open',   142500.00),
    ROW(54000.00,  8000.00,   NULL,                    NULL,     96000.00,  NOW() - INTERVAL 4 HOUR, 'tabi',   50000.00,  'C03-BAR',       'BAR',        'open',   54000.00),
    ROW(240000.00, 35000.00,  NOW() - INTERVAL 1 DAY,  'akono',  370000.00, NOW() - INTERVAL 30 HOUR,'akono',  165000.00, 'C01-RECEPTION', 'RECEPTION',  'closed', 240000.00),
    ROW(130000.00, 15000.00,  NOW() - INTERVAL 1 DAY,  'essama', 215000.00, NOW() - INTERVAL 30 HOUR,'essama', 100000.00, 'C02-RESTAURANT','RESTAURANT', 'closed', 130000.00),
    ROW(88000.00,  10000.00,  NOW() - INTERVAL 1 DAY,  'tabi',   128000.00, NOW() - INTERVAL 30 HOUR,'tabi',   50000.00,  'C03-BAR',       'BAR',        'closed', 88000.00),
    ROW(210000.00, 30000.00,  NOW() - INTERVAL 2 DAY,  'akono',  345000.00, NOW() - INTERVAL 54 HOUR,'akono',  165000.00, 'C01-RECEPTION', 'RECEPTION',  'closed', 210000.00),
    ROW(115000.00, 12000.00,  NOW() - INTERVAL 2 DAY,  'essama', 203000.00, NOW() - INTERVAL 54 HOUR,'essama', 100000.00, 'C02-RESTAURANT','RESTAURANT', 'closed', 115000.00),
    ROW(76000.00,  9000.00,   NOW() - INTERVAL 2 DAY,  'tabi',   117000.00, NOW() - INTERVAL 54 HOUR,'tabi',   50000.00,  'C03-BAR',       'BAR',        'closed', 76000.00),
    ROW(60000.00,  5000.00,   NOW() - INTERVAL 3 DAY,  'akono',  120000.00, NOW() - INTERVAL 78 HOUR,'akono',  65000.00,  'C04-PRINCIPALE','RECEPTION',  'closed', 60000.00)
) AS v(cash_in, cash_out, closed_at, closed_by, current_balance, opened_at, opened_by, opening_balance, register_number, scope_name, status_label, total_sales)
WHERE NOT EXISTS (SELECT 1 FROM app_cash_register_state);
INSERT INTO app_cash_journal (amount_value, balance_value, created_at, entry_date, description_text, reference_code, register_number,
                              scope_name, source_id, source_type, status_label, entry_type, updated_at, user_name)
SELECT v.amount_value, v.balance_value, NOW(6), v.entry_date, v.description_text, v.reference_code, v.register_number,
       v.scope_name, NULL, v.source_type, 'completed', v.entry_type, NOW(6), v.user_name
FROM (VALUES
    ROW(75000.00,  240000.00, NOW() - INTERVAL 5 HOUR, 'Règlement séjour chambre 102', 'F26-001', 'C01-RECEPTION',  'RECEPTION',  'invoice',  'income',  'akono'),
    ROW(12000.00,  252000.00, NOW() - INTERVAL 4 HOUR, 'Supplément mini-bar',           'MB-0211', 'C01-RECEPTION',  'RECEPTION',  'service',  'income',  'akono'),
    ROW(20000.00,  232000.00, NOW() - INTERVAL 3 HOUR, 'Achat fournitures',             'AF-0031', 'C01-RECEPTION',  'RECEPTION',  'expense',  'expense', 'akono'),
    ROW(48000.00,  148000.00, NOW() - INTERVAL 5 HOUR, 'Service du midi',               'RES-0801','C02-RESTAURANT', 'RESTAURANT', 'order',    'income',  'essama'),
    ROW(36000.00,  184000.00, NOW() - INTERVAL 3 HOUR, 'Service du soir',               'RES-0802','C02-RESTAURANT', 'RESTAURANT', 'order',    'income',  'essama'),
    ROW(12000.00,  172000.00, NOW() - INTERVAL 2 HOUR, 'Achat condiments',              'AF-0032', 'C02-RESTAURANT', 'RESTAURANT', 'expense',  'expense', 'essama'),
    ROW(30000.00,   80000.00, NOW() - INTERVAL 4 HOUR, 'Ventes comptoir',               'BAR-0911','C03-BAR',        'BAR',        'sale',     'income',  'tabi'),
    ROW(24000.00,  104000.00, NOW() - INTERVAL 2 HOUR, 'Ventes terrasse',               'BAR-0912','C03-BAR',        'BAR',        'sale',     'income',  'tabi'),
    ROW(8000.00,    96000.00, NOW() - INTERVAL 1 HOUR, 'Achat glaçons',                 'AF-0033', 'C03-BAR',        'BAR',        'expense',  'expense', 'tabi'),
    ROW(100000.00, 330000.00, NOW() - INTERVAL 1 HOUR, 'Acompte suite 301',             'F26-003', 'C01-RECEPTION',  'RECEPTION',  'invoice',  'income',  'akono')
) AS v(amount_value, balance_value, entry_date, description_text, reference_code, register_number, scope_name, source_type, entry_type, user_name)
WHERE NOT EXISTS (SELECT 1 FROM app_cash_journal);
INSERT INTO app_cash_transfer (amount_value, approved_by, completed_at, created_at, from_register, reason_text, requested_by, scope_name,
                               status_label, to_register, transfer_date, transfer_number, updated_at)
SELECT v.amount_value, v.approved_by, v.completed_at, NOW(6), v.from_register, v.reason_text, v.requested_by, v.scope_name,
       v.status_label, v.to_register, v.transfer_date, v.transfer_number, NOW(6)
FROM (VALUES
    ROW(100000.00, 'mballa', NOW() - INTERVAL 5 DAY, 'C01-RECEPTION',  'Versement fin de journée',         'akono',  'RECEPTION',  'completed', 'C04-PRINCIPALE', NOW() - INTERVAL 5 DAY, 'TR-2026-001'),
    ROW(50000.00,  'mballa', NOW() - INTERVAL 5 DAY, 'C02-RESTAURANT', 'Versement fin de service',         'essama', 'RESTAURANT', 'completed', 'C04-PRINCIPALE', NOW() - INTERVAL 5 DAY, 'TR-2026-002'),
    ROW(30000.00,  'mballa', NOW() - INTERVAL 4 DAY, 'C03-BAR',        'Versement fin de service',         'tabi',   'BAR',        'completed', 'C04-PRINCIPALE', NOW() - INTERVAL 4 DAY, 'TR-2026-003'),
    ROW(20000.00,  'ngono',  NOW() - INTERVAL 4 DAY, 'C04-PRINCIPALE', 'Fond de caisse bar',               'mballa', 'BAR',        'completed', 'C03-BAR',        NOW() - INTERVAL 4 DAY, 'TR-2026-004'),
    ROW(15000.00,  'ngono',  NOW() - INTERVAL 3 DAY, 'C04-PRINCIPALE', 'Fond de caisse restaurant',        'mballa', 'RESTAURANT', 'completed', 'C02-RESTAURANT', NOW() - INTERVAL 3 DAY, 'TR-2026-005'),
    ROW(80000.00,  'mballa', NOW() - INTERVAL 2 DAY, 'C01-RECEPTION',  'Versement fin de journée',         'akono',  'RECEPTION',  'completed', 'C04-PRINCIPALE', NOW() - INTERVAL 2 DAY, 'TR-2026-006'),
    ROW(25000.00,  NULL,     NULL,                   'C03-BAR',        'Versement partiel',                'tabi',   'BAR',        'pending',   'C04-PRINCIPALE', NOW() - INTERVAL 1 DAY, 'TR-2026-007'),
    ROW(40000.00,  NULL,     NULL,                   'C02-RESTAURANT', 'Versement fin de service',         'essama', 'RESTAURANT', 'pending',   'C04-PRINCIPALE', NOW() - INTERVAL 1 DAY, 'TR-2026-008'),
    ROW(10000.00,  'ngono',  NULL,                   'C04-PRINCIPALE', 'Demande annulée (erreur de montant)', 'mballa', 'RECEPTION', 'cancelled', 'C01-RECEPTION',  NOW() - INTERVAL 1 DAY, 'TR-2026-009'),
    ROW(60000.00,  NULL,     NULL,                   'C01-RECEPTION',  'Versement en cours',               'akono',  'RECEPTION',  'pending',   'C04-PRINCIPALE', NOW(),                  'TR-2026-010')
) AS v(amount_value, approved_by, completed_at, from_register, reason_text, requested_by, scope_name, status_label, to_register, transfer_date, transfer_number)
WHERE NOT EXISTS (SELECT 1 FROM app_cash_transfer);

-- ===== mirador_exploitation =====
USE mirador_exploitation;
INSERT INTO fournisseur (numero, nom, contact, solde)
SELECT v.* FROM (VALUES
    ROW('F001', 'Brasseries du Cameroun',      '+237 233 42 90 00',  450000.00),
    ROW('F002', 'Marché Central Yaoundé',      '+237 677 10 20 30',  185000.00),
    ROW('F003', 'Boulangerie Le Pain d''Or',   '+237 699 44 55 66',   32000.00),
    ROW('F004', 'Ferme Avicole Nkoabang',      '+237 655 11 22 33',   96000.00),
    ROW('F005', 'Poissonnerie du Wouri',       '+237 670 77 88 99',   54000.00),
    ROW('F006', 'Entreprise Mbarga Entretien', '+237 690 12 34 56',       0.00),
    ROW('F007', 'Papeterie Moderne',           '+237 242 23 45 67',   18000.00),
    ROW('F008', 'Distribution Eau Source Pure','+237 233 40 11 22',   27500.00),
    ROW('F009', 'Quincaillerie Générale',      '+237 674 90 80 70',   41000.00),
    ROW('F010', 'Blanchisserie Industrielle',  '+237 696 33 22 11',   63000.00)
) AS v(numero, nom, contact, solde)
WHERE NOT EXISTS (SELECT 1 FROM fournisseur);
INSERT INTO stock_boisson (code_boisson, qte, date_jour, mouvement, libelle_operation, ref_production, code_depot)
SELECT b.code_boisson, v.qte, v.date_jour, v.mouvement, v.libelle_operation, v.ref_production, v.code_depot
FROM (SELECT code_boisson, ROW_NUMBER() OVER (ORDER BY code_boisson) AS rn FROM boisson) b
JOIN (VALUES
    ROW(1,  48, NOW() - INTERVAL 9 DAY, 'ENTREE', 'Réception commande Brasseries', 'BL-0901', 2),
    ROW(2,  36, NOW() - INTERVAL 8 DAY, 'ENTREE', 'Réception commande Brasseries', 'BL-0901', 2),
    ROW(3,  12, NOW() - INTERVAL 7 DAY, 'SORTIE', 'Consommation bar',               'BAR-0701', 2),
    ROW(4,  24, NOW() - INTERVAL 7 DAY, 'SORTIE', 'Consommation restaurant',        'RES-0702', 3),
    ROW(5,  60, NOW() - INTERVAL 6 DAY, 'ENTREE', 'Réapprovisionnement',            'BL-0903', 2),
    ROW(6,   6, NOW() - INTERVAL 5 DAY, 'SORTIE', 'Casse',                          'CAS-0501', 2),
    ROW(7,  18, NOW() - INTERVAL 4 DAY, 'SORTIE', 'Consommation bar',               'BAR-0704', 2),
    ROW(8,  30, NOW() - INTERVAL 3 DAY, 'ENTREE', 'Réception commande',             'BL-0905', 7),
    ROW(9,  10, NOW() - INTERVAL 2 DAY, 'SORTIE', 'Banquet société',                'BQ-0201', 3),
    ROW(10, 20, NOW() - INTERVAL 1 DAY, 'SORTIE', 'Consommation bar',               'BAR-0707', 2)
) AS v(rn, qte, date_jour, mouvement, libelle_operation, ref_production, code_depot) ON v.rn = b.rn
WHERE NOT EXISTS (SELECT 1 FROM stock_boisson);
INSERT INTO stock_plat (code_plat, qte, date_jour, mouvement, libelle_operation, ref_production, code_depot)
SELECT p.code_plat, v.qte, v.date_jour, v.mouvement, v.libelle_operation, v.ref_production, v.code_depot
FROM (SELECT code_plat, ROW_NUMBER() OVER (ORDER BY code_plat) AS rn FROM plat) p
JOIN (VALUES
    ROW(1,  20, NOW() - INTERVAL 9 DAY, 'ENTREE', 'Production cuisine',  'PRD-0901', 4),
    ROW(2,  15, NOW() - INTERVAL 8 DAY, 'ENTREE', 'Production cuisine',  'PRD-0902', 4),
    ROW(3,   8, NOW() - INTERVAL 7 DAY, 'SORTIE', 'Service du midi',     'RES-0703', 3),
    ROW(4,  12, NOW() - INTERVAL 6 DAY, 'SORTIE', 'Service du soir',     'RES-0604', 3),
    ROW(5,  25, NOW() - INTERVAL 5 DAY, 'ENTREE', 'Production cuisine',  'PRD-0905', 4),
    ROW(6,   5, NOW() - INTERVAL 4 DAY, 'SORTIE', 'Perte (invendus)',    'PER-0401', 4),
    ROW(7,  10, NOW() - INTERVAL 3 DAY, 'SORTIE', 'Service du midi',     'RES-0307', 3),
    ROW(8,  18, NOW() - INTERVAL 2 DAY, 'ENTREE', 'Production cuisine',  'PRD-0908', 4),
    ROW(9,   9, NOW() - INTERVAL 1 DAY, 'SORTIE', 'Banquet société',     'BQ-0209', 3),
    ROW(10,  7, NOW(),                  'SORTIE', 'Service du midi',     'RES-0010', 3)
) AS v(rn, qte, date_jour, mouvement, libelle_operation, ref_production, code_depot) ON v.rn = p.rn
WHERE NOT EXISTS (SELECT 1 FROM stock_plat);
INSERT INTO app_stock_item (item_code, item_name, category_name, quantity_value, unit_name, unit_price, min_threshold, supplier_name, entity_scope, entity_reference)
SELECT v.* FROM (VALUES
    ROW('STK-001', 'Riz parfumé 25 kg',          'Épicerie',      12.00, 'sac',     18500.00,  4.00, 'Marché Central Yaoundé',      'RESTAURANT',   'CUISINE'),
    ROW('STK-002', 'Huile de palme 20 L',        'Épicerie',       6.00, 'bidon',   16000.00,  2.00, 'Marché Central Yaoundé',      'RESTAURANT',   'CUISINE'),
    ROW('STK-003', 'Poulet entier',              'Viande',        40.00, 'pièce',    3500.00, 10.00, 'Ferme Avicole Nkoabang',      'RESTAURANT',   'CUISINE'),
    ROW('STK-004', 'Poisson capitaine',          'Poisson',       18.00, 'kg',       4500.00,  5.00, 'Poissonnerie du Wouri',       'RESTAURANT',   'CUISINE'),
    ROW('STK-005', 'Bière locale 65 cl (casier)','Boissons',      30.00, 'casier',   7200.00, 10.00, 'Brasseries du Cameroun',      'BAR',          'BAR'),
    ROW('STK-006', 'Eau minérale 1,5 L (pack)',  'Boissons',      45.00, 'pack',     2400.00, 15.00, 'Distribution Eau Source Pure','BAR',          'BAR'),
    ROW('STK-007', 'Savon hôtel 30 g',           'Hygiène',      300.00, 'pièce',      150.00, 100.00,'Papeterie Moderne',          'HOUSEKEEPING', 'LINGERIE'),
    ROW('STK-008', 'Draps double 200x240',       'Linge',         24.00, 'pièce',    9500.00,  8.00, 'Blanchisserie Industrielle',  'HOUSEKEEPING', 'LINGERIE'),
    ROW('STK-009', 'Ampoule LED 9 W',            'Maintenance',   50.00, 'pièce',      900.00, 20.00, 'Quincaillerie Générale',     'STOCK_MODULE', 'MAINTENANCE'),
    ROW('STK-010', 'Papier à en-tête (rame)',    'Bureautique',    8.00, 'rame',     3200.00,  3.00, 'Papeterie Moderne',          'SERVICE',      'RECEPTION')
) AS v(item_code, item_name, category_name, quantity_value, unit_name, unit_price, min_threshold, supplier_name, entity_scope, entity_reference)
WHERE NOT EXISTS (SELECT 1 FROM app_stock_item);
INSERT INTO app_stock_movement (stock_item_id, movement_type, quantity_value, reason_text, reference_code, created_at)
SELECT i.id, v.movement_type, v.quantity_value, v.reason_text, v.reference_code, v.created_at
FROM app_stock_item i
JOIN (VALUES
    ROW('STK-001', 'ENTRY', 10.00, 'Réception commande fournisseur', 'BL-1001', NOW() - INTERVAL 9 DAY),
    ROW('STK-002', 'ENTRY',  4.00, 'Réception commande fournisseur', 'BL-1002', NOW() - INTERVAL 8 DAY),
    ROW('STK-003', 'EXIT',  10.00, 'Consommation cuisine',           'CUI-0701', NOW() - INTERVAL 7 DAY),
    ROW('STK-004', 'EXIT',   4.00, 'Consommation cuisine',           'CUI-0702', NOW() - INTERVAL 6 DAY),
    ROW('STK-005', 'ENTRY', 20.00, 'Réception commande Brasseries',  'BL-1005', NOW() - INTERVAL 5 DAY),
    ROW('STK-006', 'EXIT',  10.00, 'Consommation bar',               'BAR-0504', NOW() - INTERVAL 4 DAY),
    ROW('STK-007', 'EXIT',  60.00, 'Réassort des chambres',          'HK-0301', NOW() - INTERVAL 3 DAY),
    ROW('STK-008', 'EXIT',   4.00, 'Remplacement draps usés',        'HK-0302', NOW() - INTERVAL 2 DAY),
    ROW('STK-009', 'EXIT',   6.00, 'Remplacement ampoules étage 3',  'MNT-0101', NOW() - INTERVAL 3 DAY),
    ROW('STK-010', 'ENTRY',  5.00, 'Réception papeterie',            'BL-1010', NOW() - INTERVAL 1 DAY)
) AS v(item_code, movement_type, quantity_value, reason_text, reference_code, created_at) ON v.item_code = i.item_code
WHERE NOT EXISTS (SELECT 1 FROM app_stock_movement);
INSERT INTO app_stock_transfer (transfer_number, transfer_date, from_location, to_location, status_label, notes, requested_by, approved_by)
SELECT v.* FROM (VALUES
    ROW('TRF-2026-001', NOW() - INTERVAL 9 DAY, 'ECONOMAT', 'CUISINE',     'COMPLETED', 'Dotation hebdomadaire cuisine',        'essama', 'ngono'),
    ROW('TRF-2026-002', NOW() - INTERVAL 8 DAY, 'ECONOMAT', 'BAR',         'COMPLETED', 'Réassort du bar',                      'tabi',   'ngono'),
    ROW('TRF-2026-003', NOW() - INTERVAL 7 DAY, 'ECONOMAT', 'LINGERIE',    'COMPLETED', 'Renouvellement du linge',              'biloa',  'ngono'),
    ROW('TRF-2026-004', NOW() - INTERVAL 6 DAY, 'ECONOMAT', 'RESTAURANT',  'COMPLETED', 'Dotation du restaurant',               'essama', 'ngono'),
    ROW('TRF-2026-005', NOW() - INTERVAL 5 DAY, 'ECONOMAT', 'MAINTENANCE', 'COMPLETED', 'Petit matériel',                       'biloa',  'ngono'),
    ROW('TRF-2026-006', NOW() - INTERVAL 4 DAY, 'ECONOMAT', 'RECEPTION',   'COMPLETED', 'Fournitures de bureau',                'akono',  'ngono'),
    ROW('TRF-2026-007', NOW() - INTERVAL 3 DAY, 'ECONOMAT', 'CUISINE',     'APPROVED',  'Dotation poisson et volaille',         'essama', 'ngono'),
    ROW('TRF-2026-008', NOW() - INTERVAL 2 DAY, 'ECONOMAT', 'BAR',         'PENDING',   'Casiers de bière',                     'tabi',   NULL),
    ROW('TRF-2026-009', NOW() - INTERVAL 1 DAY, 'ECONOMAT', 'LINGERIE',    'PENDING',   'Savons et consommables',               'biloa',  NULL),
    ROW('TRF-2026-010', NOW(),                  'ECONOMAT', 'CUISINE',     'PENDING',   'Riz et huile',                         'essama', NULL)
) AS v(transfer_number, transfer_date, from_location, to_location, status_label, notes, requested_by, approved_by)
WHERE NOT EXISTS (SELECT 1 FROM app_stock_transfer);
INSERT INTO app_stock_transfer_item (transfer_id, stock_item_id, quantity_value)
SELECT t.id, i.id, v.quantity_value
FROM (VALUES
    ROW('TRF-2026-001', 'STK-001',  3.00), ROW('TRF-2026-002', 'STK-005', 10.00),
    ROW('TRF-2026-003', 'STK-008',  6.00), ROW('TRF-2026-004', 'STK-002',  2.00),
    ROW('TRF-2026-005', 'STK-009', 12.00), ROW('TRF-2026-006', 'STK-010',  2.00),
    ROW('TRF-2026-007', 'STK-004',  5.00), ROW('TRF-2026-008', 'STK-006', 12.00),
    ROW('TRF-2026-009', 'STK-007', 80.00), ROW('TRF-2026-010', 'STK-001',  2.00)
) AS v(transfer_number, item_code, quantity_value)
JOIN app_stock_transfer t ON t.transfer_number = v.transfer_number
JOIN app_stock_item i ON i.item_code = v.item_code
WHERE NOT EXISTS (SELECT 1 FROM app_stock_transfer_item);
INSERT INTO app_supplier_invoice (invoice_number, supplier_id, supplier_name, invoice_date, due_date, subtotal_amount, tax_amount, total_amount, status_label, notes, created_by)
SELECT v.invoice_number, f.code_fournisseur, f.nom, v.invoice_date, v.due_date, v.subtotal, ROUND(v.subtotal * 0.1925, 2),
       ROUND(v.subtotal * 1.1925, 2), v.status_label, v.notes, v.created_by
FROM (VALUES
    ROW('FA-0451', 'F001', NOW() - INTERVAL 20 DAY, NOW() + INTERVAL 10 DAY, 360000.00, 'Payée',      'Commande boissons du mois',   'mballa'),
    ROW('FA-0452', 'F002', NOW() - INTERVAL 18 DAY, NOW() + INTERVAL 12 DAY, 150000.00, 'Payée',      'Légumes et épicerie',         'mballa'),
    ROW('FA-0453', 'F003', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 1 DAY,   26000.00, 'Payée',      'Pain et viennoiseries',       'mballa'),
    ROW('FA-0454', 'F004', NOW() - INTERVAL 12 DAY, NOW() + INTERVAL 3 DAY,   80000.00, 'En attente', 'Volaille',                    'mballa'),
    ROW('FA-0455', 'F005', NOW() - INTERVAL 10 DAY, NOW() + INTERVAL 5 DAY,   45000.00, 'En attente', 'Poisson frais',               'mballa'),
    ROW('FA-0456', 'F007', NOW() - INTERVAL 9 DAY,  NOW() + INTERVAL 6 DAY,   15000.00, 'Payée',      'Papeterie réception',         'onana'),
    ROW('FA-0457', 'F001', NOW() - INTERVAL 6 DAY,  NOW() + INTERVAL 24 DAY, 377000.00, 'En attente', 'Boissons - réassort',         'mballa'),
    ROW('FA-0458', 'F002', NOW() - INTERVAL 3 DAY,  NOW() + INTERVAL 27 DAY, 155000.00, 'En attente', 'Légumes et viande',           'mballa'),
    ROW('FA-0459', 'F008', NOW() - INTERVAL 2 DAY,  NOW() + INTERVAL 13 DAY,  23000.00, 'En attente', 'Eau minérale',               'onana'),
    ROW('FA-0460', 'F010', NOW() - INTERVAL 1 DAY,  NOW() + INTERVAL 14 DAY,  53000.00, 'En attente', 'Blanchisserie du linge plat', 'onana')
) AS v(invoice_number, numero, invoice_date, due_date, subtotal, status_label, notes, created_by)
JOIN fournisseur f ON f.numero = v.numero
WHERE NOT EXISTS (SELECT 1 FROM app_supplier_invoice);
INSERT INTO app_supplier_invoice_item (invoice_id, item_code, item_name, category_name, quantity_value, unit_name, unit_price, total_price)
SELECT inv.id, v.item_code, v.item_name, v.category_name, v.quantity_value, v.unit_name, v.unit_price,
       ROUND(v.quantity_value * v.unit_price, 2)
FROM (VALUES
    ROW('FA-0451', 'STK-005', 'Bière locale 65 cl (casier)', 'Boissons',  50.00, 'casier',  7200.00),
    ROW('FA-0452', 'STK-002', 'Huile de palme 20 L',         'Épicerie',  5.00, 'bidon',  16000.00),
    ROW('FA-0453', 'STK-011', 'Pain baguette',               'Boulangerie',200.00,'pièce',    130.00),
    ROW('FA-0454', 'STK-003', 'Poulet entier',               'Viande',    22.00, 'pièce',   3500.00),
    ROW('FA-0455', 'STK-004', 'Poisson capitaine',           'Poisson',   10.00, 'kg',      4500.00),
    ROW('FA-0456', 'STK-010', 'Papier à en-tête (rame)',     'Bureautique',5.00, 'rame',    3000.00),
    ROW('FA-0457', 'STK-005', 'Bière locale 65 cl (casier)', 'Boissons',  52.00, 'casier',  7250.00),
    ROW('FA-0458', 'STK-001', 'Riz parfumé 25 kg',           'Épicerie',  8.00, 'sac',     18500.00),
    ROW('FA-0459', 'STK-006', 'Eau minérale 1,5 L (pack)',   'Boissons',  9.00, 'pack',     2555.56),
    ROW('FA-0460', 'STK-008', 'Draps double 200x240',        'Linge',     5.00, 'pièce',   10600.00)
) AS v(invoice_number, item_code, item_name, category_name, quantity_value, unit_name, unit_price)
JOIN app_supplier_invoice inv ON inv.invoice_number = v.invoice_number
WHERE NOT EXISTS (SELECT 1 FROM app_supplier_invoice_item);
INSERT INTO app_restaurant_order (table_number, status_label, total_amount, created_at, served_at)
SELECT v.* FROM (VALUES
    ROW(1,  'Servie',     26500.00, NOW() - INTERVAL 9 DAY,  NOW() - INTERVAL 9 DAY  + INTERVAL 40 MINUTE),
    ROW(2,  'Servie',     18000.00, NOW() - INTERVAL 7 DAY,  NOW() - INTERVAL 7 DAY  + INTERVAL 35 MINUTE),
    ROW(3,  'Servie',     42500.00, NOW() - INTERVAL 6 DAY,  NOW() - INTERVAL 6 DAY  + INTERVAL 50 MINUTE),
    ROW(4,  'Servie',     12000.00, NOW() - INTERVAL 5 DAY,  NOW() - INTERVAL 5 DAY  + INTERVAL 30 MINUTE),
    ROW(5,  'Servie',     31000.00, NOW() - INTERVAL 3 DAY,  NOW() - INTERVAL 3 DAY  + INTERVAL 45 MINUTE),
    ROW(6,  'Annulée',     9000.00, NOW() - INTERVAL 2 DAY,  NULL),
    ROW(7,  'Servie',     22500.00, NOW() - INTERVAL 1 DAY,  NOW() - INTERVAL 1 DAY  + INTERVAL 40 MINUTE),
    ROW(8,  'En cours',   28000.00, NOW() - INTERVAL 40 MINUTE, NULL),
    ROW(9,  'En attente', 15500.00, NOW() - INTERVAL 15 MINUTE, NULL),
    ROW(10, 'En attente', 19000.00, NOW() - INTERVAL 5 MINUTE,  NULL)
) AS v(table_number, status_label, total_amount, created_at, served_at)
WHERE NOT EXISTS (SELECT 1 FROM app_restaurant_order);
INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
SELECT o.id, p.code_plat, v.quantity_value, p.montant
FROM (VALUES
    ROW(1, 1, 2), ROW(2, 2, 2), ROW(3, 3, 3), ROW(4, 4, 1), ROW(5, 5, 2),
    ROW(6, 6, 1), ROW(7, 7, 2), ROW(8, 8, 3), ROW(9, 9, 1), ROW(10, 10, 2)
) AS v(table_number, plat_rank, quantity_value)
JOIN app_restaurant_order o ON o.table_number = v.table_number
JOIN (SELECT code_plat, montant, ROW_NUMBER() OVER (ORDER BY code_plat) AS rn FROM plat) p ON p.rn = v.plat_rank
WHERE NOT EXISTS (SELECT 1 FROM app_restaurant_order_item);

-- ===== data for the services that did not exist in the monolith =====
USE mirador_promotions;

INSERT INTO promotion (code, libelle, discount_type, discount_value, min_amount, start_date, end_date, usage_limit, used_count, active)
SELECT v.* FROM (VALUES
    ROW('BIENVENUE10', 'Offre de bienvenue -10 %',          'PERCENT', 10.00,    0.00, CURDATE() - INTERVAL 60 DAY, CURDATE() + INTERVAL 300 DAY, NULL, 4, 1),
    ROW('WEEKEND15',   'Week-end -15 %',                    'PERCENT', 15.00, 50000.00, CURDATE() - INTERVAL 30 DAY, CURDATE() + INTERVAL 90 DAY,  200, 37, 1),
    ROW('FIDELE20',    'Client fidele -20 %',               'PERCENT', 20.00, 100000.00, CURDATE() - INTERVAL 10 DAY, CURDATE() + INTERVAL 180 DAY, 50, 12, 1),
    ROW('NOEL25',      'Noel -25 %',                        'PERCENT', 25.00, 75000.00, '2026-12-15', '2027-01-05', 100, 0, 1),
    ROW('SEJOUR5000',  'Remise de 5 000 FCFA',              'FIXED',  5000.00, 30000.00, CURDATE() - INTERVAL 20 DAY, CURDATE() + INTERVAL 60 DAY,  NULL, 9, 1),
    ROW('AFFAIRES10K', 'Voyageurs d''affaires -10 000 FCFA','FIXED', 10000.00, 80000.00, CURDATE() - INTERVAL 90 DAY, CURDATE() + INTERVAL 270 DAY, NULL, 21, 1),
    ROW('FLASH30',     'Vente flash -30 % (epuisee)',       'PERCENT', 30.00, 40000.00, CURDATE() - INTERVAL 15 DAY, CURDATE() + INTERVAL 15 DAY,  20, 20, 1),
    ROW('RENTREE12',   'Rentree 2025 -12 % (expiree)',      'PERCENT', 12.00,    0.00, '2025-09-01', '2025-09-30', 80, 64, 1),
    ROW('GROUPE50K',   'Groupes -50 000 FCFA',              'FIXED', 50000.00, 400000.00, CURDATE() - INTERVAL 5 DAY, CURDATE() + INTERVAL 120 DAY, 10, 1, 1),
    ROW('STAFF40',     'Tarif personnel (desactive)',       'PERCENT', 40.00,    0.00, CURDATE() - INTERVAL 200 DAY, CURDATE() + INTERVAL 200 DAY, NULL, 3, 0)
) AS v(code, libelle, discount_type, discount_value, min_amount, start_date, end_date, usage_limit, used_count, active)
WHERE NOT EXISTS (SELECT 1 FROM promotion);

USE mirador_personnel;

INSERT INTO app_employee_planning (employee_id, shift_date, start_time, end_time, post_name, notes)
SELECT e.id, v.shift_date, v.start_time, v.end_time, v.post_name, v.notes
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM app_employee) e
JOIN (VALUES
    ROW(1,  CURDATE(),                  '07:00:00', '15:00:00', 'Reception',        'Equipe du matin'),
    ROW(2,  CURDATE(),                  '15:00:00', '23:00:00', 'Reception',        'Equipe du soir'),
    ROW(3,  CURDATE(),                  '06:00:00', '14:00:00', 'Housekeeping',     'Etages 1 et 2'),
    ROW(4,  CURDATE(),                  '10:00:00', '18:00:00', 'Restaurant',       'Service midi et gouter'),
    ROW(5,  CURDATE() + INTERVAL 1 DAY, '07:00:00', '15:00:00', 'Reception',        NULL),
    ROW(6,  CURDATE() + INTERVAL 1 DAY, '18:00:00', '23:59:00', 'Bar',              'Soiree'),
    ROW(7,  CURDATE() + INTERVAL 1 DAY, '08:00:00', '16:00:00', 'Maintenance',      'Climatisation chambre 203'),
    ROW(8,  CURDATE() + INTERVAL 2 DAY, '06:00:00', '14:00:00', 'Housekeeping',     'Etages 3 et 4'),
    ROW(9,  CURDATE() + INTERVAL 2 DAY, '11:00:00', '19:00:00', 'Cuisine',          'Banquet societe'),
    ROW(10, CURDATE() + INTERVAL 3 DAY, '14:00:00', '22:00:00', 'Securite',         'Ronde de nuit')
) AS v(rn, shift_date, start_time, end_time, post_name, notes) ON v.rn = e.rn
WHERE NOT EXISTS (SELECT 1 FROM app_employee_planning);

USE mirador_facturation;

-- every invoice gets its status metadata; the first ones get a creation event for the tracking view
INSERT IGNORE INTO app_invoice_meta (code_facture, statut)
SELECT code_facture, 'EMISE' FROM facture;

INSERT INTO app_invoice_event (code_facture, event_type, detail, created_at)
SELECT f.code_facture, 'CREATED', CONCAT('montant=', f.net), COALESCE(f.date_facture, NOW())
FROM facture f
WHERE NOT EXISTS (SELECT 1 FROM app_invoice_event);

USE mirador_avis;

INSERT INTO avis (client_id, reservation_id, rating, title, comment_text, status, flagged, moderation_comment, moderated_by, moderated_at, created_at)
SELECT v.* FROM (VALUES
    ROW(32, NULL, 5, 'Sejour parfait',        'Chambre impeccable, personnel adorable, petit-dejeuner excellent.', 'APPROUVE', 0, NULL, 'noubasra', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 6 DAY),
    ROW(33, NULL, 4, 'Tres bon rapport qualite-prix', 'Bon accueil, un peu de bruit le soir mais rien de grave.', 'APPROUVE', 0, NULL, 'noubasra', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 5 DAY),
    ROW(26, NULL, 5, 'Je recommande',         'Service rapide a la reception, chambre spacieuse.',               'APPROUVE', 0, NULL, 'ngono', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 4 DAY),
    ROW(27, NULL, 3, 'Correct',               'Bien situe, mais la climatisation etait bruyante.',               'APPROUVE', 0, 'Avis constructif', 'ngono', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 4 DAY),
    ROW(28, NULL, 5, 'Parfait pour les affaires', 'Salle de conference bien equipee, wifi stable.',              'APPROUVE', 0, NULL, 'noubasra', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 3 DAY),
    ROW(29, NULL, 4, 'Restaurant excellent',  'Le poulet DG etait delicieux.',                                   'EN_ATTENTE', 0, NULL, NULL, NULL, NOW() - INTERVAL 2 DAY),
    ROW(30, NULL, 2, 'Decevant',              'Attente trop longue pour le check-in.',                           'EN_ATTENTE', 0, NULL, NULL, NULL, NOW() - INTERVAL 1 DAY),
    ROW(31, NULL, 1, 'Arnaque',               'C''est une arnaque, on m''a facture un service non demande !',    'EN_ATTENTE', 1, NULL, NULL, NULL, NOW() - INTERVAL 1 DAY),
    ROW(34, NULL, 1, 'Spam',                  'Visitez mon site pour gagner de l''argent.',                      'REJETE', 0, 'Contenu publicitaire', 'noubasra', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 9 DAY),
    ROW(35, NULL, 4, 'Bonne adresse',         'Calme, propre, personnel serviable.',                             'EN_ATTENTE', 0, NULL, NULL, NULL, NOW() - INTERVAL 3 HOUR)
) AS v(client_id, reservation_id, rating, title, comment_text, status, flagged, moderation_comment, moderated_by, moderated_at, created_at)
WHERE NOT EXISTS (SELECT 1 FROM avis);

USE mirador_notifications;

INSERT INTO notification (channel, recipient, template_code, reference_key, subject, body, status, error_message, created_at, sent_at)
SELECT v.* FROM (VALUES
    ROW('EMAIL', 'abakar.mahamat@mail.cm', 'RESERVATION_CONFIRMATION', 'RES-DEMO-1', 'Confirmation de votre reservation n°DEMO-1', 'Bonjour ABAKAR MAHAMAT, votre reservation est confirmee.', 'SENT',   NULL, NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY),
    ROW('SMS',   '+237677000001',          'RESERVATION_CONFIRMATION', 'RES-DEMO-1', NULL, 'Mirador Hotel : reservation DEMO-1 confirmee.', 'SENT', NULL, NOW() - INTERVAL 9 DAY, NOW() - INTERVAL 9 DAY),
    ROW('EMAIL', 'etoa.severin@mail.cm',   'RESERVATION_CONFIRMATION', 'RES-DEMO-2', 'Confirmation de votre reservation n°DEMO-2', 'Bonjour ETOA SEVERIN, votre reservation est confirmee.', 'SENT', NULL, NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 8 DAY),
    ROW('EMAIL', 'ngando.mbia@mail.cm',    'PAYMENT_RECEIPT',          'PAY-DEMO-1', 'Recu de paiement PAY-DEMO-1', 'Nous avons bien recu votre paiement de 75 000 FCFA.', 'SENT', NULL, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
    ROW('SMS',   '+237677000002',          'PAYMENT_RECEIPT',          'PAY-DEMO-1', NULL, 'Mirador Hotel : paiement de 75 000 FCFA recu.', 'SENT', NULL, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
    ROW('EMAIL', 'fouda.therese@mail.cm',  'ARRIVAL_REMINDER',         'RES-DEMO-3-J1', 'Rappel : votre arrivee a l''Hotel Mirador', 'Nous avons le plaisir de vous accueillir demain.', 'SENT', NULL, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
    ROW('SMS',   '+237677000003',          'ARRIVAL_REMINDER',         'RES-DEMO-3-J1', NULL, 'Mirador Hotel : rappel, arrivee demain.', 'SENT', NULL, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
    ROW('SMS',   '+237677000004',          'ARRIVAL_REMINDER',         'RES-DEMO-4-J1', NULL, 'Mirador Hotel : rappel, arrivee demain.', 'FAILED', 'Operateur SMS injoignable', NOW() - INTERVAL 1 DAY, NULL),
    ROW('EMAIL', 'reservation@sabc.cm',    NULL,                       NULL, 'Offre groupes', 'Decouvrez nos tarifs groupes pour la fin d''annee.', 'SENT', NULL, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
    ROW('EMAIL', 'achats@total.cm',        NULL,                       NULL, 'Facture disponible', 'Votre facture du mois est disponible.', 'PENDING', NULL, NOW() - INTERVAL 1 HOUR, NULL)
) AS v(channel, recipient, template_code, reference_key, subject, body, status, error_message, created_at, sent_at)
WHERE NOT EXISTS (SELECT 1 FROM notification);
