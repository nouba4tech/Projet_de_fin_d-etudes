package com.mirador.hotel.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounting_operations")
public class OperationComptable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference", nullable = false, unique = true, length = 20)
    private String reference;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @Column(name = "account_code", nullable = false, length = 10)
    private String accountCode;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "debit_amount", nullable = false)
    private Double debitAmount;

    @Column(name = "credit_amount", nullable = false)
    private Double creditAmount;

    @Column(name = "journal_code", nullable = false, length = 5)
    private String journalCode;

    @Column(name = "status", nullable = false)
    private String status; // Valide, Brouillon, Annule

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public OperationComptable() {
        this.date = LocalDateTime.now();
        this.debitAmount = 0.0;
        this.creditAmount = 0.0;
        this.status = "Brouillon";
        this.createdAt = LocalDateTime.now();
    }

    public OperationComptable(String reference, String accountCode, String label,
                              Double debitAmount, Double creditAmount, String journalCode, String createdBy) {
        this();
        this.reference = reference;
        this.accountCode = accountCode;
        this.label = label;
        this.debitAmount = debitAmount;
        this.creditAmount = creditAmount;
        this.journalCode = journalCode;
        this.createdBy = createdBy;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getAccountCode() {
        return accountCode;
    }

    public void setAccountCode(String accountCode) {
        this.accountCode = accountCode;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Double getDebitAmount() {
        return debitAmount;
    }

    public void setDebitAmount(Double debitAmount) {
        this.debitAmount = debitAmount;
    }

    public Double getCreditAmount() {
        return creditAmount;
    }

    public void setCreditAmount(Double creditAmount) {
        this.creditAmount = creditAmount;
    }

    public String getJournalCode() {
        return journalCode;
    }

    public void setJournalCode(String journalCode) {
        this.journalCode = journalCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
