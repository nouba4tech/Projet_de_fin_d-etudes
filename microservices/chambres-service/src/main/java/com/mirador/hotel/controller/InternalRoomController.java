package com.mirador.hotel.controller;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.InternalRoomRepository;
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
@RequestMapping("/internal/rooms")
public class InternalRoomController {

    private final InternalRoomRepository repository;

    public InternalRoomController(InternalRoomRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/summary")
    public RemoteApi.RoomsSummary summary() {
        return repository.summary();
    }

    @PostMapping("/types")
    public Map<String, String> types(@RequestBody List<String> codes) {
        return repository.typeLabels(codes);
    }

    @GetMapping("/{code}")
    public RemoteApi.RoomInfo room(@PathVariable String code) {
        return repository.findInfo(code)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable : " + code));
    }
}
