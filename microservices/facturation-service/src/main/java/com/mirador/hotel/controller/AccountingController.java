package com.mirador.hotel.controller;

import com.mirador.hotel.dto.AccountingDashboardResponse;
import com.mirador.hotel.dto.CaisseResponse;
import com.mirador.hotel.dto.CompteComptableResponse;
import com.mirador.hotel.dto.CreateCompteComptableRequest;
import com.mirador.hotel.dto.DepotResponse;
import com.mirador.hotel.dto.OperationComptableRequest;
import com.mirador.hotel.dto.OperationComptableResponse;
import com.mirador.hotel.dto.PlanComptableResponse;
import com.mirador.hotel.dto.UpdateCompteComptableRequest;
import com.mirador.hotel.service.AccountingService;
import jakarta.validation.Valid;
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

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping({ "/api/accounting/sqlite", "/api/comptabilite/sqlite" })
public class AccountingController {

    private final AccountingService accountingService;

    public AccountingController(AccountingService accountingService) {
        this.accountingService = accountingService;
    }

    @GetMapping
    public AccountingDashboardResponse getOverview() {
        return accountingService.getDashboard();
    }

    @GetMapping("/dashboard")
    public AccountingDashboardResponse getDashboard() {
        return accountingService.getDashboard();
    }

    @GetMapping("/plan-comptable")
    public List<PlanComptableResponse> getPlanComptable() {
        return accountingService.getPlanComptable();
    }

    @GetMapping("/comptes")
    public List<CompteComptableResponse> getComptes(
            @RequestParam(required = false) String numeroPlan) {
        return accountingService.getComptes(numeroPlan);
    }

    @GetMapping("/comptes/{numcompte}")
    public CompteComptableResponse getCompte(@PathVariable String numcompte) {
        return accountingService.getCompte(numcompte);
    }

    @PostMapping("/comptes")
    public ResponseEntity<CompteComptableResponse> createCompte(
            @Valid @RequestBody CreateCompteComptableRequest request) {
        CompteComptableResponse compte = accountingService.createCompte(request);
        return ResponseEntity.created(URI.create("/api/accounting/sqlite/comptes/" + compte.numcompte())).body(compte);
    }

    @PutMapping("/comptes/{numcompte}")
    public CompteComptableResponse updateCompte(
            @PathVariable String numcompte,
            @Valid @RequestBody UpdateCompteComptableRequest request) {
        return accountingService.updateCompte(numcompte, request);
    }

    @DeleteMapping("/comptes/{numcompte}")
    public ResponseEntity<Void> deleteCompte(@PathVariable String numcompte) {
        accountingService.deleteCompte(numcompte);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/caisses")
    public List<CaisseResponse> getCaisses() {
        return accountingService.getCaisses();
    }

    @GetMapping("/depots")
    public List<DepotResponse> getDepots() {
        return accountingService.getDepots();
    }

    @PostMapping("/depots")
    public ResponseEntity<DepotResponse> createDepot(
            @Valid @RequestBody com.mirador.hotel.dto.DepotRequest request) {
        DepotResponse depot = accountingService.createDepot(request);
        return ResponseEntity.created(URI.create("/api/accounting/sqlite/depots/" + depot.codeDepot())).body(depot);
    }

    @PutMapping("/depots/{codeDepot}")
    public DepotResponse updateDepot(
            @PathVariable int codeDepot,
            @Valid @RequestBody com.mirador.hotel.dto.DepotRequest request) {
        return accountingService.updateDepot(codeDepot, request);
    }

    @DeleteMapping("/depots/{codeDepot}")
    public ResponseEntity<Void> deleteDepot(@PathVariable int codeDepot) {
        accountingService.deleteDepot(codeDepot);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/operations")
    public List<OperationComptableResponse> getOperations(
            @RequestParam(required = false) String numcompte,
            @RequestParam(required = false) String typeOperation,
            @RequestParam(required = false) Integer codeDepot) {
        return accountingService.getOperations(numcompte, typeOperation, codeDepot);
    }

    @GetMapping("/operations/{codeOperation}")
    public OperationComptableResponse getOperation(@PathVariable long codeOperation) {
        return accountingService.getOperation(codeOperation);
    }

    @PostMapping("/operations")
    public ResponseEntity<OperationComptableResponse> createOperation(
            @Valid @RequestBody OperationComptableRequest request) {
        OperationComptableResponse operation = accountingService.createOperation(request);
        return ResponseEntity.created(URI.create("/api/accounting/sqlite/operations/" + operation.codeOperation()))
                .body(operation);
    }
}
