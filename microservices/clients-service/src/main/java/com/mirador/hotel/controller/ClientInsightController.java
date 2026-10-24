package com.mirador.hotel.controller;

import com.mirador.hotel.dto.ClientInsightDtos;
import com.mirador.hotel.service.ClientInsightService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clients")
public class ClientInsightController {

    private final ClientInsightService insightService;

    public ClientInsightController(ClientInsightService insightService) {
        this.insightService = insightService;
    }

    @GetMapping("/{clientId}/historique")
    public ClientInsightDtos.History history(@PathVariable long clientId) {
        return insightService.history(clientId);
    }

    @GetMapping("/{clientId}/fidelite")
    public ClientInsightDtos.Loyalty loyalty(@PathVariable long clientId) {
        return insightService.loyalty(clientId);
    }
}
