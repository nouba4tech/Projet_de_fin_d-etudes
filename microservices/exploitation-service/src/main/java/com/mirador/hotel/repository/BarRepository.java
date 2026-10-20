package com.mirador.hotel.repository;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.util.DateTimeMapper;
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
public class BarRepository {

    private final JdbcTemplate jdbcTemplate;

    public BarRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OperationsDtos.BarProductResponse> findAllProducts() {
        return jdbcTemplate.query("""
                SELECT code_boisson, libelle, type_boisson, prix_vente, qte_stock, stock_minimal
                FROM boisson
                ORDER BY code_boisson DESC
                """, (rs, rowNum) -> new OperationsDtos.BarProductResponse(
                rs.getLong("code_boisson"),
                rs.getString("libelle"),
                ValueUtils.coalesce(rs.getString("type_boisson"), "Boisson"),
                ValueUtils.bigDecimal(rs.getBigDecimal("prix_vente")),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte_stock")),
                ValueUtils.bigDecimal(rs.getBigDecimal("stock_minimal")),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte_stock")).signum() > 0));
    }

    public Optional<OperationsDtos.BarProductResponse> findProductById(long productId) {
        return jdbcTemplate.query("""
                SELECT code_boisson, libelle, type_boisson, prix_vente, qte_stock, stock_minimal
                FROM boisson
                WHERE code_boisson = ?
                """, (rs, rowNum) -> new OperationsDtos.BarProductResponse(
                rs.getLong("code_boisson"),
                rs.getString("libelle"),
                ValueUtils.coalesce(rs.getString("type_boisson"), "Boisson"),
                ValueUtils.bigDecimal(rs.getBigDecimal("prix_vente")),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte_stock")),
                ValueUtils.bigDecimal(rs.getBigDecimal("stock_minimal")),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte_stock")).signum() > 0), productId).stream().findFirst();
    }

    public long createProduct(OperationsDtos.BarProductRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO boisson (libelle, type_boisson, prix_vente, qte_stock, stock_minimal, qte_entree, qte_sortie)
                    VALUES (?, ?, ?, ?, ?, 0, 0)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.name().trim());
            statement.setString(2, request.category().trim());
            statement.setBigDecimal(3, ValueUtils.bigDecimal(request.price()));
            statement.setBigDecimal(4, ValueUtils.bigDecimal(request.stock()));
            statement.setBigDecimal(5, ValueUtils.bigDecimal(request.minThreshold()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant produit du bar.");
        }
        return key.longValue();
    }

    public void updateProduct(long productId, OperationsDtos.BarProductRequest request) {
        jdbcTemplate.update("""
                UPDATE boisson
                SET libelle = ?, type_boisson = ?, prix_vente = ?, qte_stock = ?, stock_minimal = ?
                WHERE code_boisson = ?
                """,
                request.name().trim(),
                request.category().trim(),
                ValueUtils.bigDecimal(request.price()),
                ValueUtils.bigDecimal(request.stock()),
                ValueUtils.bigDecimal(request.minThreshold()),
                productId);
    }

    public List<OperationsDtos.BarMovementResponse> findMovements(long productId) {
        return jdbcTemplate.query("""
                SELECT code_stock, code_boisson, qte, mouvement, libelle_operation, ref_production, code_depot, date_jour
                FROM stock_boisson
                WHERE code_boisson = ?
                ORDER BY code_stock DESC
                """, (rs, rowNum) -> new OperationsDtos.BarMovementResponse(
                rs.getLong("code_stock"),
                rs.getLong("code_boisson"),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte")),
                ValueUtils.coalesce(rs.getString("mouvement"), "ENTRY"),
                ValueUtils.coalesce(rs.getString("libelle_operation"), ""),
                ValueUtils.trimToNull(rs.getString("ref_production")),
                ValueUtils.integer(rs, "code_depot"),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("date_jour"))), productId);
    }

    public long createMovement(long productId, OperationsDtos.BarMovementRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO stock_boisson (code_boisson, qte, date_jour, mouvement, libelle_operation, ref_production, code_depot)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, productId);
            statement.setBigDecimal(2, ValueUtils.bigDecimal(request.quantity()));
            statement.setTimestamp(3, Timestamp.valueOf(LocalDateTime.now()));
            statement.setString(4, request.movementType().trim());
            statement.setString(5, request.reason().trim());
            statement.setString(6, ValueUtils.trimToNull(request.reference()));
            statement.setObject(7, request.depotId());
            return statement;
        }, keyHolder);

        jdbcTemplate.update("""
                UPDATE boisson
                SET qte_stock = CASE
                        WHEN ? = 'EXIT' THEN GREATEST(COALESCE(qte_stock, 0) - ?, 0)
                        ELSE COALESCE(qte_stock, 0) + ?
                    END,
                    qte_entree = CASE
                        WHEN ? = 'ENTRY' THEN COALESCE(qte_entree, 0) + ?
                        ELSE COALESCE(qte_entree, 0)
                    END,
                    qte_sortie = CASE
                        WHEN ? = 'EXIT' THEN COALESCE(qte_sortie, 0) + ?
                        ELSE COALESCE(qte_sortie, 0)
                    END
                WHERE code_boisson = ?
                """,
                request.movementType().trim(),
                ValueUtils.bigDecimal(request.quantity()),
                ValueUtils.bigDecimal(request.quantity()),
                request.movementType().trim(),
                ValueUtils.bigDecimal(request.quantity()),
                request.movementType().trim(),
                ValueUtils.bigDecimal(request.quantity()),
                productId);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant du mouvement bar.");
        }
        return key.longValue();
    }
}
