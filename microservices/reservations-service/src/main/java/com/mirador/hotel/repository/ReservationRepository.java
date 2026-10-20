package com.mirador.hotel.repository;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.RemoteServiceException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.util.DateTimeMapper;
import com.mirador.hotel.util.ValueUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Reservations (occupation + occupant + state). Client names, room types and invoices belong to other
 * microservices: they are resolved through {@link RemoteApi} instead of SQL joins.
 */
@Repository
public class ReservationRepository {

    private static final Logger log = LoggerFactory.getLogger(ReservationRepository.class);

    private final JdbcTemplate jdbcTemplate;
    private final RemoteApi remoteApi;

    public ReservationRepository(JdbcTemplate jdbcTemplate, RemoteApi remoteApi) {
        this.jdbcTemplate = jdbcTemplate;
        this.remoteApi = remoteApi;
    }

    public List<HotelDtos.ReservationResponse> findAll() {
        return enrich(jdbcTemplate.query(baseSelect() + " ORDER BY o.code DESC", (rs, rowNum) -> mapRaw(rs)));
    }

    public Optional<HotelDtos.ReservationResponse> findById(long reservationId) {
        return enrich(jdbcTemplate.query(baseSelect() + " WHERE o.code = ?", (rs, rowNum) -> mapRaw(rs), reservationId))
                .stream().findFirst();
    }

    public List<HotelDtos.ReservationResponse> findByStatus(String status) {
        return enrich(jdbcTemplate.query(
                baseSelect() + " WHERE COALESCE(ars.status_label, 'Confirmée') = ? ORDER BY o.code DESC",
                (rs, rowNum) -> mapRaw(rs),
                status.trim()));
    }

    public List<HotelDtos.ReservationResponse> findByClient(long clientId) {
        return enrich(jdbcTemplate.query(
                baseSelect() + " WHERE o.code_client = ? ORDER BY o.code DESC",
                (rs, rowNum) -> mapRaw(rs),
                clientId));
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
        remoteApi.client(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + request.clientId()));
        BigDecimal totalAmount = resolveReservationAmount(request);

        // 1) the invoice is owned by facturation-service
        String invoiceCode = remoteApi.createInvoice(request.clientId(), totalAmount);

        // 2) local writes; if they fail, undo the remote invoice (manual compensation)
        try {
            long occupantId = insertOccupant(request);

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
        } catch (RuntimeException ex) {
            discardInvoice(invoiceCode);
            throw ex;
        }
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

        BigDecimal totalAmount = resolveReservationAmount(request);

        String invoiceCode = current.invoiceCode();
        if (ValueUtils.trimToNull(invoiceCode) == null) {
            invoiceCode = remoteApi.createInvoice(request.clientId(), totalAmount);
        } else {
            remoteApi.updateInvoice(invoiceCode, request.clientId(), totalAmount);
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

        if (current.occupantId() > 0) {
            jdbcTemplate.update("DELETE FROM occupant WHERE code_occupant = ?", current.occupantId());
        }
        if (current.invoiceCode() != null) {
            discardInvoice(current.invoiceCode());
        }
    }

    // ------------------------------------------------------------------ queries
    private String baseSelect() {
        return """
                SELECT
                    o.code,
                    o.code_client,
                    o.code_chambre,
                    DATE(o.date_debut) AS check_in,
                    DATE(o.date_fin) AS check_out,
                    COALESCE(ars.status_label, 'Confirmée') AS reservation_status,
                    COALESCE(ars.total_amount, 0) AS total_amount,
                    COALESCE(ars.created_at, o.date_debut) AS created_at,
                    occ.prenom AS occupant_first_name,
                    occ.nom AS occupant_last_name,
                    occ.numero_identite AS occupant_id_document,
                    occ.telephone AS occupant_phone
                FROM occupation o
                LEFT JOIN app_reservation_state ars ON ars.occupation_code = o.code
                LEFT JOIN occupant occ ON occ.code_occupant = o.code_occupant
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

    /** Amount = explicit amount, else nightly rate (chambres-service) x nights; then optional promo code. */
    private BigDecimal resolveReservationAmount(HotelDtos.ReservationRequest request) {
        BigDecimal amount = request.totalAmount();
        if (amount == null) {
            RemoteApi.RoomInfo room = remoteApi.room(request.roomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable : " + request.roomId()));
            long nights = Math.max(1, ChronoUnit.DAYS.between(request.checkIn(), request.checkOut()));
            amount = ValueUtils.bigDecimal(room.nightlyRate()).multiply(BigDecimal.valueOf(nights));
        } else {
            remoteApi.room(request.roomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable : " + request.roomId()));
        }

        String promoCode = ValueUtils.trimToNull(request.promoCode());
        if (promoCode != null) {
            RemoteApi.PromotionResult result = remoteApi.applyPromotion(promoCode, amount);
            if (!result.valid()) {
                throw new BadRequestException("Code promotion refuse : " + result.reason());
            }
            amount = result.finalAmount();
        }
        return amount;
    }

    private void discardInvoice(String invoiceCode) {
        try {
            remoteApi.deleteInvoice(invoiceCode);
        } catch (RuntimeException ex) {
            log.warn("facture {} non supprimee cote facturation-service : {}", invoiceCode, ex.getMessage());
        }
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

    // ------------------------------------------------------------------ enrichment
    private RawReservation mapRaw(ResultSet rs) throws SQLException {
        return new RawReservation(
                rs.getLong("code"),
                rs.getLong("code_client"),
                rs.getString("code_chambre"),
                DateTimeMapper.toLocalDate(rs.getDate("check_in")),
                DateTimeMapper.toLocalDate(rs.getDate("check_out")),
                rs.getString("reservation_status"),
                ValueUtils.bigDecimal(rs.getBigDecimal("total_amount")),
                DateTimeMapper.toOffsetDateTime(rs.getTimestamp("created_at")),
                ValueUtils.coalesce(rs.getString("occupant_first_name"), ""),
                ValueUtils.coalesce(rs.getString("occupant_last_name"), ""),
                ValueUtils.trimToNull(rs.getString("occupant_id_document")),
                ValueUtils.trimToNull(rs.getString("occupant_phone")));
    }

    private List<HotelDtos.ReservationResponse> enrich(List<RawReservation> rows) {
        Set<Long> clientIds = new LinkedHashSet<>();
        Set<String> roomCodes = new LinkedHashSet<>();
        rows.forEach(row -> {
            clientIds.add(row.clientId());
            roomCodes.add(row.roomId());
        });

        Map<Long, RemoteApi.ClientInfo> clients = new HashMap<>();
        Map<String, String> roomTypes = new HashMap<>();
        try {
            clients.putAll(remoteApi.clients(clientIds));
        } catch (RemoteServiceException ex) {
            log.warn("clients-service indisponible, noms de clients par defaut : {}", ex.getMessage());
        }
        try {
            roomTypes.putAll(remoteApi.roomTypes(roomCodes));
        } catch (RemoteServiceException ex) {
            log.warn("chambres-service indisponible, types de chambre par defaut : {}", ex.getMessage());
        }

        return rows.stream().map(row -> {
            RemoteApi.ClientInfo client = clients.get(row.clientId());
            return new HotelDtos.ReservationResponse(
                    row.id(),
                    row.clientId(),
                    row.roomId(),
                    row.checkIn(),
                    row.checkOut(),
                    row.status(),
                    row.totalAmount(),
                    row.createdAt(),
                    client == null ? "Personne physique" : ValueUtils.coalesce(client.clientType(), "Personne physique"),
                    client == null ? null : client.companyName(),
                    row.occupantFirstName(),
                    row.occupantLastName(),
                    row.occupantIdDocument(),
                    row.occupantPhone(),
                    ValueUtils.coalesce(roomTypes.get(row.roomId()), "Standard"),
                    client == null ? "Client" : ValueUtils.coalesce(client.name(), "Client"));
        }).toList();
    }

    private record RawReservation(
            long id,
            long clientId,
            String roomId,
            LocalDate checkIn,
            LocalDate checkOut,
            String status,
            BigDecimal totalAmount,
            OffsetDateTime createdAt,
            String occupantFirstName,
            String occupantLastName,
            String occupantIdDocument,
            String occupantPhone) {
    }

    private record ReservationInternalRow(
            long id,
            long occupantId,
            String invoiceCode) {
    }
}
