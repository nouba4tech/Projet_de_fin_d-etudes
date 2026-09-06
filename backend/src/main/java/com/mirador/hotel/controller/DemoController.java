package com.mirador.hotel.controller;

import com.mirador.hotel.service.DemoSeedService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    private final DemoSeedService demoSeedService;

    public DemoController(DemoSeedService demoSeedService) {
        this.demoSeedService = demoSeedService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(demoSeedService.status());
    }

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seed() {
        return ResponseEntity.ok(demoSeedService.seedDemoData());
    }
}
