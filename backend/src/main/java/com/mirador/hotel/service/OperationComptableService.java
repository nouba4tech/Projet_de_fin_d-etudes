package com.mirador.hotel.service;

import com.mirador.hotel.model.OperationComptable;
import com.mirador.hotel.repository.OperationComptableRepository;
import com.mirador.hotel.repository.PlanComptableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class OperationComptableService {

    @Autowired
    private OperationComptableRepository operationRepository;

    @Autowired
    private PlanComptableRepository planComptableRepository;

    public List<OperationComptable> getAllOperations() {
        return operationRepository.findAll();
    }

    public Optional<OperationComptable> getOperationById(@NonNull Long id) {
        return operationRepository.findById(id);
    }

    public Optional<OperationComptable> getOperationByReference(String reference) {
        return operationRepository.findByReference(reference);
    }

    public List<OperationComptable> getOperationsByAccountCode(String accountCode) {
        return operationRepository.findByAccountCode(accountCode);
    }

    public List<OperationComptable> getOperationsByJournalCode(String journalCode) {
        return operationRepository.findByJournalCode(journalCode);
    }

    public List<OperationComptable> getOperationsByStatus(String status) {
        return operationRepository.findByStatus(status);
    }

    public List<OperationComptable> getOperationsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return operationRepository.findByDateBetween(startDate, endDate);
    }

    public List<OperationComptable> searchOperations(String search) {
        return operationRepository.findByLabelOrReferenceContaining(search);
    }

    public OperationComptable createOperation(OperationComptable operation) {
        if (operationRepository.findByReference(operation.getReference()).isPresent()) {
            throw new RuntimeException("Cette reference existe deja");
        }

        if (!planComptableRepository.findByCode(operation.getAccountCode()).isPresent()) {
            throw new RuntimeException("Le compte specifie n'existe pas");
        }

        if (operation.getReference() == null || operation.getReference().isEmpty()) {
            operation.setReference("OP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        operation.setCreatedAt(LocalDateTime.now());
        operation.setStatus("Brouillon");
        return operationRepository.save(operation);
    }

    public OperationComptable updateOperation(@NonNull Long id, OperationComptable operationDetails) {
        Optional<OperationComptable> optionalOperation = operationRepository.findById(id);
        if (!optionalOperation.isPresent()) {
            throw new RuntimeException("Operation non trouvee");
        }

        OperationComptable operation = optionalOperation.get();

        if (!operation.getReference().equals(operationDetails.getReference())) {
            if (operationRepository.findByReference(operationDetails.getReference()).isPresent()) {
                throw new RuntimeException("Cette reference existe deja");
            }
        }

        if (!planComptableRepository.findByCode(operationDetails.getAccountCode()).isPresent()) {
            throw new RuntimeException("Le compte specifie n'existe pas");
        }

        operation.setReference(operationDetails.getReference());
        operation.setAccountCode(operationDetails.getAccountCode());
        operation.setLabel(operationDetails.getLabel());
        operation.setDebitAmount(operationDetails.getDebitAmount());
        operation.setCreditAmount(operationDetails.getCreditAmount());
        operation.setJournalCode(operationDetails.getJournalCode());

        return operationRepository.save(operation);
    }

    public OperationComptable validateOperation(@NonNull Long id) {
        Optional<OperationComptable> optionalOperation = operationRepository.findById(id);
        if (!optionalOperation.isPresent()) {
            throw new RuntimeException("Operation non trouvee");
        }

        OperationComptable operation = optionalOperation.get();
        operation.setStatus("Valide");
        return operationRepository.save(operation);
    }

    public OperationComptable cancelOperation(@NonNull Long id) {
        Optional<OperationComptable> optionalOperation = operationRepository.findById(id);
        if (!optionalOperation.isPresent()) {
            throw new RuntimeException("Operation non trouvee");
        }

        OperationComptable operation = optionalOperation.get();
        operation.setStatus("Annule");
        return operationRepository.save(operation);
    }

    public void deleteOperation(@NonNull Long id) {
        if (!operationRepository.existsById(id)) {
            throw new RuntimeException("Operation non trouvee");
        }
        operationRepository.deleteById(id);
    }

    public Map<String, Double> getOperationSummaryByJournal() {
        List<Object[]> results = operationRepository.getOperationSummaryByJournal();
        return results.stream()
                .collect(Collectors.toMap(
                        result -> (String) result[0],
                        result -> (Double) result[1]
                ));
    }

    public Double getTotalDebitByStatus(String status) {
        return operationRepository.sumDebitByStatus(status);
    }

    public Double getTotalCreditByStatus(String status) {
        return operationRepository.sumCreditByStatus(status);
    }

    public Long getOperationCountByStatus(String status) {
        return operationRepository.countByStatus(status);
    }

    public List<OperationComptable> getValidatedOperations() {
        return operationRepository.findByStatus("Valide");
    }

    public List<OperationComptable> getDraftOperations() {
        return operationRepository.findByStatus("Brouillon");
    }

    public boolean operationExists(String reference) {
        return operationRepository.findByReference(reference).isPresent();
    }

    public String generateReference() {
        return "OP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
