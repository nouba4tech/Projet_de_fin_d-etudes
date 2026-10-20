package com.mirador.hotel.service;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.MenuItemResponse> getMenuItems() {
        return restaurantRepository.findMenuItems();
    }

    @Transactional(readOnly = true)
    public OperationsDtos.MenuItemResponse getMenuItem(long menuItemId) {
        return restaurantRepository.findMenuItemById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Article menu introuvable: " + menuItemId));
    }

    public OperationsDtos.MenuItemResponse createMenuItem(OperationsDtos.MenuItemRequest request) {
        long menuItemId = restaurantRepository.createMenuItem(request);
        return getMenuItem(menuItemId);
    }

    public OperationsDtos.MenuItemResponse updateMenuItem(long menuItemId, OperationsDtos.MenuItemRequest request) {
        getMenuItem(menuItemId);
        restaurantRepository.updateMenuItem(menuItemId, request);
        return getMenuItem(menuItemId);
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.RestaurantOrderResponse> getOrders() {
        return restaurantRepository.findOrders();
    }

    @Transactional(readOnly = true)
    public OperationsDtos.RestaurantOrderResponse getOrder(long orderId) {
        return restaurantRepository.findOrderById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande restaurant introuvable: " + orderId));
    }

    public OperationsDtos.RestaurantOrderResponse createOrder(OperationsDtos.RestaurantOrderRequest request) {
        long orderId = restaurantRepository.createOrder(request);
        return getOrder(orderId);
    }

    public OperationsDtos.RestaurantOrderResponse updateOrderStatus(long orderId, String status) {
        getOrder(orderId);
        restaurantRepository.updateOrderStatus(orderId, status);
        return getOrder(orderId);
    }

    public void deleteOrder(long orderId) {
        getOrder(orderId);
        restaurantRepository.deleteOrder(orderId);
    }
}
