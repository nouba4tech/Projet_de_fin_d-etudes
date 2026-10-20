package com.mirador.hotel.saga;

import com.mirador.hotel.client.RemoteApi;

import java.math.BigDecimal;

/** State shared by the steps of one payment saga. */
public class PaymentContext {

    public final String reference;
    public final String invoiceCode;
    public final BigDecimal amount;
    public final String method;

    public Long clientId;
    public RemoteApi.InvoiceInfo invoiceAfterPayment;
    public String previousReservationStatus;
    public boolean reservationConfirmed;

    public PaymentContext(String reference, String invoiceCode, BigDecimal amount, String method) {
        this.reference = reference;
        this.invoiceCode = invoiceCode;
        this.amount = amount;
        this.method = method;
    }
}
