package com.mirador.hotel.dto;

import com.mirador.hotel.model.CashJournalEntry;
import com.mirador.hotel.model.CashRegisterState;
import com.mirador.hotel.model.CashTransferRecord;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class CashWorkflowDtos {

    private CashWorkflowDtos() {
    }

    public record CashModuleStateResponse(
            List<CashRegisterState> cashRegisters,
            List<CashTransferRecord> cashTransfers,
            List<CashJournalEntry> cashJournal) {
    }

    public record CashModuleBootstrapRequest(
            @NotEmpty List<@Valid CashRegisterBootstrapItem> cashRegisters,
            List<@Valid CashTransferBootstrapItem> cashTransfers,
            List<@Valid CashJournalBootstrapItem> cashJournal) {
    }

    public record CashRegisterBootstrapItem(
            @NotBlank String registerNumber,
            @NotNull BigDecimal openingBalance,
            @NotNull BigDecimal currentBalance,
            @NotNull BigDecimal cashIn,
            @NotNull BigDecimal cashOut,
            @NotNull BigDecimal totalSales,
            @NotBlank String status,
            String openedBy,
            String closedBy,
            LocalDateTime openedAt,
            LocalDateTime closedAt) {
    }

    public record CashTransferBootstrapItem(
            @NotBlank String transferNumber,
            @NotBlank String fromRegister,
            @NotBlank String toRegister,
            @NotNull BigDecimal amount,
            @NotBlank String reason,
            @NotBlank String status,
            @NotBlank String requestedBy,
            String approvedBy,
            @NotNull LocalDateTime transferDate,
            LocalDateTime completedAt) {
    }

    public record CashJournalBootstrapItem(
            @NotNull LocalDateTime date,
            @NotBlank String description,
            @NotBlank String type,
            @NotNull BigDecimal amount,
            @NotNull BigDecimal balance,
            @NotBlank String register,
            @NotBlank String user,
            String reference,
            String status,
            String sourceType) {
    }

    public record CreateCashTransferRequest(
            @NotBlank String fromRegister,
            @NotBlank String toRegister,
            @NotNull @Positive BigDecimal amount,
            @NotBlank String reason,
            @NotBlank String requestedBy,
            @NotNull LocalDateTime transferDate) {
    }

    public record ApproveCashTransferRequest(
            @NotBlank String approvedBy) {
    }

    public record RegisterOpeningRequest(
            @NotBlank String registerNumber,
            @NotNull BigDecimal openingBalance,
            @NotBlank String responsible,
            String notes) {
    }

    public record RegisterClosingRequest(
            @NotBlank String registerNumber,
            @NotNull BigDecimal realBalance,
            @NotBlank String responsible,
            String notes) {
    }

    public record CashMovementRequest(
            @NotBlank String registerNumber,
            @NotBlank String type,
            @NotNull @Positive BigDecimal amount,
            @NotBlank String responsible,
            String description) {
    }
}
