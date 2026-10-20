package com.mirador.hotel.controller;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.service.BarService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/bar")
public class BarController {

    private final BarService barService;

    public BarController(BarService barService) {
        this.barService = barService;
    }

    @GetMapping("/products")
    public List<OperationsDtos.BarProductResponse> getProducts() {
        return barService.getProducts();
    }

    @GetMapping("/products/{productId}")
    public OperationsDtos.BarProductResponse getProduct(@PathVariable long productId) {
        return barService.getProduct(productId);
    }

    @PostMapping("/products")
    public ResponseEntity<OperationsDtos.BarProductResponse> createProduct(
            @Valid @RequestBody OperationsDtos.BarProductRequest request) {
        OperationsDtos.BarProductResponse product = barService.createProduct(request);
        return ResponseEntity.created(URI.create("/api/bar/products/" + product.id())).body(product);
    }

    @PutMapping("/products/{productId}")
    public OperationsDtos.BarProductResponse updateProduct(
            @PathVariable long productId,
            @Valid @RequestBody OperationsDtos.BarProductRequest request) {
        return barService.updateProduct(productId, request);
    }

    @GetMapping("/products/{productId}/movements")
    public List<OperationsDtos.BarMovementResponse> getMovements(@PathVariable long productId) {
        return barService.getMovements(productId);
    }

    @PostMapping("/products/{productId}/movements")
    public ResponseEntity<OperationsDtos.BarMovementResponse> createMovement(
            @PathVariable long productId,
            @Valid @RequestBody OperationsDtos.BarMovementRequest request) {
        OperationsDtos.BarMovementResponse movement = barService.createMovement(productId, request);
        return ResponseEntity.created(URI.create("/api/bar/products/" + productId + "/movements/" + movement.id()))
                .body(movement);
    }
}
