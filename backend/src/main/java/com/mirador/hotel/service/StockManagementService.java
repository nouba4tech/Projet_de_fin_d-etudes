package com.mirador.hotel.service;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.model.Fournisseur;
import com.mirador.hotel.repository.FournisseurRepository;
import com.mirador.hotel.repository.StockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class StockManagementService {

    private final StockRepository stockRepository;
    private final FournisseurRepository fournisseurRepository;
    private final FinanceService financeService;

    public StockManagementService(
            StockRepository stockRepository,
            FournisseurRepository fournisseurRepository,
            FinanceService financeService) {
        this.stockRepository = stockRepository;
        this.fournisseurRepository = fournisseurRepository;
        this.financeService = financeService;
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.StockItemResponse> getItems(String scope) {
        return stockRepository.findAllItemsByScope(scope);
    }

    @Transactional(readOnly = true)
    public OperationsDtos.StockItemResponse getItem(long itemId) {
        return stockRepository.findItemById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Article de stock introuvable: " + itemId));
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.StockMovementResponse> getMovements(String scope) {
        return stockRepository.findAllMovementsByScope(scope);
    }

    public OperationsDtos.StockItemResponse createItem(OperationsDtos.StockItemRequest request) {
        long itemId = stockRepository.createItem(request);
        return getItem(itemId);
    }

    public OperationsDtos.StockItemResponse updateItem(long itemId, OperationsDtos.StockItemRequest request) {
        OperationsDtos.StockItemResponse existing = getItem(itemId);
        OperationsDtos.StockItemRequest normalizedRequest = new OperationsDtos.StockItemRequest(
                request.code(),
                request.name(),
                request.category(),
                request.quantity(),
                request.unit(),
                request.unitPrice(),
                request.minThreshold(),
                request.supplier(),
                request.scope() != null ? request.scope() : existing.scope(),
                request.scopeReference() != null ? request.scopeReference() : existing.scopeReference());
        stockRepository.updateItem(itemId, normalizedRequest);
        return getItem(itemId);
    }

    public void deleteItem(long itemId) {
        getItem(itemId);
        stockRepository.deleteItem(itemId);
    }

    public OperationsDtos.StockMovementResponse createMovement(OperationsDtos.StockMovementRequest request) {
        getItem(request.itemId());
        long movementId = stockRepository.createMovement(request);
        return stockRepository.findMovementById(movementId)
                .orElseThrow(() -> new ResourceNotFoundException("Mouvement de stock introuvable: " + movementId));
    }

    // ========== TRANSFERS ==========

    @Transactional(readOnly = true)
    public List<OperationsDtos.StockTransferResponse> getTransfers() {
        return stockRepository.findAllTransfers();
    }

    @Transactional(readOnly = true)
    public OperationsDtos.StockTransferResponse getTransfer(long transferId) {
        return stockRepository.findTransferById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfert de stock introuvable: " + transferId));
    }

    public OperationsDtos.StockTransferResponse createTransfer(OperationsDtos.StockTransferRequest request) {
        long id = stockRepository.createTransfer(request);

        for (OperationsDtos.StockTransferItemRequest item : request.items()) {
            OperationsDtos.StockItemResponse sourceItem = getItem(item.stockItemId());

            // 1. Deduct from source scope
            stockRepository.createMovement(new OperationsDtos.StockMovementRequest(
                    sourceItem.id(),
                    "EXIT",
                    item.quantity(),
                    "Transfert interne vers " + request.toLocation(),
                    request.transferNumber()
            ));

            // 2. Find or create in destination scope
            Optional<OperationsDtos.StockItemResponse> maybeDestItem = stockRepository.findItemByCodeAndScope(
                    sourceItem.code(),
                    request.toLocation()
            );

            long destItemId;
            if (maybeDestItem.isPresent()) {
                destItemId = maybeDestItem.get().id();
            } else {
                destItemId = stockRepository.createItem(new OperationsDtos.StockItemRequest(
                        sourceItem.code(),
                        sourceItem.name(),
                        sourceItem.category(),
                        BigDecimal.ZERO,
                        sourceItem.unit(),
                        sourceItem.unitPrice(),
                        sourceItem.minThreshold(),
                        sourceItem.supplier(),
                        request.toLocation(),
                        request.toLocation()
                ));
            }

            // 3. Add to destination scope
            stockRepository.createMovement(new OperationsDtos.StockMovementRequest(
                    destItemId,
                    "ENTRY",
                    item.quantity(),
                    "Transfert interne depuis " + request.fromLocation(),
                    request.transferNumber()
            ));
        }

        return getTransfer(id);
    }

    // ========== SUPPLIER INVOICES ==========

    @Transactional(readOnly = true)
    public List<OperationsDtos.SupplierInvoiceResponse> getSupplierInvoices() {
        return stockRepository.findAllSupplierInvoices();
    }

    @Transactional(readOnly = true)
    public OperationsDtos.SupplierInvoiceResponse getSupplierInvoice(long invoiceId) {
        return stockRepository.findSupplierInvoiceById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Facture fournisseur introuvable: " + invoiceId));
    }

    public OperationsDtos.SupplierInvoiceResponse createSupplierInvoice(OperationsDtos.SupplierInvoiceRequest request) {
        Fournisseur supplier = fournisseurRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable: " + request.supplierId()));

        long id = stockRepository.createSupplierInvoice(request, supplier.getNom());

        if ("validated".equalsIgnoreCase(request.status()) || "paid".equalsIgnoreCase(request.status())) {
            processSupplierInvoiceStockAndFinance(request, supplier.getNom());
        }

        return getSupplierInvoice(id);
    }

    public OperationsDtos.SupplierInvoiceResponse validateSupplierInvoice(long invoiceId) {
        OperationsDtos.SupplierInvoiceResponse invoice = getSupplierInvoice(invoiceId);
        if ("validated".equalsIgnoreCase(invoice.status()) || "paid".equalsIgnoreCase(invoice.status())) {
            return invoice;
        }

        stockRepository.updateSupplierInvoiceStatus(invoiceId, "validated");

        List<OperationsDtos.SupplierInvoiceItemRequest> reqItems = new ArrayList<>();
        for (OperationsDtos.SupplierInvoiceItemResponse item : invoice.items()) {
            reqItems.add(new OperationsDtos.SupplierInvoiceItemRequest(
                    item.itemCode(),
                    item.itemName(),
                    item.categoryName(),
                    item.quantity(),
                    item.unitName(),
                    item.unitPrice()
            ));
        }

        OperationsDtos.SupplierInvoiceRequest request = new OperationsDtos.SupplierInvoiceRequest(
                invoice.invoiceNumber(),
                invoice.supplierId(),
                invoice.invoiceDate(),
                invoice.dueDate(),
                invoice.notes(),
                invoice.createdBy(),
                "validated",
                reqItems
        );

        processSupplierInvoiceStockAndFinance(request, invoice.supplierName());

        return getSupplierInvoice(invoiceId);
    }

    public OperationsDtos.SupplierInvoiceResponse markSupplierInvoicePaid(long invoiceId) {
        OperationsDtos.SupplierInvoiceResponse invoice = getSupplierInvoice(invoiceId);
        if (!"validated".equalsIgnoreCase(invoice.status())) {
            invoice = validateSupplierInvoice(invoiceId);
        }
        stockRepository.updateSupplierInvoiceStatus(invoiceId, "paid");
        return getSupplierInvoice(invoiceId);
    }

    private void processSupplierInvoiceStockAndFinance(OperationsDtos.SupplierInvoiceRequest request, String supplierName) {
        for (OperationsDtos.SupplierInvoiceItemRequest item : request.items()) {
            Optional<OperationsDtos.StockItemResponse> maybeStockItem = stockRepository.findItemByCodeAndScope(
                    item.itemCode(),
                    "STOCK_MODULE"
            );

            long stockItemId;
            if (maybeStockItem.isPresent()) {
                stockItemId = maybeStockItem.get().id();
            } else {
                stockItemId = stockRepository.createItem(new OperationsDtos.StockItemRequest(
                        item.itemCode(),
                        item.itemName(),
                        item.categoryName() != null ? item.categoryName() : "Général",
                        BigDecimal.ZERO,
                        item.unitName(),
                        item.unitPrice(),
                        BigDecimal.TEN,
                        supplierName,
                        "STOCK_MODULE",
                        "STOCK_MODULE"
                ));
            }

            stockRepository.createMovement(new OperationsDtos.StockMovementRequest(
                    stockItemId,
                    "ENTRY",
                    item.quantity(),
                    "Réception commande fournisseur - Facture " + request.invoiceNumber(),
                    request.invoiceNumber()
            ));
        }

        BigDecimal subtotal = request.items().stream()
                .map(item -> item.unitPrice().multiply(item.quantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.1925));
        BigDecimal total = subtotal.add(tax);

        financeService.createTransaction(new OperationsDtos.FinanceTransactionRequest(
                "Sortie",
                "Achats",
                "Achat marchandises - Facture fournisseur " + request.invoiceNumber() + " (" + supplierName + ")",
                total,
                LocalDate.now(),
                request.invoiceNumber()
        ));
    }

    // ========== INVENTORY RECONCILIATION ==========

    public void reconcileInventory(OperationsDtos.InventoryReconciliationRequest request) {
        for (OperationsDtos.InventoryReconciliationItem entry : request.items()) {
            OperationsDtos.StockItemResponse item = getItem(entry.itemId());
            BigDecimal diff = entry.physicalQuantity().subtract(item.quantity());

            if (diff.compareTo(BigDecimal.ZERO) != 0) {
                String movementType = diff.compareTo(BigDecimal.ZERO) > 0 ? "ENTRY" : "EXIT";
                BigDecimal quantity = diff.abs();
                String reason = entry.reason() != null && !entry.reason().isBlank()
                        ? entry.reason()
                        : "Ajustement inventaire physique";

                stockRepository.createMovement(new OperationsDtos.StockMovementRequest(
                        item.id(),
                        movementType,
                        quantity,
                        reason,
                        request.reasonReference()
                ));
            }
        }
    }
}

