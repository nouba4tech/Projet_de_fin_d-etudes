package com.mirador.hotel.repository;

import com.mirador.hotel.dto.AuthDtos;
import com.mirador.hotel.util.PasswordUtils;
import com.mirador.hotel.util.RoleAccess;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class AuthRepository {

    private final JdbcTemplate jdbcTemplate;

    public AuthRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<AuthUserRow> findByUsernameOrEmail(String identifier) {
        String sql = """
                SELECT
                    u.code_user,
                    u.compte,
                    u.psw,
                    u.nom,
                    u.prenom,
                    u.code_groupe,
                    COALESCE(g.libelle, '') AS group_name,
                    u.statut,
                    COALESCE(p.email, '') AS email,
                    COALESCE(p.role_name, '') AS role_name
                FROM utilisateur u
                LEFT JOIN app_user_profile p ON p.code_user = u.code_user
                LEFT JOIN groupe g ON g.code_groupe = u.code_groupe
                WHERE u.compte = ? OR p.email = ?
                ORDER BY u.code_user
                """;

        List<AuthUserRow> rows = jdbcTemplate.query(sql, (rs, rowNum) -> new AuthUserRow(
                rs.getLong("code_user"),
                rs.getString("compte"),
                rs.getString("psw"),
                rs.getString("nom"),
                rs.getString("prenom"),
                rs.getString("email"),
                rs.getString("role_name"),
                rs.getInt("code_groupe"),
                rs.getString("group_name"),
                ValueUtils.coalesce(rs.getString("statut"), "Actif")),
                identifier.trim(),
                identifier.trim());

        return rows.stream().findFirst();
    }

    public boolean existsByUsername(String username) {
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM utilisateur WHERE compte = ?",
                Long.class,
                username.trim());

        return total != null && total > 0;
    }

    public boolean existsByEmail(String email) {
        if (ValueUtils.trimToNull(email) == null) {
            return false;
        }

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_user_profile WHERE email = ?",
                Long.class,
                email.trim());

        return total != null && total > 0;
    }

    public boolean existsByUsernameExcludingId(String username, long excludedUserId) {
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM utilisateur WHERE compte = ? AND code_user <> ?",
                Long.class,
                username.trim(),
                excludedUserId);

        return total != null && total > 0;
    }

    public boolean existsByEmailExcludingId(String email, long excludedUserId) {
        if (ValueUtils.trimToNull(email) == null) {
            return false;
        }

        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_user_profile WHERE email = ? AND code_user <> ?",
                Long.class,
                email.trim(),
                excludedUserId);

        return total != null && total > 0;
    }

    public long insertUser(AuthDtos.RegisterRequest request, String lastName, String firstName, String role) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO utilisateur (compte, psw, nom, prenom, code_groupe, statut)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);

            statement.setString(1, request.username().trim());
            statement.setString(2, PasswordUtils.hash(request.password().trim()));
            statement.setString(3, lastName);
            statement.setString(4, firstName);
            statement.setInt(5, resolveGroupCode(role));
            statement.setString(6, "Actif");
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            Long fallback = jdbcTemplate.queryForObject("SELECT MAX(code_user) FROM utilisateur", Long.class);
            if (fallback == null) {
                throw new IllegalStateException("Impossible de recuperer l'identifiant utilisateur.");
            }
            return fallback;
        }

        return key.longValue();
    }

    public void upsertProfile(long userId, String email, String role) {
        jdbcTemplate.update("""
                INSERT INTO app_user_profile (code_user, email, role_name, created_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    email = VALUES(email),
                    role_name = VALUES(role_name)
                """,
                userId,
                ValueUtils.trimToNull(email),
                RoleAccess.normalizeRole(role),
                Timestamp.valueOf(LocalDateTime.now()));
    }

    public void touchLastLogin(long userId) {
        jdbcTemplate.update("""
                INSERT INTO app_user_profile (code_user, created_at, last_login_at)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    last_login_at = VALUES(last_login_at)
                """,
                userId,
                Timestamp.valueOf(LocalDateTime.now()),
                Timestamp.valueOf(LocalDateTime.now()));
    }

    public List<AuthDtos.UserSummaryResponse> findAllUsers() {
        return jdbcTemplate.query("""
                SELECT
                    u.code_user,
                    u.compte,
                    u.nom,
                    u.prenom,
                    u.code_groupe,
                    COALESCE(g.libelle, '') AS group_name,
                    COALESCE(p.email, '') AS email,
                    COALESCE(p.role_name, '') AS role_name,
                    COALESCE(u.statut, 'Actif') AS statut
                FROM utilisateur u
                LEFT JOIN app_user_profile p ON p.code_user = u.code_user
                LEFT JOIN groupe g ON g.code_groupe = u.code_groupe
                ORDER BY u.code_user DESC
                """, (rs, rowNum) -> {
            String role = RoleAccess.resolveRole(rs.getInt("code_groupe"), rs.getString("group_name"), rs.getString("role_name"));
            return new AuthDtos.UserSummaryResponse(
                    rs.getLong("code_user"),
                    rs.getString("compte"),
                    ValueUtils.coalesce(rs.getString("prenom"), ""),
                    ValueUtils.coalesce(rs.getString("nom"), ""),
                    ValueUtils.coalesce(rs.getString("email"), ""),
                    role,
                    resolveGroupCode(role),
                    RoleAccess.groupNameForRole(role),
                    "Actif".equalsIgnoreCase(ValueUtils.coalesce(rs.getString("statut"), "Actif")));
        });
    }

    public Optional<AuthUserRow> findById(long userId) {
        List<AuthUserRow> rows = jdbcTemplate.query("""
                SELECT
                    u.code_user,
                    u.compte,
                    u.psw,
                    u.nom,
                    u.prenom,
                    u.code_groupe,
                    COALESCE(g.libelle, '') AS group_name,
                    COALESCE(p.email, '') AS email,
                    COALESCE(p.role_name, '') AS role_name,
                    COALESCE(u.statut, 'Actif') AS statut
                FROM utilisateur u
                LEFT JOIN app_user_profile p ON p.code_user = u.code_user
                LEFT JOIN groupe g ON g.code_groupe = u.code_groupe
                WHERE u.code_user = ?
                """, (rs, rowNum) -> new AuthUserRow(
                rs.getLong("code_user"),
                rs.getString("compte"),
                rs.getString("psw"),
                rs.getString("nom"),
                rs.getString("prenom"),
                rs.getString("email"),
                rs.getString("role_name"),
                rs.getInt("code_groupe"),
                rs.getString("group_name"),
                ValueUtils.coalesce(rs.getString("statut"), "Actif")),
                userId);

        return rows.stream().findFirst();
    }

    public long insertUser(AuthDtos.CreateUserRequest request, String lastName, String firstName, String role, String status) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO utilisateur (compte, psw, nom, prenom, code_groupe, statut)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);

            statement.setString(1, request.username().trim());
            statement.setString(2, PasswordUtils.hash(request.password().trim()));
            statement.setString(3, lastName);
            statement.setString(4, firstName);
            statement.setInt(5, resolveGroupCode(role));
            statement.setString(6, status);
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            Long fallback = jdbcTemplate.queryForObject("SELECT MAX(code_user) FROM utilisateur", Long.class);
            if (fallback == null) {
                throw new IllegalStateException("Impossible de recuperer l'identifiant utilisateur.");
            }
            return fallback;
        }

        return key.longValue();
    }

    public void updateUser(long userId, AuthDtos.UpdateUserRequest request, String lastName, String firstName, String role, String status) {
        jdbcTemplate.update("""
                UPDATE utilisateur
                SET compte = ?, nom = ?, prenom = ?, code_groupe = ?, statut = ?
                WHERE code_user = ?
                """,
                request.username().trim(),
                lastName,
                firstName,
                resolveGroupCode(role),
                status,
                userId);
    }

    public int findGroupCodeForRole(String role) {
        return resolveGroupCode(role);
    }

    public void updateUserGroup(long userId, String role) {
        jdbcTemplate.update("UPDATE utilisateur SET code_groupe = ? WHERE code_user = ?", resolveGroupCode(role), userId);
    }

    public void updatePassword(long userId, String newPassword) {
        jdbcTemplate.update("""
                UPDATE utilisateur
                SET psw = ?
                WHERE code_user = ?
                """,
                PasswordUtils.hash(newPassword.trim()),
                userId);
    }

    public void deleteUser(long userId) {
        jdbcTemplate.update("DELETE FROM app_user_profile WHERE code_user = ?", userId);
        jdbcTemplate.update("DELETE FROM utilisateur WHERE code_user = ?", userId);
    }

    private int resolveGroupCode(String role) {
        String groupName = RoleAccess.groupNameForRole(role);
        List<Integer> groupCodes = jdbcTemplate.query(
                "SELECT code_groupe FROM groupe WHERE UPPER(libelle) = ? ORDER BY code_groupe DESC LIMIT 1",
                (rs, rowNum) -> rs.getInt("code_groupe"),
                groupName);

        return groupCodes.stream().findFirst().orElse(RoleAccess.mapGroupCode(role));
    }

    public record AuthUserRow(
            long id,
            String username,
            String passwordHash,
            String lastName,
            String firstName,
            String email,
            String role,
            Integer groupCode,
            String groupName,
            String status) {
    }
}
