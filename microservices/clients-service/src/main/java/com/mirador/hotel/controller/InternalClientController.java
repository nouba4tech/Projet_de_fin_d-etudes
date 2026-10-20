package com.mirador.hotel.controller;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.InternalClientRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Service-to-service API (not routed by the gateway, guarded by X-Internal-Token). */
@RestController
@RequestMapping("/internal/clients")
public class InternalClientController {

    private final InternalClientRepository repository;

    public InternalClientController(InternalClientRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/count")
    public long count() {
        return repository.count();
    }

    @PostMapping("/lookup")
    public Map<String, RemoteApi.ClientInfo> lookup(@RequestBody List<Long> ids) {
        return repository.lookup(ids);
    }

    @GetMapping("/{id}")
    public RemoteApi.ClientInfo client(@PathVariable long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + id));
    }
}
