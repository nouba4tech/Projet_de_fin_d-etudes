package com.mirador.hotel.controller;

import com.mirador.hotel.dto.NotificationDtos;
import com.mirador.hotel.model.Templates;
import com.mirador.hotel.service.NotificationService;
import com.mirador.hotel.service.ReminderService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** E-mails and SMS: manual sending, history, retry and reminders. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final ReminderService reminderService;

    public NotificationController(NotificationService notificationService, ReminderService reminderService) {
        this.notificationService = notificationService;
        this.reminderService = reminderService;
    }

    /** 201 when sent now, 200 when the same notification (template + recipient + reference) already exists. */
    @PostMapping
    public ResponseEntity<NotificationDtos.NotificationResponse> send(@Valid @RequestBody NotificationDtos.SendRequest request) {
        NotificationService.Outcome outcome = notificationService.send(request);
        return ResponseEntity.status(outcome.created() ? HttpStatus.CREATED : HttpStatus.OK).body(outcome.notification());
    }

    @GetMapping
    public List<NotificationDtos.NotificationResponse> list(@RequestParam(required = false) String status,
                                                            @RequestParam(required = false) String channel,
                                                            @RequestParam(defaultValue = "100") int limit) {
        return notificationService.list(status, channel, limit);
    }

    @GetMapping("/templates")
    public Set<String> templates() {
        return Templates.CATALOG.keySet();
    }

    @GetMapping("/{id}")
    public NotificationDtos.NotificationResponse get(@PathVariable long id) {
        return notificationService.get(id);
    }

    @PostMapping("/{id}/retry")
    public NotificationDtos.NotificationResponse retry(@PathVariable long id) {
        return notificationService.retry(id);
    }

    /** Runs the reminder job now (default: guests arriving tomorrow). */
    @PostMapping("/reminders/run")
    public NotificationDtos.ReminderResult runReminders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reminderService.sendArrivalReminders(date == null ? LocalDate.now().plusDays(1) : date);
    }
}
