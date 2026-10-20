package com.mirador.hotel.service;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.BarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BarService {

    private final BarRepository barRepository;

    public BarService(BarRepository barRepository) {
        this.barRepository = barRepository;
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.BarProductResponse> getProducts() {
        return barRepository.findAllProducts();
    }

    @Transactional(readOnly = true)
    public OperationsDtos.BarProductResponse getProduct(long productId) {
        return barRepository.findProductById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit bar introuvable: " + productId));
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.BarMovementResponse> getMovements(long productId) {
        getProduct(productId);
        return barRepository.findMovements(productId);
    }

    public OperationsDtos.BarProductResponse createProduct(OperationsDtos.BarProductRequest request) {
        long productId = barRepository.createProduct(request);
        return getProduct(productId);
    }

    public OperationsDtos.BarProductResponse updateProduct(long productId, OperationsDtos.BarProductRequest request) {
        getProduct(productId);
        barRepository.updateProduct(productId, request);
        return getProduct(productId);
    }

    public OperationsDtos.BarMovementResponse createMovement(long productId, OperationsDtos.BarMovementRequest request) {
        getProduct(productId);
        long movementId = barRepository.createMovement(productId, request);
        return barRepository.findMovements(productId).stream()
                .filter(movement -> movement.id().equals(movementId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Mouvement bar introuvable: " + movementId));
    }
}
