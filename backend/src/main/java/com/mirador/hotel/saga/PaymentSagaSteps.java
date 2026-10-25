package com.mirador.hotel.saga;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ConflictException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * The saga "pay an invoice":
 * <ol>
 *   <li>VALIDATE_INVOICE            (facturation + reservations, read only)</li>
 *   <li>REGISTER_PAYMENT_ON_INVOICE (facturation)   - compensation: reverse the payment</li>
 *   <li>RECORD_FINANCE_TRANSACTION  (local)         - compensation: delete the rows</li>
 *   <li>CONFIRM_RESERVATION         (reservations)  - compensation: restore the previous status</li>
 *   <li>NOTIFY_CLIENT               (notifications) - non critical, never compensated</li>
 * </ol>
 */
@Component
public class PaymentSagaSteps {

    public static final String SAGA_TYPE = "PAIEMENT_FACTURE";

    private final RemoteApi remoteApi;
    private final JdbcTemplate jdbcTemplate;

    public PaymentSagaSteps(RemoteApi remoteApi, JdbcTemplate jdbcTemplate) {
        this.remoteApi = remoteApi;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SagaStep<PaymentContext>> build() {
        List<SagaStep<PaymentContext>> steps = new ArrayList<>();
        steps.add(new ValidateInvoice());
        steps.add(new RegisterPaymentOnInvoice());
        steps.add(new RecordFinanceTransaction());
        steps.add(new ConfirmReservation());
        steps.add(new NotifyClient());
        return steps;
    }

    // ------------------------------------------------------------------ 1
    final class ValidateInvoice implements SagaStep<PaymentContext> {
        public String name() {
            return "VALIDATE_INVOICE";
        }

        public void execute(PaymentContext ctx) {
            RemoteApi.InvoiceInfo invoice = remoteApi.invoice(ctx.invoiceCode)
                    .orElseThrow(() -> new BadRequestException("Facture introuvable : " + ctx.invoiceCode));
            ctx.clientId = invoice.clientId();
            if ("ARCHIVEE".equals(invoice.status()) || "ANNULEE".equals(invoice.status())) {
                throw new ConflictException("La facture est " + invoice.status().toLowerCase() + " : paiement impossible.");
            }
            BigDecimal remaining = invoice.net().subtract(invoice.totalPaid()).max(BigDecimal.ZERO);
            if (remaining.signum() == 0) {
                throw new ConflictException("La facture est deja entierement payee.");
            }
            if (ctx.amount.compareTo(remaining) > 0) {
                throw new ConflictException("Montant superieur au reste a payer (" + remaining.toPlainString() + ").");
            }
            remoteApi.reservationByInvoice(ctx.invoiceCode).ifPresent(reservation -> {
                if ("Annulée".equals(reservation.status()) || "Annulee".equals(reservation.status())) {
                    throw new ConflictException("La reservation liee a cette facture est annulee.");
                }
            });
        }
    }

    // ------------------------------------------------------------------ 2
    final class RegisterPaymentOnInvoice implements SagaStep<PaymentContext> {
        public String name() {
            return "REGISTER_PAYMENT_ON_INVOICE";
        }

        public void execute(PaymentContext ctx) {
            ctx.invoiceAfterPayment = remoteApi.registerPayment(ctx.invoiceCode, ctx.amount, ctx.reference);
        }

        public boolean hasCompensation() {
            return true;
        }

        public void compensate(PaymentContext ctx) {
            remoteApi.reversePayment(ctx.invoiceCode, ctx.amount, ctx.reference);
        }
    }

    // ------------------------------------------------------------------ 3
    final class RecordFinanceTransaction implements SagaStep<PaymentContext> {
        public String name() {
            return "RECORD_FINANCE_TRANSACTION";
        }

        public void execute(PaymentContext ctx) {
            jdbcTemplate.update("""
                    INSERT INTO app_finance_transaction
                        (transaction_type, category_name, description_text, amount_value, transaction_date, reference_code)
                    VALUES ('Recette', 'Hébergement', ?, ?, ?, ?)
                    """,
                    "Paiement facture " + ctx.invoiceCode + " (" + ctx.method + ")",
                    ctx.amount, Date.valueOf(LocalDate.now()), ctx.reference);
            jdbcTemplate.update("""
                    INSERT INTO reglement (code_reg, code_facture, code_client, date_reglement, montant, libelle, type_reg, letype)
                    VALUES (?, ?, ?, NOW(), ?, ?, ?, 'Client')
                    """,
                    ctx.reference, ctx.invoiceCode, ctx.clientId, ctx.amount.doubleValue(),
                    "Reglement facture " + ctx.invoiceCode, ctx.method);
        }

        public boolean hasCompensation() {
            return true;
        }

        public void compensate(PaymentContext ctx) {
            jdbcTemplate.update("DELETE FROM app_finance_transaction WHERE reference_code = ?", ctx.reference);
            jdbcTemplate.update("DELETE FROM reglement WHERE code_reg = ?", ctx.reference);
        }
    }

    // ------------------------------------------------------------------ 4
    final class ConfirmReservation implements SagaStep<PaymentContext> {
        public String name() {
            return "CONFIRM_RESERVATION";
        }

        public void execute(PaymentContext ctx) {
            if (ctx.invoiceAfterPayment == null || !ctx.invoiceAfterPayment.paid()) {
                return; // partial payment: the reservation is confirmed once the invoice is fully paid
            }
            remoteApi.reservationByInvoice(ctx.invoiceCode).ifPresent(reservation -> {
                if ("Confirmée".equals(reservation.status())) {
                    return;
                }
                ctx.previousReservationStatus = remoteApi.setReservationStatusByInvoice(ctx.invoiceCode, "Confirmée");
                ctx.reservationConfirmed = true;
            });
        }

        public boolean hasCompensation() {
            return true;
        }

        public void compensate(PaymentContext ctx) {
            if (ctx.reservationConfirmed && ctx.previousReservationStatus != null) {
                remoteApi.setReservationStatusByInvoice(ctx.invoiceCode, ctx.previousReservationStatus);
            }
        }
    }

    // ------------------------------------------------------------------ 5
    final class NotifyClient implements SagaStep<PaymentContext> {
        public String name() {
            return "NOTIFY_CLIENT";
        }

        public boolean critical() {
            return false;
        }

        public void execute(PaymentContext ctx) {
            if (ctx.clientId == null) {
                return;
            }
            remoteApi.client(ctx.clientId).ifPresent(client -> {
                Map<String, String> variables = Map.of(
                        "name", client.name() == null ? "" : client.name(),
                        "invoice", ctx.invoiceCode,
                        "amount", ctx.amount.toPlainString(),
                        "method", ctx.method,
                        "reference", ctx.reference);
                if (client.email() != null) {
                    remoteApi.notifyQuietly(new RemoteApi.NotificationCommand(
                            "EMAIL", client.email(), "PAYMENT_RECEIPT", ctx.reference, null, null, variables));
                }
                if (client.phone() != null) {
                    remoteApi.notifyQuietly(new RemoteApi.NotificationCommand(
                            "SMS", client.phone(), "PAYMENT_RECEIPT", ctx.reference, null, null, variables));
                }
            });
        }
    }
}
