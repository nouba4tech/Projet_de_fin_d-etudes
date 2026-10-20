package com.mirador.hotel.controller;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.repository.InternalFinanceRepository;
import com.mirador.hotel.service.FinanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/** Service-to-service API (not routed by the gateway, guarded by X-Internal-Token). */
@RestController
@RequestMapping("/internal/finance")
public class InternalFinanceController {

    private final InternalFinanceRepository repository;
    private final FinanceService financeService;

    public InternalFinanceController(InternalFinanceRepository repository, FinanceService financeService) {
        this.repository = repository;
        this.financeService = financeService;
    }

    @GetMapping("/revenue-today")
    public BigDecimal revenueToday() {
        return repository.revenueToday();
    }

    @GetMapping("/revenue-by-day")
    public Map<String, BigDecimal> revenueByDay(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return repository.revenueByDay(from, to);
    }

    @PostMapping("/transactions")
    public ResponseEntity<OperationsDtos.FinanceTransactionResponse> createTransaction(
            @RequestBody OperationsDtos.FinanceTransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(financeService.createTransaction(request));
    }
}
