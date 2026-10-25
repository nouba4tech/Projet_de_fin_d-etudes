package com.mirador.hotel.service;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.InvoiceDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ConflictException;
import com.mirador.hotel.exception.RemoteServiceException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.InvoiceRepository;
import com.mirador.hotel.repository.InvoiceRepository.InvoiceRow;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Invoice life cycle: issue, payments, archive, tracking and printable document. */
@Service
@Transactional
public class InvoiceService {

    private final InvoiceRepository repository;
    private final RemoteApi remoteApi;

    public InvoiceService(InvoiceRepository repository, RemoteApi remoteApi) {
        this.repository = repository;
        this.remoteApi = remoteApi;
    }

    // ------------------------------------------------------------------ public (gateway) use cases
    @Transactional(readOnly = true)
    public List<InvoiceDtos.InvoiceResponse> list(String status, Long clientId, Boolean archived) {
        List<InvoiceRow> rows = repository.findAll(clientId);
        Map<Long, RemoteApi.ClientInfo> clients = lookupClients(rows);
        return rows.stream()
                .filter(row -> status == null || status.isBlank() || row.status().equalsIgnoreCase(status.trim()))
                .filter(row -> archived == null || archived == InvoiceRepository.ARCHIVEE.equals(row.status()))
                .map(row -> toResponse(row, clients))
                .toList();
    }

    @Transactional(readOnly = true)
    public InvoiceDtos.InvoiceResponse get(String code) {
        InvoiceRow row = require(code);
        return toResponse(row, lookupClients(List.of(row)));
    }

    @Transactional(readOnly = true)
    public InvoiceDtos.InvoiceTracking tracking(String code) {
        return new InvoiceDtos.InvoiceTracking(get(code), repository.events(code));
    }

    @Transactional(readOnly = true)
    public InvoiceDtos.InvoiceStats stats() {
        long issued = 0;
        long partial = 0;
        long paid = 0;
        long archived = 0;
        BigDecimal amount = BigDecimal.ZERO;
        BigDecimal collected = BigDecimal.ZERO;
        List<InvoiceRow> rows = repository.findAll(null);
        for (InvoiceRow row : rows) {
            switch (row.status()) {
                case InvoiceRepository.EMISE -> issued++;
                case InvoiceRepository.PARTIELLEMENT_PAYEE -> partial++;
                case InvoiceRepository.PAYEE -> paid++;
                case InvoiceRepository.ARCHIVEE -> archived++;
                default -> { }
            }
            if (!InvoiceRepository.ANNULEE.equals(row.status())) {
                amount = amount.add(row.net());
                collected = collected.add(row.totalPaid());
            }
        }
        return new InvoiceDtos.InvoiceStats(rows.size(), issued, partial, paid, archived, amount, collected,
                amount.subtract(collected).max(BigDecimal.ZERO));
    }

    public InvoiceDtos.InvoiceResponse archive(String code) {
        InvoiceRow row = require(code);
        if (InvoiceRepository.ARCHIVEE.equals(row.status())) {
            throw new ConflictException("La facture " + code + " est deja archivee.");
        }
        if (!InvoiceRepository.PAYEE.equals(row.status())) {
            throw new ConflictException("Seule une facture soldee peut etre archivee (statut actuel : " + row.status() + ").");
        }
        String user = currentUser();
        repository.archive(code, user);
        repository.addEvent(code, "ARCHIVED", "par " + user);
        return get(code);
    }

    @Transactional(readOnly = true)
    public String renderDocument(String code) {
        InvoiceRow row = require(code);
        Map<Long, RemoteApi.ClientInfo> clients = lookupClients(List.of(row));
        String clientName = row.clientId() == null ? "Client"
                : clients.containsKey(row.clientId()) ? clients.get(row.clientId()).name() : "Client #" + row.clientId();

        List<InvoiceRepository.DetailLine> lines = repository.detailLines(code);
        StringBuilder body = new StringBuilder();
        if (lines.isEmpty()) {
            String label = "Prestation d'hebergement";
            try {
                label = remoteApi.reservationByInvoice(code)
                        .map(r -> "Hebergement chambre " + r.roomId() + " du " + r.checkIn() + " au " + r.checkOut())
                        .orElse(label);
            } catch (RemoteServiceException ignored) {
                // keep the generic label
            }
            body.append(line(label, 1, row.total(), row.total()));
        } else {
            lines.forEach(l -> body.append(line(l.label() == null ? l.service() : l.label(), l.quantity(), l.unitPrice(), l.total())));
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        return """
                <!doctype html>
                <html lang="fr"><head><meta charset="utf-8"><title>Facture %1$s</title>
                <style>
                  body{font-family:"Times New Roman",serif;margin:40px;color:#111}
                  h1{margin:0} .muted{color:#555} table{width:100%%;border-collapse:collapse;margin-top:24px}
                  th,td{border:1px solid #999;padding:8px;text-align:left} th{background:#eee}
                  td.num,th.num{text-align:right} .tot td{font-weight:bold} .status{display:inline-block;padding:2px 10px;border:1px solid #333}
                </style></head><body>
                <h1>MIRADOR HOTEL</h1><div class="muted">Facture n&deg; %1$s</div>
                <p>Date : %2$s<br>Client : <b>%3$s</b><br>Statut : <span class="status">%4$s</span></p>
                <table><tr><th>Designation</th><th class="num">Qte</th><th class="num">Prix unitaire</th><th class="num">Total</th></tr>
                %5$s
                <tr class="tot"><td colspan="3">Total</td><td class="num">%6$s</td></tr>
                <tr><td colspan="3">Remise</td><td class="num">%7$s</td></tr>
                <tr class="tot"><td colspan="3">Net a payer</td><td class="num">%8$s</td></tr>
                <tr><td colspan="3">Deja paye</td><td class="num">%9$s</td></tr>
                <tr class="tot"><td colspan="3">Reste a payer</td><td class="num">%10$s</td></tr>
                </table></body></html>
                """.formatted(
                esc(row.code()),
                row.date() == null ? "-" : row.date().format(fmt),
                esc(clientName),
                esc(row.status()),
                body,
                money(row.total()), money(row.discount()), money(row.net()), money(row.totalPaid()), money(row.remaining()));
    }

    // ------------------------------------------------------------------ service-to-service use cases
    public String createInvoice(Long clientId, BigDecimal amount) {
        if (amount == null || amount.signum() < 0) {
            throw new BadRequestException("Montant de facture invalide.");
        }
        return repository.create(clientId, amount);
    }

    public void updateInvoice(String code, Long clientId, BigDecimal amount) {
        InvoiceRow row = require(code);
        if (InvoiceRepository.ARCHIVEE.equals(row.status())) {
            throw new ConflictException("La facture " + code + " est archivee : modification impossible.");
        }
        repository.update(code, clientId, amount);
    }

    public void deleteInvoice(String code) {
        repository.find(code).ifPresent(row -> {
            if (InvoiceRepository.ARCHIVEE.equals(row.status())) {
                throw new ConflictException("La facture " + code + " est archivee : suppression impossible.");
            }
            repository.delete(code);
        });
    }

    @Transactional(readOnly = true)
    public RemoteApi.InvoiceInfo info(String code) {
        return toInfo(require(code));
    }

    /** Cancels an invoice that has not received any payment (idempotent). */
    public RemoteApi.InvoiceInfo cancelInvoice(String code, String reason) {
        InvoiceRow row = repository.findForUpdate(code)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + code));
        if (InvoiceRepository.ANNULEE.equals(row.status())) {
            return toInfo(row);
        }
        if (InvoiceRepository.ARCHIVEE.equals(row.status())) {
            throw new ConflictException("La facture " + code + " est archivee : annulation impossible.");
        }
        if (row.totalPaid().signum() > 0) {
            throw new ConflictException("La facture " + code + " a deja recu " + row.totalPaid().toPlainString()
                    + " : un remboursement est necessaire avant toute annulation.");
        }
        repository.setStatus(code, InvoiceRepository.ANNULEE);
        repository.addEvent(code, "CANCELLED", reason == null ? "" : reason);
        return toInfo(repository.find(code).orElseThrow());
    }

    /** Idempotent on {@code reference}: replaying the same payment does not count it twice. */
    public RemoteApi.InvoiceInfo registerPayment(String code, BigDecimal amount, String reference) {
        InvoiceRow row = repository.findForUpdate(code)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + code));
        if (reference == null || reference.isBlank()) {
            throw new BadRequestException("La reference du paiement est obligatoire.");
        }
        if (repository.eventExists(code, "PAYMENT", reference)) {
            return toInfo(row);
        }
        if (InvoiceRepository.ARCHIVEE.equals(row.status()) || InvoiceRepository.ANNULEE.equals(row.status())) {
            throw new ConflictException("La facture " + code + " est " + row.status().toLowerCase(Locale.ROOT) + " : paiement impossible.");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new BadRequestException("Le montant du paiement doit etre positif.");
        }
        if (amount.compareTo(row.remaining()) > 0) {
            throw new ConflictException("Montant superieur au reste a payer (" + row.remaining().toPlainString() + ").");
        }
        BigDecimal newPaid = row.totalPaid().add(amount);
        repository.updatePaid(code, newPaid, newPaid.compareTo(row.net()) >= 0);
        repository.addEvent(code, "PAYMENT", "ref=" + reference + ";montant=" + amount.toPlainString());
        return toInfo(repository.find(code).orElseThrow());
    }

    /** Compensation of {@link #registerPayment}; a no-op when that payment was never registered. */
    public RemoteApi.InvoiceInfo reversePayment(String code, BigDecimal amount, String reference) {
        InvoiceRow row = repository.findForUpdate(code)
                .orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + code));
        if (!repository.eventExists(code, "PAYMENT", reference) || repository.eventExists(code, "PAYMENT_REVERSED", reference)) {
            return toInfo(row);
        }
        BigDecimal newPaid = row.totalPaid().subtract(amount).max(BigDecimal.ZERO);
        repository.updatePaid(code, newPaid, newPaid.compareTo(row.net()) >= 0 && row.net().signum() > 0);
        repository.addEvent(code, "PAYMENT_REVERSED", "ref=" + reference + ";montant=" + amount.toPlainString());
        return toInfo(repository.find(code).orElseThrow());
    }

    // ------------------------------------------------------------------ helpers
    private InvoiceRow require(String code) {
        return repository.find(code).orElseThrow(() -> new ResourceNotFoundException("Facture introuvable : " + code));
    }

    private RemoteApi.InvoiceInfo toInfo(InvoiceRow row) {
        return new RemoteApi.InvoiceInfo(row.code(), row.clientId(), row.total(), row.net(), row.totalPaid(),
                row.paid(), row.status());
    }

    private InvoiceDtos.InvoiceResponse toResponse(InvoiceRow row, Map<Long, RemoteApi.ClientInfo> clients) {
        RemoteApi.ClientInfo client = row.clientId() == null ? null : clients.get(row.clientId());
        return new InvoiceDtos.InvoiceResponse(row.code(), row.clientId(), client == null ? null : client.name(),
                row.date(), row.total(), row.discount(), row.net(), row.totalPaid(), row.remaining(), row.paid(),
                row.status(), row.archivedAt(), row.archivedBy());
    }

    private Map<Long, RemoteApi.ClientInfo> lookupClients(List<InvoiceRow> rows) {
        Set<Long> ids = new HashSet<>();
        rows.forEach(row -> {
            if (row.clientId() != null) {
                ids.add(row.clientId());
            }
        });
        try {
            return remoteApi.clients(ids);
        } catch (RemoteServiceException ex) {
            return new HashMap<>();
        }
    }

    private static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? "system" : auth.getName();
    }

    private static String line(String label, int quantity, BigDecimal unit, BigDecimal total) {
        return "<tr><td>%s</td><td class=\"num\">%d</td><td class=\"num\">%s</td><td class=\"num\">%s</td></tr>\n"
                .formatted(esc(label), quantity, money(unit), money(total));
    }

    private static String money(BigDecimal value) {
        NumberFormat format = NumberFormat.getIntegerInstance(Locale.FRANCE);
        return format.format(value == null ? BigDecimal.ZERO : value) + " FCFA";
    }

    private static String esc(String value) {
        return value == null ? "" : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
