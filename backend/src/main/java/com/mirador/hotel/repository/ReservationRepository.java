package com.mirador.hotel.repository;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.util.DateTimeMapper;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Repository
public class ReservationRepository {

    private final JdbcTemplate jdbcTemplate;

    public ReservationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<HotelDtos.ReservationResponse> findAll() {
        return jdbcTemplate.query(baseSelect() + " ORDER BY o.code DESC", (rs, rowNum) -> mapReservation(rs));
    }

    public Optional<HotelDtos.ReservationResponse> findById(long reservationId) {
        return jdbcTemplate.query(
                baseSelect() + " WHERE o.code = ?",
                (rs, rowNum) -> mapReservation(rs),
                reservationId).stream().findFirst();
    }

    public List<HotelDtos.ReservationResponse> findByStatus(String status) {
        return jdbcTemplate.query(
                baseSelect() + " WHERE COALESCE(ars.status_label, 'Confirmée') = ? ORDER BY o.code DESC",
                (rs, rowNum) -> mapReservation(rs),
                status.trim());
    }

    public List<HotelDtos.ReservationResponse> findByClient(long clientId) {
        return jdbcTemplate.query(
                baseSelect() + " WHERE o.code_client = ? ORDER BY o.code DESC",
                (rs, rowNum) -> mapReservation(rs),
                clientId);
    }

    public boolean isRoomAvailable(String roomId, LocalDate checkIn, LocalDate checkOut, Long excludeReservationId) {
        Long total = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM occupation o
                LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
                WHERE o.code_chambre = ?
                  AND (? IS NULL OR o.code <> ?)
                  AND COALESCE(ars.status_label, 'Confirmée') NOT IN ('Annulée', 'Annulee', 'Cancelled')
                  AND DATE(o.date_debut) < ?
                  AND DATE(o.date_fin) > ?
                """,
                Long.class,
                roomId.trim(),
                excludeReservationId,
                excludeReservationId,
                java.sql.Date.valueOf(checkOut),
                java.sql.Date.valueOf(checkIn));

        return total == null || total == 0;
    }

    public long create(HotelDtos.ReservationRequest request) {
        long occupantId = insertOccupant(request);
        BigDecimal totalAmount = resolveReservationAmount(
                request.roomId(),
                request.checkIn(),
                request.checkOut(),
                request.totalAmount());

        String invoiceCode = generateInvoiceCode();
        insertInvoice(invoiceCode, request.clientId(), totalAmount);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO occupation (
                        code_client,
                        code_chambre,
                        date_debut,
                        date_fin,
                        type_service,
                        qte,
                        code_occupant,
                        code_facture,
                        observation
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, request.clientId());
            statement.setString(2, request.roomId().trim());
            statement.setTimestamp(3, Timestamp.valueOf(request.checkIn().atStartOfDay()));
            statement.setTimestamp(4, Timestamp.valueOf(request.checkOut().atStartOfDay()));
            statement.setString(5, "HEBERGEMENT");
            statement.setInt(6, (int) Math.max(1, ChronoUnit.DAYS.between(request.checkIn(), request.checkOut())));
            statement.setLong(7, occupantId);
            statement.setString(8, invoiceCode);
            statement.setString(9, ValueUtils.trimToNull(request.observation()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'identifiant de la reservation.");
        }

        long reservationId = key.longValue();
        upsertReservationState(reservationId, request.status(), totalAmount);
        return reservationId;
    }

    public void update(long reservationId, HotelDtos.ReservationRequest request) {
        ReservationInternalRow current = findInternal(reservationId)
                .orElseThrow(() -> new IllegalStateException("Reservation introuvable."));

        long occupantId = current.occupantId();
        if (occupantId == 0) {
            occupantId = insertOccupant(request);
        } else {
            updateOccupant(occupantId, request);
        }

        BigDecimal totalAmount = resolveReservationAmount(
                request.roomId(),
                request.checkIn(),
                request.checkOut(),
                request.totalAmount());

        String invoiceCode = current.invoiceCode();
        if (ValueUtils.trimToNull(invoiceCode) == null) {
            invoiceCode = generateInvoiceCode();
            insertInvoice(invoiceCode, request.clientId(), totalAmount);
        } else {
            updateInvoice(invoiceCode, request.clientId(), totalAmount);
        }

        jdbcTemplate.update("""
                UPDATE occupation
                SET code_client = ?, code_chambre = ?, date_debut = ?, date_fin = ?, qte = ?,
                    code_occupant = ?, code_facture = ?, observation = ?
                WHERE code = ?
                """,
                request.clientId(),
                request.roomId().trim(),
                Timestamp.valueOf(request.checkIn().atStartOfDay()),
                Timestamp.valueOf(request.checkOut().atStartOfDay()),
                (int) Math.max(1, ChronoUnit.DAYS.between(request.checkIn(), request.checkOut())),
                occupantId,
                invoiceCode,
                ValueUtils.trimToNull(request.observation()),
                reservationId);

        upsertReservationState(reservationId, request.status(), totalAmount);
    }

    public void delete(long reservationId) {
        ReservationInternalRow current = findInternal(reservationId)
                .orElseThrow(() -> new IllegalStateException("Reservation introuvable."));

        jdbcTemplate.update("DELETE FROM app_reservation_state WHERE occupation_code = ?", reservationId);
        jdbcTemplate.update("DELETE FROM occupation WHERE code = ?", reservationId);

        if (current.invoiceCode() != null) {
            jdbcTemplate.update("DELETE FROM facture WHERE code_facture = ?", current.invoiceCode());
        }

        if (current.occupantId() > 0) {
            jdbcTemplate.update("DELETE FROM occupant WHERE code_occupant = ?", current.occupantId());
        }
    }

    private String baseSelect() {
        return """
                SELECT
                    o.code,
                    o.code_client,
                    o.code_chambre,
                    DATE(o.date_debut) AS check_in,
                    DATE(o.date_fin) AS check_out,
                    COALESCE(ars.status_label, 'Confirmée') AS reservation_status,
                    COALESCE(ars.total_amount, f.net, 0) AS total_amount,
                    COALESCE(ars.created_at, o.date_debut) AS created_at,
                    c.type_client,
                    cp.company_name,
                    occ.prenom AS occupant_first_name,
                    occ.nom AS occupant_last_name,
                    occ.numero_identite AS occupant_id_document,
                    occ.telephone AS occupant_phone,
                    tc.libelle AS room_type,
                    c.nom_client AS client_name
                FROM occupation o
                LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
                LEFT JOIN client c ON c.code_client = o.code_client
                LEFT JOIN app_client_profile cp ON cp.code_client = c.code_client
                LEFT JOIN occupant occ ON occ.code_occupant = o.code_occupant
                LEFT JOIN chambre ch ON ch.code_chambre = o.code_chambre
                LEFT JOIN type_chambre tc ON tc.codetype = ch.code_type
                LEFT JOIN facture f ON f.code_facture = o.code_facture
                """;
    }

    private Optional<ReservationInternalRow> findInternal(long reservationId) {
        return jdbcTemplate.query("""
                SELECT code, COALESCE(code_occupant, 0) AS code_occupant, code_facture
                FROM occupation
                WHERE code = ?
                """,
                (rs, rowNum) -> new ReservationInternalRow(
                        rs.getLong("code"),
                        rs.getLong("code_occupant"),
                        ValueUtils.trimToNull(rs.getString("code_facture"))),
                reservationId).stream().findFirst();
    }

    private long insertOccupant(HotelDtos.ReservationRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO occupant (
                        nom,
                        prenom,
                        telephone,
                        adresse_privee,
                        numero_identite
                    ) VALUES (?, ?, ?, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, request.occupantLastName().trim());
            statement.setString(2, request.occupantFirstName().trim());
            statement.setString(3, ValueUtils.trimToNull(request.occupantPhone()));
            statement.setString(4, ValueUtils.trimToNull(request.occupantAddress()));
            statement.setString(5, ValueUtils.trimToNull(request.occupantIdDocument()));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Impossible de recuperer l'occupant cree.");
        }

        return key.longValue();
    }

    private void updateOccupant(long occupantId, HotelDtos.ReservationRequest request) {
        jdbcTemplate.update("""
                UPDATE occupant
                SET nom = ?, prenom = ?, telephone = ?, adresse_privee = ?, numero_identite = ?
                WHERE code_occupant = ?
                """,
                request.occupantLastName().trim(),
                request.occupantFirstName().trim(),
                ValueUtils.trimToNull(request.occupantPhone()),
                ValueUtils.trimToNull(request.occupantAddress()),
                ValueUtils.trimToNull(request.occupantIdDocument()),
                occupantId);
    }

    private BigDecimal resolveReservationAmount(String roomId, LocalDate checkIn, LocalDate checkOut, BigDecimal requestedAmount) {
        if (requestedAmount != null) {
            return requestedAmount;
        }

        BigDecimal roomRate = jdbcTemplate.queryForObject("""
                SELECT COALESCE(t.nuite, 0)
                FROM chambre c
                LEFT JOIN type_chambre t ON t.codetype = c.code_type
                WHERE c.code_chambre = ?
                """,
                BigDecimal.class,
                roomId.trim());

        long nights = Math.max(1, ChronoUnit.DAYS.between(checkIn, checkOut));
        return ValueUtils.bigDecimal(roomRate).multiply(BigDecimal.valueOf(nights));
    }

    private String generateInvoiceCode() {
        return "RS" + System.currentTimeMillis();
    }

    private void insertInvoice(String invoiceCode, long clientId, BigDecimal totalAmount) {
        jdbcTemplate.update("""
                INSERT INTO facture (
                    code_facture,
                    code_client,
                    date_facture,
                    remise,
                    total,
                    net,
                    code_depot,
                    total_paye,
                    paye
                ) VALUES (?, ?, ?, 0, ?, ?, 1, 0, 0)
                """,
                invoiceCode,
                clientId,
                Timestamp.valueOf(LocalDateTime.now()),
                ValueUtils.bigDecimal(totalAmount),
                ValueUtils.bigDecimal(totalAmount));
    }

    private void updateInvoice(String invoiceCode, long clientId, BigDecimal totalAmount) {
        jdbcTemplate.update("""
                UPDATE facture
                SET code_client = ?, total = ?, net = ?, date_facture = ?
                WHERE code_facture = ?
                """,
                clientId,
                ValueUtils.bigDecimal(totalAmount),
                ValueUtils.bigDecimal(totalAmount),
                Timestamp.valueOf(LocalDateTime.now()),
                invoiceCode);
    }

    private void upsertReservationState(long reservationId, String status, BigDecimal totalAmount) {
        jdbcTemplate.update("""
                INSERT INTO app_reservation_state (occupation_code, status_label, total_amount, created_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    status_label = VALUES(status_label),
                    total_amount = VALUES(total_amount)
                """,
                reservationId,
                ValueUtils.coalesce(status, "Confirmée"),
                ValueUtils.bigDecimal(totalAmount),
                Timestamp.valueOf(LocalDateTime.now()));
    }

    private HotelDtos.ReservationResponse mapReservation(ResultSet rs) throws SQLException {
        return new HotelDtos.ReservationResponse(
                rs.getLong("code"),
                rs.getLong("code_client"),
                rs.getString("code_chambre"),
                DateTimeMapper.toLocalDate(rs.getDate("check_in")),
                DateTimeMapper.toLocalDate(rs.getDate("check_out")),
                rs.getString("reservation_status"),
                ValueUtils.bigDecimal(rs.getBigDecimal("total_amount")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at")),
                ValueUtils.coalesce(rs.getString("type_client"), "Personne physique"),
                ValueUtils.trimToNull(rs.getString("company_name")),
                ValueUtils.coalesce(rs.getString("occupant_first_name"), ""),
                ValueUtils.coalesce(rs.getString("occupant_last_name"), ""),
                ValueUtils.trimToNull(rs.getString("occupant_id_document")),
                ValueUtils.trimToNull(rs.getString("occupant_phone")),
                ValueUtils.coalesce(rs.getString("room_type"), "Standard"),
                ValueUtils.coalesce(rs.getString("client_name"), "Client"));
    }

    private record ReservationInternalRow(
            long id,
            long occupantId,
            String invoiceCode) {
    }
}
