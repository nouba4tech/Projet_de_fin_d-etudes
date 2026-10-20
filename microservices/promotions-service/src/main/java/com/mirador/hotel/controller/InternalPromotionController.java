package com.mirador.hotel.controller;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.service.PromotionService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/** Service-to-service API (not routed by the gateway, guarded by X-Internal-Token). */
@RestController
@RequestMapping("/internal/promotions")
public class InternalPromotionController {

    public record ApplyRequest(String code, BigDecimal amount) {
    }

    private final PromotionService promotionService;

    public InternalPromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    /** Called by reservations-service when a booking carries a promo code. */
    @PostMapping("/apply")
    public RemoteApi.PromotionResult apply(@RequestBody ApplyRequest request) {
        return promotionService.apply(request.code(), request.amount());
    }
}
