package com.mirador.hotel.controller;

import com.mirador.hotel.dto.InvoiceDtos;
import com.mirador.hotel.service.InvoiceService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

/** Invoicing: generation (printable document), archiving and tracking. */
@RestController
@RequestMapping("/api/factures")
public class FactureController {

    private final InvoiceService invoiceService;

    public FactureController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public List<InvoiceDtos.InvoiceResponse> list(@RequestParam(required = false) String status,
                                                  @RequestParam(required = false) Long clientId,
                                                  @RequestParam(required = false) Boolean archived) {
        return invoiceService.list(status, clientId, archived);
    }

    @GetMapping("/stats")
    public InvoiceDtos.InvoiceStats stats() {
        return invoiceService.stats();
    }

    @GetMapping("/{code}")
    public InvoiceDtos.InvoiceResponse get(@PathVariable String code) {
        return invoiceService.get(code);
    }

    @GetMapping("/{code}/suivi")
    public InvoiceDtos.InvoiceTracking tracking(@PathVariable String code) {
        return invoiceService.tracking(code);
    }

    @GetMapping(value = "/{code}/document", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<byte[]> document(@PathVariable String code) {
        byte[] html = invoiceService.renderDocument(code).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok().contentType(new MediaType("text", "html", StandardCharsets.UTF_8)).body(html);
    }

    @PostMapping("/{code}/archive")
    public InvoiceDtos.InvoiceResponse archive(@PathVariable String code) {
        return invoiceService.archive(code);
    }
}
