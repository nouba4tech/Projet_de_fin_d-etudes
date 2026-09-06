package com.mirador.hotel.controller;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.service.RestaurantService;
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
@RequestMapping("/api/restaurant")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/menu")
    public List<OperationsDtos.MenuItemResponse> getMenuItems() {
        return restaurantService.getMenuItems();
    }

    @GetMapping("/menu/{menuItemId}")
    public OperationsDtos.MenuItemResponse getMenuItem(@PathVariable long menuItemId) {
        return restaurantService.getMenuItem(menuItemId);
    }

    @PostMapping("/menu")
    public ResponseEntity<OperationsDtos.MenuItemResponse> createMenuItem(
            @Valid @RequestBody OperationsDtos.MenuItemRequest request) {
        OperationsDtos.MenuItemResponse item = restaurantService.createMenuItem(request);
        return ResponseEntity.created(URI.create("/api/restaurant/menu/" + item.id())).body(item);
    }

    @PutMapping("/menu/{menuItemId}")
    public OperationsDtos.MenuItemResponse updateMenuItem(
            @PathVariable long menuItemId,
            @Valid @RequestBody OperationsDtos.MenuItemRequest request) {
        return restaurantService.updateMenuItem(menuItemId, request);
    }

    @GetMapping("/orders")
    public List<OperationsDtos.RestaurantOrderResponse> getAllOrders() {
        return restaurantService.getOrders();
    }

    @GetMapping("/orders/{orderId}")
    public OperationsDtos.RestaurantOrderResponse getOrderById(@PathVariable long orderId) {
        return restaurantService.getOrder(orderId);
    }

    @PostMapping("/orders")
    public ResponseEntity<OperationsDtos.RestaurantOrderResponse> createOrder(
            @Valid @RequestBody OperationsDtos.RestaurantOrderRequest request) {
        OperationsDtos.RestaurantOrderResponse order = restaurantService.createOrder(request);
        return ResponseEntity.created(URI.create("/api/restaurant/orders/" + order.id())).body(order);
    }

    @PutMapping("/orders/{orderId}/status")
    public OperationsDtos.RestaurantOrderResponse updateOrderStatus(
            @PathVariable long orderId,
            @RequestParam String status) {
        return restaurantService.updateOrderStatus(orderId, status);
    }

    @DeleteMapping("/orders/{orderId}")
    public ResponseEntity<Void> deleteOrder(@PathVariable long orderId) {
        restaurantService.deleteOrder(orderId);
        return ResponseEntity.noContent().build();
    }
}
