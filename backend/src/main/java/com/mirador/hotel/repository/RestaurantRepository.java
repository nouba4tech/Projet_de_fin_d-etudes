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
public class RestaurantRepository {

    private final JdbcTemplate jdbcTemplate;

    public RestaurantRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OperationsDtos.MenuItemResponse> findMenuItems() {
        return jdbcTemplate.query("""
                SELECT p.code_plat, p.libelle, p.montant, p.code_depot, p.qte_stock, tp.libelle AS category_name
                FROM plat p
                LEFT JOIN type_plat tp ON tp.code_type = p.code_type
                ORDER BY p.code_plat DESC
                """, (rs, rowNum) -> new OperationsDtos.MenuItemResponse(
                rs.getLong("code_plat"),
                rs.getString("libelle"),
                rs.getString("libelle"),
                ValueUtils.bigDecimal(rs.getBigDecimal("montant")),
                ValueUtils.coalesce(rs.getString("category_name"), "Plat"),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte_stock")).signum() > 0,
                ValueUtils.integer(rs, "code_depot"),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte_stock"))));
    }

    public Optional<OperationsDtos.MenuItemResponse> findMenuItemById(long menuItemId) {
        return jdbcTemplate.query("""
                SELECT p.code_plat, p.libelle, p.montant, p.code_depot, p.qte_stock, tp.libelle AS category_name
                FROM plat p
                LEFT JOIN type_plat tp ON tp.code_type = p.code_type
                WHERE p.code_plat = ?
                """, (rs, rowNum) -> new OperationsDtos.MenuItemResponse(
                rs.getLong("code_plat"),
                rs.getString("libelle"),
                rs.getString("libelle"),
                ValueUtils.bigDecimal(rs.getBigDecimal("montant")),
                ValueUtils.coalesce(rs.getString("category_name"), "Plat"),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte_stock")).signum() > 0,
                ValueUtils.integer(rs, "code_depot"),
                ValueUtils.bigDecimal(rs.getBigDecimal("qte_stock"))), menuItemId).stream().findFirst();
    }

    public long createMenuItem(OperationsDtos.MenuItemRequest request) {
        int categoryId = ensureCategory(request.category());
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO plat (numero, libelle, montant, code_type, code_depot, qte_stock, qte_entree, qte_sortie)
                    VALUES (NULL, ?, ?, ?, ?, ?, 0, 0)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.name().trim());
            statement.setBigDecimal(2, ValueUtils.bigDecimal(request.price()));
            statement.setInt(3, categoryId);
            statement.setObject(4, request.depotId());
            statement.setBigDecimal(5, Boolean.FALSE.equals(request.available()) ? java.math.BigDecimal.ZERO : java.math.BigDecimal.ONE);
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant menu.");
        }
        return key.longValue();
    }

    public void updateMenuItem(long menuItemId, OperationsDtos.MenuItemRequest request) {
        int categoryId = ensureCategory(request.category());
        jdbcTemplate.update("""
                UPDATE plat
                SET libelle = ?, montant = ?, code_type = ?, code_depot = ?,
                    qte_stock = CASE
                        WHEN ? = FALSE THEN 0
                        ELSE CASE WHEN COALESCE(qte_stock, 0) = 0 THEN 1 ELSE qte_stock END
                    END
                WHERE code_plat = ?
                """,
                request.name().trim(),
                ValueUtils.bigDecimal(request.price()),
                categoryId,
                request.depotId(),
                Boolean.FALSE.equals(request.available()),
                menuItemId);
    }

    public List<OperationsDtos.RestaurantOrderResponse> findOrders() {
        return jdbcTemplate.query("""
                SELECT id, table_number, status_label, total_amount, created_at, served_at
                FROM app_restaurant_order
                ORDER BY id DESC
                """, (rs, rowNum) -> mapOrder(
                rs.getLong("id"),
                rs.getInt("table_number"),
                rs.getString("status_label"),
                ValueUtils.bigDecimal(rs.getBigDecimal("total_amount")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("served_at"))));
    }

    public Optional<OperationsDtos.RestaurantOrderResponse> findOrderById(long orderId) {
        return jdbcTemplate.query("""
                SELECT id, table_number, status_label, total_amount, created_at, served_at
                FROM app_restaurant_order
                WHERE id = ?
                """, (rs, rowNum) -> mapOrder(
                rs.getLong("id"),
                rs.getInt("table_number"),
                rs.getString("status_label"),
                ValueUtils.bigDecimal(rs.getBigDecimal("total_amount")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("served_at"))), orderId).stream().findFirst();
    }

    public long createOrder(OperationsDtos.RestaurantOrderRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        java.math.BigDecimal totalAmount = request.items().stream()
                .map(item -> ValueUtils.bigDecimal(item.unitPrice()).multiply(java.math.BigDecimal.valueOf(item.quantity())))
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        String status = ValueUtils.coalesce(request.status(), "En attente");
        Timestamp servedAt = ("Servi".equalsIgnoreCase(status) || "Payé".equalsIgnoreCase(status))
                ? Timestamp.valueOf(LocalDateTime.now())
                : null;

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_restaurant_order (table_number, status_label, total_amount, created_at, served_at)
                    VALUES (?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setInt(1, request.tableNumber());
            statement.setString(2, status);
            statement.setBigDecimal(3, totalAmount);
            statement.setTimestamp(4, Timestamp.valueOf(LocalDateTime.now()));
            statement.setTimestamp(5, servedAt);
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant de commande restaurant.");
        }

        long orderId = key.longValue();
        for (OperationsDtos.RestaurantOrderItemRequest item : request.items()) {
            jdbcTemplate.update("""
                    INSERT INTO app_restaurant_order_item (order_id, menu_item_id, quantity_value, unit_price)
                    VALUES (?, ?, ?, ?)
                    """,
                    orderId,
                    item.menuItemId(),
                    item.quantity(),
                    ValueUtils.bigDecimal(item.unitPrice()));

            // 1. Check if the item is a drink (boisson) or a dish (plat)
            boolean isDrink = false;
            try {
                Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM boisson WHERE code_boisson = ?", Integer.class, item.menuItemId());
                isDrink = count != null && count > 0;
            } catch (Exception e) {
                // Ignore
            }

            String itemName = "";
            if (isDrink) {
                // Decrement legacy boisson stock
                jdbcTemplate.update("""
                        UPDATE boisson
                        SET qte_stock = GREATEST(COALESCE(qte_stock, 0) - ?, 0),
                            qte_sortie = COALESCE(qte_sortie, 0) + ?
                        WHERE code_boisson = ?
                        """, item.quantity(), item.quantity(), item.menuItemId());

                // Record legacy movement in stock_boisson
                jdbcTemplate.update("""
                        INSERT INTO stock_boisson (code_boisson, qte, date_jour, mouvement, libelle_operation, code_depot)
                        VALUES (?, ?, ?, 'EXIT', ?, 3)
                        """,
                        item.menuItemId(),
                        item.quantity(),
                        Timestamp.valueOf(LocalDateTime.now()),
                        "Vente bar - Table " + request.tableNumber());

                try {
                    itemName = jdbcTemplate.queryForObject(
                            "SELECT libelle FROM boisson WHERE code_boisson = ?", String.class, item.menuItemId());
                } catch (Exception e) {
                    // Keep default
                }
                if (itemName == null || itemName.isBlank()) {
                    itemName = "Boisson " + item.menuItemId();
                }

                // Find or create matching app_stock_item in BAR scope
                String itemCode = "DRK-" + item.menuItemId();
                String finalItemName = itemName;
                List<Long> existingIds = jdbcTemplate.query("""
                        SELECT id FROM app_stock_item
                        WHERE item_code = ? AND UPPER(entity_scope) = 'BAR'
                        """, (rs, rowNum) -> rs.getLong("id"), itemCode);

                long stockItemId;
                if (existingIds.isEmpty()) {
                    KeyHolder sKeyHolder = new GeneratedKeyHolder();
                    jdbcTemplate.update(connection -> {
                        PreparedStatement sStatement = connection.prepareStatement("""
                                INSERT INTO app_stock_item (
                                    item_code, item_name, category_name, quantity_value, unit_name, unit_price, min_threshold,
                                    supplier_name, entity_scope, entity_reference, last_updated
                                ) VALUES (?, ?, 'Boisson', 25, 'bouteilles', ?, 5, 'Bar', 'BAR', ?, ?)
                                """, Statement.RETURN_GENERATED_KEYS);
                        sStatement.setString(1, itemCode);
                        sStatement.setString(2, finalItemName);
                        sStatement.setBigDecimal(3, ValueUtils.bigDecimal(item.unitPrice()));
                        sStatement.setString(4, String.valueOf(item.menuItemId()));
                        sStatement.setTimestamp(5, Timestamp.valueOf(LocalDateTime.now()));
                        return sStatement;
                    }, sKeyHolder);
                    Number sKey = sKeyHolder.getKey();
                    stockItemId = sKey != null ? sKey.longValue() : 0L;
                } else {
                    stockItemId = existingIds.get(0);
                }

                if (stockItemId > 0) {
                    // Create EXIT stock movement
                    jdbcTemplate.update("""
                            INSERT INTO app_stock_movement (stock_item_id, movement_type, quantity_value, reason_text, reference_code, created_at)
                            VALUES (?, 'EXIT', ?, ?, ?, ?)
                            """,
                            stockItemId,
                            item.quantity(),
                            "Vente bar - Table " + request.tableNumber(),
                            "ORDER-" + orderId,
                            Timestamp.valueOf(LocalDateTime.now()));

                    // Update quantity in app_stock_item
                    jdbcTemplate.update("""
                            UPDATE app_stock_item
                            SET quantity_value = GREATEST(COALESCE(quantity_value, 0) - ?, 0),
                                last_updated = ?
                            WHERE id = ?
                            """,
                            item.quantity(),
                            Timestamp.valueOf(LocalDateTime.now()),
                            stockItemId);
                }
            } else {
                // Decrement legacy plat stock
                jdbcTemplate.update("""
                        UPDATE plat
                        SET qte_stock = GREATEST(COALESCE(qte_stock, 0) - ?, 0),
                            qte_sortie = COALESCE(qte_sortie, 0) + ?
                        WHERE code_plat = ?
                        """, item.quantity(), item.quantity(), item.menuItemId());

                try {
                    itemName = jdbcTemplate.queryForObject(
                            "SELECT libelle FROM plat WHERE code_plat = ?", String.class, item.menuItemId());
                } catch (Exception e) {
                    // Keep default
                }
                if (itemName == null || itemName.isBlank()) {
                    itemName = "Plat " + item.menuItemId();
                }

                // Find or create matching app_stock_item in RESTAURANT scope
                String itemCode = "PLT-" + item.menuItemId();
                String finalItemName = itemName;
                List<Long> existingIds = jdbcTemplate.query("""
                        SELECT id FROM app_stock_item
                        WHERE item_code = ? AND UPPER(entity_scope) = 'RESTAURANT'
                        """, (rs, rowNum) -> rs.getLong("id"), itemCode);

                long stockItemId;
                if (existingIds.isEmpty()) {
                    KeyHolder sKeyHolder = new GeneratedKeyHolder();
                    jdbcTemplate.update(connection -> {
                        PreparedStatement sStatement = connection.prepareStatement("""
                                INSERT INTO app_stock_item (
                                    item_code, item_name, category_name, quantity_value, unit_name, unit_price, min_threshold,
                                    supplier_name, entity_scope, entity_reference, last_updated
                                ) VALUES (?, ?, 'Plat', 10, 'portions', ?, 5, 'Cuisine', 'RESTAURANT', ?, ?)
                                """, Statement.RETURN_GENERATED_KEYS);
                        sStatement.setString(1, itemCode);
                        sStatement.setString(2, finalItemName);
                        sStatement.setBigDecimal(3, ValueUtils.bigDecimal(item.unitPrice()));
                        sStatement.setString(4, String.valueOf(item.menuItemId()));
                        sStatement.setTimestamp(5, Timestamp.valueOf(LocalDateTime.now()));
                        return sStatement;
                    }, sKeyHolder);
                    Number sKey = sKeyHolder.getKey();
                    stockItemId = sKey != null ? sKey.longValue() : 0L;
                } else {
                    stockItemId = existingIds.get(0);
                }

                if (stockItemId > 0) {
                    // Create EXIT stock movement
                    jdbcTemplate.update("""
                            INSERT INTO app_stock_movement (stock_item_id, movement_type, quantity_value, reason_text, reference_code, created_at)
                            VALUES (?, 'EXIT', ?, ?, ?, ?)
                            """,
                            stockItemId,
                            item.quantity(),
                            "Vente restaurant - Table " + request.tableNumber(),
                            "ORDER-" + orderId,
                            Timestamp.valueOf(LocalDateTime.now()));

                    // Update quantity in app_stock_item
                    jdbcTemplate.update("""
                            UPDATE app_stock_item
                            SET quantity_value = GREATEST(COALESCE(quantity_value, 0) - ?, 0),
                                last_updated = ?
                            WHERE id = ?
                            """,
                            item.quantity(),
                            Timestamp.valueOf(LocalDateTime.now()),
                            stockItemId);
                }
            }
        }

        return orderId;
    }

    public void updateOrderStatus(long orderId, String status) {
        Timestamp servedAt = ("Servi".equalsIgnoreCase(status) || "Payé".equalsIgnoreCase(status))
                ? Timestamp.valueOf(LocalDateTime.now())
                : null;

        jdbcTemplate.update("""
                UPDATE app_restaurant_order
                SET status_label = ?, served_at = CASE WHEN ? IS NULL THEN served_at ELSE ? END
                WHERE id = ?
                """,
                status,
                servedAt,
                servedAt,
                orderId);
    }

    public void deleteOrder(long orderId) {
        jdbcTemplate.update("DELETE FROM app_restaurant_order_item WHERE order_id = ?", orderId);
        jdbcTemplate.update("DELETE FROM app_restaurant_order WHERE id = ?", orderId);
    }

    private int ensureCategory(String categoryName) {
        Integer existing = jdbcTemplate.query("""
                SELECT code_type
                FROM type_plat
                WHERE LOWER(libelle) = LOWER(?)
                LIMIT 1
                """, (rs, rowNum) -> rs.getInt("code_type"), ValueUtils.coalesce(categoryName, "Plat")).stream()
                .findFirst()
                .orElse(null);

        if (existing != null) {
            return existing;
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO type_plat (libelle) VALUES (?)",
                    Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, ValueUtils.coalesce(categoryName, "Plat"));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer la categorie de plat.");
        }
        return key.intValue();
    }

    private OperationsDtos.RestaurantOrderResponse mapOrder(
            long orderId,
            int tableNumber,
            String status,
            java.math.BigDecimal totalAmount,
            java.time.OffsetDateTime createdAt,
            java.time.OffsetDateTime servedAt) {
        return new OperationsDtos.RestaurantOrderResponse(
                orderId,
                tableNumber,
                findOrderItems(orderId),
                status,
                totalAmount,
                createdAt,
                servedAt);
    }

    private List<OperationsDtos.RestaurantOrderItemResponse> findOrderItems(long orderId) {
        return jdbcTemplate.query("""
                SELECT oi.id, oi.menu_item_id, oi.quantity_value, oi.unit_price, p.libelle
                FROM app_restaurant_order_item oi
                LEFT JOIN plat p ON p.code_plat = oi.menu_item_id
                WHERE oi.order_id = ?
                ORDER BY oi.id
                """, (rs, rowNum) -> new OperationsDtos.RestaurantOrderItemResponse(
                rs.getLong("id"),
                rs.getLong("menu_item_id"),
                ValueUtils.coalesce(rs.getString("libelle"), "Article"),
                rs.getInt("quantity_value"),
                ValueUtils.bigDecimal(rs.getBigDecimal("unit_price"))), orderId);
    }
}
