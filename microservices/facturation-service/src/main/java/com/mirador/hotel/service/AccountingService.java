package com.mirador.hotel.service;

import com.mirador.hotel.dto.AccountingDashboardResponse;
import com.mirador.hotel.dto.CaisseResponse;
import com.mirador.hotel.dto.CompteComptableResponse;
import com.mirador.hotel.dto.CreateCompteComptableRequest;
import com.mirador.hotel.dto.DepotResponse;
import com.mirador.hotel.dto.OperationComptableRequest;
import com.mirador.hotel.dto.OperationComptableResponse;
import com.mirador.hotel.dto.PlanComptableResponse;
import com.mirador.hotel.dto.UpdateCompteComptableRequest;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.AccountingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AccountingService {

    private final AccountingRepository accountingRepository;

    public AccountingService(AccountingRepository accountingRepository) {
        this.accountingRepository = accountingRepository;
    }

    public AccountingDashboardResponse getDashboard() {
        return accountingRepository.getDashboard();
    }

    public List<PlanComptableResponse> getPlanComptable() {
        return accountingRepository.findPlans();
    }

    public List<CompteComptableResponse> getComptes(String numeroPlan) {
        return accountingRepository.findAccounts(numeroPlan);
    }

    public CompteComptableResponse getCompte(String numcompte) {
        return accountingRepository.findAccountById(numcompte)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Compte comptable introuvable pour le numero: " + numcompte));
    }

    public List<CaisseResponse> getCaisses() {
        return accountingRepository.findCashRegisters();
    }

    public List<DepotResponse> getDepots() {
        return accountingRepository.findDepots();
    }

    @Transactional
    public DepotResponse createDepot(com.mirador.hotel.dto.DepotRequest request) {
        int codeDepot = accountingRepository.insertDepot(request);
        return new DepotResponse(codeDepot, request.libelle().trim());
    }

    @Transactional
    public DepotResponse updateDepot(int codeDepot, com.mirador.hotel.dto.DepotRequest request) {
        if (!accountingRepository.depotExists(codeDepot)) {
            throw new ResourceNotFoundException("Depot introuvable pour le code: " + codeDepot);
        }
        accountingRepository.updateDepot(codeDepot, request);
        return new DepotResponse(codeDepot, request.libelle().trim());
    }

    @Transactional
    public void deleteDepot(int codeDepot) {
        if (!accountingRepository.depotExists(codeDepot)) {
            throw new ResourceNotFoundException("Depot introuvable pour le code: " + codeDepot);
        }
        accountingRepository.deleteDepot(codeDepot);
    }

    public List<OperationComptableResponse> getOperations(String numcompte, String typeOperation, Integer codeDepot) {
        return accountingRepository.findOperations(numcompte, typeOperation, codeDepot);
    }

    public OperationComptableResponse getOperation(long codeOperation) {
        return accountingRepository.findOperationById(codeOperation)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Operation comptable introuvable pour le code: " + codeOperation));
    }

    @Transactional
    public CompteComptableResponse createCompte(CreateCompteComptableRequest request) {
        validatePlanExists(request.numeroPlan());

        if (accountingRepository.accountExists(request.numcompte().trim())) {
            throw new IllegalStateException("Le compte comptable " + request.numcompte() + " existe deja.");
        }

        accountingRepository.insertAccount(request);
        return getCompte(request.numcompte().trim());
    }

    @Transactional
    public CompteComptableResponse updateCompte(String numcompte, UpdateCompteComptableRequest request) {
        getCompte(numcompte);
        validatePlanExists(request.numeroPlan());
        accountingRepository.updateAccount(numcompte, request);
        return getCompte(numcompte);
    }

    @Transactional
    public void deleteCompte(String numcompte) {
        getCompte(numcompte);

        if (accountingRepository.isAccountLinkedToCashRegister(numcompte)) {
            throw new IllegalStateException(
                    "Ce compte est rattache a une caisse et ne peut pas etre supprime.");
        }

        if (accountingRepository.countOperationsForAccount(numcompte) > 0) {
            throw new IllegalStateException(
                    "Ce compte possede des operations comptables et ne peut pas etre supprime.");
        }

        accountingRepository.deleteAccount(numcompte);
    }

    @Transactional
    public OperationComptableResponse createOperation(OperationComptableRequest request) {
        validateAccountExists(request.numcompte());
        validateDepotExists(request.codeDepot());
        validateOperationAmounts(request.credit(), request.debit());

        long codeOperation = accountingRepository.insertOperation(request);
        accountingRepository.applyOperationToAccount(request);
        return getOperation(codeOperation);
    }

    private void validatePlanExists(String numeroPlan) {
        if (!accountingRepository.planExists(numeroPlan.trim())) {
            throw new IllegalArgumentException(
                    "Le numero de plan comptable " + numeroPlan + " n'existe pas dans la base SQLite.");
        }
    }

    private void validateAccountExists(String numcompte) {
        if (!accountingRepository.accountExists(numcompte.trim())) {
            throw new IllegalArgumentException(
                    "Le compte comptable " + numcompte + " n'existe pas dans la base SQLite.");
        }
    }

    private void validateDepotExists(Integer codeDepot) {
        if (codeDepot != null && !accountingRepository.depotExists(codeDepot)) {
            throw new IllegalArgumentException("Le depot " + codeDepot + " n'existe pas.");
        }
    }

    private void validateOperationAmounts(BigDecimal credit, BigDecimal debit) {
        BigDecimal safeCredit = credit == null ? BigDecimal.ZERO : credit;
        BigDecimal safeDebit = debit == null ? BigDecimal.ZERO : debit;

        if (safeCredit.signum() == 0 && safeDebit.signum() == 0) {
            throw new IllegalArgumentException("Une operation doit contenir un credit ou un debit strictement positif.");
        }

        if (safeCredit.signum() > 0 && safeDebit.signum() > 0) {
            throw new IllegalArgumentException("Renseigne soit un credit, soit un debit, mais pas les deux.");
        }
    }
}
