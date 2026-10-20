package com.mirador.hotel.service;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.FinanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class FinanceService {

    private final FinanceRepository financeRepository;

    public FinanceService(FinanceRepository financeRepository) {
        this.financeRepository = financeRepository;
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.FinanceTransactionResponse> getTransactions() {
        return financeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public OperationsDtos.FinanceTransactionResponse getTransaction(long transactionId) {
        return financeRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction introuvable: " + transactionId));
    }

    public OperationsDtos.FinanceTransactionResponse createTransaction(OperationsDtos.FinanceTransactionRequest request) {
        long transactionId = financeRepository.create(request);
        return getTransaction(transactionId);
    }

    public OperationsDtos.FinanceTransactionResponse updateTransaction(
            long transactionId,
            OperationsDtos.FinanceTransactionRequest request) {
        getTransaction(transactionId);
        financeRepository.update(transactionId, request);
        return getTransaction(transactionId);
    }

    public void deleteTransaction(long transactionId) {
        getTransaction(transactionId);
        financeRepository.delete(transactionId);
    }
}
