package com.mirador.hotel.repository;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ParametresRepository {

    private final JdbcTemplate jdbcTemplate;

    public ParametresRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ===== ROOM TYPES =====

    public List<ParametresDtos.RoomTypeResponse> findAllRoomTypes() {
        return jdbcTemplate.query("""
                SELECT codetype, libelle, nuite, sejour, sieste, numero
                FROM type_chambre
                ORDER BY codetype
                """, (rs, rowNum) -> new ParametresDtos.RoomTypeResponse(
                String.valueOf(rs.getInt("codetype")),
                ValueUtils.coalesce(rs.getString("numero"), "T" + rs.getInt("codetype")),
                ValueUtils.coalesce(rs.getString("libelle"), "Standard"),
                null,
                null,
                ValueUtils.bigDecimal(rs.getBigDecimal("nuite")),
                List.of(),
                "active",
                null,
                null,
                null
        ));
    }

    public Optional<ParametresDtos.RoomTypeResponse> findRoomTypeById(String id) {
        int typeId;
        try { typeId = Integer.parseInt(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("""
                SELECT codetype, libelle, nuite, sejour, sieste, numero
                FROM type_chambre WHERE codetype = ?
                """, (rs, rowNum) -> new ParametresDtos.RoomTypeResponse(
                String.valueOf(rs.getInt("codetype")),
                ValueUtils.coalesce(rs.getString("numero"), "T" + rs.getInt("codetype")),
                ValueUtils.coalesce(rs.getString("libelle"), "Standard"),
                null, null,
                ValueUtils.bigDecimal(rs.getBigDecimal("nuite")),
                List.of(), "active", null, null, null
        ), typeId).stream().findFirst();
    }

    public int createRoomType(ParametresDtos.RoomTypeRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO type_chambre (libelle, nuite, sejour, sieste, numero) VALUES (?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, ValueUtils.trimToNull(request.name()));
            ps.setBigDecimal(2, request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO);
            ps.setBigDecimal(3, request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO);
            ps.setBigDecimal(4, request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO);
            ps.setString(5, ValueUtils.trimToNull(request.code()));
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant du type de chambre.");
        return key.intValue();
    }

    public void updateRoomType(String id, ParametresDtos.RoomTypeRequest request) {
        int typeId;
        try { typeId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }

        jdbcTemplate.update("UPDATE type_chambre SET libelle = ?, nuite = ?, sejour = ?, sieste = ?, numero = ? WHERE codetype = ?",
                ValueUtils.trimToNull(request.name()),
                request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO,
                request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO,
                request.basePrice() != null ? request.basePrice() : BigDecimal.ZERO,
                ValueUtils.trimToNull(request.code()),
                typeId);
    }

    public void deleteRoomType(String id) {
        int typeId;
        try { typeId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM type_chambre WHERE codetype = ?", typeId);
    }

    // ===== ROOMS =====

    public List<ParametresDtos.RoomResponse> findAllRooms(String status) {
        String sql = """
                SELECT c.code_chambre, COALESCE(t.libelle, CONCAT('Type ', COALESCE(c.code_type, 0))) AS room_type,
                       COALESCE(t.codetype, 0) AS type_id, c.code_type,
                       COALESCE(arr.status_label, 'Disponible') AS room_status,
                       COALESCE(arr.cleaning_status, 'Pret') AS cleaning_status,
                       arr.description_text, arr.capacity_value
                FROM chambre c
                LEFT JOIN type_chambre t ON t.codetype = c.code_type
                LEFT JOIN app_room_status arr ON arr.code_chambre = c.code_chambre
                """ + (status != null ? " WHERE COALESCE(arr.status_label, 'Disponible') = ?" : "") +
                " ORDER BY c.code_chambre";

        if (status != null) {
            return jdbcTemplate.query(sql, (rs, rowNum) -> mapRoomResponse(rs), status);
        }
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapRoomResponse(rs));
    }

    private ParametresDtos.RoomResponse mapRoomResponse(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new ParametresDtos.RoomResponse(
                rs.getString("code_chambre"),
                rs.getString("code_chambre"),
                String.valueOf(rs.getInt("type_id")),
                ValueUtils.coalesce(rs.getString("room_type"), "Standard"),
                null,
                ValueUtils.coalesce(rs.getString("room_status"), "Disponible"),
                ValueUtils.coalesce(rs.getString("cleaning_status"), "Pret"),
                rs.getString("description_text"),
                null, null, null
        );
    }

    public Optional<ParametresDtos.RoomResponse> findRoomById(String id) {
        return jdbcTemplate.query("""
                SELECT c.code_chambre, COALESCE(t.libelle, CONCAT('Type ', COALESCE(c.code_type, 0))) AS room_type,
                       COALESCE(t.codetype, 0) AS type_id, c.code_type,
                       COALESCE(arr.status_label, 'Disponible') AS room_status,
                       COALESCE(arr.cleaning_status, 'Pret') AS cleaning_status,
                       arr.description_text, arr.capacity_value
                FROM chambre c
                LEFT JOIN type_chambre t ON t.codetype = c.code_type
                LEFT JOIN app_room_status arr ON arr.code_chambre = c.code_chambre
                WHERE c.code_chambre = ?
                """, (rs, rowNum) -> mapRoomResponse(rs), id).stream().findFirst();
    }

    public void createRoom(ParametresDtos.RoomRequest request) {
        int typeId = resolveRoomTypeId(request.roomTypeId());
        jdbcTemplate.update("INSERT INTO chambre (code_chambre, code_type) VALUES (?, ?)",
                request.number().trim(), typeId);
    }

    public void updateRoom(String id, ParametresDtos.RoomRequest request) {
        int typeId = resolveRoomTypeId(request.roomTypeId());
        jdbcTemplate.update("UPDATE chambre SET code_type = ? WHERE code_chambre = ?", typeId, id);
    }

    public void deleteRoom(String id) {
        jdbcTemplate.update("DELETE FROM app_room_status WHERE code_chambre = ?", id);
        jdbcTemplate.update("DELETE FROM chambre WHERE code_chambre = ?", id);
    }

    private int resolveRoomTypeId(String roomTypeId) {
        if (roomTypeId == null || roomTypeId.isBlank()) return 1;
        try {
            return Integer.parseInt(roomTypeId);
        } catch (NumberFormatException e) {
            return 1;
        }
    }

    // ===== PERSONNEL =====

    public List<ParametresDtos.PersonnelResponse> findAllPersonnel(String status) {
        String sql = "SELECT id, first_name, last_name, email, phone, position_name, department_name, hire_date, salary_amount, status_label, role_name FROM app_employee";
        if (status != null) sql += " WHERE status_label = ?";
        sql += " ORDER BY id DESC";

        if (status != null) {
            return jdbcTemplate.query(sql, (rs, rowNum) -> mapPersonnel(rs), status);
        }
        return jdbcTemplate.query(sql, (rs, rowNum) -> mapPersonnel(rs));
    }

    private ParametresDtos.PersonnelResponse mapPersonnel(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new ParametresDtos.PersonnelResponse(
                String.valueOf(rs.getLong("id")),
                "EMP-" + rs.getLong("id"),
                ValueUtils.coalesce(rs.getString("first_name"), ""),
                ValueUtils.coalesce(rs.getString("last_name"), ""),
                ValueUtils.trimToNull(rs.getString("email")),
                ValueUtils.trimToNull(rs.getString("phone")),
                ValueUtils.coalesce(rs.getString("position_name"), ""),
                ValueUtils.coalesce(rs.getString("department_name"), ""),
                rs.getDate("hire_date") != null ? rs.getDate("hire_date").toLocalDate() : null,
                ValueUtils.bigDecimal(rs.getBigDecimal("salary_amount")),
                ValueUtils.coalesce(rs.getString("status_label"), "Actif"),
                List.of(), null, null
        );
    }

    public Optional<ParametresDtos.PersonnelResponse> findPersonnelById(String id) {
        long empId;
        try { empId = Long.parseLong(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("""
                SELECT id, first_name, last_name, email, phone, position_name, department_name, hire_date, salary_amount, status_label, role_name
                FROM app_employee WHERE id = ?
                """, (rs, rowNum) -> mapPersonnel(rs), empId).stream().findFirst();
    }

    public long createPersonnel(ParametresDtos.PersonnelRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("""
                    INSERT INTO app_employee (first_name, last_name, email, phone, position_name, department_name, hire_date, salary_amount, status_label, role_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, request.firstName().trim());
            ps.setString(2, request.lastName().trim());
            ps.setString(3, ValueUtils.trimToNull(request.email()));
            ps.setString(4, ValueUtils.trimToNull(request.phone()));
            ps.setString(5, request.position().trim());
            ps.setString(6, ValueUtils.coalesce(request.department(), "General"));
            ps.setDate(7, request.hireDate() != null ? java.sql.Date.valueOf(request.hireDate()) : java.sql.Date.valueOf(java.time.LocalDate.now()));
            ps.setBigDecimal(8, request.salary() != null ? request.salary() : BigDecimal.ZERO);
            ps.setString(9, ValueUtils.coalesce(request.status(), "Actif"));
            ps.setString(10, "Service");
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant de l'employe.");
        return key.longValue();
    }

    public void updatePersonnel(String id, ParametresDtos.PersonnelRequest request) {
        long empId;
        try { empId = Long.parseLong(id); } catch (NumberFormatException e) { return; }

        jdbcTemplate.update("""
                UPDATE app_employee SET first_name = ?, last_name = ?, email = ?, phone = ?, position_name = ?,
                    department_name = ?, hire_date = ?, salary_amount = ?, status_label = ?
                WHERE id = ?
                """,
                request.firstName().trim(), request.lastName().trim(),
                ValueUtils.trimToNull(request.email()), ValueUtils.trimToNull(request.phone()),
                request.position().trim(), ValueUtils.coalesce(request.department(), "General"),
                request.hireDate() != null ? java.sql.Date.valueOf(request.hireDate()) : null,
                request.salary() != null ? request.salary() : BigDecimal.ZERO,
                ValueUtils.coalesce(request.status(), "Actif"),
                empId);
    }

    public void deletePersonnel(String id) {
        long empId;
        try { empId = Long.parseLong(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM app_employee WHERE id = ?", empId);
    }

    // ===== CASH REGISTERS =====

    public List<ParametresDtos.CashRegisterResponse> findAllCashRegisters(String status) {
        String sql = "SELECT code_caisse, numero, libelle FROM caisse ORDER BY code_caisse";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new ParametresDtos.CashRegisterResponse(
                String.valueOf(rs.getInt("code_caisse")),
                ValueUtils.coalesce(rs.getString("numero"), ""),
                ValueUtils.coalesce(rs.getString("libelle"), ""),
                null, BigDecimal.ZERO, BigDecimal.ZERO, "XAF", "active", null, null, null
        ));
    }

    public Optional<ParametresDtos.CashRegisterResponse> findCashRegisterById(String id) {
        int cashId;
        try { cashId = Integer.parseInt(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("SELECT code_caisse, numero, libelle FROM caisse WHERE code_caisse = ?",
                (rs, rowNum) -> new ParametresDtos.CashRegisterResponse(
                        String.valueOf(rs.getInt("code_caisse")),
                        ValueUtils.coalesce(rs.getString("numero"), ""),
                        ValueUtils.coalesce(rs.getString("libelle"), ""),
                        null, BigDecimal.ZERO, BigDecimal.ZERO, "XAF", "active", null, null, null
                ), cashId).stream().findFirst();
    }

    public int createCashRegister(ParametresDtos.CashRegisterRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO caisse (numero, libelle) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, ValueUtils.trimToNull(request.code()));
            ps.setString(2, ValueUtils.trimToNull(request.name()));
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant de la caisse.");
        return key.intValue();
    }

    public void updateCashRegister(String id, ParametresDtos.CashRegisterRequest request) {
        int cashId;
        try { cashId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("UPDATE caisse SET numero = ?, libelle = ? WHERE code_caisse = ?",
                ValueUtils.trimToNull(request.code()), ValueUtils.trimToNull(request.name()), cashId);
    }

    public void deleteCashRegister(String id) {
        int cashId;
        try { cashId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM caisse WHERE code_caisse = ?", cashId);
    }

    // ===== SUPPLIERS =====

    public List<ParametresDtos.SupplierResponse> findAllSuppliers(String status) {
        return jdbcTemplate.query("SELECT code_fournisseur, numero, nom, contact, solde FROM fournisseur ORDER BY nom",
                (rs, rowNum) -> new ParametresDtos.SupplierResponse(
                        String.valueOf(rs.getInt("code_fournisseur")),
                        ValueUtils.coalesce(rs.getString("numero"), ""),
                        ValueUtils.coalesce(rs.getString("nom"), ""),
                        ValueUtils.coalesce(rs.getString("contact"), ""),
                        null, null, null, "General", "Comptant", null, 0.0, "active", null, null
                ));
    }

    public Optional<ParametresDtos.SupplierResponse> findSupplierById(String id) {
        int supId;
        try { supId = Integer.parseInt(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("SELECT code_fournisseur, numero, nom, contact, solde FROM fournisseur WHERE code_fournisseur = ?",
                (rs, rowNum) -> new ParametresDtos.SupplierResponse(
                        String.valueOf(rs.getInt("code_fournisseur")),
                        ValueUtils.coalesce(rs.getString("numero"), ""),
                        ValueUtils.coalesce(rs.getString("nom"), ""),
                        ValueUtils.coalesce(rs.getString("contact"), ""),
                        null, null, null, "General", "Comptant", null, 0.0, "active", null, null
                ), supId).stream().findFirst();
    }

    public int createSupplier(ParametresDtos.SupplierRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO fournisseur (numero, nom, contact, solde) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, ValueUtils.trimToNull(request.code()));
            ps.setString(2, ValueUtils.trimToNull(request.name()));
            ps.setString(3, ValueUtils.trimToNull(request.contactPerson()));
            ps.setBigDecimal(4, BigDecimal.ZERO);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant du fournisseur.");
        return key.intValue();
    }

    public void updateSupplier(String id, ParametresDtos.SupplierRequest request) {
        int supId;
        try { supId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("UPDATE fournisseur SET numero = ?, nom = ?, contact = ? WHERE code_fournisseur = ?",
                ValueUtils.trimToNull(request.code()), ValueUtils.trimToNull(request.name()),
                ValueUtils.trimToNull(request.contactPerson()), supId);
    }

    public void deleteSupplier(String id) {
        int supId;
        try { supId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM fournisseur WHERE code_fournisseur = ?", supId);
    }

    // ===== CLIENTS =====

    public List<ParametresDtos.ClientParametreResponse> findAllClients(String status) {
        String sql = """
                SELECT c.code_client, c.nom_client, c.contact, c.type_client,
                       p.email, p.address_line, p.id_document, p.company_name, p.status_label
                FROM client c
                LEFT JOIN app_client_profile p ON p.code_client = c.code_client
                ORDER BY c.code_client DESC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            String displayName = ValueUtils.coalesce(rs.getString("nom_client"), "");
            String[] nameParts = displayName.split("\\s+", 2);
            return new ParametresDtos.ClientParametreResponse(
                    String.valueOf(rs.getLong("code_client")),
                    "CLI-" + rs.getLong("code_client"),
                    nameParts.length > 0 ? nameParts[0] : "",
                    nameParts.length > 1 ? nameParts[1] : "",
                    ValueUtils.trimToNull(rs.getString("email")),
                    ValueUtils.trimToNull(rs.getString("contact")),
                    ValueUtils.trimToNull(rs.getString("address_line")),
                    ValueUtils.trimToNull(rs.getString("id_document")),
                    null, null, null,
                    rs.getString("company_name") != null,
                    ValueUtils.coalesce(rs.getString("status_label"), "Actif"),
                    List.of(), null, null
            );
        });
    }

    public Optional<ParametresDtos.ClientParametreResponse> findClientById(String id) {
        long clientId;
        try { clientId = Long.parseLong(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("""
                SELECT c.code_client, c.nom_client, c.contact, c.type_client,
                       p.email, p.address_line, p.id_document, p.company_name, p.status_label
                FROM client c
                LEFT JOIN app_client_profile p ON p.code_client = c.code_client
                WHERE c.code_client = ?
                """, (rs, rowNum) -> {
            String displayName = ValueUtils.coalesce(rs.getString("nom_client"), "");
            String[] nameParts = displayName.split("\\s+", 2);
            return new ParametresDtos.ClientParametreResponse(
                    String.valueOf(rs.getLong("code_client")),
                    "CLI-" + rs.getLong("code_client"),
                    nameParts.length > 0 ? nameParts[0] : "",
                    nameParts.length > 1 ? nameParts[1] : "",
                    ValueUtils.trimToNull(rs.getString("email")),
                    ValueUtils.trimToNull(rs.getString("contact")),
                    ValueUtils.trimToNull(rs.getString("address_line")),
                    ValueUtils.trimToNull(rs.getString("id_document")),
                    null, null, null,
                    rs.getString("company_name") != null,
                    ValueUtils.coalesce(rs.getString("status_label"), "Actif"),
                    List.of(), null, null
            );
        }, clientId).stream().findFirst();
    }

    public long createClient(ParametresDtos.ClientParametreRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        String displayName = (ValueUtils.coalesce(request.firstName(), "") + " " + ValueUtils.coalesce(request.lastName(), "")).trim();
        final String finalDisplayName = displayName.isBlank() ? "Client Mirador" : displayName;

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO client (nom_client, contact, type_client, solde) VALUES (?, ?, ?, 0)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, finalDisplayName);
            ps.setString(2, ValueUtils.trimToNull(request.phone()));
            ps.setString(3, "Personne physique");
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant du client.");
        long clientId = key.longValue();

        jdbcTemplate.update("""
                INSERT INTO app_client_profile (code_client, email, address_line, id_document, status_label, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE email = VALUES(email), address_line = VALUES(address_line),
                    id_document = VALUES(id_document), status_label = VALUES(status_label)
                """,
                clientId,
                ValueUtils.trimToNull(request.email()),
                ValueUtils.trimToNull(request.address()),
                ValueUtils.trimToNull(request.idNumber()),
                ValueUtils.coalesce(request.status(), "Actif"));

        return clientId;
    }

    public void updateClient(String id, ParametresDtos.ClientParametreRequest request) {
        long clientId;
        try { clientId = Long.parseLong(id); } catch (NumberFormatException e) { return; }

        String displayName = (ValueUtils.coalesce(request.firstName(), "") + " " + ValueUtils.coalesce(request.lastName(), "")).trim();
        if (displayName.isBlank()) displayName = "Client Mirador";

        jdbcTemplate.update("UPDATE client SET nom_client = ?, contact = ? WHERE code_client = ?",
                displayName, ValueUtils.trimToNull(request.phone()), clientId);

        jdbcTemplate.update("""
                INSERT INTO app_client_profile (code_client, email, address_line, id_document, status_label, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE email = VALUES(email), address_line = VALUES(address_line),
                    id_document = VALUES(id_document), status_label = VALUES(status_label)
                """,
                clientId,
                ValueUtils.trimToNull(request.email()),
                ValueUtils.trimToNull(request.address()),
                ValueUtils.trimToNull(request.idNumber()),
                ValueUtils.coalesce(request.status(), "Actif"));
    }

    public void deleteClient(String id) {
        long clientId;
        try { clientId = Long.parseLong(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM app_client_profile WHERE code_client = ?", clientId);
        jdbcTemplate.update("DELETE FROM client WHERE code_client = ?", clientId);
    }

    // ===== SERVICES =====

    public List<ParametresDtos.ServiceResponse> findAllServices(String category) {
        return jdbcTemplate.query("""
                SELECT code_service, numero, libelle, prix_service FROM autre_service ORDER BY code_service
                """, (rs, rowNum) -> new ParametresDtos.ServiceResponse(
                String.valueOf(rs.getInt("code_service")),
                ValueUtils.coalesce(rs.getString("numero"), ""),
                ValueUtils.coalesce(rs.getString("libelle"), ""),
                null, "other",
                ValueUtils.bigDecimal(rs.getBigDecimal("prix_service")),
                "flat_rate", "active", null, null
        ));
    }

    public Optional<ParametresDtos.ServiceResponse> findServiceById(String id) {
        int svcId;
        try { svcId = Integer.parseInt(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("SELECT code_service, numero, libelle, prix_service FROM autre_service WHERE code_service = ?",
                (rs, rowNum) -> new ParametresDtos.ServiceResponse(
                        String.valueOf(rs.getInt("code_service")),
                        ValueUtils.coalesce(rs.getString("numero"), ""),
                        ValueUtils.coalesce(rs.getString("libelle"), ""),
                        null, "other",
                        ValueUtils.bigDecimal(rs.getBigDecimal("prix_service")),
                        "flat_rate", "active", null, null
                ), svcId).stream().findFirst();
    }

    public int createService(ParametresDtos.ServiceRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO autre_service (numero, libelle, prix_service) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, ValueUtils.trimToNull(request.code()));
            ps.setString(2, ValueUtils.trimToNull(request.name()));
            ps.setBigDecimal(3, request.price() != null ? request.price() : BigDecimal.ZERO);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Impossible de recuperer l'identifiant du service.");
        return key.intValue();
    }

    public void updateService(String id, ParametresDtos.ServiceRequest request) {
        int svcId;
        try { svcId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("UPDATE autre_service SET numero = ?, libelle = ?, prix_service = ? WHERE code_service = ?",
                ValueUtils.trimToNull(request.code()), ValueUtils.trimToNull(request.name()),
                request.price() != null ? request.price() : BigDecimal.ZERO, svcId);
    }

    public void deleteService(String id) {
        int svcId;
        try { svcId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM autre_service WHERE code_service = ?", svcId);
    }

    // ===== GENERAL PARAMETERS =====

    public List<ParametresDtos.ParameterResponse> findAllParameters(String category) {
        return jdbcTemplate.query("""
                SELECT idparametre, raison_sociale, activite, contact, ville, niu
                FROM parametre
                ORDER BY idparametre
                """, (rs, rowNum) -> new ParametresDtos.ParameterResponse(
                String.valueOf(rs.getInt("idparametre")),
                ValueUtils.coalesce(rs.getString("raison_sociale"), ""),
                ValueUtils.coalesce(rs.getString("activite"), ""),
                ValueUtils.coalesce(rs.getString("contact"), ""),
                ValueUtils.coalesce(rs.getString("ville"), ""),
                ValueUtils.coalesce(rs.getString("niu"), ""),
                "active",
                java.time.OffsetDateTime.now(),
                "System"
        ));
    }

    public Optional<ParametresDtos.ParameterResponse> findParameterById(String id) {
        int paramId;
        try { paramId = Integer.parseInt(id); } catch (NumberFormatException e) { return Optional.empty(); }

        return jdbcTemplate.query("SELECT idparametre, raison_sociale, activite, contact, ville, niu FROM parametre WHERE idparametre = ?",
                (rs, rowNum) -> new ParametresDtos.ParameterResponse(
                        String.valueOf(rs.getInt("idparametre")),
                        ValueUtils.coalesce(rs.getString("raison_sociale"), ""),
                        ValueUtils.coalesce(rs.getString("activite"), ""),
                        ValueUtils.coalesce(rs.getString("contact"), ""),
                        ValueUtils.coalesce(rs.getString("ville"), ""),
                        ValueUtils.coalesce(rs.getString("niu"), ""),
                        "active",
                        java.time.OffsetDateTime.now(),
                        "System"
                ), paramId).stream().findFirst();
    }

    public void createParameter(ParametresDtos.ParameterRequest request) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM parametre", Integer.class);
        if (count != null && count > 0) {
            updateParameter("1", request);
            return;
        }

        jdbcTemplate.update("""
                INSERT INTO parametre (idparametre, raison_sociale, activite, contact, ville, niu)
                VALUES (1, ?, ?, ?, ?, ?)
                """,
                ValueUtils.trimToNull(request.raisonSociale()),
                ValueUtils.trimToNull(request.activite()),
                ValueUtils.trimToNull(request.contact()),
                ValueUtils.trimToNull(request.ville()),
                ValueUtils.trimToNull(request.niu()));
    }

    public void updateParameter(String id, ParametresDtos.ParameterRequest request) {
        int paramId;
        try { paramId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("""
                UPDATE parametre SET raison_sociale = ?, activite = ?, contact = ?, ville = ?, niu = ? WHERE idparametre = ?
                """,
                ValueUtils.trimToNull(request.raisonSociale()),
                ValueUtils.trimToNull(request.activite()),
                ValueUtils.trimToNull(request.contact()),
                ValueUtils.trimToNull(request.ville()),
                ValueUtils.trimToNull(request.niu()),
                paramId);
    }

    public void deleteParameter(String id) {
        int paramId;
        try { paramId = Integer.parseInt(id); } catch (NumberFormatException e) { return; }
        jdbcTemplate.update("DELETE FROM parametre WHERE idparametre = ?", paramId);
    }
}
