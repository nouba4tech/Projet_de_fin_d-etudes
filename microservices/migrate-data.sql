-- One-time copy of the monolith data (database bd_mirador) into the per-service databases.
-- Run AFTER the services have started once (so the schemas exist):
--     mysql -u root -p --force < migrate-data.sql
-- INSERT IGNORE: safe to re-run. --force: tables that never existed in the old database are skipped
-- with an error instead of aborting the script.

-- mirador_utilisateurs
SET FOREIGN_KEY_CHECKS = 0;
INSERT IGNORE INTO mirador_utilisateurs.utilisateur SELECT * FROM bd_mirador.utilisateur;
INSERT IGNORE INTO mirador_utilisateurs.app_user_profile SELECT * FROM bd_mirador.app_user_profile;
INSERT IGNORE INTO mirador_utilisateurs.groupe SELECT * FROM bd_mirador.groupe;
INSERT IGNORE INTO mirador_utilisateurs.privilege SELECT * FROM bd_mirador.privilege;
INSERT IGNORE INTO mirador_utilisateurs.objets SELECT * FROM bd_mirador.objets;
INSERT IGNORE INTO mirador_utilisateurs.app_database_backup SELECT * FROM bd_mirador.app_database_backup;
SET FOREIGN_KEY_CHECKS = 1;

-- mirador_chambres
SET FOREIGN_KEY_CHECKS = 0;
INSERT IGNORE INTO mirador_chambres.type_chambre SELECT * FROM bd_mirador.type_chambre;
INSERT IGNORE INTO mirador_chambres.chambre SELECT * FROM bd_mirador.chambre;
INSERT IGNORE INTO mirador_chambres.app_room_status SELECT * FROM bd_mirador.app_room_status;
SET FOREIGN_KEY_CHECKS = 1;

-- mirador_clients
SET FOREIGN_KEY_CHECKS = 0;
INSERT IGNORE INTO mirador_clients.client SELECT * FROM bd_mirador.client;
INSERT IGNORE INTO mirador_clients.app_client_profile SELECT * FROM bd_mirador.app_client_profile;
SET FOREIGN_KEY_CHECKS = 1;

-- mirador_reservations
SET FOREIGN_KEY_CHECKS = 0;
INSERT IGNORE INTO mirador_reservations.occupant SELECT * FROM bd_mirador.occupant;
INSERT IGNORE INTO mirador_reservations.visite SELECT * FROM bd_mirador.visite;
INSERT IGNORE INTO mirador_reservations.occupation SELECT * FROM bd_mirador.occupation;
INSERT IGNORE INTO mirador_reservations.app_reservation_state SELECT * FROM bd_mirador.app_reservation_state;
SET FOREIGN_KEY_CHECKS = 1;

-- mirador_paiements
SET FOREIGN_KEY_CHECKS = 0;
INSERT IGNORE INTO mirador_paiements.reglement SELECT * FROM bd_mirador.reglement;
INSERT IGNORE INTO mirador_paiements.app_finance_transaction SELECT * FROM bd_mirador.app_finance_transaction;
INSERT IGNORE INTO mirador_paiements.transaction SELECT * FROM bd_mirador.transaction;
INSERT IGNORE INTO mirador_paiements.lems SELECT * FROM bd_mirador.lems;
INSERT IGNORE INTO mirador_paiements.letransfert SELECT * FROM bd_mirador.letransfert;
SET FOREIGN_KEY_CHECKS = 1;

-- mirador_facturation
SET FOREIGN_KEY_CHECKS = 0;
INSERT IGNORE INTO mirador_facturation.facture SELECT * FROM bd_mirador.facture;
INSERT IGNORE INTO mirador_facturation.detail_facture SELECT * FROM bd_mirador.detail_facture;
INSERT IGNORE INTO mirador_facturation.plan_comptable SELECT * FROM bd_mirador.plan_comptable;
INSERT IGNORE INTO mirador_facturation.lescompte SELECT * FROM bd_mirador.lescompte;
INSERT IGNORE INTO mirador_facturation.caisse SELECT * FROM bd_mirador.caisse;
INSERT IGNORE INTO mirador_facturation.operation SELECT * FROM bd_mirador.operation;
INSERT IGNORE INTO mirador_facturation.depot SELECT * FROM bd_mirador.depot;
INSERT IGNORE INTO mirador_facturation.compte_boisson SELECT * FROM bd_mirador.compte_boisson;
INSERT IGNORE INTO mirador_facturation.compte_caisse SELECT * FROM bd_mirador.compte_caisse;
INSERT IGNORE INTO mirador_facturation.compte_client SELECT * FROM bd_mirador.compte_client;
INSERT IGNORE INTO mirador_facturation.compte_divers SELECT * FROM bd_mirador.compte_divers;
INSERT IGNORE INTO mirador_facturation.compte_facture SELECT * FROM bd_mirador.compte_facture;
INSERT IGNORE INTO mirador_facturation.compte_fournisseur SELECT * FROM bd_mirador.compte_fournisseur;
INSERT IGNORE INTO mirador_facturation.compte_personnel SELECT * FROM bd_mirador.compte_personnel;
INSERT IGNORE INTO mirador_facturation.compte_plat SELECT * FROM bd_mirador.compte_plat;
INSERT IGNORE INTO mirador_facturation.compte_reglement SELECT * FROM bd_mirador.compte_reglement;
INSERT IGNORE INTO mirador_facturation.compte_service SELECT * FROM bd_mirador.compte_service;
INSERT IGNORE INTO mirador_facturation.compte_type_chambre SELECT * FROM bd_mirador.compte_type_chambre;
INSERT IGNORE INTO mirador_facturation.compte_vivre SELECT * FROM bd_mirador.compte_vivre;
SET FOREIGN_KEY_CHECKS = 1;

-- mirador_personnel
SET FOREIGN_KEY_CHECKS = 0;
INSERT IGNORE INTO mirador_personnel.app_employee SELECT * FROM bd_mirador.app_employee;
SET FOREIGN_KEY_CHECKS = 1;

-- mirador_exploitation
SET FOREIGN_KEY_CHECKS = 0;
INSERT IGNORE INTO mirador_exploitation.boisson SELECT * FROM bd_mirador.boisson;
INSERT IGNORE INTO mirador_exploitation.type_plat SELECT * FROM bd_mirador.type_plat;
INSERT IGNORE INTO mirador_exploitation.plat SELECT * FROM bd_mirador.plat;
INSERT IGNORE INTO mirador_exploitation.stock_boisson SELECT * FROM bd_mirador.stock_boisson;
INSERT IGNORE INTO mirador_exploitation.stock_plat SELECT * FROM bd_mirador.stock_plat;
INSERT IGNORE INTO mirador_exploitation.app_stock_item SELECT * FROM bd_mirador.app_stock_item;
INSERT IGNORE INTO mirador_exploitation.app_stock_movement SELECT * FROM bd_mirador.app_stock_movement;
INSERT IGNORE INTO mirador_exploitation.app_stock_transfer SELECT * FROM bd_mirador.app_stock_transfer;
INSERT IGNORE INTO mirador_exploitation.app_stock_transfer_item SELECT * FROM bd_mirador.app_stock_transfer_item;
INSERT IGNORE INTO mirador_exploitation.app_supplier_invoice SELECT * FROM bd_mirador.app_supplier_invoice;
INSERT IGNORE INTO mirador_exploitation.app_supplier_invoice_item SELECT * FROM bd_mirador.app_supplier_invoice_item;
INSERT IGNORE INTO mirador_exploitation.fournisseur SELECT * FROM bd_mirador.fournisseur;
INSERT IGNORE INTO mirador_exploitation.app_restaurant_order SELECT * FROM bd_mirador.app_restaurant_order;
INSERT IGNORE INTO mirador_exploitation.app_restaurant_order_item SELECT * FROM bd_mirador.app_restaurant_order_item;
INSERT IGNORE INTO mirador_exploitation.autre_service SELECT * FROM bd_mirador.autre_service;
INSERT IGNORE INTO mirador_exploitation.pays SELECT * FROM bd_mirador.pays;
INSERT IGNORE INTO mirador_exploitation.parametre SELECT * FROM bd_mirador.parametre;
INSERT IGNORE INTO mirador_exploitation.app_service_request SELECT * FROM bd_mirador.app_service_request;
INSERT IGNORE INTO mirador_exploitation.main_courante SELECT * FROM bd_mirador.main_courante;
SET FOREIGN_KEY_CHECKS = 1;

-- invoices copied from the monolith get the new status metadata
INSERT IGNORE INTO mirador_facturation.app_invoice_meta (code_facture, statut)
SELECT code_facture, 'EMISE' FROM mirador_facturation.facture;
