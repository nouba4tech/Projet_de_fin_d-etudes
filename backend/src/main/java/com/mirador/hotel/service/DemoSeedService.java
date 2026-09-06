package com.mirador.hotel.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DemoSeedService {

    private final JdbcTemplate jdbcTemplate;

    public DemoSeedService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public Map<String, Object> seedDemoData() {
        ensureFinanceTable();
        clearDemoTables();
        ensureReferenceData();

        List<Long> clientIds = jdbcTemplate.queryForList(
                "SELECT code_client FROM client ORDER BY code_client LIMIT 10", Long.class);
        List<String> roomIds = jdbcTemplate.queryForList(
                "SELECT code_chambre FROM chambre ORDER BY code_chambre LIMIT 10", String.class);
        List<Long> occupantIds = jdbcTemplate.queryForList(
                "SELECT code_occupant FROM occupant ORDER BY code_occupant LIMIT 10", Long.class);
        List<Long> menuItemIds = jdbcTemplate.queryForList(
                "SELECT code_plat FROM plat ORDER BY code_plat LIMIT 10", Long.class);

        seedClientProfiles(clientIds);
        seedRoomStatuses(roomIds);
        seedReservations(clientIds, roomIds, occupantIds);
        seedVisits(occupantIds);
        seedStockItems();
        seedFinanceTransactions();
        seedServiceRequests(clientIds);
        seedHotelServices();
        seedRestaurantOrders(menuItemIds);
        seedBackups();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Données démo chargées : 10 lignes par module (réservations, visites, stock, finances, commandes bar/restaurant).");
        response.put("counts", moduleCounts());
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> status() {
        ensureFinanceTable();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("ready", countRows("occupation") >= 10 && countRows("app_restaurant_order") >= 10);
        response.put("counts", moduleCounts());
        return response;
    }

    private void ensureFinanceTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS app_finance_transaction (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    transaction_type VARCHAR(60) NOT NULL,
                    category_name VARCHAR(120) NOT NULL,
                    description_text TEXT NOT NULL,
                    amount_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    transaction_date DATE NOT NULL,
                    reference_code VARCHAR(120) NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
    }

    private void clearDemoTables() {
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        jdbcTemplate.update("DELETE FROM app_restaurant_order_item");
        jdbcTemplate.update("DELETE FROM app_restaurant_order");
        jdbcTemplate.update("DELETE FROM app_service_request");
        jdbcTemplate.update("DELETE FROM app_finance_transaction");
        jdbcTemplate.update("DELETE FROM app_stock_item");
        jdbcTemplate.update("DELETE FROM app_database_backup");
        jdbcTemplate.update("DELETE FROM app_reservation_state");
        jdbcTemplate.update("DELETE FROM occupation");
        jdbcTemplate.update("DELETE FROM visite");
        jdbcTemplate.update("DELETE FROM autre_service");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
    }

    private void ensureReferenceData() {
        ensureTypeChambre();
        ensureChambres(10);
        ensureClients(10);
        ensureOccupants(10);
        ensureTypePlat();
        ensurePlats(10);
        ensureFactures(10);
        ensureEmployees(10);
        ensureFournisseurs(10);
        ensureBoissons(10);
    }

    private void ensureTypeChambre() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM type_chambre", Long.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.update("""
                INSERT INTO type_chambre (libelle, nuite, sejour, sieste, numero)
                VALUES ('Standard', 25000, 25000, 15000, 'STD')
                """);
    }

    private void ensureChambres(int target) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM chambre", Long.class);
        if (count != null && count >= target) {
            return;
        }
        Integer typeId = jdbcTemplate.queryForObject(
                "SELECT codetype FROM type_chambre ORDER BY codetype LIMIT 1", Integer.class);
        String[] numbers = {"101", "102", "103", "104", "105", "201", "202", "203", "204", "205"};
        for (String number : numbers) {
            jdbcTemplate.update("""
                    INSERT INTO chambre (code_chambre, numero, code_type, type, prix)
                    SELECT ?, ?, ?, 'Standard', 25000
                    FROM DUAL
                    WHERE NOT EXISTS (SELECT 1 FROM chambre WHERE code_chambre = ?)
                    """, number, number, typeId, number);
        }
    }

    private void ensureClients(int target) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM client", Long.class);
        int existing = count == null ? 0 : count.intValue();
        String[][] demoClients = {
                {"ABAKAR", "MAHAMAT", "Physique", "411001"},
                {"ETOA", "SEVERIN", "Physique", "411002"},
                {"COTONTCHAD", "SOCIETE", "Morale", "411003"},
                {"TOTAL", "CAMEROUN", "Morale", "411004"},
                {"NGANDO", "MBIA", "Physique", "411005"},
                {"FOUDA", "THERESE", "Physique", "411006"},
                {"TCHAKOUNTE", "HERVE", "Physique", "411007"},
                {"SABC", "SOCIETE", "Morale", "411008"},
                {"IDRISS", "OUMAR", "Physique", "411009"},
                {"BELLA", "SYLVAIN", "Physique", "411010"}
        };
        for (int index = existing; index < target && index < demoClients.length; index++) {
            String[] client = demoClients[index];
            jdbcTemplate.update("""
                    INSERT INTO client (nom, nom_client, type_client, solde, numero)
                    VALUES (?, ?, ?, 0, ?)
                    """,
                    client[0] + " " + client[1],
                    client[0] + " " + client[1],
                    client[2],
                    client[3]);
        }
    }

    private void ensureOccupants(int target) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM occupant", Long.class);
        int existing = count == null ? 0 : count.intValue();
        String[][] occupants = {
                {"ABAKAR", "MAHAMAT"}, {"ETOA", "SEVERIN"}, {"TCHAKOUNTE", "HERVE"},
                {"IDRISS", "OUMAR"}, {"FOUDA", "THERESE"}, {"NGANDO", "MBIA"},
                {"ZAMBO", "ETOUNDI"}, {"MVOGO", "BELIBI"}, {"BIKORO", "BI-BIKORO"}, {"ONANA", "BELINGA"}
        };
        for (int index = existing; index < target && index < occupants.length; index++) {
            jdbcTemplate.update(
                    "INSERT INTO occupant (nom, prenom, sexe, nationalite, telephone) VALUES (?, ?, 'M', 'Camerounaise', ?)",
                    occupants[index][0],
                    occupants[index][1],
                    "+237 6990000" + index);
        }
    }

    private void ensureTypePlat() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM type_plat", Long.class);
        if (count != null && count > 0) {
            return;
        }
        jdbcTemplate.update("INSERT INTO type_plat (libelle) VALUES ('Plat principal')");
    }

    private void ensurePlats(int target) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM plat", Long.class);
        if (count != null && count >= target) {
            return;
        }
        Integer typeId = jdbcTemplate.queryForObject(
                "SELECT code_type FROM type_plat ORDER BY code_type LIMIT 1", Integer.class);
        String[] names = {
                "Poulet DG", "Poisson braisé", "Ndolé", "Sauce arachide", "Riz sauce",
                "Brochettes", "Poisson fumé", "Poulet braisé", "Attiéké poisson", "Koki"
        };
        int[] prices = {4500, 5500, 4000, 3800, 3500, 4200, 6000, 5000, 4800, 3000};
        for (int index = 0; index < names.length; index++) {
            jdbcTemplate.update("""
                    INSERT INTO plat (numero, libelle, montant, code_type, code_depot, qte_stock, qte_entree, qte_sortie)
                    VALUES (?, ?, ?, ?, 1, 10, 0, 0)
                    """,
                    "PLT-" + (index + 1),
                    names[index],
                    prices[index],
                    typeId);
        }
    }

    private void ensureFactures(int target) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM facture", Long.class);
        if (count != null && count >= target) {
            return;
        }
        List<Long> clientIds = jdbcTemplate.queryForList(
                "SELECT code_client FROM client ORDER BY code_client LIMIT ?", Long.class, target);
        for (int index = 0; index < clientIds.size(); index++) {
            String code = String.format("FDEMO-%03d", index + 1);
            jdbcTemplate.update("""
                    INSERT INTO facture (code_facture, code_client, total, net, paye)
                    SELECT ?, ?, 75000, 75000, 1
                    FROM DUAL
                    WHERE NOT EXISTS (SELECT 1 FROM facture WHERE code_facture = ?)
                    """,
                    code,
                    clientIds.get(index),
                    code);
        }
    }

    private void ensureEmployees(int target) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM app_employee", Long.class);
        if (count != null && count >= target) {
            return;
        }
        String[][] employees = {
                {"SAMUEL", "NOUBASRA", "DIRECTEUR", "DIRECTION"},
                {"KALTOUMA", "ACHTA", "RECEPTIONNISTE", "ACCUEIL"},
                {"NGANDO", "MBIA", "CHEF CUISINE", "CUISINE"},
                {"ZAMBO", "ETOUNDI", "COMPTABLE", "FINANCE"},
                {"TCHAKOUNTE", "HERVE", "BARMAN", "BAR"},
                {"FOUDA", "THERESE", "GOUVERNANTE", "MENAGE"},
                {"ETOA", "SEVERIN", "VALET", "MENAGE"},
                {"IDRISS", "OUMAR", "CHAUFFEUR", "LOGISTIQUE"},
                {"WADAI", "BRAHIM", "ECONOME", "ACHATS"},
                {"MESSINA", "ALINE", "SERVEUSE", "SERVICE"}
        };
        for (String[] employee : employees) {
            jdbcTemplate.update("""
                    INSERT INTO app_employee (first_name, last_name, email, position_name, department_name, hire_date, salary_amount)
                    SELECT ?, ?, ?, ?, ?, '2022-01-01', 250000
                    FROM DUAL
                    WHERE NOT EXISTS (
                        SELECT 1 FROM app_employee WHERE first_name = ? AND last_name = ?
                    )
                    """,
                    employee[0],
                    employee[1],
                    (employee[0] + "." + employee[1] + "@mirador.cm").toLowerCase(),
                    employee[2],
                    employee[3],
                    employee[0],
                    employee[1]);
        }
    }

    private void ensureFournisseurs(int target) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM fournisseur", Long.class);
        if (count != null && count >= target) {
            return;
        }
        String[][] suppliers = {
                {"FOUR-001", "SABC", "Douala"}, {"FOUR-002", "GUINNESS", "Douala"},
                {"FOUR-003", "CHOCOCAM", "Yaoundé"}, {"FOUR-004", "GLOBAL NET", "Yaoundé"},
                {"FOUR-005", "CADY SERVICES", "Yaoundé"}, {"FOUR-006", "SOFAVINC", "Douala"},
                {"FOUR-007", "CAMLAIT", "Yaoundé"}, {"FOUR-008", "SOCUCAM", "Douala"},
                {"FOUR-009", "NESTLE", "Douala"}, {"FOUR-010", "TECH SERVICES", "Yaoundé"}
        };
        for (String[] supplier : suppliers) {
            jdbcTemplate.update("""
                    INSERT INTO fournisseur (numero, nom, contact, solde)
                    SELECT ?, ?, ?, 0
                    FROM DUAL
                    WHERE NOT EXISTS (SELECT 1 FROM fournisseur WHERE numero = ?)
                    """,
                    supplier[0],
                    supplier[1],
                    supplier[2],
                    supplier[0]);
        }
    }

    private void ensureBoissons(int target) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM boisson", Long.class);
        if (count != null && count >= target) {
            return;
        }
        String[][] drinks = {
                {"Ice Black", "BIERE", "1000"}, {"Guinness", "BIERE", "1500"}, {"Beaufort", "BIERE", "1000"},
                {"Top Pamplemousse", "SODA", "600"}, {"Coca-Cola", "SODA", "500"}, {"Fanta", "SODA", "500"},
                {"Eau minérale 1.5L", "EAU", "400"}, {"Castel", "BIERE", "1000"},
                {"Jus bissap", "JUS", "800"}, {"Whisky local", "ALCOOL", "3500"}
        };
        for (String[] drink : drinks) {
            int salePrice = Integer.parseInt(drink[2]);
            jdbcTemplate.update("""
                    INSERT INTO boisson (libelle, type_boisson, prix_achat, prix_vente, code_depot, qte_stock)
                    SELECT ?, ?, ?, ?, 3, 25
                    FROM DUAL
                    WHERE NOT EXISTS (SELECT 1 FROM boisson WHERE libelle = ?)
                    """,
                    drink[0],
                    drink[1],
                    salePrice * 10,
                    salePrice,
                    drink[0]);
        }
    }

    private void seedClientProfiles(List<Long> clientIds) {
        String[] emails = {
                "abakar@mirador.cm", "etoa@mirador.cm", "cotontchad@mirador.cm", "total@mirador.cm",
                "ngando@mirador.cm", "tfouda@mirador.cm", "htchak@mirador.cm", "sabc@mirador.cm",
                "iomar@mirador.cm", "sbella@mirador.cm"
        };
        for (int index = 0; index < clientIds.size(); index++) {
            Long clientId = clientIds.get(index);
            jdbcTemplate.update("""
                    INSERT INTO app_client_profile (code_client, email, address_line, status_label, created_at)
                    VALUES (?, ?, 'Yaoundé, Cameroun', 'Actif', NOW())
                    ON DUPLICATE KEY UPDATE email = VALUES(email), status_label = 'Actif'
                    """,
                    clientId,
                    emails[Math.min(index, emails.length - 1)]);
        }
    }

    private void seedRoomStatuses(List<String> roomIds) {
        String[] statuses = {"Occupée", "Disponible", "Occupée", "Disponible", "Maintenance",
                "Occupée", "Disponible", "Occupée", "Disponible", "Occupée"};
        for (int index = 0; index < roomIds.size(); index++) {
            String roomId = roomIds.get(index);
            jdbcTemplate.update("""
                    INSERT INTO app_room_status (code_chambre, status_label, cleaning_status, capacity_value)
                    VALUES (?, ?, 'Prêt', 2)
                    ON DUPLICATE KEY UPDATE status_label = VALUES(status_label)
                    """,
                    roomId,
                    statuses[Math.min(index, statuses.length - 1)]);
        }
    }

    private void seedReservations(List<Long> clientIds, List<String> roomIds, List<Long> occupantIds) {
        String[] statuses = {"Confirmée", "Check-in", "Check-out", "Payée", "Confirmée",
                "Check-in", "Confirmée", "Payée", "Check-out", "Confirmée"};
        String[] factures = {
                "FDEMO-001", "FDEMO-002", "FDEMO-003", "FDEMO-004", "FDEMO-005",
                "FDEMO-006", "FDEMO-007", "FDEMO-008", "FDEMO-009", "FDEMO-010"
        };
        LocalDate baseDate = LocalDate.now().minusDays(2);
        int rows = Math.min(10, Math.min(clientIds.size(), roomIds.size()));
        for (int index = 0; index < rows; index++) {
            LocalDate checkIn = baseDate.plusDays(index);
            LocalDate checkOut = checkIn.plusDays(3);
            Long occupantId = occupantIds.isEmpty() ? null : occupantIds.get(index % occupantIds.size());
            jdbcTemplate.update("""
                    INSERT INTO occupation (
                        code_client, code_chambre, date_debut, date_fin, status, type_service, qte,
                        code_occupant, code_facture, observation
                    ) VALUES (?, ?, ?, ?, 'Actif', 'NUITE', 3, ?, ?, ?)
                    """,
                    clientIds.get(index),
                    roomIds.get(index),
                    Timestamp.valueOf(checkIn.atTime(14, 0)),
                    Timestamp.valueOf(checkOut.atTime(11, 0)),
                    occupantId,
                    factures[Math.min(index, factures.length - 1)],
                    "Réservation démo " + (index + 1));

            Long occupationId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            int nights = Math.max(1, (int) java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut));
            jdbcTemplate.update("""
                    INSERT INTO app_reservation_state (occupation_code, status_label, total_amount, created_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    occupationId,
                    statuses[Math.min(index, statuses.length - 1)],
                    BigDecimal.valueOf(25000L * nights),
                    Timestamp.valueOf(checkIn.atStartOfDay()));
        }
    }

    private void seedVisits(List<Long> occupantIds) {
        String[][] visits = {
                {"DANG", "ALAIN", "Réunion commerciale"}, {"MBOUM", "CLAIRE", "Livraison fournisseur"},
                {"NDJOCK", "PIERRE", "Maintenance"}, {"FOTSING", "MARIE", "Visite famille"},
                {"ABENA", "PAUL", "Audit interne"}, {"TCHOUA", "ERIC", "Prospection"},
                {"MANGA", "SYLVIE", "Formation"}, {"OUMAR", "HASSAN", "Contrôle qualité"},
                {"BELLO", "GRACE", "Agence voyage"}, {"KAMGA", "JOSEPH", "Réunion direction"}
        };
        for (int index = 0; index < visits.length; index++) {
            Long occupantId = occupantIds.isEmpty() ? null : occupantIds.get(index % occupantIds.size());
            LocalDateTime start = LocalDateTime.now().minusDays(index).withHour(9).withMinute(0);
            LocalDateTime end = index % 2 == 0 ? start.plusHours(2) : null;
            jdbcTemplate.update("""
                    INSERT INTO visite (code_occupant, nom, prenom, observation, date_debut, date_fin)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    occupantId,
                    visits[index][0],
                    visits[index][1],
                    visits[index][2],
                    Timestamp.valueOf(start),
                    end == null ? null : Timestamp.valueOf(end));
        }
    }

    private void seedStockItems() {
        Object[][] items = {
                {"ART-001", "Serviettes bain", "Linge", 120, "pièces", 3500},
                {"ART-002", "Draps king size", "Linge", 80, "pièces", 8500},
                {"ART-003", "Gel douche", "Consommables", 200, "unités", 1200},
                {"ART-004", "Shampoing", "Consommables", 180, "unités", 1200},
                {"ART-005", "Papier toilette", "Consommables", 500, "rouleaux", 450},
                {"ART-006", "Café moulu", "Restauration", 45, "sachets", 6500},
                {"ART-007", "Huile 5L", "Restauration", 25, "bidons", 8500},
                {"ART-008", "Détergent", "Entretien", 35, "litres", 2800},
                {"ART-009", "Ampoules LED", "Maintenance", 60, "pièces", 1500},
                {"ART-010", "Sacs poubelle", "Entretien", 90, "paquets", 2200}
        };
        for (Object[] item : items) {
            jdbcTemplate.update("""
                    INSERT INTO app_stock_item (
                        item_code, item_name, category_name, quantity_value, unit_name, unit_price,
                        min_threshold, supplier_name, entity_scope, last_updated
                    ) VALUES (?, ?, ?, ?, ?, ?, 10, 'Fournisseur Mirador', 'STOCK_MODULE', NOW())
                    """,
                    item[0], item[1], item[2], item[3], item[4], item[5]);
        }
    }

    private void seedFinanceTransactions() {
        String[][] transactions = {
                {"Entrée", "Hébergement", "Encaissement chambre", "75000", "ENC-001"},
                {"Entrée", "Restaurant", "Ticket restaurant", "18500", "ENC-002"},
                {"Entrée", "Bar", "Vente bar soirée", "42000", "ENC-003"},
                {"Sortie", "Achats", "Facture SABC", "125000", "DEC-001"},
                {"Sortie", "Salaires", "Avance personnel", "85000", "DEC-002"},
                {"Entrée", "Services", "Blanchisserie", "12000", "ENC-004"},
                {"Sortie", "Entretien", "Maintenance clim", "45000", "DEC-003"},
                {"Entrée", "Hébergement", "Groupe entreprise", "350000", "ENC-005"},
                {"Sortie", "Fournitures", "Produits entretien", "28000", "DEC-004"},
                {"Entrée", "Bar", "Cocktail VIP", "95000", "ENC-006"}
        };
        LocalDate date = LocalDate.now().minusDays(5);
        for (int index = 0; index < transactions.length; index++) {
            String[] row = transactions[index];
            jdbcTemplate.update("""
                    INSERT INTO app_finance_transaction (
                        transaction_type, category_name, description_text, amount_value, transaction_date, reference_code, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())
                    """,
                    row[0],
                    row[1],
                    row[2],
                    new BigDecimal(row[3]),
                    java.sql.Date.valueOf(date.plusDays(index)),
                    row[4]);
        }
    }

    private void seedServiceRequests(List<Long> clientIds) {
        String[][] services = {
                {"housekeeping", "Changement draps", "Terminé", "0"},
                {"room_service", "Petit-déjeuner chambre", "En cours", "8500"},
                {"laundry", "Pressing costume", "Demandé", "12000"},
                {"transport", "Navette aéroport", "Confirmé", "25000"},
                {"maintenance", "Climatisation bruyante", "En cours", "0"},
                {"housekeeping", "Nettoyage supplémentaire", "Terminé", "5000"},
                {"room_service", "Dîner room service", "Demandé", "22000"},
                {"laundry", "Blanchisserie express", "Terminé", "8000"},
                {"transport", "Taxi centre-ville", "Confirmé", "5000"},
                {"maintenance", "Réparation serrure", "En cours", "0"}
        };
        for (int index = 0; index < services.length; index++) {
            Long clientId = clientIds.get(index % clientIds.size());
            jdbcTemplate.update("""
                    INSERT INTO app_service_request (
                        code_client, service_type, description_text, status_label, requested_at, price_amount
                    ) VALUES (?, ?, ?, ?, NOW(), ?)
                    """,
                    clientId,
                    services[index][0],
                    services[index][1],
                    services[index][2],
                    new BigDecimal(services[index][3]));
        }
    }

    private void seedHotelServices() {
        String[][] services = {
                {"SRV-001", "Blanchisserie express", "8000"},
                {"SRV-002", "Pressing complet", "12000"},
                {"SRV-003", "Navette aéroport", "25000"},
                {"SRV-004", "Room service petit-déjeuner", "8500"},
                {"SRV-005", "Massage spa 1h", "35000"},
                {"SRV-006", "Location salle réunion", "150000"},
                {"SRV-007", "Parking sécurisé", "5000"},
                {"SRV-008", "Baby-sitting 2h", "15000"},
                {"SRV-009", "Late check-out", "20000"},
                {"SRV-010", "Décoration anniversaire", "45000"}
        };
        for (String[] service : services) {
            jdbcTemplate.update(
                    "INSERT INTO autre_service (numero, libelle, prix_service) VALUES (?, ?, ?)",
                    service[0],
                    service[1],
                    new BigDecimal(service[2]));
        }
    }

    private void seedRestaurantOrders(List<Long> menuItemIds) {
        if (menuItemIds.isEmpty()) {
            return;
        }
        String[] statuses = {"Payé", "Payé", "Payé", "Payé", "Payé", "Servi", "En attente", "Payé", "Payé", "Payé"};
        int[] tables = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        int[] totals = {8500, 12000, 15500, 9800, 22000, 7500, 6500, 18500, 14200, 31000};
        for (int index = 0; index < 10; index++) {
            boolean paid = "Payé".equals(statuses[index]) || "Servi".equals(statuses[index]);
            jdbcTemplate.update("""
                    INSERT INTO app_restaurant_order (table_number, status_label, total_amount, created_at, served_at)
                    VALUES (?, ?, ?, NOW(), ?)
                    """,
                    tables[index],
                    statuses[index],
                    totals[index],
                    paid ? Timestamp.valueOf(LocalDateTime.now()) : null);

            Long orderId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            Long menuItemId = menuItemIds.get(index % menuItemIds.size());
            jdbcTemplate.update("""
                    INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
                    VALUES (?, ?, 2, ?)
                    """,
                    orderId,
                    menuItemId,
                    totals[index] / 2);
        }
    }

    private void seedBackups() {
        for (int index = 1; index <= 10; index++) {
            jdbcTemplate.update("""
                    INSERT INTO app_database_backup (label, created_at, status, size_in_bytes, file_name)
                    VALUES (?, NOW(), 'Disponible', ?, ?)
                    """,
                    "Sauvegarde démo " + index,
                    50_000_000L + (index * 100_000L),
                    "mirador_demo_" + index + ".sql");
        }
    }

    private Map<String, Long> moduleCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("clients", countRows("client"));
        counts.put("chambres", countRows("chambre"));
        counts.put("reservations", countRows("occupation"));
        counts.put("visites", countRows("visite"));
        counts.put("stockItems", safeCount("app_stock_item"));
        counts.put("financeTransactions", safeCount("app_finance_transaction"));
        counts.put("serviceRequests", countRows("app_service_request"));
        counts.put("hotelServices", countRows("autre_service"));
        counts.put("restaurantOrders", countRows("app_restaurant_order"));
        counts.put("employees", countRows("app_employee"));
        counts.put("boissons", countRows("boisson"));
        counts.put("plats", countRows("plat"));
        counts.put("fournisseurs", countRows("fournisseur"));
        counts.put("backups", countRows("app_database_backup"));
        return counts;
    }

    private long safeCount(String tableName) {
        try {
            return countRows(tableName);
        } catch (Exception exception) {
            return 0L;
        }
    }

    private long countRows(String tableName) {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
        return count == null ? 0L : count;
    }
}
