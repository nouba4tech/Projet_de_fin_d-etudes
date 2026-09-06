package com.mirador.hotel.repository;

import com.mirador.hotel.dto.AccountingDashboardResponse;
import com.mirador.hotel.dto.CaisseResponse;
import com.mirador.hotel.dto.CompteComptableResponse;
import com.mirador.hotel.dto.CreateCompteComptableRequest;
import com.mirador.hotel.dto.DepotResponse;
import com.mirador.hotel.dto.OperationComptableRequest;
import com.mirador.hotel.dto.OperationComptableResponse;
import com.mirador.hotel.dto.PlanComptableResponse;
import com.mirador.hotel.dto.UpdateCompteComptableRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Repository
public class AccountingRepository {

    private static final RowMapper<CompteComptableResponse> ACCOUNT_MAPPER = (rs, rowNum) -> new CompteComptableResponse(
            rs.getString("numcompte"),
            rs.getString("numero"),
            rs.getString("libelle_plan"),
            rs.getString("libelle_compte"),
            defaultBigDecimal(rs.getBigDecimal("solde")),
            defaultBigDecimal(rs.getBigDecimal("cumul_depot")),
            defaultBigDecimal(rs.getBigDecimal("cumul_retrait")),
            rs.getString("type_compte"));

    private static final RowMapper<OperationComptableResponse> OPERATION_MAPPER = (rs, rowNum) -> new OperationComptableResponse(
            rs.getLong("code_op"),
            rs.getString("date_op"),
            rs.getString("heure_op"),
            rs.getString("numcompte"),
            rs.getString("libelle_compte"),
            defaultBigDecimal(rs.getBigDecimal("credit")),
            defaultBigDecimal(rs.getBigDecimal("debit")),
            rs.getString("type_operation"),
            getInteger(rs, "num_transaction"),
            rs.getString("numpiece"),
            rs.getString("libelle"),
            rs.getString("codejournal"),
            getInteger(rs, "code_depot"),
            rs.getString("libelle_depot"));

    private final JdbcTemplate jdbcTemplate;

    public AccountingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AccountingDashboardResponse getDashboard() {
        String sql = """
                SELECT
                    (SELECT COUNT(*) FROM plan_comptable) AS total_plans,
                    (SELECT COUNT(*) FROM lescompte) AS total_comptes,
                    (SELECT COUNT(*) FROM caisse) AS total_caisses,
                    (SELECT COUNT(*) FROM depot) AS total_depots_physiques,
                    (SELECT COUNT(*) FROM operation) AS total_operations,
                    (SELECT COALESCE(SUM(solde), 0) FROM lescompte) AS solde_global,
                    (SELECT COALESCE(SUM(cumul_depot), 0) FROM lescompte) AS total_depot_comptable,
                    (SELECT COALESCE(SUM(cumul_retrait), 0) FROM lescompte) AS total_retrait_comptable,
                    (SELECT COALESCE(SUM(credit), 0) FROM operation) AS total_credits,
                    (SELECT COALESCE(SUM(debit), 0) FROM operation) AS total_debits
                """;

        return Objects.requireNonNull(jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new AccountingDashboardResponse(
                rs.getLong("total_plans"),
                rs.getLong("total_comptes"),
                rs.getLong("total_caisses"),
                rs.getLong("total_depots_physiques"),
                rs.getLong("total_operations"),
                defaultBigDecimal(rs.getBigDecimal("solde_global")),
                defaultBigDecimal(rs.getBigDecimal("total_depot_comptable")),
                defaultBigDecimal(rs.getBigDecimal("total_retrait_comptable")),
                defaultBigDecimal(rs.getBigDecimal("total_credits")),
                defaultBigDecimal(rs.getBigDecimal("total_debits")))));
    }

    public List<PlanComptableResponse> findPlans() {
        String sql = """
                SELECT
                    p.numero,
                    p.libelle_plan,
                    COUNT(l.numcompte) AS total_comptes,
                    COALESCE(SUM(l.solde), 0) AS solde_total
                FROM plan_comptable p
                LEFT JOIN lescompte l ON l.numero = p.numero
                GROUP BY p.numero, p.libelle_plan
                ORDER BY p.numero
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new PlanComptableResponse(
                rs.getString("numero"),
                rs.getString("libelle_plan"),
                rs.getLong("total_comptes"),
                defaultBigDecimal(rs.getBigDecimal("solde_total"))));
    }

    public List<CompteComptableResponse> findAccounts(String numeroPlan) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    l.numcompte,
                    l.numero,
                    p.libelle_plan,
                    l.libelle_compte,
                    l.solde,
                    l.cumul_depot,
                    l.cumul_retrait,
                    l.type_compte
                FROM lescompte l
                LEFT JOIN plan_comptable p ON p.numero = l.numero
                """);
        List<Object> args = new ArrayList<>();

        if (StringUtils.hasText(numeroPlan)) {
            sql.append(" WHERE l.numero = ?");
            args.add(numeroPlan.trim());
        }

        sql.append(" ORDER BY l.numcompte");
        return jdbcTemplate.query(sql.toString(), ACCOUNT_MAPPER, args.toArray());
    }

    public Optional<CompteComptableResponse> findAccountById(String numcompte) {
        String sql = """
                SELECT
                    l.numcompte,
                    l.numero,
                    p.libelle_plan,
                    l.libelle_compte,
                    l.solde,
                    l.cumul_depot,
                    l.cumul_retrait,
                    l.type_compte
                FROM lescompte l
                LEFT JOIN plan_comptable p ON p.numero = l.numero
                WHERE l.numcompte = ?
                """;

        return jdbcTemplate.query(sql, ACCOUNT_MAPPER, numcompte).stream().findFirst();
    }

    public boolean planExists(String numeroPlan) {
        return count("SELECT COUNT(*) FROM plan_comptable WHERE numero = ?", numeroPlan) > 0;
    }

    public boolean accountExists(String numcompte) {
        return count("SELECT COUNT(*) FROM lescompte WHERE numcompte = ?", numcompte) > 0;
    }

    public boolean depotExists(Integer codeDepot) {
        if (codeDepot == null) {
            return true;
        }
        return count("SELECT COUNT(*) FROM depot WHERE code_depot = ?", codeDepot) > 0;
    }

    public void insertAccount(CreateCompteComptableRequest request) {
        jdbcTemplate.update("""
                INSERT INTO lescompte (
                    numcompte,
                    numero,
                    libelle_compte,
                    solde,
                    cumul_depot,
                    cumul_retrait,
                    type_compte
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                request.numcompte().trim(),
                request.numeroPlan().trim(),
                request.libelleCompte().trim(),
                defaultBigDecimal(request.solde()),
                defaultBigDecimal(request.cumulDepot()),
                defaultBigDecimal(request.cumulRetrait()),
                emptyToNull(request.typeCompte()));
    }

    public void updateAccount(String numcompte, UpdateCompteComptableRequest request) {
        jdbcTemplate.update("""
                UPDATE lescompte
                SET numero = ?, libelle_compte = ?, type_compte = ?
                WHERE numcompte = ?
                """,
                request.numeroPlan().trim(),
                request.libelleCompte().trim(),
                emptyToNull(request.typeCompte()),
                numcompte);
    }

    public boolean isAccountLinkedToCashRegister(String numcompte) {
        return count("SELECT COUNT(*) FROM caisse WHERE numero = ?", numcompte) > 0;
    }

    public long countOperationsForAccount(String numcompte) {
        return count("SELECT COUNT(*) FROM operation WHERE numcompte = ?", numcompte);
    }

    public void deleteAccount(String numcompte) {
        jdbcTemplate.update("DELETE FROM lescompte WHERE numcompte = ?", numcompte);
    }

    public List<CaisseResponse> findCashRegisters() {
        String sql = """
                SELECT
                    c.code_caisse,
                    c.numero,
                    c.libelle,
                    l.libelle_compte,
                    COALESCE(l.solde, 0) AS solde_compte
                FROM caisse c
                LEFT JOIN lescompte l ON l.numcompte = c.numero
                ORDER BY c.code_caisse
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new CaisseResponse(
                rs.getInt("code_caisse"),
                rs.getString("numero"),
                rs.getString("libelle"),
                rs.getString("libelle_compte"),
                defaultBigDecimal(rs.getBigDecimal("solde_compte"))));
    }

    public List<DepotResponse> findDepots() {
        return jdbcTemplate.query(
                "SELECT code_depot, libelle FROM depot ORDER BY code_depot",
                (rs, rowNum) -> new DepotResponse(rs.getInt("code_depot"), rs.getString("libelle")));
    }

    public boolean depotExists(int codeDepot) {
        return count("SELECT COUNT(*) FROM depot WHERE code_depot = ?", codeDepot) > 0;
    }

    public int insertDepot(com.mirador.hotel.dto.DepotRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO depot (libelle) VALUES (?)", Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.libelle().trim());
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant du depot cree.");
        }
        return key.intValue();
    }

    public void updateDepot(int codeDepot, com.mirador.hotel.dto.DepotRequest request) {
        jdbcTemplate.update(
                "UPDATE depot SET libelle = ? WHERE code_depot = ?",
                request.libelle().trim(),
                codeDepot);
    }

    public void deleteDepot(int codeDepot) {
        jdbcTemplate.update("DELETE FROM depot WHERE code_depot = ?", codeDepot);
    }

    public List<OperationComptableResponse> findOperations(String numcompte, String typeOperation, Integer codeDepot) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    o.code_op,
                    o.date_op,
                    o.heure_op,
                    o.numcompte,
                    l.libelle_compte,
                    o.credit,
                    o.debit,
                    o.type_operation,
                    o.num_transaction,
                    o.numpiece,
                    o.libelle,
                    o.codejournal,
                    o.code_depot,
                    d.libelle AS libelle_depot
                FROM operation o
                LEFT JOIN lescompte l ON l.numcompte = o.numcompte
                LEFT JOIN depot d ON d.code_depot = o.code_depot
                WHERE 1 = 1
                """);

        List<Object> args = new ArrayList<>();

        if (StringUtils.hasText(numcompte)) {
            sql.append(" AND o.numcompte = ?");
            args.add(numcompte.trim());
        }

        if (StringUtils.hasText(typeOperation)) {
            sql.append(" AND o.type_operation = ?");
            args.add(typeOperation.trim());
        }

        if (codeDepot != null) {
            sql.append(" AND o.code_depot = ?");
            args.add(codeDepot);
        }

        sql.append(" ORDER BY o.code_op DESC");
        return jdbcTemplate.query(sql.toString(), OPERATION_MAPPER, args.toArray());
    }

    public Optional<OperationComptableResponse> findOperationById(long codeOperation) {
        String sql = """
                SELECT
                    o.code_op,
                    o.date_op,
                    o.heure_op,
                    o.numcompte,
                    l.libelle_compte,
                    o.credit,
                    o.debit,
                    o.type_operation,
                    o.num_transaction,
                    o.numpiece,
                    o.libelle,
                    o.codejournal,
                    o.code_depot,
                    d.libelle AS libelle_depot
                FROM operation o
                LEFT JOIN lescompte l ON l.numcompte = o.numcompte
                LEFT JOIN depot d ON d.code_depot = o.code_depot
                WHERE o.code_op = ?
                """;

        return jdbcTemplate.query(sql, OPERATION_MAPPER, codeOperation).stream().findFirst();
    }

    public long insertOperation(OperationComptableRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO operation (
                        date_op,
                        heure_op,
                        numcompte,
                        credit,
                        debit,
                        type_operation,
                        num_transaction,
                        numpiece,
                        libelle,
                        codejournal,
                        code_depot
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);

            statement.setString(1, defaultDate(request.dateOperation()));
            statement.setString(2, defaultTime(request.heureOperation()));
            statement.setString(3, request.numcompte().trim());
            statement.setBigDecimal(4, defaultBigDecimal(request.credit()));
            statement.setBigDecimal(5, defaultBigDecimal(request.debit()));
            statement.setString(6, emptyToNull(request.typeOperation()));
            setNullableInteger(statement, 7, request.numTransaction());
            statement.setString(8, emptyToNull(request.numpiece()));
            statement.setString(9, request.libelle().trim());
            statement.setString(10, emptyToNull(request.codeJournal()));
            setNullableInteger(statement, 11, request.codeDepot());
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            Long fallbackKey = jdbcTemplate.queryForObject("SELECT MAX(code_op) FROM operation", Long.class);
            if (fallbackKey == null) {
                throw new IllegalStateException("Impossible de recuperer l'identifiant de l'operation creee.");
            }
            return fallbackKey;
        }

        return key.longValue();
    }

    public void applyOperationToAccount(OperationComptableRequest request) {
        jdbcTemplate.update("""
                UPDATE lescompte
                SET
                    solde = COALESCE(solde, 0) + ? - ?,
                    cumul_depot = COALESCE(cumul_depot, 0) + ?,
                    cumul_retrait = COALESCE(cumul_retrait, 0) + ?
                WHERE numcompte = ?
                """,
                defaultBigDecimal(request.credit()),
                defaultBigDecimal(request.debit()),
                defaultBigDecimal(request.credit()),
                defaultBigDecimal(request.debit()),
                request.numcompte().trim());
    }

    private long count(String sql, Object value) {
        Long result = jdbcTemplate.queryForObject(sql, Long.class, value);
        return result == null ? 0L : result;
    }

    private static BigDecimal defaultBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static Integer getInteger(ResultSet resultSet, String column) throws SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }

    private static void setNullableInteger(PreparedStatement statement, int index, Integer value)
            throws SQLException {
        if (value == null) {
            statement.setNull(index, Types.INTEGER);
            return;
        }
        statement.setInt(index, value);
    }

    private static String emptyToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static String defaultDate(String dateOperation) {
        return StringUtils.hasText(dateOperation) ? dateOperation.trim() : LocalDate.now().toString();
    }

    private static String defaultTime(String heureOperation) {
        return StringUtils.hasText(heureOperation)
                ? heureOperation.trim()
                : LocalTime.now().truncatedTo(ChronoUnit.SECONDS).toString();
    }
}
