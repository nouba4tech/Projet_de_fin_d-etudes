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

    // ===== PERSONNEL =====
    public List<ParametresDtos.PersonnelResponse> listPersonnel(String status) {
        return parametresRepository.findAllPersonnel(status);
    }

    public ParametresDtos.PersonnelResponse getPersonnel(String id) {
        return parametresRepository.findPersonnelById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel introuvable."));
    }

    public ParametresDtos.PersonnelResponse createPersonnel(ParametresDtos.PersonnelRequest request) {
        long id = parametresRepository.createPersonnel(request);
        return parametresRepository.findPersonnelById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Personnel cree introuvable."));
    }

    public ParametresDtos.PersonnelResponse updatePersonnel(String id, ParametresDtos.PersonnelRequest request) {
        parametresRepository.findPersonnelById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel introuvable."));
        parametresRepository.updatePersonnel(id, request);
        return parametresRepository.findPersonnelById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel mis a jour introuvable."));
    }

    public void deletePersonnel(String id) {
        parametresRepository.findPersonnelById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel introuvable."));
        parametresRepository.deletePersonnel(id);
    }
}
