package com.mirador.hotel.controller;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.service.FinanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/finances")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @GetMapping("/transactions")
    public List<OperationsDtos.FinanceTransactionResponse> getAllFinances() {
        return financeService.getTransactions();
    }

    @GetMapping("/transactions/{transactionId}")
    public OperationsDtos.FinanceTransactionResponse getFinanceById(@PathVariable long transactionId) {
        return financeService.getTransaction(transactionId);
    }

    @PostMapping("/transactions")
    public ResponseEntity<OperationsDtos.FinanceTransactionResponse> createFinance(
            @Valid @RequestBody OperationsDtos.FinanceTransactionRequest request) {
        OperationsDtos.FinanceTransactionResponse transaction = financeService.createTransaction(request);
        return ResponseEntity.created(URI.create("/api/finances/transactions/" + transaction.id())).body(transaction);
    }

    @PutMapping("/transactions/{transactionId}")
    public OperationsDtos.FinanceTransactionResponse updateFinance(
            @PathVariable long transactionId,
            @Valid @RequestBody OperationsDtos.FinanceTransactionRequest request) {
        return financeService.updateTransaction(transactionId, request);
    }

    @DeleteMapping("/transactions/{transactionId}")
    public ResponseEntity<Void> deleteFinance(@PathVariable long transactionId) {
        financeService.deleteTransaction(transactionId);
        return ResponseEntity.noContent().build();
    }
}
