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

    // ===== CLIENTS =====
    @GetMapping("/clients")
    public ResponseEntity<List<ParametresDtos.ClientParametreResponse>> listClients(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(parametresService.listClients(status));
    }

    @GetMapping("/clients/{id}")
    public ResponseEntity<ParametresDtos.ClientParametreResponse> getClient(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getClient(id));
    }

    @PostMapping("/clients")
    public ResponseEntity<ParametresDtos.ClientParametreResponse> createClient(
            @Valid @RequestBody ParametresDtos.ClientParametreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createClient(request));
    }

    @PutMapping("/clients/{id}")
    public ResponseEntity<ParametresDtos.ClientParametreResponse> updateClient(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.ClientParametreRequest request) {
        return ResponseEntity.ok(parametresService.updateClient(id, request));
    }

    @DeleteMapping("/clients/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable String id) {
        parametresService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }
}
