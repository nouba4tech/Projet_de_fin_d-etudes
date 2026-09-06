package com.mirador.hotel.controller;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.service.StockManagementService;
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
@RequestMapping("/api/stock")
public class StockController {

    private final StockManagementService stockManagementService;

    public StockController(StockManagementService stockManagementService) {
        this.stockManagementService = stockManagementService;
    }

    @GetMapping("/items")
    public List<OperationsDtos.StockItemResponse> getAllStock(
            @RequestParam(required = false) String scope) {
        return stockManagementService.getItems(scope);
    }

    @GetMapping("/items/{itemId}")
    public OperationsDtos.StockItemResponse getStockById(@PathVariable long itemId) {
        return stockManagementService.getItem(itemId);
    }

    @PostMapping("/items")
    public ResponseEntity<OperationsDtos.StockItemResponse> createStock(
            @Valid @RequestBody OperationsDtos.StockItemRequest request) {
        OperationsDtos.StockItemResponse item = stockManagementService.createItem(request);
        return ResponseEntity.created(URI.create("/api/stock/items/" + item.id())).body(item);
    }

    @PutMapping("/items/{itemId}")
    public OperationsDtos.StockItemResponse updateStock(
            @PathVariable long itemId,
            @Valid @RequestBody OperationsDtos.StockItemRequest request) {
        return stockManagementService.updateItem(itemId, request);
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteStock(@PathVariable long itemId) {
        stockManagementService.deleteItem(itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/movements")
    public List<OperationsDtos.StockMovementResponse> getMovements(
            @RequestParam(required = false) String scope) {
        return stockManagementService.getMovements(scope);
    }

    @PostMapping("/movements")
    public ResponseEntity<OperationsDtos.StockMovementResponse> createMovement(
            @Valid @RequestBody OperationsDtos.StockMovementRequest request) {
        OperationsDtos.StockMovementResponse movement = stockManagementService.createMovement(request);
        return ResponseEntity.created(URI.create("/api/stock/movements/" + movement.id())).body(movement);
    }

    // ========== TRANSFERS ==========

    @GetMapping("/transfers")
    public List<OperationsDtos.StockTransferResponse> getTransfers() {
        return stockManagementService.getTransfers();
    }

    @GetMapping("/transfers/{transferId}")
    public OperationsDtos.StockTransferResponse getTransferById(@PathVariable long transferId) {
        return stockManagementService.getTransfer(transferId);
    }

    @PostMapping("/transfers")
    public ResponseEntity<OperationsDtos.StockTransferResponse> createTransfer(
            @Valid @RequestBody OperationsDtos.StockTransferRequest request) {
        OperationsDtos.StockTransferResponse transfer = stockManagementService.createTransfer(request);
        return ResponseEntity.created(URI.create("/api/stock/transfers/" + transfer.id())).body(transfer);
    }

    // ========== SUPPLIER INVOICES ==========

    @GetMapping("/supplier-invoices")
    public List<OperationsDtos.SupplierInvoiceResponse> getSupplierInvoices() {
        return stockManagementService.getSupplierInvoices();
    }

    @GetMapping("/supplier-invoices/{invoiceId}")
    public OperationsDtos.SupplierInvoiceResponse getSupplierInvoiceById(@PathVariable long invoiceId) {
        return stockManagementService.getSupplierInvoice(invoiceId);
    }

    @PostMapping("/supplier-invoices")
    public ResponseEntity<OperationsDtos.SupplierInvoiceResponse> createSupplierInvoice(
            @Valid @RequestBody OperationsDtos.SupplierInvoiceRequest request) {
        OperationsDtos.SupplierInvoiceResponse invoice = stockManagementService.createSupplierInvoice(request);
        return ResponseEntity.created(URI.create("/api/stock/supplier-invoices/" + invoice.id())).body(invoice);
    }

    @PostMapping("/supplier-invoices/{invoiceId}/validate")
    public OperationsDtos.SupplierInvoiceResponse validateSupplierInvoice(@PathVariable long invoiceId) {
        return stockManagementService.validateSupplierInvoice(invoiceId);
    }

    @PostMapping("/supplier-invoices/{invoiceId}/pay")
    public OperationsDtos.SupplierInvoiceResponse markSupplierInvoicePaid(@PathVariable long invoiceId) {
        return stockManagementService.markSupplierInvoicePaid(invoiceId);
    }

    // ========== INVENTORY RECONCILIATION ==========

    @PostMapping("/inventory/reconcile")
    public ResponseEntity<Void> reconcileInventory(
            @Valid @RequestBody OperationsDtos.InventoryReconciliationRequest request) {
        stockManagementService.reconcileInventory(request);
        return ResponseEntity.ok().build();
    }
}

