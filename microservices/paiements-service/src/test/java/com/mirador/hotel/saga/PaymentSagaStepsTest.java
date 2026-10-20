package com.mirador.hotel.saga;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** The payment saga wired with mocked collaborators: verifies the compensation of the real steps. */
class PaymentSagaStepsTest {

    private RemoteApi remote;
    private JdbcTemplate jdbc;
    private PaymentSagaSteps steps;

    private static RemoteApi.InvoiceInfo invoice(String status, String net, String paid, boolean fullyPaid) {
        return new RemoteApi.InvoiceInfo("RS1", 7L, new BigDecimal(net), new BigDecimal(net), new BigDecimal(paid), fullyPaid, status);
    }

    private static RemoteApi.ReservationInfo reservation(String status) {
        return new RemoteApi.ReservationInfo(3, 7, "101", null, null, status, new BigDecimal("100000"), "RS1");
    }

    @BeforeEach
    void setUp() {
        remote = mock(RemoteApi.class);
        jdbc = mock(JdbcTemplate.class);
        steps = new PaymentSagaSteps(remote, jdbc);
    }

    private SagaResult run(PaymentContext ctx) {
        return new SagaOrchestrator<>(steps.build()).run(ctx, SagaListener.NOOP);
    }

    @Test
    void fullPaymentConfirmsTheReservation() {
        when(remote.invoice("RS1")).thenReturn(Optional.of(invoice("EMISE", "100000", "0", false)));
        when(remote.reservationByInvoice("RS1")).thenReturn(Optional.of(reservation("En attente")));
        when(remote.registerPayment("RS1", new BigDecimal("100000"), "PAY1")).thenReturn(invoice("PAYEE", "100000", "100000", true));
        when(remote.setReservationStatusByInvoice("RS1", "Confirmée")).thenReturn("En attente");
        when(remote.client(7L)).thenReturn(Optional.empty());

        PaymentContext ctx = new PaymentContext("PAY1", "RS1", new BigDecimal("100000"), "ESPECES");
        SagaResult result = run(ctx);

        assertTrue(result.success());
        verify(remote).setReservationStatusByInvoice("RS1", "Confirmée");
        assertEquals("En attente", ctx.previousReservationStatus);
    }

    @Test
    void partialPaymentDoesNotConfirmTheReservation() {
        when(remote.invoice("RS1")).thenReturn(Optional.of(invoice("EMISE", "100000", "0", false)));
        when(remote.reservationByInvoice("RS1")).thenReturn(Optional.of(reservation("En attente")));
        when(remote.registerPayment("RS1", new BigDecimal("40000"), "PAY2")).thenReturn(invoice("PARTIELLEMENT_PAYEE", "100000", "40000", false));
        when(remote.client(7L)).thenReturn(Optional.empty());

        SagaResult result = run(new PaymentContext("PAY2", "RS1", new BigDecimal("40000"), "CARTE"));

        assertTrue(result.success());
        verify(remote, never()).setReservationStatusByInvoice(anyString(), anyString());
    }

    @Test
    void failureWhileConfirmingTheReservationReversesThePaymentAndTheLocalRows() {
        when(remote.invoice("RS1")).thenReturn(Optional.of(invoice("EMISE", "100000", "0", false)));
        when(remote.reservationByInvoice("RS1")).thenReturn(Optional.of(reservation("En attente")));
        when(remote.registerPayment("RS1", new BigDecimal("100000"), "PAY3")).thenReturn(invoice("PAYEE", "100000", "100000", true));
        doThrow(new IllegalStateException("reservations-service indisponible"))
                .when(remote).setReservationStatusByInvoice("RS1", "Confirmée");

        PaymentContext ctx = new PaymentContext("PAY3", "RS1", new BigDecimal("100000"), "VIREMENT");
        SagaResult result = run(ctx);

        assertFalse(result.success());
        assertEquals("CONFIRM_RESERVATION", result.failedStep());
        // reverse order: finance rows first, then the payment on the invoice
        assertEquals(List.of("RECORD_FINANCE_TRANSACTION", "REGISTER_PAYMENT_ON_INVOICE"), result.compensatedSteps());
        verify(remote).reversePayment("RS1", new BigDecimal("100000"), "PAY3");
        verify(jdbc).update(eq("DELETE FROM app_finance_transaction WHERE reference_code = ?"), eq("PAY3"));
        verify(jdbc).update(eq("DELETE FROM reglement WHERE code_reg = ?"), eq("PAY3"));
    }

    @Test
    void overpaymentIsRejectedBeforeAnythingIsWritten() {
        when(remote.invoice("RS1")).thenReturn(Optional.of(invoice("EMISE", "100000", "90000", false)));

        SagaResult result = run(new PaymentContext("PAY4", "RS1", new BigDecimal("50000"), "ESPECES"));

        assertFalse(result.success());
        assertEquals("VALIDATE_INVOICE", result.failedStep());
        assertTrue(result.compensatedSteps().isEmpty());
        verify(remote, never()).registerPayment(anyString(), any(), anyString());
    }

    @Test
    void cancelledReservationBlocksThePayment() {
        when(remote.invoice("RS1")).thenReturn(Optional.of(invoice("EMISE", "100000", "0", false)));
        when(remote.reservationByInvoice("RS1")).thenReturn(Optional.of(reservation("Annulée")));

        SagaResult result = run(new PaymentContext("PAY5", "RS1", new BigDecimal("100000"), "ESPECES"));

        assertFalse(result.success());
        assertEquals("VALIDATE_INVOICE", result.failedStep());
        assertTrue(result.failureReason().contains("annulee"));
        verify(remote, never()).registerPayment(anyString(), any(), anyString());
    }

    @Test
    void archivedInvoiceCannotBePaid() {
        when(remote.invoice("RS1")).thenReturn(Optional.of(invoice("ARCHIVEE", "100000", "100000", true)));

        SagaResult result = run(new PaymentContext("PAY6", "RS1", new BigDecimal("1000"), "ESPECES"));

        assertFalse(result.success());
        assertEquals("VALIDATE_INVOICE", result.failedStep());
    }
}
