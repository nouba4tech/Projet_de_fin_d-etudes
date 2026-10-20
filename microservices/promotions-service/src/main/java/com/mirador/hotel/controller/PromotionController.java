package com.mirador.hotel.controller;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.PromotionDtos;
import com.mirador.hotel.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Tariff promotions (promo codes). */
@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    /** {@code ?active=true} keeps only the promotions that can be used today. */
    @GetMapping
    public List<PromotionDtos.PromotionResponse> list(@RequestParam(name = "active", required = false) Boolean active) {
        return promotionService.list(active);
    }

    @GetMapping("/{id}")
    public PromotionDtos.PromotionResponse get(@PathVariable long id) {
        return promotionService.get(id);
    }

    @PostMapping
    public ResponseEntity<PromotionDtos.PromotionResponse> create(@Valid @RequestBody PromotionDtos.PromotionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionService.create(request));
    }

    @PutMapping("/{id}")
    public PromotionDtos.PromotionResponse update(@PathVariable long id, @Valid @RequestBody PromotionDtos.PromotionRequest request) {
        return promotionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        promotionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Preview the effect of a code on an amount (does not consume a use). */
    @PostMapping("/validate")
    public RemoteApi.PromotionResult validate(@Valid @RequestBody PromotionDtos.ValidateRequest request) {
        return promotionService.validate(request.code(), request.amount());
    }
}
