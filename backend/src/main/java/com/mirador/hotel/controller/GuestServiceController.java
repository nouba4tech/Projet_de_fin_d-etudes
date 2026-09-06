package com.mirador.hotel.controller;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.service.GuestServiceManagementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/services")
public class GuestServiceController {

    private final GuestServiceManagementService guestServiceManagementService;

    public GuestServiceController(GuestServiceManagementService guestServiceManagementService) {
        this.guestServiceManagementService = guestServiceManagementService;
    }

    @GetMapping
    public List<OperationsDtos.GuestServiceResponse> getAllServices() {
        return guestServiceManagementService.getServices();
    }

    @GetMapping("/{serviceId}")
    public OperationsDtos.GuestServiceResponse getServiceById(@PathVariable long serviceId) {
        return guestServiceManagementService.getService(serviceId);
    }

    @PostMapping
    public ResponseEntity<OperationsDtos.GuestServiceResponse> createService(
            @Valid @RequestBody OperationsDtos.GuestServiceRequest request) {
        OperationsDtos.GuestServiceResponse service = guestServiceManagementService.createService(request);
        return ResponseEntity.created(URI.create("/api/services/" + service.id())).body(service);
    }

    @PutMapping("/{serviceId}")
    public OperationsDtos.GuestServiceResponse updateService(
            @PathVariable long serviceId,
            @Valid @RequestBody OperationsDtos.GuestServiceRequest request) {
        return guestServiceManagementService.updateService(serviceId, request);
    }

    @DeleteMapping("/{serviceId}")
    public ResponseEntity<Void> deleteService(@PathVariable long serviceId) {
        guestServiceManagementService.deleteService(serviceId);
        return ResponseEntity.noContent().build();
    }
}
