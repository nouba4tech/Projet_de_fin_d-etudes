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

    // ===== CASH REGISTERS =====
    public List<ParametresDtos.CashRegisterResponse> listCashRegisters(String status) {
        return parametresRepository.findAllCashRegisters(status);
    }

    public ParametresDtos.CashRegisterResponse getCashRegister(String id) {
        return parametresRepository.findCashRegisterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caisse introuvable."));
    }

    public ParametresDtos.CashRegisterResponse createCashRegister(ParametresDtos.CashRegisterRequest request) {
        int id = parametresRepository.createCashRegister(request);
        return parametresRepository.findCashRegisterById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Caisse creee introuvable."));
    }

    public ParametresDtos.CashRegisterResponse updateCashRegister(String id, ParametresDtos.CashRegisterRequest request) {
        parametresRepository.findCashRegisterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caisse introuvable."));
        parametresRepository.updateCashRegister(id, request);
        return parametresRepository.findCashRegisterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caisse mise a jour introuvable."));
    }

    public void deleteCashRegister(String id) {
        parametresRepository.findCashRegisterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caisse introuvable."));
        parametresRepository.deleteCashRegister(id);
    }
}
