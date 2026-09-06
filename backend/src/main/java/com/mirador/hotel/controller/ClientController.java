package com.mirador.hotel.controller;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.service.ClientService;
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
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public List<HotelDtos.ClientResponse> getAllClients() {
        return clientService.getClients();
    }

    @GetMapping("/{clientId}")
    public HotelDtos.ClientResponse getClientById(@PathVariable long clientId) {
        return clientService.getClient(clientId);
    }

    @PostMapping
    public ResponseEntity<HotelDtos.ClientResponse> createClient(@RequestBody HotelDtos.ClientRequest request) {
        HotelDtos.ClientResponse client = clientService.createClient(request);
        return ResponseEntity.created(URI.create("/api/clients/" + client.id())).body(client);
    }

    @PutMapping("/{clientId}")
    public HotelDtos.ClientResponse updateClient(@PathVariable long clientId, @RequestBody HotelDtos.ClientRequest request) {
        return clientService.updateClient((Long) clientId, request);
    }

    @DeleteMapping("/{clientId}")
    public ResponseEntity<Void> deleteClient(@PathVariable long clientId) {
        clientService.deleteClient((Long) clientId);
        return ResponseEntity.noContent().build();
    }
}
