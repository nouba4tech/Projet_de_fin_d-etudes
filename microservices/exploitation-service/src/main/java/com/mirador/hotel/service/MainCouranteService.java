package com.mirador.hotel.service;

import com.mirador.hotel.dto.MainCouranteDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.MainCouranteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MainCouranteService {

    private final MainCouranteRepository mainCouranteRepository;

    public MainCouranteService(MainCouranteRepository mainCouranteRepository) {
        this.mainCouranteRepository = mainCouranteRepository;
    }

    @Transactional(readOnly = true)
    public List<MainCouranteDtos.MainCouranteResponse> getEntries() {
        return mainCouranteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public MainCouranteDtos.MainCouranteResponse getEntry(long id) {
        return mainCouranteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Entree main courante introuvable: " + id));
    }

    public MainCouranteDtos.MainCouranteResponse createEntry(MainCouranteDtos.MainCouranteRequest request) {
        long id = mainCouranteRepository.insert(request);
        return getEntry(id);
    }

    public MainCouranteDtos.MainCouranteResponse updateStatus(long id, String status) {
        getEntry(id);
        mainCouranteRepository.updateStatus(id, status);
        return getEntry(id);
    }

    public MainCouranteDtos.MainCouranteResponse resolveEntry(long id, MainCouranteDtos.MainCouranteResolveRequest request) {
        getEntry(id);
        mainCouranteRepository.resolve(id, request.resolution(), request.resolvedBy());
        return getEntry(id);
    }

    public void deleteEntry(long id) {
        getEntry(id);
        mainCouranteRepository.delete(id);
    }
}
