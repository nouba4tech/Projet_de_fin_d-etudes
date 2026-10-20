package com.mirador.hotel.service;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.GuestServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GuestServiceManagementService {

    private final GuestServiceRepository guestServiceRepository;

    public GuestServiceManagementService(GuestServiceRepository guestServiceRepository) {
        this.guestServiceRepository = guestServiceRepository;
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.GuestServiceResponse> getServices() {
        return guestServiceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public OperationsDtos.GuestServiceResponse getService(long serviceId) {
        return guestServiceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service annexe introuvable: " + serviceId));
    }

    public OperationsDtos.GuestServiceResponse createService(OperationsDtos.GuestServiceRequest request) {
        long serviceId = guestServiceRepository.create(request);
        return getService(serviceId);
    }

    public OperationsDtos.GuestServiceResponse updateService(long serviceId, OperationsDtos.GuestServiceRequest request) {
        getService(serviceId);
        guestServiceRepository.update(serviceId, request);
        return getService(serviceId);
    }

    public void deleteService(long serviceId) {
        getService(serviceId);
        guestServiceRepository.delete(serviceId);
    }
}
