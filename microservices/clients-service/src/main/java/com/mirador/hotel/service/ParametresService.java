package com.mirador.hotel.service;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.ParametresRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ParametresService {

    private final ParametresRepository parametresRepository;

    public ParametresService(ParametresRepository parametresRepository) {
        this.parametresRepository = parametresRepository;
    }

    // ===== CLIENTS =====
    public List<ParametresDtos.ClientParametreResponse> listClients(String status) {
        return parametresRepository.findAllClients(status);
    }

    public ParametresDtos.ClientParametreResponse getClient(String id) {
        return parametresRepository.findClientById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable."));
    }

    public ParametresDtos.ClientParametreResponse createClient(ParametresDtos.ClientParametreRequest request) {
        long id = parametresRepository.createClient(request);
        return parametresRepository.findClientById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Client cree introuvable."));
    }

    public ParametresDtos.ClientParametreResponse updateClient(String id, ParametresDtos.ClientParametreRequest request) {
        parametresRepository.findClientById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable."));
        parametresRepository.updateClient(id, request);
        return parametresRepository.findClientById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client mis a jour introuvable."));
    }

    public void deleteClient(String id) {
        parametresRepository.findClientById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable."));
        parametresRepository.deleteClient(id);
    }
}
