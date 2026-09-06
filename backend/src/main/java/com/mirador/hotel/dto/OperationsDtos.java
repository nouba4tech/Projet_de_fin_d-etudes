package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public final class OperationsDtos {

    private OperationsDtos() {
    }

    public record EmployeeRequest(
            @NotBlank(message = "Le prenom est obligatoire")
            String firstName,

            @NotBlank(message = "Le nom est obligatoire")
            String lastName,

            String email,
            String phone,

            @NotBlank(message = "Le poste est obligatoire")
            String position,

            @NotBlank(message = "Le departement est obligatoire")
            String department,

            @NotNull(message = "La date d'embauche est obligatoire")
            LocalDate hireDate,

            @PositiveOrZero(message = "Le salaire doit etre positif ou nul")
            BigDecimal salary,

            String status,
            String userRole,
            Long userId) {
    }

    public record EmployeeResponse(
            Long id,
            String firstName,
            String lastName,
            String email,
            String phone,
            String position,
            String department,
            LocalDate hireDate,
            BigDecimal salary,
            String status,
            String userRole,
            Long userId) {
    }

    public record GuestServiceRequest(
            @NotNull(message = "Le client est obligatoire")
            Long clientId,

            @NotBlank(message = "Le type de service est obligatoire")
            String serviceType,

            @NotBlank(message = "La description est obligatoire")
            String description,

            String status,

            OffsetDateTime requestedAt,

            OffsetDateTime completedAt,

            @PositiveOrZero(message = "Le prix doit etre positif ou nul")
            BigDecimal price) {
    }

    public record GuestServiceResponse(
            Long id,
            Long clientId,
            String serviceType,
            String description,
            String status,
            OffsetDateTime requestedAt,
            OffsetDateTime completedAt,
            BigDecimal price) {
    }

    public record StockItemRequest(
            @NotBlank(message = "Le code article est obligatoire")
            String code,

            @NotBlank(message = "Le nom article est obligatoire")
            String name,

            @NotBlank(message = "La categorie est obligatoire")
            String category,

            @PositiveOrZero(message = "La quantite doit etre positive ou nulle")
            BigDecimal quantity,

            @NotBlank(message = "L'unite est obligatoire")
            String unit,

            @PositiveOrZero(message = "Le prix unitaire doit etre positif ou nul")
            BigDecimal unitPrice,

            @PositiveOrZero(message = "Le seuil minimum doit etre positif ou nul")
            BigDecimal minThreshold,

            String supplier,
            String scope,
            String scopeReference) {
    }

    public record StockItemResponse(
            Long id,
            String code,
            String name,
            String category,
            BigDecimal quantity,
            String unit,
            BigDecimal unitPrice,
            BigDecimal minThreshold,
            String supplier,
            String scope,
            String scopeReference,
            OffsetDateTime lastUpdated) {
    }

    public record StockMovementRequest(
            @NotNull(message = "L'article de stock est obligatoire")
            Long itemId,

            @NotBlank(message = "Le type de mouvement est obligatoire")
            String movementType,

            @Positive(message = "La quantite doit etre strictement positive")
            BigDecimal quantity,

            @NotBlank(message = "La raison est obligatoire")
            String reason,

            String reference) {
    }

    public record StockMovementResponse(
            Long id,
            Long itemId,
            String movementType,
            BigDecimal quantity,
            String reason,
            String reference,
            String itemScope,
            String itemScopeReference,
            OffsetDateTime createdAt) {
    }

    public record BarProductRequest(
            @NotBlank(message = "Le nom du produit est obligatoire")
            String name,

            @NotBlank(message = "La categorie est obligatoire")
            String category,

            @PositiveOrZero(message = "Le prix doit etre positif ou nul")
            BigDecimal price,

            @PositiveOrZero(message = "Le stock doit etre positif ou nul")
            BigDecimal stock,

            @PositiveOrZero(message = "Le seuil minimal doit etre positif ou nul")
            BigDecimal minThreshold,

            Boolean available) {
    }

    public record BarProductResponse(
            Long id,
            String name,
            String category,
            BigDecimal price,
            BigDecimal stock,
            BigDecimal minThreshold,
            boolean available) {
    }

    public record BarMovementRequest(
            @Positive(message = "La quantite doit etre strictement positive")
            BigDecimal quantity,

            @NotBlank(message = "Le type de mouvement est obligatoire")
            String movementType,

            @NotBlank(message = "La raison est obligatoire")
            String reason,

            String reference,
            Integer depotId) {
    }

    public record BarMovementResponse(
            Long id,
            Long productId,
            BigDecimal quantity,
            String movementType,
            String reason,
            String reference,
            Integer depotId,
            OffsetDateTime movementDate) {
    }

    public record MenuItemRequest(
            @NotBlank(message = "Le nom du menu est obligatoire")
            String name,

            @NotBlank(message = "La description est obligatoire")
            String description,

            @PositiveOrZero(message = "Le prix doit etre positif ou nul")
            BigDecimal price,

            String category,

            Boolean available,

            Integer depotId) {
    }

    public record MenuItemResponse(
            Long id,
            String name,
            String description,
            BigDecimal price,
            String category,
            boolean available,
            Integer depotId,
            BigDecimal stockQuantity) {
    }

    public record RestaurantOrderItemRequest(
            @NotNull(message = "L'article du menu est obligatoire")
            Long menuItemId,

            @Positive(message = "La quantite doit etre strictement positive")
            Integer quantity,

            @PositiveOrZero(message = "Le prix unitaire doit etre positif ou nul")
            BigDecimal unitPrice) {
    }

    public record RestaurantOrderItemResponse(
            Long id,
            Long menuItemId,
            String menuItemName,
            Integer quantity,
            BigDecimal unitPrice) {
    }

    public record RestaurantOrderRequest(
            @NotNull(message = "Le numero de table est obligatoire")
            Integer tableNumber,

            @NotEmpty(message = "La commande doit contenir au moins un article")
            List<RestaurantOrderItemRequest> items,

            String status) {
    }

    public record RestaurantOrderResponse(
            Long id,
            Integer tableNumber,
            List<RestaurantOrderItemResponse> items,
            String status,
            BigDecimal totalAmount,
            OffsetDateTime createdAt,
            OffsetDateTime servedAt) {
    }

    public record FinanceTransactionRequest(
            @NotBlank(message = "Le type de transaction est obligatoire")
            String type,

            @NotBlank(message = "La categorie est obligatoire")
            String category,

            @NotBlank(message = "La description est obligatoire")
            String description,

            @PositiveOrZero(message = "Le montant doit etre positif ou nul")
            BigDecimal amount,

            @NotNull(message = "La date de transaction est obligatoire")
            LocalDate transactionDate,

            String reference) {
    }

    public record FinanceTransactionResponse(
            Long id,
            String type,
            String category,
            String description,
            BigDecimal amount,
            LocalDate transactionDate,
            String reference,
            OffsetDateTime createdAt) {
    }

    public record VisitRequest(
            String name,
            String firstName,
            String observation,
            OffsetDateTime startDate,
            OffsetDateTime endDate,
            Long occupantId) {
    }

    public record VisitResponse(
            Long id,
            String name,
            String firstName,
            String observation,
            OffsetDateTime startDate,
            OffsetDateTime endDate,
            Long occupantId) {
    }

    public record StockTransferItemRequest(
            @NotNull(message = "L'article est obligatoire")
            Long stockItemId,
            @Positive(message = "La quantité doit être strictement positive")
            BigDecimal quantity) {
    }

    public record StockTransferItemResponse(
            Long id,
            Long stockItemId,
            String itemCode,
            String itemName,
            BigDecimal quantity) {
    }

    public record StockTransferRequest(
            @NotBlank(message = "Le numéro de transfert est obligatoire")
            String transferNumber,
            @NotNull(message = "La date de transfert est obligatoire")
            OffsetDateTime transferDate,
            @NotBlank(message = "L'emplacement d'origine est obligatoire")
            String fromLocation,
            @NotBlank(message = "L'emplacement de destination est obligatoire")
            String toLocation,
            String notes,
            String requestedBy,
            String approvedBy,
            @NotEmpty(message = "Le transfert doit contenir au moins un article")
            List<StockTransferItemRequest> items) {
    }

    public record StockTransferResponse(
            Long id,
            String transferNumber,
            OffsetDateTime transferDate,
            String fromLocation,
            String toLocation,
            String status,
            String notes,
            String requestedBy,
            String approvedBy,
            List<StockTransferItemResponse> items,
            OffsetDateTime createdAt) {
    }

    public record SupplierInvoiceItemRequest(
            @NotBlank(message = "Le code article est obligatoire")
            String itemCode,
            @NotBlank(message = "Le nom de l'article est obligatoire")
            String itemName,
            String categoryName,
            @Positive(message = "La quantité doit être strictement positive")
            BigDecimal quantity,
            @NotBlank(message = "L'unité est obligatoire")
            String unitName,
            @PositiveOrZero(message = "Le prix unitaire doit être positif ou nul")
            BigDecimal unitPrice) {
    }

    public record SupplierInvoiceItemResponse(
            Long id,
            String itemCode,
            String itemName,
            String categoryName,
            BigDecimal quantity,
            String unitName,
            BigDecimal unitPrice,
            BigDecimal totalPrice) {
    }

    public record SupplierInvoiceRequest(
            @NotBlank(message = "Le numéro de facture est obligatoire")
            String invoiceNumber,
            @NotNull(message = "Le fournisseur est obligatoire")
            Integer supplierId,
            @NotNull(message = "La date de facture est obligatoire")
            OffsetDateTime invoiceDate,
            @NotNull(message = "La date d'échéance est obligatoire")
            OffsetDateTime dueDate,
            String notes,
            String createdBy,
            String status,
            @NotEmpty(message = "La facture doit contenir au moins un article")
            List<SupplierInvoiceItemRequest> items) {
    }

    public record SupplierInvoiceResponse(
            Long id,
            String invoiceNumber,
            Integer supplierId,
            String supplierName,
            OffsetDateTime invoiceDate,
            OffsetDateTime dueDate,
            BigDecimal subtotalAmount,
            BigDecimal taxAmount,
            BigDecimal totalAmount,
            String status,
            String notes,
            String createdBy,
            List<SupplierInvoiceItemResponse> items,
            OffsetDateTime createdAt) {
    }

    public record InventoryReconciliationItem(
            @NotNull(message = "L'article est obligatoire")
            Long itemId,
            @PositiveOrZero(message = "La quantité physique doit être positive ou nulle")
            BigDecimal physicalQuantity,
            String reason) {
    }

    public record InventoryReconciliationRequest(
            @NotEmpty(message = "La réconciliation doit contenir au moins un article")
            List<InventoryReconciliationItem> items,
            String reasonReference) {
    }
}

