package com.mirador.hotel.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/** Every morning, reminds the guests who arrive the next day. Disable with notifications.reminders.enabled=false. */
@Component
@ConditionalOnProperty(name = "notifications.reminders.enabled", havingValue = "true", matchIfMissing = true)
public class ArrivalReminderJob {

    private static final Logger log = LoggerFactory.getLogger(ArrivalReminderJob.class);

    private final ReminderService reminderService;

    public ArrivalReminderJob(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @Scheduled(cron = "${notifications.reminders.cron:0 0 8 * * *}", zone = "Africa/Lagos")
    public void run() {
        try {
            log.info("rappels d'arrivee : {}", reminderService.sendArrivalReminders(LocalDate.now().plusDays(1)));
        } catch (RuntimeException ex) {
            log.warn("rappels d'arrivee impossibles : {}", ex.getMessage());
        }
    }
}
