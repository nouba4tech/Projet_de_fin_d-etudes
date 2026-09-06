package com.mirador.hotel.controller;

import com.mirador.hotel.dto.CashWorkflowDtos;
import com.mirador.hotel.model.CashJournalEntry;
import com.mirador.hotel.model.CashRegisterState;
import com.mirador.hotel.model.CashTransferRecord;
import com.mirador.hotel.service.CashWorkflowService;
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

@RestController
@RequestMapping("/api/cash")
public class CashWorkflowController {

    private final CashWorkflowService cashWorkflowService;

    public CashWorkflowController(CashWorkflowService cashWorkflowService) {
        this.cashWorkflowService = cashWorkflowService;
    }

    @GetMapping("/{scope}")
    public CashWorkflowDtos.CashModuleStateResponse getState(@PathVariable String scope) {
        return cashWorkflowService.getModuleState(scope);
    }

    @PostMapping("/{scope}/bootstrap")
    public CashWorkflowDtos.CashModuleStateResponse bootstrap(
            @PathVariable String scope,
            @Valid @RequestBody CashWorkflowDtos.CashModuleBootstrapRequest request) {
        return cashWorkflowService.bootstrap(scope, request);
    }

    @PostMapping("/{scope}/transfers")
    public ResponseEntity<CashTransferRecord> createTransfer(
            @PathVariable String scope,
            @Valid @RequestBody CashWorkflowDtos.CreateCashTransferRequest request) {
        CashTransferRecord transfer = cashWorkflowService.createTransfer(scope, request);
        return ResponseEntity.created(URI.create("/api/cash/" + scope + "/transfers/" + transfer.getId())).body(transfer);
    }

    @PutMapping("/{scope}/transfers/{transferId}/approve")
    public CashTransferRecord approveTransfer(
            @PathVariable String scope,
            @PathVariable Long transferId,
            @Valid @RequestBody CashWorkflowDtos.ApproveCashTransferRequest request) {
        return cashWorkflowService.approveTransfer(scope, transferId, request.approvedBy());
    }

    @PutMapping("/{scope}/transfers/{transferId}/cancel")
    public CashTransferRecord cancelTransfer(
            @PathVariable String scope,
            @PathVariable Long transferId) {
        return cashWorkflowService.cancelTransfer(scope, transferId);
    }

    @DeleteMapping("/{scope}/transfers/{transferId}")
    public ResponseEntity<Void> deleteTransfer(
            @PathVariable String scope,
            @PathVariable Long transferId) {
        cashWorkflowService.deleteTransfer(scope, transferId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{scope}/registers/open")
    public ResponseEntity<CashRegisterState> openRegister(
            @PathVariable String scope,
            @Valid @RequestBody CashWorkflowDtos.RegisterOpeningRequest request) {
        CashRegisterState state = cashWorkflowService.openRegister(scope, request);
        return ResponseEntity.created(URI.create("/api/cash/" + scope + "/registers/" + state.getId())).body(state);
    }

    @PostMapping("/{scope}/registers/close")
    public CashRegisterState closeRegister(
            @PathVariable String scope,
            @Valid @RequestBody CashWorkflowDtos.RegisterClosingRequest request) {
        return cashWorkflowService.closeRegister(scope, request);
    }

    @PostMapping("/{scope}/registers/movement")
    public CashJournalEntry recordMovement(
            @PathVariable String scope,
            @Valid @RequestBody CashWorkflowDtos.CashMovementRequest request) {
        return cashWorkflowService.recordMovement(scope, request);
    }

    @PutMapping("/{scope}/closures/{journalEntryId}/cancel")
    public CashJournalEntry cancelClosure(
            @PathVariable String scope,
            @PathVariable Long journalEntryId) {
        return cashWorkflowService.cancelRegisterClosure(scope, journalEntryId);
    }

    @DeleteMapping("/{scope}/closures/{journalEntryId}")
    public ResponseEntity<Void> deleteClosure(
            @PathVariable String scope,
            @PathVariable Long journalEntryId) {
        cashWorkflowService.deleteRegisterClosure(scope, journalEntryId);
        return ResponseEntity.noContent().build();
    }
}

