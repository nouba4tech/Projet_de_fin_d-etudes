package com.mirador.hotel.service;

import com.mirador.hotel.dto.CashWorkflowDtos;
import com.mirador.hotel.model.CashJournalEntry;
import com.mirador.hotel.model.CashRegisterState;
import com.mirador.hotel.model.CashTransferRecord;
import com.mirador.hotel.repository.CashJournalEntryRepository;
import com.mirador.hotel.repository.CashRegisterStateRepository;
import com.mirador.hotel.repository.CashTransferRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@Transactional
public class CashWorkflowService {

    private final CashRegisterStateRepository cashRegisterRepository;
    private final CashTransferRecordRepository cashTransferRepository;
    private final CashJournalEntryRepository cashJournalRepository;

    public CashWorkflowService(
            CashRegisterStateRepository cashRegisterRepository,
            CashTransferRecordRepository cashTransferRepository,
            CashJournalEntryRepository cashJournalRepository) {
        this.cashRegisterRepository = cashRegisterRepository;
        this.cashTransferRepository = cashTransferRepository;
        this.cashJournalRepository = cashJournalRepository;
    }

    public CashWorkflowDtos.CashModuleStateResponse getModuleState(String scope) {
        if ("accounting".equals(scope)) {
            return new CashWorkflowDtos.CashModuleStateResponse(
                    cashRegisterRepository.findAllByOrderByRegisterNumberAsc(),
                    cashTransferRepository.findAllByOrderByTransferDateDesc(),
                    cashJournalRepository.findAllByOrderByDateDesc()
            );
        }
        return new CashWorkflowDtos.CashModuleStateResponse(
                cashRegisterRepository.findByScopeOrderByRegisterNumberAsc(scope),
                cashTransferRepository.findByScopeOrderByTransferDateDesc(scope),
                cashJournalRepository.findByScopeOrderByDateDesc(scope)
        );
    }

    public CashWorkflowDtos.CashModuleStateResponse bootstrap(
            String scope,
            CashWorkflowDtos.CashModuleBootstrapRequest request) {
        if (cashRegisterRepository.existsByScope(scope)
                || cashTransferRepository.existsByScope(scope)
                || cashJournalRepository.existsByScope(scope)) {
            return getModuleState(scope);
        }

        request.cashRegisters().forEach(item -> {
            CashRegisterState register = new CashRegisterState();
            register.setScope(scope);
            register.setRegisterNumber(item.registerNumber());
            register.setOpeningBalance(scale(item.openingBalance()));
            register.setCurrentBalance(scale(item.currentBalance()));
            register.setCashIn(scale(item.cashIn()));
            register.setCashOut(scale(item.cashOut()));
            register.setTotalSales(scale(item.totalSales()));
            register.setStatus(item.status());
            register.setOpenedBy(item.openedBy());
            register.setClosedBy(item.closedBy());
            register.setOpenedAt(item.openedAt());
            register.setClosedAt(item.closedAt());
            cashRegisterRepository.save(register);
        });

        if (request.cashTransfers() != null) {
            request.cashTransfers().forEach(item -> {
                CashTransferRecord transfer = new CashTransferRecord();
                transfer.setScope(scope);
                transfer.setTransferNumber(item.transferNumber());
                transfer.setFromRegister(item.fromRegister());
                transfer.setToRegister(item.toRegister());
                transfer.setAmount(scale(item.amount()));
                transfer.setReason(item.reason());
                transfer.setStatus(item.status());
                transfer.setRequestedBy(item.requestedBy());
                transfer.setApprovedBy(item.approvedBy());
                transfer.setTransferDate(item.transferDate());
                transfer.setCompletedAt(item.completedAt());
                cashTransferRepository.save(transfer);
            });
        }

        if (request.cashJournal() != null) {
            request.cashJournal().forEach(item -> {
                CashJournalEntry entry = new CashJournalEntry();
                entry.setScope(scope);
                entry.setDate(item.date());
                entry.setDescription(item.description());
                entry.setType(item.type());
                entry.setAmount(scale(item.amount()));
                entry.setBalance(scale(item.balance()));
                entry.setRegister(item.register());
                entry.setUser(item.user());
                entry.setReference(item.reference());
                entry.setStatus(item.status() == null || item.status().isBlank() ? "active" : item.status());
                entry.setSourceType(item.sourceType());
                cashJournalRepository.save(entry);
            });
        }

        return getModuleState(scope);
    }

    public CashTransferRecord createTransfer(String scope, CashWorkflowDtos.CreateCashTransferRequest request) {
        CashRegisterState sourceRegister = getRegister(scope, request.fromRegister());
        CashRegisterState destinationRegister = getRegister(scope, request.toRegister());

        if (sourceRegister.getRegisterNumber().equals(destinationRegister.getRegisterNumber())) {
            throw new IllegalArgumentException("La caisse source et la caisse destination doivent etre differentes.");
        }

        assertOpenRegister(sourceRegister);
        assertOpenRegister(destinationRegister);

        if (scale(request.amount()).compareTo(sourceRegister.getCurrentBalance()) > 0) {
            throw new IllegalArgumentException("Le montant depasse le solde disponible de la caisse source.");
        }

        CashTransferRecord transfer = new CashTransferRecord();
        transfer.setScope(scope);
        transfer.setTransferNumber(generateReference("TRF"));
        transfer.setFromRegister(sourceRegister.getRegisterNumber());
        transfer.setToRegister(destinationRegister.getRegisterNumber());
        transfer.setAmount(scale(request.amount()));
        transfer.setReason(request.reason().trim());
        transfer.setStatus("pending");
        transfer.setRequestedBy(request.requestedBy().trim());
        transfer.setTransferDate(request.transferDate());
        return cashTransferRepository.save(transfer);
    }

    public CashTransferRecord approveTransfer(String scope, Long transferId, String approvedBy) {
        CashTransferRecord transfer = getTransfer(scope, transferId);
        if (!"pending".equalsIgnoreCase(transfer.getStatus())) {
            throw new IllegalArgumentException("Seuls les transferts en attente peuvent etre approuves.");
        }

        CashRegisterState sourceRegister = getRegister(scope, transfer.getFromRegister());
        CashRegisterState destinationRegister = getRegister(scope, transfer.getToRegister());

        if (transfer.getAmount().compareTo(sourceRegister.getCurrentBalance()) > 0) {
            throw new IllegalArgumentException("Le montant depasse le solde disponible de la caisse source.");
        }

        BigDecimal sourceBalance = sourceRegister.getCurrentBalance().subtract(transfer.getAmount());
        BigDecimal destinationBalance = destinationRegister.getCurrentBalance().add(transfer.getAmount());

        sourceRegister.setCurrentBalance(scale(sourceBalance));
        sourceRegister.setCashOut(scale(sourceRegister.getCashOut().add(transfer.getAmount())));
        destinationRegister.setCurrentBalance(scale(destinationBalance));
        destinationRegister.setCashIn(scale(destinationRegister.getCashIn().add(transfer.getAmount())));

        transfer.setStatus("completed");
        transfer.setApprovedBy(approvedBy.trim());
        transfer.setCompletedAt(LocalDateTime.now());

        cashRegisterRepository.save(sourceRegister);
        cashRegisterRepository.save(destinationRegister);
        cashTransferRepository.save(transfer);

        createJournalEntry(scope, transfer.getCompletedAt(),
                "Transfert vers " + destinationRegister.getRegisterNumber() + " - " + transfer.getReason(),
                "transfer",
                transfer.getAmount(),
                sourceBalance,
                sourceRegister.getRegisterNumber(),
                approvedBy,
                transfer.getTransferNumber(),
                "active",
                "transfer",
                transfer.getId());

        createJournalEntry(scope, transfer.getCompletedAt(),
                "Transfert depuis " + sourceRegister.getRegisterNumber() + " - " + transfer.getReason(),
                "cash_in",
                transfer.getAmount(),
                destinationBalance,
                destinationRegister.getRegisterNumber(),
                approvedBy,
                transfer.getTransferNumber(),
                "active",
                "transfer",
                transfer.getId());

        return transfer;
    }

    public CashTransferRecord cancelTransfer(String scope, Long transferId) {
        CashTransferRecord transfer = getTransfer(scope, transferId);
        if ("completed".equalsIgnoreCase(transfer.getStatus())) {
            throw new IllegalArgumentException("Un transfert complete ne peut pas etre annule automatiquement.");
        }

        transfer.setStatus("cancelled");
        return cashTransferRepository.save(transfer);
    }

    public void deleteTransfer(String scope, Long transferId) {
        CashTransferRecord transfer = getTransfer(scope, transferId);
        if ("completed".equalsIgnoreCase(transfer.getStatus())) {
            throw new IllegalArgumentException("Un transfert complete ne peut pas etre supprime.");
        }
        cashTransferRepository.delete(transfer);
    }

    public CashRegisterState openRegister(String scope, CashWorkflowDtos.RegisterOpeningRequest request) {
        CashRegisterState register = cashRegisterRepository.findByScopeAndRegisterNumber(scope, request.registerNumber())
                .orElseGet(CashRegisterState::new);

        if (register.getId() != null && "open".equalsIgnoreCase(register.getStatus())) {
            throw new IllegalArgumentException("Cette caisse est deja ouverte.");
        }

        LocalDateTime openedAt = LocalDateTime.now();
        BigDecimal openingBalance = scale(request.openingBalance());
        register.setScope(scope);
        register.setRegisterNumber(request.registerNumber());
        register.setOpeningBalance(openingBalance);
        register.setCurrentBalance(openingBalance);
        register.setCashIn(BigDecimal.ZERO);
        register.setCashOut(BigDecimal.ZERO);
        register.setTotalSales(BigDecimal.ZERO);
        register.setStatus("open");
        register.setOpenedBy(request.responsible().trim());
        register.setOpenedAt(openedAt);
        register.setClosedBy(null);
        register.setClosedAt(null);
        CashRegisterState savedRegister = cashRegisterRepository.save(register);

        CashJournalEntry entry = createJournalEntry(scope, openedAt,
                appendNotes("Ouverture de caisse", request.notes()),
                "opening",
                openingBalance,
                openingBalance,
                savedRegister.getRegisterNumber(),
                request.responsible(),
                generateReference("OUV"),
                "active",
                "register-opening",
                savedRegister.getId());

        entry.setSourceId(savedRegister.getId());
        cashJournalRepository.save(entry);
        return savedRegister;
    }

    public CashRegisterState closeRegister(String scope, CashWorkflowDtos.RegisterClosingRequest request) {
        CashRegisterState register = getRegister(scope, request.registerNumber());
        assertOpenRegister(register);

        LocalDateTime closedAt = LocalDateTime.now();
        BigDecimal realBalance = scale(request.realBalance());
        register.setCurrentBalance(realBalance);
        register.setStatus("closed");
        register.setClosedBy(request.responsible().trim());
        register.setClosedAt(closedAt);
        CashRegisterState savedRegister = cashRegisterRepository.save(register);

        CashJournalEntry entry = createJournalEntry(scope, closedAt,
                appendNotes("Fermeture de caisse", request.notes()),
                "closing",
                realBalance,
                realBalance,
                register.getRegisterNumber(),
                request.responsible(),
                generateReference("FER"),
                "active",
                "register-closing",
                savedRegister.getId());

        entry.setSourceId(savedRegister.getId());
        cashJournalRepository.save(entry);
        return savedRegister;
    }

    public CashJournalEntry recordMovement(String scope, CashWorkflowDtos.CashMovementRequest request) {
        CashRegisterState register = getRegister(scope, request.registerNumber());
        assertOpenRegister(register);

        BigDecimal amount = scale(request.amount());
        String type = request.type().trim().toLowerCase();
        boolean cashIn = "cash_in".equals(type);
        boolean cashOut = "cash_out".equals(type);
        if (!cashIn && !cashOut) {
            throw new IllegalArgumentException("Le type de mouvement doit etre cash_in ou cash_out.");
        }
        if (cashOut && amount.compareTo(register.getCurrentBalance()) > 0) {
            throw new IllegalArgumentException("Le montant depasse le solde disponible de la caisse.");
        }

        BigDecimal balance = cashIn
                ? register.getCurrentBalance().add(amount)
                : register.getCurrentBalance().subtract(amount);
        register.setCurrentBalance(scale(balance));
        if (cashIn) {
            register.setCashIn(scale(register.getCashIn().add(amount)));
        } else {
            register.setCashOut(scale(register.getCashOut().add(amount)));
        }
        cashRegisterRepository.save(register);

        return createJournalEntry(scope, LocalDateTime.now(),
                appendNotes(cashIn ? "Entree de caisse" : "Sortie de caisse", request.description()),
                type, amount, balance, register.getRegisterNumber(), request.responsible(),
                generateReference(cashIn ? "ENT" : "SOR"), "active", "cash-movement", register.getId());
    }

    public CashJournalEntry cancelRegisterClosure(String scope, Long journalEntryId) {
        CashJournalEntry journalEntry = getJournalEntry(scope, journalEntryId);
        if (!"register-closing".equalsIgnoreCase(journalEntry.getSourceType())) {
            throw new IllegalArgumentException("Seule une cloture peut etre annulee.");
        }
        if ("cancelled".equalsIgnoreCase(journalEntry.getStatus())) {
            return journalEntry;
        }

        CashRegisterState register = getRegister(scope, journalEntry.getRegister());
        register.setStatus("open");
        register.setClosedBy(null);
        register.setClosedAt(null);
        cashRegisterRepository.save(register);

        journalEntry.setStatus("cancelled");
        return cashJournalRepository.save(journalEntry);
    }

    public void deleteRegisterClosure(String scope, Long journalEntryId) {
        CashJournalEntry journalEntry = getJournalEntry(scope, journalEntryId);
        if (!"register-closing".equalsIgnoreCase(journalEntry.getSourceType())) {
            throw new IllegalArgumentException("Seule une cloture peut etre supprimee.");
        }
        if (!"cancelled".equalsIgnoreCase(journalEntry.getStatus())) {
            throw new IllegalArgumentException("Annulez la cloture avant suppression.");
        }
        cashJournalRepository.delete(journalEntry);
    }

    private CashRegisterState getRegister(String scope, String registerNumber) {
        if ("accounting".equals(scope)) {
            return cashRegisterRepository.findFirstByRegisterNumber(registerNumber)
                    .orElseThrow(() -> new IllegalArgumentException("Caisse introuvable: " + registerNumber));
        }
        return cashRegisterRepository.findByScopeAndRegisterNumber(scope, registerNumber)
                .orElseThrow(() -> new IllegalArgumentException("Caisse introuvable: " + registerNumber));
    }

    private CashTransferRecord getTransfer(String scope, Long transferId) {
        CashTransferRecord transfer = cashTransferRepository.findById(transferId)
                .orElseThrow(() -> new IllegalArgumentException("Transfert introuvable."));
        if (!scope.equalsIgnoreCase(transfer.getScope())) {
            throw new IllegalArgumentException("Transfert introuvable pour ce module.");
        }
        return transfer;
    }

    private CashJournalEntry getJournalEntry(String scope, Long journalEntryId) {
        CashJournalEntry entry = cashJournalRepository.findById(journalEntryId)
                .orElseThrow(() -> new IllegalArgumentException("Ecriture introuvable."));
        if (!scope.equalsIgnoreCase(entry.getScope())) {
            throw new IllegalArgumentException("Ecriture introuvable pour ce module.");
        }
        return entry;
    }

    private void assertOpenRegister(CashRegisterState register) {
        if (!"open".equalsIgnoreCase(register.getStatus())) {
            throw new IllegalArgumentException("La caisse " + register.getRegisterNumber() + " doit etre ouverte.");
        }
    }

    private CashJournalEntry createJournalEntry(
            String scope,
            LocalDateTime date,
            String description,
            String type,
            BigDecimal amount,
            BigDecimal balance,
            String registerNumber,
            String userName,
            String reference,
            String status,
            String sourceType,
            Long sourceId) {
        CashJournalEntry entry = new CashJournalEntry();
        entry.setScope(scope);
        entry.setDate(date);
        entry.setDescription(description);
        entry.setType(type);
        entry.setAmount(scale(amount));
        entry.setBalance(scale(balance));
        entry.setRegister(registerNumber);
        entry.setUser(userName.trim());
        entry.setReference(reference);
        entry.setStatus(status);
        entry.setSourceType(sourceType);
        entry.setSourceId(sourceId);
        return cashJournalRepository.save(entry);
    }

    private BigDecimal scale(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private String generateReference(String prefix) {
        return prefix + "-" + LocalDateTime.now().toString().replace(":", "").replace("-", "").replace(".", "");
    }

    private String appendNotes(String label, String notes) {
        if (notes == null || notes.isBlank()) {
            return label;
        }
        return label + " - " + notes.trim();
    }
}
