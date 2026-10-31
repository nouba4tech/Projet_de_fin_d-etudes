package com.mirador.hotel.controller;

import com.mirador.hotel.dto.IdentityDtos;
import com.mirador.hotel.repository.SecurityAuditRepository;
import com.mirador.hotel.service.IdentityVerificationService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/** Access limited to Admin and Reception by SecurityConfig (reads included); decisions to Admin. */
@RestController
@RequestMapping("/api/identity-verifications")
public class IdentityVerificationController {

    private final IdentityVerificationService service;
    private final SecurityAuditRepository audit;

    public IdentityVerificationController(IdentityVerificationService service, SecurityAuditRepository audit) {
        this.service = service;
        this.audit = audit;
    }

    @PostMapping
    public ResponseEntity<IdentityDtos.VerificationResponse> create(@Valid @RequestBody IdentityDtos.VerificationRequest request) {
        IdentityDtos.VerificationResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/identity-verifications/" + created.id())).body(created);
    }

    @GetMapping
    public List<IdentityDtos.VerificationResponse> list(@RequestParam(required = false) Long clientId) {
        return service.list(clientId);
    }

    @GetMapping("/{id}")
    public IdentityDtos.VerificationResponse get(@PathVariable long id) {
        return service.get(id);
    }

    /** part: recto, verso or selfie. Never cached, never served from a public URL. */
    @GetMapping("/{id}/documents/{part}")
    public ResponseEntity<byte[]> document(@PathVariable long id, @PathVariable String part) {
        byte[] image = service.document(id, part);
        boolean png = image.length > 1 && (image[0] & 0xFF) == 0x89;
        return ResponseEntity.ok()
                .contentType(png ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(image);
    }

    @PostMapping("/{id}/result")
    public IdentityDtos.VerificationResponse result(@PathVariable long id, @RequestBody IdentityDtos.ResultRequest request) {
        return service.submitResult(id, request);
    }

    @PostMapping("/{id}/decision")
    public IdentityDtos.VerificationResponse decide(@PathVariable long id, @Valid @RequestBody IdentityDtos.DecisionRequest request) {
        return service.decide(id, request);
    }

    @GetMapping("/audit")
    public List<IdentityDtos.AuditEntry> audit(@RequestParam(defaultValue = "100") int limit) {
        return audit.latest(Math.max(1, Math.min(limit, 500)));
    }
}
