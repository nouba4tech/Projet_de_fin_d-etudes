package com.mirador.hotel.controller;

import com.mirador.hotel.dto.NotificationDtos;
import com.mirador.hotel.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Service-to-service API (not routed by the gateway, guarded by X-Internal-Token). */
@RestController
@RequestMapping("/internal/notifications")
public class InternalNotificationController {

    private final NotificationService notificationService;

    public InternalNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<NotificationDtos.NotificationResponse> send(@RequestBody NotificationDtos.SendRequest request) {
        NotificationService.Outcome outcome = notificationService.send(request);
        return ResponseEntity.status(outcome.created() ? HttpStatus.CREATED : HttpStatus.OK).body(outcome.notification());
    }
}
