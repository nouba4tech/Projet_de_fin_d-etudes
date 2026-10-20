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

    // ===== PERSONNEL =====
    @GetMapping("/personnel")
    public ResponseEntity<List<ParametresDtos.PersonnelResponse>> listPersonnel(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(parametresService.listPersonnel(status));
    }

    @GetMapping("/personnel/{id}")
    public ResponseEntity<ParametresDtos.PersonnelResponse> getPersonnel(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getPersonnel(id));
    }

    @PostMapping("/personnel")
    public ResponseEntity<ParametresDtos.PersonnelResponse> createPersonnel(
            @Valid @RequestBody ParametresDtos.PersonnelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createPersonnel(request));
    }

    @PutMapping("/personnel/{id}")
    public ResponseEntity<ParametresDtos.PersonnelResponse> updatePersonnel(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.PersonnelRequest request) {
        return ResponseEntity.ok(parametresService.updatePersonnel(id, request));
    }

    @DeleteMapping("/personnel/{id}")
    public ResponseEntity<Void> deletePersonnel(@PathVariable String id) {
        parametresService.deletePersonnel(id);
        return ResponseEntity.noContent().build();
    }
}
