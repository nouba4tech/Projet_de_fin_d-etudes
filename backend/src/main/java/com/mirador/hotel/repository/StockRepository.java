package com.mirador.hotel.repository;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.model.StockScope;
import com.mirador.hotel.util.DateTimeMapper;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class StockRepository {

    private final JdbcTemplate jdbcTemplate;

    public StockRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OperationsDtos.StockItemResponse> findAllItems() {
        return findAllItemsByScope(null);
    }

    public List<OperationsDtos.StockItemResponse> findAllItemsByScope(String scope) {
        String normalizedScope = ValueUtils.trimToNull(scope);
        if (normalizedScope == null) {
            return jdbcTemplate.query("""
                    SELECT id, item_code, item_name, category_name, quantity_value, unit_name, unit_price,
                           min_threshold, supplier_name, entity_scope, entity_reference, last_updated
                    FROM app_stock_item
                    ORDER BY id DESC
                    """, (rs, rowNum) -> mapItem(rs));
        }

        return jdbcTemplate.query("""
                SELECT id, item_code, item_name, category_name, quantity_value, unit_name, unit_price,
                       min_threshold, supplier_name, entity_scope, entity_reference, last_updated
                FROM app_stock_item
                WHERE UPPER(entity_scope) = ?
                ORDER BY id DESC
                """, (rs, rowNum) -> mapItem(rs), normalizeScope(normalizedScope));
    }

    public Optional<OperationsDtos.StockItemResponse> findItemById(long itemId) {
        return jdbcTemplate.query("""
                SELECT id, item_code, item_name, category_name, quantity_value, unit_name, unit_price,
                       min_threshold, supplier_name, entity_scope, entity_reference, last_updated
                FROM app_stock_item
                WHERE id = ?
                """, (rs, rowNum) -> mapItem(rs), itemId).stream().findFirst();
    }

    public long createItem(OperationsDtos.StockItemRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_stock_item (
                        item_code, item_name, category_name, quantity_value, unit_name, unit_price, min_threshold,
                        supplier_name, entity_scope, entity_reference, last_updated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.code().trim());
            statement.setString(2, request.name().trim());
            statement.setString(3, request.category().trim());
            statement.setBigDecimal(4, ValueUtils.bigDecimal(request.quantity()));
            statement.setString(5, request.unit().trim());
            statement.setBigDecimal(6, ValueUtils.bigDecimal(request.unitPrice()));
            statement.setBigDecimal(7, ValueUtils.bigDecimal(request.minThreshold()));
            statement.setString(8, ValueUtils.trimToNull(request.supplier()));
            statement.setString(9, normalizeScope(request.scope()));
            statement.setString(10, normalizeScopeReference(request.scopeReference()));
            statement.setTimestamp(11, Timestamp.valueOf(LocalDateTime.now()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant stock.");
        }
        return key.longValue();
    }

    public void updateItem(long itemId, OperationsDtos.StockItemRequest request) {
        jdbcTemplate.update("""
                UPDATE app_stock_item
                SET item_code = ?, item_name = ?, category_name = ?, quantity_value = ?, unit_name = ?, unit_price = ?,
                    min_threshold = ?, supplier_name = ?, entity_scope = ?, entity_reference = ?, last_updated = ?
                WHERE id = ?
                """,
                request.code().trim(),
                request.name().trim(),
                request.category().trim(),
                ValueUtils.bigDecimal(request.quantity()),
                request.unit().trim(),
                ValueUtils.bigDecimal(request.unitPrice()),
                ValueUtils.bigDecimal(request.minThreshold()),
                ValueUtils.trimToNull(request.supplier()),
                normalizeScope(request.scope()),
                normalizeScopeReference(request.scopeReference()),
                Timestamp.valueOf(LocalDateTime.now()),
                itemId);
    }

    public void deleteItem(long itemId) {
        jdbcTemplate.update("DELETE FROM app_stock_movement WHERE stock_item_id = ?", itemId);
        jdbcTemplate.update("DELETE FROM app_stock_item WHERE id = ?", itemId);
    }

    public List<OperationsDtos.StockMovementResponse> findAllMovements() {
        return findAllMovementsByScope(null);
    }

    public List<OperationsDtos.StockMovementResponse> findAllMovementsByScope(String scope) {
        String normalizedScope = ValueUtils.trimToNull(scope);
        if (normalizedScope == null) {
            return jdbcTemplate.query("""
                    SELECT m.id, m.stock_item_id, m.movement_type, m.quantity_value, m.reason_text, m.reference_code, m.created_at,
                           i.entity_scope, i.entity_reference
                    FROM app_stock_movement m
                    JOIN app_stock_item i ON i.id = m.stock_item_id
                    ORDER BY m.id DESC
                    """, (rs, rowNum) -> mapMovement(rs));
        }

        return jdbcTemplate.query("""
                SELECT m.id, m.stock_item_id, m.movement_type, m.quantity_value, m.reason_text, m.reference_code, m.created_at,
                       i.entity_scope, i.entity_reference
                FROM app_stock_movement m
                JOIN app_stock_item i ON i.id = m.stock_item_id
                WHERE UPPER(i.entity_scope) = ?
                ORDER BY m.id DESC
                """, (rs, rowNum) -> mapMovement(rs), normalizeScope(normalizedScope));
    }

    public Optional<OperationsDtos.StockMovementResponse> findMovementById(long movementId) {
        return jdbcTemplate.query("""
                SELECT m.id, m.stock_item_id, m.movement_type, m.quantity_value, m.reason_text, m.reference_code, m.created_at,
                       i.entity_scope, i.entity_reference
                FROM app_stock_movement m
                JOIN app_stock_item i ON i.id = m.stock_item_id
                WHERE m.id = ?
                """, (rs, rowNum) -> mapMovement(rs), movementId).stream().findFirst();
    }

    public long createMovement(OperationsDtos.StockMovementRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_stock_movement (stock_item_id, movement_type, quantity_value, reason_text, reference_code, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, request.itemId());
            statement.setString(2, request.movementType().trim());
            statement.setBigDecimal(3, ValueUtils.bigDecimal(request.quantity()));
            statement.setString(4, request.reason().trim());
            statement.setString(5, ValueUtils.trimToNull(request.reference()));
            statement.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
            return statement;
        }, keyHolder);

        jdbcTemplate.update("""
                UPDATE app_stock_item
                SET quantity_value = CASE
                        WHEN ? = 'EXIT' THEN GREATEST(COALESCE(quantity_value, 0) - ?, 0)
                        ELSE COALESCE(quantity_value, 0) + ?
                    END,
                    last_updated = ?
                WHERE id = ?
                """,
                request.movementType().trim(),
                ValueUtils.bigDecimal(request.quantity()),
                ValueUtils.bigDecimal(request.quantity()),
                Timestamp.valueOf(LocalDateTime.now()),
                request.itemId());

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant du mouvement.");
        }
        return key.longValue();
    }

    public Optional<OperationsDtos.StockItemResponse> findItemByCodeAndScope(String code, String scope) {
        return jdbcTemplate.query("""
                SELECT id, item_code, item_name, category_name, quantity_value, unit_name, unit_price,
                       min_threshold, supplier_name, entity_scope, entity_reference, last_updated
                FROM app_stock_item
                WHERE item_code = ? AND UPPER(entity_scope) = ?
                """, (rs, rowNum) -> mapItem(rs), code, normalizeScope(scope)).stream().findFirst();
    }

    public List<OperationsDtos.StockTransferResponse> findAllTransfers() {
        return jdbcTemplate.query("""
                SELECT id, transfer_number, transfer_date, from_location, to_location, status_label, notes, requested_by, approved_by, created_at
                FROM app_stock_transfer
                ORDER BY id DESC
                """, (rs, rowNum) -> mapTransfer(rs));
    }

    public Optional<OperationsDtos.StockTransferResponse> findTransferById(long id) {
        return jdbcTemplate.query("""
                SELECT id, transfer_number, transfer_date, from_location, to_location, status_label, notes, requested_by, approved_by, created_at
                FROM app_stock_transfer
                WHERE id = ?
                """, (rs, rowNum) -> mapTransfer(rs), id).stream().findFirst();
    }

    private OperationsDtos.StockTransferResponse mapTransfer(ResultSet rs) throws SQLException {
        long id = rs.getLong("id");
        List<OperationsDtos.StockTransferItemResponse> items = jdbcTemplate.query("""
                SELECT ti.id, ti.stock_item_id, i.item_code, i.item_name, ti.quantity_value
                FROM app_stock_transfer_item ti
                JOIN app_stock_item i ON i.id = ti.stock_item_id
                WHERE ti.transfer_id = ?
                """, (rsItem, rowNum) -> new OperationsDtos.StockTransferItemResponse(
                rsItem.getLong("id"),
                rsItem.getLong("stock_item_id"),
                rsItem.getString("item_code"),
                rsItem.getString("item_name"),
                rsItem.getBigDecimal("quantity_value")
        ), id);

        return new OperationsDtos.StockTransferResponse(
                id,
                rs.getString("transfer_number"),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("transfer_date")),
                rs.getString("from_location"),
                rs.getString("to_location"),
                rs.getString("status_label"),
                rs.getString("notes"),
                rs.getString("requested_by"),
                rs.getString("approved_by"),
                items,
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at"))
        );
    }

    public long createTransfer(OperationsDtos.StockTransferRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_stock_transfer (
                        transfer_number, transfer_date, from_location, to_location, status_label, notes, requested_by, approved_by, created_at
                    ) VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.transferNumber().trim());
            statement.setTimestamp(2, Timestamp.valueOf(request.transferDate().toLocalDateTime()));
            statement.setString(3, request.fromLocation().trim());
            statement.setString(4, request.toLocation().trim());
            statement.setString(5, ValueUtils.trimToNull(request.notes()));
            statement.setString(6, ValueUtils.trimToNull(request.requestedBy()));
            statement.setString(7, ValueUtils.trimToNull(request.approvedBy()));
            statement.setTimestamp(8, Timestamp.valueOf(LocalDateTime.now()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de récupérer l'identifiant du transfert.");
        }
        long transferId = key.longValue();

        for (OperationsDtos.StockTransferItemRequest item : request.items()) {
            jdbcTemplate.update("""
                    INSERT INTO app_stock_transfer_item (transfer_id, stock_item_id, quantity_value)
                    VALUES (?, ?, ?)
                    """,
                    transferId,
                    item.stockItemId(),
                    item.quantity());
        }

        return transferId;
    }

    public List<OperationsDtos.SupplierInvoiceResponse> findAllSupplierInvoices() {
        return jdbcTemplate.query("""
                SELECT id, invoice_number, supplier_id, supplier_name, invoice_date, due_date, subtotal_amount, tax_amount, total_amount, status_label, notes, created_by, created_at
                FROM app_supplier_invoice
                ORDER BY id DESC
                """, (rs, rowNum) -> mapSupplierInvoice(rs));
    }

    public Optional<OperationsDtos.SupplierInvoiceResponse> findSupplierInvoiceById(long id) {
        return jdbcTemplate.query("""
                SELECT id, invoice_number, supplier_id, supplier_name, invoice_date, due_date, subtotal_amount, tax_amount, total_amount, status_label, notes, created_by, created_at
                FROM app_supplier_invoice
                WHERE id = ?
                """, (rs, rowNum) -> mapSupplierInvoice(rs), id).stream().findFirst();
    }

    private OperationsDtos.SupplierInvoiceResponse mapSupplierInvoice(ResultSet rs) throws SQLException {
        long id = rs.getLong("id");
        List<OperationsDtos.SupplierInvoiceItemResponse> items = jdbcTemplate.query("""
                SELECT id, item_code, item_name, category_name, quantity_value, unit_name, unit_price, quantity_value * unit_price AS total_price
                FROM app_supplier_invoice_item
                WHERE invoice_id = ?
                """, (rsItem, rowNum) -> new OperationsDtos.SupplierInvoiceItemResponse(
                rsItem.getLong("id"),
                rsItem.getString("item_code"),
                rsItem.getString("item_name"),
                rsItem.getString("category_name"),
                rsItem.getBigDecimal("quantity_value"),
                rsItem.getString("unit_name"),
                rsItem.getBigDecimal("unit_price"),
                rsItem.getBigDecimal("total_price")
        ), id);

        return new OperationsDtos.SupplierInvoiceResponse(
                id,
                rs.getString("invoice_number"),
                rs.getInt("supplier_id"),
                rs.getString("supplier_name"),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("invoice_date")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("due_date")),
                rs.getBigDecimal("subtotal_amount"),
                rs.getBigDecimal("tax_amount"),
                rs.getBigDecimal("total_amount"),
                rs.getString("status_label"),
                rs.getString("notes"),
                rs.getString("created_by"),
                items,
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at"))
        );
    }

    public long createSupplierInvoice(OperationsDtos.SupplierInvoiceRequest request, String supplierName) {
        java.math.BigDecimal subtotal = request.items().stream()
                .map(item -> item.unitPrice().multiply(item.quantity()))
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        java.math.BigDecimal taxRate = java.math.BigDecimal.valueOf(0.1925);
        java.math.BigDecimal tax = subtotal.multiply(taxRate);
        java.math.BigDecimal total = subtotal.add(tax);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO app_supplier_invoice (
                        invoice_number, supplier_id, supplier_name, invoice_date, due_date, subtotal_amount, tax_amount, total_amount, status_label, notes, created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.invoiceNumber().trim());
            statement.setInt(2, request.supplierId());
            statement.setString(3, supplierName);
            statement.setTimestamp(4, Timestamp.valueOf(request.invoiceDate().toLocalDateTime()));
            statement.setTimestamp(5, Timestamp.valueOf(request.dueDate().toLocalDateTime()));
            statement.setBigDecimal(6, subtotal);
            statement.setBigDecimal(7, tax);
            statement.setBigDecimal(8, total);
            statement.setString(9, request.status() != null ? request.status().trim() : "draft");
            statement.setString(10, ValueUtils.trimToNull(request.notes()));
            statement.setString(11, ValueUtils.trimToNull(request.createdBy()));
            statement.setTimestamp(12, Timestamp.valueOf(LocalDateTime.now()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de récupérer l'identifiant de la facture fournisseur.");
        }
        long invoiceId = key.longValue();

        for (OperationsDtos.SupplierInvoiceItemRequest item : request.items()) {
            java.math.BigDecimal itemTotal = item.unitPrice().multiply(item.quantity());
            jdbcTemplate.update("""
                    INSERT INTO app_supplier_invoice_item (
                        invoice_id, item_code, item_name, category_name, quantity_value, unit_name, unit_price, total_price
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    invoiceId,
                    item.itemCode().trim(),
                    item.itemName().trim(),
                    ValueUtils.trimToNull(item.categoryName()),
                    item.quantity(),
                    item.unitName().trim(),
                    item.unitPrice(),
                    itemTotal);
        }

        return invoiceId;
    }

    public void updateSupplierInvoiceStatus(long invoiceId, String status) {
        jdbcTemplate.update("""
                UPDATE app_supplier_invoice
                SET status_label = ?
                WHERE id = ?
                """,
                status,
                invoiceId);
    }

    private OperationsDtos.StockItemResponse mapItem(ResultSet rs) throws SQLException {
        return new OperationsDtos.StockItemResponse(
                rs.getLong("id"),
                rs.getString("item_code"),
                rs.getString("item_name"),
                rs.getString("category_name"),
                ValueUtils.bigDecimal(rs.getBigDecimal("quantity_value")),
                rs.getString("unit_name"),
                ValueUtils.bigDecimal(rs.getBigDecimal("unit_price")),
                ValueUtils.bigDecimal(rs.getBigDecimal("min_threshold")),
                ValueUtils.trimToNull(rs.getString("supplier_name")),
                normalizeScope(rs.getString("entity_scope")),
                ValueUtils.trimToNull(rs.getString("entity_reference")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("last_updated")));
    }

    private OperationsDtos.StockMovementResponse mapMovement(ResultSet rs) throws SQLException {
        return new OperationsDtos.StockMovementResponse(
                rs.getLong("id"),
                rs.getLong("stock_item_id"),
                rs.getString("movement_type"),
                ValueUtils.bigDecimal(rs.getBigDecimal("quantity_value")),
                rs.getString("reason_text"),
                ValueUtils.trimToNull(rs.getString("reference_code")),
                normalizeScope(rs.getString("entity_scope")),
                ValueUtils.trimToNull(rs.getString("entity_reference")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at")));
    }

    private String normalizeScope(String scope) {
        return StockScope.normalize(scope);
    }

    private String normalizeScopeReference(String scopeReference) {
        return ValueUtils.trimToNull(scopeReference);
    }
}

