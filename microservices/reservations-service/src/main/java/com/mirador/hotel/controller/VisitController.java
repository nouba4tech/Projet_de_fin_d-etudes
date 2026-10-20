package com.mirador.hotel.controller;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.service.VisitService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitService visitService;

    public VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    @GetMapping
    public List<OperationsDtos.VisitResponse> getAllVisits() {
        return visitService.getVisits();
    }

    @GetMapping("/{id}")
    public OperationsDtos.VisitResponse getVisitById(@PathVariable long id) {
        return visitService.getVisit(id);
    }

    @PostMapping
    public ResponseEntity<OperationsDtos.VisitResponse> createVisit(@Valid @RequestBody OperationsDtos.VisitRequest request) {
        OperationsDtos.VisitResponse visit = visitService.createVisit(request);
        return ResponseEntity.created(URI.create("/api/visits/" + visit.id())).body(visit);
    }

    @PutMapping("/{id}")
    public OperationsDtos.VisitResponse updateVisit(@PathVariable long id, @Valid @RequestBody OperationsDtos.VisitRequest request) {
        return visitService.updateVisit(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVisit(@PathVariable long id) {
        visitService.deleteVisit(id);
        return ResponseEntity.noContent().build();
    }
}
