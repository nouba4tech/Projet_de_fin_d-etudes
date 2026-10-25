package com.mirador.hotel.controller;

import com.mirador.hotel.dto.PaymentDtos;
import com.mirador.hotel.service.PaiementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Payments of invoices, executed as an orchestrated saga. */
@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    private final PaiementService paiementService;

    public PaiementController(PaiementService paiementService) {
        this.paiementService = paiementService;
    }

    /** 201 when the saga completed, 422 (with the saga log in the body) when it failed and was compensated. */
    @PostMapping
    public ResponseEntity<PaymentDtos.PaymentResponse> pay(@Valid @RequestBody PaymentDtos.PaymentRequest request) {
        PaymentDtos.PaymentResponse response = paiementService.pay(request);
        HttpStatus status = "COMPLETED".equals(response.status()) ? HttpStatus.CREATED : HttpStatus.UNPROCESSABLE_ENTITY;
        return ResponseEntity.status(status).body(response);
    }

    @GetMapping
    public List<PaymentDtos.PaymentResponse> list(@RequestParam(required = false) String invoiceCode,
                                                  @RequestParam(required = false) String status) {
        return paiementService.list(invoiceCode, status);
    }

    @GetMapping("/{id}")
    public PaymentDtos.PaymentResponse get(@PathVariable long id) {
        return paiementService.get(id);
    }

    @GetMapping("/{id}/saga")
    public PaymentDtos.SagaView saga(@PathVariable long id) {
        return paiementService.saga(id);
    }
}
