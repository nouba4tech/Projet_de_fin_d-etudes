package com.mirador.hotel.controller;

import com.mirador.hotel.model.BrouillardCaisse;
import com.mirador.hotel.model.OperationComptable;
import com.mirador.hotel.model.PlanComptable;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.service.BrouillardCaisseService;
import com.mirador.hotel.service.OperationComptableService;
import com.mirador.hotel.service.PlanComptableService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounting")
public class AccountingManagementController {

    private final PlanComptableService planComptableService;
    private final OperationComptableService operationComptableService;
    private final BrouillardCaisseService brouillardCaisseService;

    public AccountingManagementController(
            PlanComptableService planComptableService,
            OperationComptableService operationComptableService,
            BrouillardCaisseService brouillardCaisseService) {
        this.planComptableService = planComptableService;
        this.operationComptableService = operationComptableService;
        this.brouillardCaisseService = brouillardCaisseService;
    }

    // ========== PLAN COMPTABLE ==========

    @GetMapping("/accounts")
    public ResponseEntity<List<PlanComptable>> getAccounts(
            @RequestParam(required = false) String type,
            @RequestParam(required = false, name = "className") String className,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(planComptableService.searchAccounts(search));
        }
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(planComptableService.getAccountsByStatus(status));
        }
        if (type != null && !type.isBlank()) {
            return ResponseEntity.ok(planComptableService.getAccountsByType(type));
        }
        if (className != null && !className.isBlank()) {
            return ResponseEntity.ok(planComptableService.getAccountsByClass(className));
        }
        return ResponseEntity.ok(planComptableService.getAllAccounts());
    }

    @GetMapping("/accounts/{id}")
    public ResponseEntity<PlanComptable> getAccountById(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(planComptableService.getAccountById(id).orElseThrow(() ->
                new ResourceNotFoundException("Compte non trouvé avec l'ID : " + id)));
    }

    @GetMapping("/accounts/code/{code}")
    public ResponseEntity<PlanComptable> getAccountByCode(@PathVariable String code) {
        return ResponseEntity.ok(planComptableService.getAccountByCode(code).orElseThrow(() ->
                new ResourceNotFoundException("Compte non trouvé avec le code : " + code)));
    }

    @PostMapping("/accounts")
    public ResponseEntity<PlanComptable> createAccount(@Valid @RequestBody PlanComptable account) {
        return ResponseEntity.ok(planComptableService.createAccount(account));
    }

    @PutMapping("/accounts/{id}")
    public ResponseEntity<PlanComptable> updateAccount(
            @PathVariable @NonNull Long id,
            @Valid @RequestBody PlanComptable account) {
        return ResponseEntity.ok(planComptableService.updateAccount(id, account));
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable @NonNull Long id) {
        planComptableService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/accounts/{id}/activate")
    public ResponseEntity<PlanComptable> activateAccount(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(planComptableService.activateAccount(id));
    }

    @PutMapping("/accounts/{id}/deactivate")
    public ResponseEntity<PlanComptable> deactivateAccount(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(planComptableService.deactivateAccount(id));
    }

    @GetMapping("/accounts/summary")
    public ResponseEntity<Map<String, Double>> getBalanceSummary() {
        return ResponseEntity.ok(planComptableService.getBalanceSummary());
    }

    // ========== OPERATIONS COMPTABLES ==========

    @GetMapping("/operations")
    public ResponseEntity<List<OperationComptable>> getOperations(
            @RequestParam(required = false) String accountCode,
            @RequestParam(required = false) String journalCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(operationComptableService.searchOperations(search));
        }
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(operationComptableService.getOperationsByDateRange(startDate, endDate));
        }
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(operationComptableService.getOperationsByStatus(status));
        }
        if (accountCode != null && !accountCode.isBlank()) {
            return ResponseEntity.ok(operationComptableService.getOperationsByAccountCode(accountCode));
        }
        if (journalCode != null && !journalCode.isBlank()) {
            return ResponseEntity.ok(operationComptableService.getOperationsByJournalCode(journalCode));
        }
        return ResponseEntity.ok(operationComptableService.getAllOperations());
    }

    @GetMapping("/operations/{id}")
    public ResponseEntity<OperationComptable> getOperationById(@PathVariable Long id) {
        return ResponseEntity.ok(operationComptableService.getOperationById(id).orElseThrow(() ->
                new ResourceNotFoundException("Opération non trouvée avec l'ID : " + id)));
    }

    @PostMapping("/operations")
    public ResponseEntity<OperationComptable> createOperation(@Valid @RequestBody OperationComptable operation) {
        return ResponseEntity.ok(operationComptableService.createOperation(operation));
    }

    @PutMapping("/operations/{id}")
    public ResponseEntity<OperationComptable> updateOperation(
            @PathVariable Long id,
            @Valid @RequestBody OperationComptable operation) {
        return ResponseEntity.ok(operationComptableService.updateOperation(id, operation));
    }

    @PutMapping("/operations/{id}/validate")
    public ResponseEntity<OperationComptable> validateOperation(@PathVariable Long id) {
        return ResponseEntity.ok(operationComptableService.validateOperation(id));
    }

    @PutMapping("/operations/{id}/cancel")
    public ResponseEntity<OperationComptable> cancelOperation(@PathVariable Long id) {
        return ResponseEntity.ok(operationComptableService.cancelOperation(id));
    }

    @DeleteMapping("/operations/{id}")
    public ResponseEntity<Void> deleteOperation(@PathVariable Long id) {
        operationComptableService.deleteOperation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/operations/summary/journal")
    public ResponseEntity<Map<String, Double>> getOperationSummaryByJournal() {
        return ResponseEntity.ok(operationComptableService.getOperationSummaryByJournal());
    }

    // ========== BROUILLARD DE CAISSE ==========

    @GetMapping("/cash-book")
    public ResponseEntity<List<BrouillardCaisse>> getCashEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(brouillardCaisseService.searchCashEntries(search));
        }
        if (date != null) {
            return ResponseEntity.ok(brouillardCaisseService.getCashEntriesByDate(date));
        }
        if (startDate != null && endDate != null && type != null && !type.isBlank()) {
            return ResponseEntity.ok(brouillardCaisseService.getCashEntriesByDateRangeAndType(startDate, endDate, type));
        }
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(brouillardCaisseService.getCashEntriesByDateRange(startDate, endDate));
        }
        if (type != null && !type.isBlank()) {
            return ResponseEntity.ok(brouillardCaisseService.getCashEntriesByType(type));
        }
        return ResponseEntity.ok(brouillardCaisseService.getAllCashEntries());
    }

    @PostMapping("/cash-book")
    public ResponseEntity<BrouillardCaisse> createCashEntry(@Valid @RequestBody BrouillardCaisse entry) {
        return ResponseEntity.ok(brouillardCaisseService.createCashEntry(entry));
    }

    @PutMapping("/cash-book/{id}")
    public ResponseEntity<BrouillardCaisse> updateCashEntry(@PathVariable Long id, @Valid @RequestBody BrouillardCaisse entry) {
        return ResponseEntity.ok(brouillardCaisseService.updateCashEntry(id, entry));
    }

    @DeleteMapping("/cash-book/{id}")
    public ResponseEntity<Void> deleteCashEntry(@PathVariable Long id) {
        brouillardCaisseService.deleteCashEntry(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cash-book/current-balance")
    public ResponseEntity<Double> getCurrentBalance() {
        return ResponseEntity.ok(brouillardCaisseService.getCurrentBalance());
    }

    @GetMapping("/cash-book/today")
    public ResponseEntity<List<BrouillardCaisse>> getTodayEntries() {
        return ResponseEntity.ok(brouillardCaisseService.getTodayEntries());
    }

    // ========== BALANCE GENERALE ==========

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getGeneralBalance() {
        Map<String, Object> balance = Map.of(
                "totalActif", planComptableService.getTotalBalanceByType("Actif"),
                "totalPassif", planComptableService.getTotalBalanceByType("Passif"),
                "totalCharges", planComptableService.getTotalBalanceByType("Charge"),
                "totalProduits", planComptableService.getTotalBalanceByType("Produit"),
                "accounts", planComptableService.getActiveAccounts(),
                "isBalanced", planComptableService.getTotalBalanceByType("Actif").equals(
                        planComptableService.getTotalBalanceByType("Passif")),
                "generatedAt", LocalDateTime.now()
        );
        return ResponseEntity.ok(balance);
    }
}
