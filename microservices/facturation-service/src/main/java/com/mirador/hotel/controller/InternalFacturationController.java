package com.mirador.hotel.controller;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.InvoiceDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.ClientAccountRepository;
import com.mirador.hotel.repository.InvoiceRepository;
import com.mirador.hotel.service.InvoiceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/** Service-to-service API (not routed by the gateway, guarded by X-Internal-Token). */
@RestController
@RequestMapping("/internal")
public class InternalFacturationController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final ClientAccountRepository clientAccounts;

    public InternalFacturationController(InvoiceService invoiceService, InvoiceRepository invoiceRepository,
                                         ClientAccountRepository clientAccounts) {
        this.invoiceService = invoiceService;
        this.invoiceRepository = invoiceRepository;
        this.clientAccounts = clientAccounts;
    }

    // ------------------------------------------------------------------ invoices
    @PostMapping("/invoices")
    public ResponseEntity<Map<String, String>> create(@RequestBody InvoiceDtos.AmountRequest request) {
        String code = invoiceService.createInvoice(request.clientId(), request.amount());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("code", code));
    }

    @GetMapping("/invoices/revenue-today")
    public BigDecimal revenueToday() {
        return invoiceRepository.revenueToday();
    }

    @GetMapping("/invoices/revenue-by-day")
    public Map<String, BigDecimal> revenueByDay(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return invoiceRepository.revenueByDay(from, to);
    }

    @GetMapping("/invoices/{code}")
    public RemoteApi.InvoiceInfo info(@PathVariable String code) {
        return invoiceService.info(code);
    }

    @PutMapping("/invoices/{code}")
    public ResponseEntity<Void> update(@PathVariable String code, @RequestBody InvoiceDtos.AmountRequest request) {
        invoiceService.updateInvoice(code, request.clientId(), request.amount());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/invoices/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        invoiceService.deleteInvoice(code);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invoices/{code}/payments")
    public RemoteApi.InvoiceInfo registerPayment(@PathVariable String code, @RequestBody InvoiceDtos.PaymentRequest request) {
        return invoiceService.registerPayment(code, request.amount(), request.reference());
    }

    public record CancelRequest(String reason) {
    }

    @PostMapping("/invoices/{code}/cancel")
    public RemoteApi.InvoiceInfo cancel(@PathVariable String code, @RequestBody(required = false) CancelRequest request) {
        return invoiceService.cancelInvoice(code, request == null ? null : request.reason());
    }

    @PostMapping("/invoices/{code}/payments/reverse")
    public RemoteApi.InvoiceInfo reversePayment(@PathVariable String code, @RequestBody InvoiceDtos.PaymentRequest request) {
        return invoiceService.reversePayment(code, request.amount(), request.reference());
    }

    // ------------------------------------------------------------------ customer ledger accounts
    @PostMapping("/client-accounts")
    public ResponseEntity<Map<String, String>> createClientAccount(@RequestBody InvoiceDtos.ClientAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("numcompte", clientAccounts.create(request.displayName())));
    }

    @PutMapping("/client-accounts/{accountNumber}")
    public ResponseEntity<Void> renameClientAccount(@PathVariable String accountNumber,
                                                    @RequestBody InvoiceDtos.ClientAccountRequest request) {
        if (clientAccounts.rename(accountNumber, request.displayName()) == 0) {
            throw new ResourceNotFoundException("Compte client introuvable : " + accountNumber);
        }
        return ResponseEntity.noContent().build();
    }
}
