package com.mirador.hotel.controller;

import com.mirador.hotel.dto.MainCouranteDtos;
import com.mirador.hotel.service.MainCouranteService;
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
@RequestMapping("/api/main-courante")
public class MainCouranteController {

    private final MainCouranteService mainCouranteService;

    public MainCouranteController(MainCouranteService mainCouranteService) {
        this.mainCouranteService = mainCouranteService;
    }

    @GetMapping
    public List<MainCouranteDtos.MainCouranteResponse> getAllEntries() {
        return mainCouranteService.getEntries();
    }

    @GetMapping("/{id}")
    public MainCouranteDtos.MainCouranteResponse getEntryById(@PathVariable long id) {
        return mainCouranteService.getEntry(id);
    }

    @PostMapping
    public ResponseEntity<MainCouranteDtos.MainCouranteResponse> createEntry(
            @Valid @RequestBody MainCouranteDtos.MainCouranteRequest request) {
        MainCouranteDtos.MainCouranteResponse entry = mainCouranteService.createEntry(request);
        return ResponseEntity.created(URI.create("/api/main-courante/" + entry.id())).body(entry);
    }

    @PutMapping("/{id}/status")
    public MainCouranteDtos.MainCouranteResponse updateStatus(
            @PathVariable long id,
            @Valid @RequestBody MainCouranteDtos.MainCouranteStatusRequest request) {
        return mainCouranteService.updateStatus(id, request.status());
    }

    @PostMapping("/{id}/resolve")
    public MainCouranteDtos.MainCouranteResponse resolveEntry(
            @PathVariable long id,
            @RequestBody MainCouranteDtos.MainCouranteResolveRequest request) {
        return mainCouranteService.resolveEntry(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable long id) {
        mainCouranteService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }
}
