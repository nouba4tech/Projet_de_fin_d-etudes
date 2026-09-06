-- =============================================
-- MEGA SEED DATA - Mirador Hotel
-- 25 lignes par table - Contexte 100% Afrique Centrale/Ouest
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. ParamÃ¨tres
DELETE FROM parametre;
INSERT INTO parametre (idparametre, raison_sociale, activite, contact, ville, niu) VALUES
(1,'MIRADOR HOTEL YAOUNDE','HÃ´tellerie de Luxe','+237 222 33 44 55','YAOUNDE','M0123456789'),
(2,'MIRADOR NDJAMENA','Lodge & Business','+235 66 77 88 99','N\'DJAMENA','TCH-998877');

-- 2. Pays (25 pays africains)
DELETE FROM pays;
INSERT INTO pays (libelle) VALUES
('Cameroun'), ('Tchad'), ('Gabon'), ('Congo'), ('RCA'), ('GuinÃ©e Ã‰quatoriale'), ('Nigeria'), ('BÃ©nin'), ('Togo'), ('SÃ©nÃ©gal'),
('CÃ´te d\'Ivoire'), ('Mali'), ('Niger'), ('Burkina Faso'), ('GuinÃ©e'), ('Ghana'), ('Angola'), ('Maroc'), ('Tunisie'), ('Ã‰gypte'),
('Ã‰thiopie'), ('Kenya'), ('Afrique du Sud'), ('Rwanda'), ('RD Congo');

-- 3. Groupes et Objets (25 de chaque)
DELETE FROM groupe;
INSERT INTO groupe (libelle) VALUES
('ADMINISTRATEUR'), ('MAITRE D\'HOTEL'), ('RECEPTIONNISTE'), ('COMPTABLE'), ('MAGASINIER'), ('DIRECTEUR'), ('CHEF DE CUISINE'), ('BARMAN'), ('VALET DE CHAMBRE'), ('CLIENT VIP'),
('AUDITEUR'), ('CAISSIER PRINCIPAL'), ('AGENT SECURITE'), ('COMMERCIAL'), ('MAINTENANCE'), ('GOUVERNANTE'), ('BOULANGER'), ('SOMMELIER'), ('CONCIERGE'), ('CHAUFFEUR'),
('ANIMATEUR'), ('HOTE D\'ACCUEIL'), ('STAGIAIRE'), ('RH'), ('CHEF RANG');

DELETE FROM objets;
INSERT INTO objets (code_objet, libelle, type_objet) VALUES
(1,'SECURITE','MENU'), (2,'PARAMETRES','MENU'), (3,'ACHATS','MENU'), (4,'STOCKS','MENU'), (5,'PRODUCTION','MENU'),
(6,'VENTES','MENU'), (7,'CAISSE','MENU'), (8,'COMPTABILITE','MENU'), (9,'STATISTIQUES','MENU'), (10,'UTILISATEURS','MENU'),
(11,'RESERVATIONS','MENU'), (12,'CHAMBRES','MENU'), (13,'CLIENTS','MENU'), (14,'FACTURES','MENU'), (15,'RESTAURANT','MENU'),
(16,'BAR','MENU'), (17,'RH','MENU'), (18,'MAINTENANCE','MENU'), (19,'SERVICES','MENU'), (20,'RAPPORTS','MENU'),
(21,'ARCHIVES','MENU'), (22,'AUDIT','MENU'), (23,'BLANCHISSERIE','MENU'), (24,'SPA','MENU'), (25,'BOUTIQUE','MENU');

DELETE FROM privilege;
INSERT INTO privilege (code_privilege, code_groupe, code_objet, statut) VALUES
(1,1,1,'Actif'), (2,1,2,'Actif'), (3,1,3,'Actif'), (4,1,4,'Actif'), (5,1,5,'Actif'), (6,1,6,'Actif'), (7,1,7,'Actif'), (8,1,8,'Actif'), (9,1,9,'Actif'), (10,1,10,'Actif'),
(11,2,6,'Actif'), (12,3,11,'Actif'), (13,4,8,'Actif'), (14,5,4,'Actif'), (15,1,15,'Actif'), (16,1,16,'Actif'), (17,1,17,'Actif'), (18,1,18,'Actif'), (19,1,19,'Actif'), (20,1,20,'Actif'),
(21,1,21,'Actif'), (22,1,22,'Actif'), (23,1,23,'Actif'), (24,1,24,'Actif'), (25,1,25,'Actif');

-- 4. Comptes et Plan Comptable
DELETE FROM plan_comptable;
INSERT INTO plan_comptable (numero, libelle_plan) VALUES
('101','CAPITAL'), ('401','FOURNISSEURS'), ('411','CLIENTS'), ('521','BANQUE'), ('571','CAISSE'), ('601','ACHATS'), ('605','ENERGIE'), ('611','LOYER'), ('621','TRANSPORT'), ('661','SALAIRES'),
('701','VENTES'), ('706','SERVICES'), ('443','ETAT'), ('106','RESERVES'), ('211','IMMOBILISATIONS'), ('213','MATERIEL'), ('421','PERSONNEL'), ('512','BANQUE LOCALE'), ('613','ENTRETIEN'), ('616','ASSURANCE'),
('622','MISSIONS'), ('624','PUBLICITE'), ('707','PRODUITS ACC'), ('708','AUTRES PRODUITS'), ('771','PRODUITS EXCEPTION');

DELETE FROM account_plan;
INSERT INTO account_plan (code, name, type, class_name, balance, status) VALUES
('101','Capital Social','Passif','CLASSE 1',10000000,'Actif'),
('4011','SABC Cameroun','Passif','CLASSE 4',250000,'Actif'),
('4012','SAB Miller Tchad','Passif','CLASSE 4',120000,'Actif'),
('4111','Clients HÃ´tel','Actif','CLASSE 4',850000,'Actif'),
('4112','Clients SociÃ©tÃ©','Actif','CLASSE 4',2300000,'Actif'),
('5211','BICEC YaoundÃ©','Actif','CLASSE 5',5000000,'Actif'),
('5212','ECOBANK N\'Djamena','Actif','CLASSE 5',3500000,'Actif'),
('5213','UBA Douala','Actif','CLASSE 5',1200000,'Actif'),
('5711','Caisse RÃ©ception','Actif','CLASSE 5',150000,'Actif'),
('5712','Caisse Bar','Actif','CLASSE 5',85000,'Actif'),
('6011','Achats Boissons','Charge','CLASSE 6',450000,'Actif'),
('6012','Achats Vivres','Charge','CLASSE 6',350000,'Actif'),
('6051','ENEO Ã‰lectricitÃ©','Charge','CLASSE 6',185000,'Actif'),
('6052','CAMWATER Eau','Charge','CLASSE 6',45000,'Actif'),
('6111','Loyer','Charge','CLASSE 6',1200000,'Actif'),
('6211','Frais Transport','Charge','CLASSE 6',25000,'Actif'),
('6611','Salaires Personnel','Charge','CLASSE 6',4500000,'Actif'),
('7011','Ventes HÃ©bergement','Produit','CLASSE 7',12500000,'Actif'),
('7012','Ventes Restaurant','Produit','CLASSE 7',3500000,'Actif'),
('7013','Ventes Bar','Produit','CLASSE 7',2500000,'Actif'),
('7061','Prestations Services','Produit','CLASSE 7',850000,'Actif'),
('4431','Ã‰tat TVA FacturÃ©e','Passif','CLASSE 4',150000,'Actif'),
('4432','Ã‰tat TVA RÃ©cupÃ©rable','Actif','CLASSE 4',45000,'Actif'),
('5121','Banque CBC','Actif','CLASSE 5',900000,'Actif'),
('1061','RÃ©serves','Passif','CLASSE 1',500000,'Actif');

-- 5. Boissons et Plats (25 de chaque)
DELETE FROM boisson;
INSERT INTO boisson (libelle, type_boisson, prix_achat, prix_vente, code_depot, qte_stock) VALUES
('Ice Black','BIERE',12000,1000,3,25), ('Top Pamplemousse','SODDA',7500,600,3,50), ('Guinness 60cl','BIERE',16000,1500,3,15), ('Beaufort Lager','BIERE',13000,1000,3,30), ('Gala Chad','BIERE',13500,1200,3,40),
('FolÃ©rÃ© GlacÃ©','JUS',2000,500,3,100), ('Jus de Gingembre','JUS',2500,500,3,80), ('Eau Tangui 1.5L','EAU',4000,600,3,120), ('Eau Mayo 1.5L','EAU',3800,600,3,150), ('Vimto','SODDA',8500,700,3,60),
('Dâ€™jino','SODDA',8000,600,3,50), ('Castel Beer','BIERE',12000,1000,3,30), ('Kadji Beer','BIERE',12000,1000,3,25), ('MÃ¼tzig','BIERE',13000,1000,3,40), ('33 Export','BIERE',11500,800,3,100),
('Red Label','SPIRIT',45000,25000,3,5), ('Jack Daniels','SPIRIT',65000,35000,3,4), ('Martini Blanc','VIN',15000,1500,3,10), ('Veuve Clicquot','CHAMP',250000,85000,3,3), ('Bordeaux Rouge','VIN',25000,5000,3,10),
('ThÃ© Vert Touareg','CHAUD',1500,500,3,200), ('CafÃ© Arabica','CHAUD',4500,1000,3,50), ('Chocolat Chaud','CHAUD',3500,1500,3,30), ('Orangina','SODDA',9000,800,3,40), ('Coca Cola 33cl','SODDA',8500,600,3,100);

DELETE FROM type_plat;
INSERT INTO type_plat (libelle) VALUES
('Plats MitonnÃ©s'), ('Grillades Adamaoua'), ('Saveurs ForestiÃ¨res'), ('Cuisine SahÃ©lienne'), ('Fruits de Mer'),
('EntrÃ©es Chaudes'), ('EntrÃ©es Froides'), ('Desserts Tropicaux'), ('Petits DÃ©jeuners'), ('Plats du Jour'),
('SpÃ©cialitÃ©s Tchad'), ('Cuisine Ouest'), ('Volailles BraisÃ©es'), ('PÃ¢tes/Risottos'), ('Soupes/Bouillons'),
('Menu Enfant'), ('Sandwiches/Burgers'), ('Salades'), ('Accompagnements'), ('Sauces Locales'),
('Grillades Poisson'), ('Viandes Brousse'), ('Fruits Saison'), ('PÃ¢tisseries'), ('Boissons FraÃ®ches');

DELETE FROM plat;
INSERT INTO plat (libelle, montant, code_type, code_depot, qte_stock) VALUES
('NdolÃ© Royal',4500,1,1,0), ('Poulet DG YaoundÃ©',5500,1,1,0), ('Boule de Mil Sauce Rouge',3000,11,1,0), ('Kissar Tchadien',3500,11,1,0), ('Poisson BraisÃ© (Bar)',6500,21,1,0),
('Achu (NW Cam)',5000,12,1,0), ('Kpem et Noix',3000,3,1,0), ('Eru et Garri',3500,3,1,0), ('Okok SucrÃ©',3000,12,1,0), ('Soya BÅ“uf',2000,2,1,0),
('Kilichi Garoua',2500,2,1,0), ('Omelette Garnie',2500,9,1,0), ('Petit DÃ©j Mirador',3500,9,1,0), ('Salade NiÃ§oise',3500,18,1,0), ('Steak Frites',5000,10,1,0),
('Spaghetti Bolognaise',3500,14,1,0), ('Gambas Plancha',12000,5,1,0), ('Sanga MaÃ¯s',2500,3,1,0), ('CondrÃ© Porc',4500,12,1,0), ('Prunes BraisÃ©es',1500,23,1,0),
('Papaye Citron',1500,8,1,0), ('CrÃªpes Chocolat',2000,8,1,0), ('Soupe PÃªcheur',4500,15,1,0), ('Crevettes Kribi',5500,5,1,0), ('Yassa Poulet',4500,10,1,0);

-- 6. Personnel (25 employÃ©s - Noms 100% Africains)
DELETE FROM app_employee;
INSERT INTO app_employee (first_name, last_name, email, position_name, department_name, hire_date, salary_amount) VALUES
('SAMUEL','NOUBASRA','snoubasra@mirador.com','DIRECTEUR','DIRECTION','2018-01-10',1250000),
('MAHAMAT','ABAKAR','mabakar@mirador.com','SUPERVISEUR','LOGISTIQUE','2019-05-15',450000),
('KALTOUMA','ACHTA','kachta@mirador.com','RECEPTIONNISTE','ACCUEIL','2021-03-01',250000),
('NGANDO','MBIA','nmbia@mirador.com','CHEF CUISINE','CUISINE','2018-11-20',650000),
('ZAMBO','ETOUNDI','zetoundi@mirador.com','COMPTABLE','FINANCE','2020-02-14',550000),
('MVOGO','BELIBI','mbelibi@mirador.com','MAITRE D\'HOTEL','SERVICE','2019-08-10',350000),
('TCHAKOUNTE','HERVE','htchak@mirador.com','BARMAN','BAR','2022-01-05',200000),
('ETOA','SEVERIN','setoa@mirador.com','VALET','MENAGE','2021-09-12',120000),
('FOUDA','THERESE','tfouda@mirador.com','GOUVERNANTE','MENAGE','2020-06-30',280000),
('IDRISS','OUMAR','iodriss@mirador.com','CHAUFFEUR','LOGISTIQUE','2021-05-15',180000),
('BIKORO','BI-BIKORO','bbikoro@mirador.com','SECURITE','GARDE','2021-12-01',160000),
('ONANA','BELINGA','obelinga@mirador.com','RECEPTION','ACCUEIL','2022-04-10',220000),
('MESSINA','ALINE','amessina@mirador.com','SERVEUSE','SERVICE','2022-06-01',150000),
('BELLA','SYLVAIN','sbella@mirador.com','PLONGEUR','CUISINE','2022-07-20',110000),
('NKODO','FABRICE','fnkodo@mirador.com','JARDINIER','EXTERIEUR','2021-02-15',130000),
('ESSOMBA','PATRICE','pessomba@mirador.com','MAINTENANCE','TECHNIQUE','2020-11-01',280000),
('TCHUENTE','RAISSA','rtchuente@mirador.com','COMMERCIAL','VENTES','2021-08-01',420000),
('WADAI','BRAHIM','bwadai@mirador.com','ECONOME','ACHATS','2019-12-01',380000),
('SALES','MOUSSA','msales@mirador.com','AUDITEUR','FINANCE','2020-05-20',600000),
('MOUSTAPHA','ALI','amoustapha@mirador.com','CAISSIER','BAR','2022-03-15',180000),
('NKOU','SIMON','snkou@mirador.com','AGENT RH','RH','2020-09-01',480000),
('ABENA','JEANNE','jabena@mirador.com','CHEF DE RANG','SERVICE','2021-01-10',220000),
('MANGA','LOUIS','lmanga@mirador.com','BOULANGER','PRODUCTION','2020-04-12',280000),
('DEBY','IDRISSOU','ideby@mirador.com','CONCIERGE','ACCUEIL','2022-02-14',240000),
('NGUEMA','MARCEL','mnguema@mirador.com','AGENT SPA','BIEN-ETRE','2022-08-01',210000);

-- 7. Clients et Occupants
DELETE FROM client;
INSERT INTO client (nom, nom_client, type_client, solde, numero) VALUES
('ABAKAR MAHAMAT','ABAKAR MAHAMAT','Physique',15000,'411001'), ('ETOA SEVERIN','ETOA SEVERIN','Physique',0,'411002'), ('SOCIETE COTONTCHAD','COTONTCHAD','Morale',1250000,'411003'), ('TOTAL CAMEROUN','TOTAL','Morale',350000,'411004'), ('NGANDO MBIA','NGANDO MBIA','Physique',12000,'411005'),
('FOUDA THERESE','FOUDA THERESE','Physique',0,'411006'), ('TCHAKOUNTE HERVE','TCHAKOUNTE','Physique',5000,'411007'), ('SOCIETE SABC','SABC','Morale',0,'411008'), ('IDRISS OUMAR','IDRISS OUMAR','Physique',2500,'411009'), ('BELLA SYLVAIN','BELLA','Physique',0,'411010'),
('NKODO FABRICE','NKODO','Physique',18000,'411011'), ('ESSOMBA PATRICE','ESSOMBA','Physique',0,'411012'), ('TCHUENTE RAISSA','TCHUENTE','Physique',45000,'411013'), ('WADAI BRAHIM','WADAI','Physique',0,'411014'), ('SALES MOUSSA','SALES','Physique',120000,'411015'),
('MOUSTAPHA ALI','MOUSTAPHA','Physique',0,'411016'), ('NKOU SIMON','NKOU','Physique',3500,'411017'), ('ABENA JEANNE','ABENA','Physique',0,'411018'), ('MANGA LOUIS','MANGA','Physique',1500,'411019'), ('DEBY IDRISSOU','DEBY','Physique',0,'411020'),
('NGUEMA MARCEL','NGUEMA','Physique',7500,'411021'), ('YAMSI CHRISTIAN','YAMSI','Physique',0,'411022'), ('NGANDIFOND JOSEPH','NGANDIFOND','Physique',12500,'411023'), ('PAUL VINCENT','PAUL','Physique',0,'411024'), ('LOWE BERNARD','LOWE','Physique',3400,'411025');

DELETE FROM occupant;
INSERT INTO occupant (nom, prenom, sexe, nationalite, telephone) VALUES
('ABAKAR','MAHAMAT','M','Tchadienne','+235 66112233'), ('ETOA','SEVERIN','M','Camerounaise','691452145'), ('TCHAKOUNTE','HERVE','M','Camerounaise','674125896'), ('IDRISS','OUMAR','M','Tchadienne','+235 99887766'), ('FOUDA','THERESE','F','Camerounaise','699112233'),
('NGANDO','MBIA','M','Camerounaise','655443322'), ('ZAMBO','ETOUNDI','M','Camerounaise','699887766'), ('MVOGO','BELIBI','M','Camerounaise','677665544'), ('BIKORO','BI-BIKORO','M','Gabonaise','688223344'), ('ONANA','BELINGA','M','Camerounaise','699334455'),
('MESSINA','ALINE','F','Camerounaise','699001122'), ('BELLA','SYLVAIN','M','Camerounaise','677112233'), ('NKODO','FABRICE','M','Camerounaise','699445566'), ('ESSOMBA','PATRICE','M','Camerounaise','677889900'), ('TCHUENTE','RAISSA','F','Camerounaise','655223344'),
('WADAI','BRAHIM','M','Tchadienne','+235 66223344'), ('SALES','MOUSSA','M','Tchadienne','+235 99112233'), ('MOUSTAPHA','ALI','M','Tchadienne','+235 77665544'), ('NKOU','SIMON','M','Camerounaise','699554433'), ('ABENA','JEANNE','F','Camerounaise','677443322'),
('MANGA','LOUIS','M','Camerounaise','655112233'), ('DEBY','IDRISSOU','M','Tchadienne','+235 66001122'), ('NGUEMA','MARCEL','M','Equato-GuinÃ©enne','699778899'), ('YAMSI','CHRISTIAN','M','Camerounaise','677334455'), ('LOWE','BERNARD','M','Camerounaise','655667788');

-- 8. Chambres
DELETE FROM type_chambre;
INSERT INTO type_chambre (libelle, nuite, sejour, sieste, numero) VALUES
('Standard Simple', 25000, 25000, 15000, 'STD'), ('Standard Double', 35000, 35000, 20000, 'DBL'), ('Luxe Simple', 45000, 45000, 25000, 'LUXS'), ('Luxe Double', 60000, 60000, 35000, 'LUXD'), ('Suite Junior', 75000, 75000, 40000, 'SUIJ'),
('Suite Senior', 100000, 100000, 60000, 'SUIS'), ('VIP Mirador', 150000, 150000, 85000, 'VIPM'), ('Case Trad', 30000, 30000, 18000, 'CASE'), ('Appart 2P', 120000, 120000, 70000, 'APP2'), ('Appart 3P', 180000, 180000, 100000, 'APP3'),
('Chambre Twin', 40000, 40000, 22000, 'TWIN'), ('Suite SahÃ©lienne', 85000, 85000, 45000, 'SAH'), ('Case VIP Cam', 110000, 110000, 70000, 'CVIP'), ('Studio Affaires', 45000, 45000, 25000, 'STA'), ('Penthouse PH1', 350000, 350000, 200000, 'PENT'),
('Bungalow Plage', 65000, 65000, 35000, 'BUN'), ('Familiale', 55000, 55000, 30000, 'FAM'), ('Chambre Ã‰co', 15000, 15000, 10000, 'ECO'), ('Suite Royale', 250000, 250000, 150000, 'ROY'), ('PrÃ©sidentielle', 500000, 500000, 300000, 'PRES'),
('Chambre PMR', 30000, 30000, 18000, 'PMR'), ('Suite Mariage', 120000, 120000, 70000, 'WED'), ('Dortoir', 40000, 40000, 20000, 'DORT'), ('Suite Business', 90000, 90000, 50000, 'BUS'), ('Chambre Balcon', 38000, 38000, 20000, 'BAL');

DELETE FROM chambre;
INSERT INTO chambre (code_chambre, numero, code_type, type, prix) VALUES
('101','101',1,'Standard',25000), ('102','102',1,'Standard',25000), ('103','103',1,'Standard',25000), ('104','104',14,'Studio',45000), ('105','105',11,'Twin',40000),
('201','201',2,'Standard D',35000), ('202','202',2,'Standard D',35000), ('203','203',3,'Luxe S',45000), ('204','204',4,'Luxe D',60000), ('205','205',13,'Case VIP',110000),
('301','301',5,'Suite J',75000), ('302','302',5,'Suite J',75000), ('303','303',6,'Suite S',100000), ('304','304',6,'Suite S',100000), ('305','305',12,'SahÃ©lienne',85000),
('401','401',7,'VIP',150000), ('402','402',19,'Royale',250000), ('403','403',20,'PrÃ©sident',500000), ('501','501',9,'Appart 2P',120000), ('502','502',10,'Appart 3P',180000),
('B01','B1',16,'Bungalow',65000), ('F01','F1',17,'Familiale',55000), ('E01','E1',18,'Ã‰co',15000), ('P01','PH1',15,'Penthouse',350000), ('W01','W1',22,'Mariage',120000);

-- 9. Factures
DELETE FROM facture;
INSERT INTO facture (code_facture, code_client, total, net, paye) VALUES
('F26-001',1,45000,45000,1), ('F26-002',3,1250000,1250000,1), ('F26-003',4,350000,350000,0), ('F26-004',5,12000,12000,1), ('F26-005',7,5000,5000,1),
('F26-006',11,18000,18000,1), ('F26-007',13,45000,45000,1), ('F26-008',15,120000,120000,0), ('F26-009',17,3500,3500,1), ('F26-010',19,1500,1500,1),
('F26-011',21,7500,7500,1), ('F26-012',23,12500,12500,1), ('F26-013',25,3400,3400,1), ('F26-014',2,25000,25000,1), ('F26-015',6,8500,8500,1),
('F26-016',8,15000,15000,1), ('F26-017',10,1200,1200,1), ('F26-018',12,6500,6500,1), ('F26-019',14,4500,4500,1), ('F26-020',16,3000,3000,1),
('F26-021',18,22000,22000,1), ('F26-022',20,15000,15000,1), ('F26-023',22,8500,8500,1), ('F26-024',24,12000,12000,1), ('F26-025',1,30000,30000,1);

-- 10. Tables Techniques (25 lignes)
DELETE FROM compte_boisson; INSERT INTO compte_boisson (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_caisse; INSERT INTO compte_caisse (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_client; INSERT INTO compte_client (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_divers; INSERT INTO compte_divers (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_facture; INSERT INTO compte_facture (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_fournisseur; INSERT INTO compte_fournisseur (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_personnel; INSERT INTO compte_personnel (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_plat; INSERT INTO compte_plat (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_reglement; INSERT INTO compte_reglement (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_service; INSERT INTO compte_service (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_type_chambre; INSERT INTO compte_type_chambre (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM compte_vivre; INSERT INTO compte_vivre (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM lems; INSERT INTO lems (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM letransfert; INSERT INTO letransfert (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);
DELETE FROM transaction; INSERT INTO transaction (id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),(16),(17),(18),(19),(20),(21),(22),(23),(24),(25);

SET FOREIGN_KEY_CHECKS = 1;
