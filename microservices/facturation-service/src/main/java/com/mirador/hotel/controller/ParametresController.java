package com.mirador.hotel.controller;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.service.ParametresService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parametres")
public class ParametresController {

    private final ParametresService parametresService;

    public ParametresController(ParametresService parametresService) {
        this.parametresService = parametresService;
    }

    // ===== CASH REGISTERS =====
    @GetMapping("/cash-registers")
    public ResponseEntity<List<ParametresDtos.CashRegisterResponse>> listCashRegisters(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(parametresService.listCashRegisters(status));
    }

    @GetMapping("/cash-registers/{id}")
    public ResponseEntity<ParametresDtos.CashRegisterResponse> getCashRegister(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getCashRegister(id));
    }

    @PostMapping("/cash-registers")
    public ResponseEntity<ParametresDtos.CashRegisterResponse> createCashRegister(
            @Valid @RequestBody ParametresDtos.CashRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createCashRegister(request));
    }

    @PutMapping("/cash-registers/{id}")
    public ResponseEntity<ParametresDtos.CashRegisterResponse> updateCashRegister(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.CashRegisterRequest request) {
        return ResponseEntity.ok(parametresService.updateCashRegister(id, request));
    }

    @DeleteMapping("/cash-registers/{id}")
    public ResponseEntity<Void> deleteCashRegister(@PathVariable String id) {
        parametresService.deleteCashRegister(id);
        return ResponseEntity.noContent().build();
    }
}
