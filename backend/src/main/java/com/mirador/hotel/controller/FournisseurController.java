package com.mirador.hotel.controller;

import com.mirador.hotel.dto.FournisseurDtos;
import com.mirador.hotel.model.Fournisseur;
import com.mirador.hotel.repository.FournisseurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fournisseurs")
public class FournisseurController {

    private final FournisseurRepository fournisseurRepository;

    public FournisseurController(FournisseurRepository fournisseurRepository) {
        this.fournisseurRepository = fournisseurRepository;
    }

    @GetMapping
    public List<FournisseurDtos.FournisseurResponse> getAll() {
        return fournisseurRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public FournisseurDtos.FournisseurResponse getById(@PathVariable int id) {
        return fournisseurRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fournisseur non trouvé"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FournisseurDtos.FournisseurResponse create(@RequestBody FournisseurDtos.FournisseurRequest request) {
        Fournisseur fournisseur = new Fournisseur();
        fournisseur.setNumero(request.numero());
        fournisseur.setNom(request.nom());
        fournisseur.setContact(request.contact());
        fournisseur.setSolde(request.solde());
        
        Fournisseur saved = fournisseurRepository.save(fournisseur);
        return mapToResponse(saved);
    }

    @PutMapping("/{id}")
    public FournisseurDtos.FournisseurResponse update(@PathVariable int id, @RequestBody FournisseurDtos.FournisseurRequest request) {
        Fournisseur fournisseur = fournisseurRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fournisseur non trouvé"));
        
        fournisseur.setNumero(request.numero());
        fournisseur.setNom(request.nom());
        fournisseur.setContact(request.contact());
        fournisseur.setSolde(request.solde());
        
        Fournisseur saved = fournisseurRepository.save(fournisseur);
        return mapToResponse(saved);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable int id) {
        fournisseurRepository.deleteById(id);
    }

    private FournisseurDtos.FournisseurResponse mapToResponse(Fournisseur f) {
        return new FournisseurDtos.FournisseurResponse(
                f.getCodeFournisseur(),
                f.getNumero(),
                f.getNom(),
                f.getContact(),
                f.getSolde()
        );
    }
}
