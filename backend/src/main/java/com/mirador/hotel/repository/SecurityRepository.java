package com.mirador.hotel.repository;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class SecurityRepository {

    private final JdbcTemplate jdbcTemplate;

    public SecurityRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ===== GROUPS =====

    public List<ParametresDtos.GroupResponse> findAllGroups() {
        return jdbcTemplate.query("""
                SELECT g.code_groupe, g.libelle,
                       (SELECT COUNT(*) FROM utilisateur u WHERE u.code_groupe = g.code_groupe) AS member_count
                FROM groupe g
                ORDER BY g.code_groupe
                """, (rs, rowNum) -> {
            int groupId = rs.getInt("code_groupe");
            String name = ValueUtils.coalesce(rs.getString("libelle"), "");
            int memberCount = rs.getInt("member_count");
            List<String> rights = findGroupRights(groupId);
            return new ParametresDtos.GroupResponse(groupId, name, buildRightsDescription(rights), rights, memberCount);
        });
    }

    public Optional<ParametresDtos.GroupResponse> findGroupById(int groupId) {
        return jdbcTemplate.query("""
                SELECT g.code_groupe, g.libelle,
                       (SELECT COUNT(*) FROM utilisateur u WHERE u.code_groupe = g.code_groupe) AS member_count
                FROM groupe g
                WHERE g.code_groupe = ?
                """, (rs, rowNum) -> {
            String name = ValueUtils.coalesce(rs.getString("libelle"), "");
            int memberCount = rs.getInt("member_count");
            List<String> rights = findGroupRights(groupId);
            return new ParametresDtos.GroupResponse(groupId, name, buildRightsDescription(rights), rights, memberCount);
        }, groupId).stream().findFirst();
    }

    public int createGroup(ParametresDtos.GroupRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO groupe (libelle) VALUES (?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, ValueUtils.trimToNull(request.name()));
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant du groupe.");
        }

        int groupId = key.intValue();

        if (request.rights() != null) {
            for (String right : request.rights()) {
                insertGroupRight(groupId, right);
            }
        }

        return groupId;
    }

    public void updateGroup(int groupId, ParametresDtos.GroupRequest request) {
        jdbcTemplate.update("UPDATE groupe SET libelle = ? WHERE code_groupe = ?",
                ValueUtils.trimToNull(request.name()), groupId);

        jdbcTemplate.update("DELETE FROM privilege WHERE code_groupe = ?", groupId);

        if (request.rights() != null) {
            for (String right : request.rights()) {
                insertGroupRight(groupId, right);
            }
        }
    }

    public void deleteGroup(int groupId) {
        jdbcTemplate.update("DELETE FROM privilege WHERE code_groupe = ?", groupId);
        jdbcTemplate.update("UPDATE utilisateur SET code_groupe = 6 WHERE code_groupe = ?", groupId);
        jdbcTemplate.update("DELETE FROM groupe WHERE code_groupe = ?", groupId);
    }

    private List<String> findGroupRights(int groupId) {
        return jdbcTemplate.query("""
                SELECT o.libelle FROM privilege p
                JOIN objets o ON o.code_objet = p.code_objet
                WHERE p.code_groupe = ?
                ORDER BY o.code_objet
                """, (rs, rowNum) -> ValueUtils.coalesce(rs.getString("libelle"), ""), groupId);
    }

    private void insertGroupRight(int groupId, String right) {
        Integer objetCode = findObjetCodeByName(right);
        if (objetCode != null) {
            jdbcTemplate.update("INSERT INTO privilege (code_groupe, code_objet, statut) VALUES (?, ?, '1')",
                    groupId, objetCode);
        }
    }

    private Integer findObjetCodeByName(String name) {
        List<Integer> codes = jdbcTemplate.query(
                "SELECT code_objet FROM objets WHERE libelle = ? ORDER BY code_objet DESC LIMIT 1",
                (rs, rowNum) -> rs.getInt("code_objet"), name);
        return codes.stream().findFirst().orElse(null);
    }

    private String buildRightsDescription(List<String> rights) {
        if (rights == null || rights.isEmpty()) {
            return "Non defini";
        }
        return String.join(", ", rights);
    }

    // ===== PRIVILEGES =====

    public List<ParametresDtos.PrivilegeResponse> findAllPrivileges() {
        return jdbcTemplate.query("""
                SELECT p.code_privilege, p.code_groupe, p.code_objet, p.statut,
                       COALESCE(o.libelle, '') AS module_label,
                       COALESCE(o.type_objet, '') AS object_type
                FROM privilege p
                LEFT JOIN objets o ON o.code_objet = p.code_objet
                ORDER BY p.code_groupe, p.code_objet
                """, (rs, rowNum) -> {
            String id = String.valueOf(rs.getInt("code_privilege"));
            String module = ValueUtils.coalesce(rs.getString("module_label"), "");
            String code = "PRIV_" + rs.getInt("code_objet");
            String level = mapStatutToLevel(ValueUtils.coalesce(rs.getString("statut"), "0"));
            boolean visible = "1".equals(ValueUtils.coalesce(rs.getString("statut"), "0"))
                    || "2".equals(ValueUtils.coalesce(rs.getString("statut"), "0"));
            return new ParametresDtos.PrivilegeResponse(id, module, code, level, visible);
        });
    }

    public List<ParametresDtos.PrivilegeResponse> findPrivilegesByGroup(int groupId) {
        return jdbcTemplate.query("""
                SELECT p.code_privilege, p.code_groupe, p.code_objet, p.statut,
                       COALESCE(o.libelle, '') AS module_label,
                       COALESCE(o.type_objet, '') AS object_type
                FROM privilege p
                LEFT JOIN objets o ON o.code_objet = p.code_objet
                WHERE p.code_groupe = ?
                ORDER BY p.code_objet
                """, (rs, rowNum) -> {
            String id = String.valueOf(rs.getInt("code_privilege"));
            String module = ValueUtils.coalesce(rs.getString("module_label"), "");
            String code = "PRIV_" + rs.getInt("code_objet");
            String level = mapStatutToLevel(ValueUtils.coalesce(rs.getString("statut"), "0"));
            boolean visible = "1".equals(ValueUtils.coalesce(rs.getString("statut"), "0"))
                    || "2".equals(ValueUtils.coalesce(rs.getString("statut"), "0"));
            return new ParametresDtos.PrivilegeResponse(id, module, code, level, visible);
        }, groupId);
    }

    public Optional<ParametresDtos.PrivilegeResponse> findPrivilegeById(String privilegeId) {
        int id;
        try {
            id = Integer.parseInt(privilegeId);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }

        return jdbcTemplate.query("""
                SELECT p.code_privilege, p.code_groupe, p.code_objet, p.statut,
                       COALESCE(o.libelle, '') AS module_label,
                       COALESCE(o.type_objet, '') AS object_type
                FROM privilege p
                LEFT JOIN objets o ON o.code_objet = p.code_objet
                WHERE p.code_privilege = ?
                """, (rs, rowNum) -> {
            String module = ValueUtils.coalesce(rs.getString("module_label"), "");
            String code = "PRIV_" + rs.getInt("code_objet");
            String level = mapStatutToLevel(ValueUtils.coalesce(rs.getString("statut"), "0"));
            boolean visible = "1".equals(ValueUtils.coalesce(rs.getString("statut"), "0"))
                    || "2".equals(ValueUtils.coalesce(rs.getString("statut"), "0"));
            return new ParametresDtos.PrivilegeResponse(privilegeId, module, code, level, visible);
        }, id).stream().findFirst();
    }

    public String createPrivilege(ParametresDtos.PrivilegeRequest request) {
        int groupId = 1;
        int objetCode = findOrCreateObjet(request.module(), request.code());

        String statut = mapLevelToStatut(request.level(), request.visible());

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO privilege (code_groupe, code_objet, statut) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setInt(1, groupId);
            ps.setInt(2, objetCode);
            ps.setString(3, statut);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        String id = key != null ? String.valueOf(key.intValue()) : "prv-" + System.currentTimeMillis();

        return id;
    }

    public void updatePrivilege(String privilegeId, ParametresDtos.PrivilegeRequest request) {
        int id;
        try {
            id = Integer.parseInt(privilegeId);
        } catch (NumberFormatException e) {
            return;
        }

        int objetCode = findOrCreateObjet(request.module(), request.code());
        String statut = mapLevelToStatut(request.level(), request.visible());

        jdbcTemplate.update("UPDATE privilege SET code_objet = ?, statut = ? WHERE code_privilege = ?",
                objetCode, statut, id);
    }

    public void deletePrivilege(String privilegeId) {
        int id;
        try {
            id = Integer.parseInt(privilegeId);
        } catch (NumberFormatException e) {
            return;
        }
        jdbcTemplate.update("DELETE FROM privilege WHERE code_privilege = ?", id);
    }

    public void updatePrivilegeVisibility(String privilegeId, boolean visible) {
        int id;
        try {
            id = Integer.parseInt(privilegeId);
        } catch (NumberFormatException e) {
            return;
        }

        String statut = visible ? "1" : "0";
        jdbcTemplate.update("UPDATE privilege SET statut = ? WHERE code_privilege = ?", statut, id);
    }

    private int findOrCreateObjet(String module, String code) {
        String label = ValueUtils.trimToNull(module);
        if (label == null) label = ValueUtils.trimToNull(code);
        if (label == null) label = "Unknown";
        String finalLabel = label;
        String finalCode = ValueUtils.trimToNull(code);

        List<Integer> existing = jdbcTemplate.query(
                "SELECT code_objet FROM objets WHERE libelle = ? ORDER BY code_objet DESC LIMIT 1",
                (rs, rowNum) -> rs.getInt("code_objet"), finalLabel);

        return existing.stream().findFirst().orElseGet(() -> {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                        "INSERT INTO objets (libelle, type_objet) VALUES (?, ?)",
                        Statement.RETURN_GENERATED_KEYS
                );
                ps.setString(1, finalLabel);
                ps.setString(2, finalCode);
                return ps;
            }, keyHolder);
            Number key = keyHolder.getKey();
            if (key == null) {
                throw new IllegalStateException("Impossible de recuperer l'identifiant de l'objet.");
            }
            return key.intValue();
        });
    }

    private String mapStatutToLevel(String statut) {
        return switch (statut) {
            case "2" -> "Administration";
            case "1" -> "Ecriture";
            case "0" -> "Lecture";
            default -> "Lecture";
        };
    }

    private String mapLevelToStatut(String level, Boolean visible) {
        if (visible != null && !visible) return "0";
        if ("Administration".equalsIgnoreCase(level)) return "2";
        if ("Ecriture".equalsIgnoreCase(level)) return "1";
        return "0";
    }

    // ===== BACKUPS =====

    public List<ParametresDtos.BackupResponse> findAllBackups() {
        return jdbcTemplate.query("""
                SELECT id, label, created_at, status, size_in_bytes, file_name
                FROM app_database_backup
                ORDER BY created_at DESC
                """, (rs, rowNum) -> new ParametresDtos.BackupResponse(
                String.valueOf(rs.getLong("id")),
                ValueUtils.coalesce(rs.getString("label"), ""),
                rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant().atOffset(OffsetDateTime.now().getOffset()) : OffsetDateTime.now(),
                ValueUtils.coalesce(rs.getString("status"), "Disponible"),
                rs.getLong("size_in_bytes"),
                ValueUtils.coalesce(rs.getString("file_name"), "")
        ));
    }

    public long createBackup(String label) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO app_database_backup (label, created_at, status, size_in_bytes, file_name) VALUES (?, NOW(), 'Disponible', 0, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, ValueUtils.trimToNull(label));
            ps.setString(2, "mirador_hotel_backup.sql");
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant de la sauvegarde.");
        }
        return key.longValue();
    }

    public void updateBackupStatus(String backupId, String status) {
        long id;
        try {
            id = Long.parseLong(backupId);
        } catch (NumberFormatException e) {
            return;
        }
        jdbcTemplate.update("UPDATE app_database_backup SET status = ? WHERE id = ?", status, id);
    }

    public void deleteBackup(String backupId) {
        long id;
        try {
            id = Long.parseLong(backupId);
        } catch (NumberFormatException e) {
            return;
        }
        jdbcTemplate.update("DELETE FROM app_database_backup WHERE id = ?", id);
    }

    public void deleteAllBackups() {
        jdbcTemplate.update("DELETE FROM app_database_backup");
    }

    public byte[] generateSqlDump() {
        StringBuilder sql = new StringBuilder();
        sql.append("-- Mirador Hotel database dump\n");
        sql.append("-- Genere le ").append(OffsetDateTime.now()).append("\n\n");
        sql.append("SET FOREIGN_KEY_CHECKS=0;\n\n");

        try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
            String catalog = connection.getCatalog();
            List<String> tableNames = new java.util.ArrayList<>();
            try (ResultSet tablesRs = connection.getMetaData().getTables(catalog, null, "%", new String[]{"TABLE"})) {
                while (tablesRs.next()) {
                    tableNames.add(tablesRs.getString("TABLE_NAME"));
                }
            }
            Collections.sort(tableNames);

            for (String table : tableNames) {
                dumpTable(connection, table, sql);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la generation du dump SQL", e);
        }

        sql.append("SET FOREIGN_KEY_CHECKS=1;\n");
        return sql.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void dumpTable(Connection connection, String table, StringBuilder sql) throws SQLException {
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM `" + table + "`")) {
            ResultSetMetaData meta = rs.getMetaData();
            int columnCount = meta.getColumnCount();

            String[] columnNames = new String[columnCount];
            for (int i = 1; i <= columnCount; i++) {
                columnNames[i - 1] = meta.getColumnName(i);
            }

            sql.append("-- Table `").append(table).append("`\n");
            boolean hasRows = false;

            while (rs.next()) {
                if (!hasRows) {
                    sql.append("INSERT INTO `").append(table).append("` (`")
                            .append(String.join("`, `", columnNames)).append("`) VALUES\n");
                    hasRows = true;
                } else {
                    sql.append(",\n");
                }

                sql.append('(');
                for (int i = 1; i <= columnCount; i++) {
                    if (i > 1) {
                        sql.append(", ");
                    }
                    sql.append(formatSqlValue(rs.getObject(i)));
                }
                sql.append(')');
            }

            if (hasRows) {
                sql.append(";\n\n");
            } else {
                sql.append("-- (table vide)\n\n");
            }
        }
    }

    private String formatSqlValue(Object value) {
        if (value == null) {
            return "NULL";
        }
        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }
        String text = value.toString().replace("\\", "\\\\").replace("'", "''");
        return "'" + text + "'";
    }

    public Optional<ParametresDtos.BackupResponse> findBackupById(String backupId) {
        long id;
        try {
            id = Long.parseLong(backupId);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
        return jdbcTemplate.query("""
                SELECT id, label, created_at, status, size_in_bytes, file_name
                FROM app_database_backup
                WHERE id = ?
                """, (rs, rowNum) -> new ParametresDtos.BackupResponse(
                String.valueOf(rs.getLong("id")),
                ValueUtils.coalesce(rs.getString("label"), ""),
                rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant().atOffset(OffsetDateTime.now().getOffset()) : OffsetDateTime.now(),
                ValueUtils.coalesce(rs.getString("status"), "Disponible"),
                rs.getLong("size_in_bytes"),
                ValueUtils.coalesce(rs.getString("file_name"), "")
        ), id).stream().findFirst();
    }
}
