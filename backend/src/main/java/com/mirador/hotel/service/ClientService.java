package com.mirador.hotel.service;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.ClientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @Transactional(readOnly = true)
    public List<HotelDtos.ClientResponse> getClients() {
        return clientRepository.findAll();
    }

    @Transactional(readOnly = true)
    public HotelDtos.ClientResponse getClient(long clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable: " + clientId));
    }

    public HotelDtos.ClientResponse createClient(HotelDtos.ClientRequest request) {
        long clientId = clientRepository.create(request);
        return getClient(clientId);
    }

    public HotelDtos.ClientResponse updateClient(long clientId, HotelDtos.ClientRequest request) {
        getClient(clientId);
        clientRepository.update(clientId, request);
        return getClient(clientId);
    }

    public void deleteClient(long clientId) {
        getClient(clientId);
        clientRepository.delete(clientId);
    }
}
