-- Schema of notifications-service (database mirador_notifications). Idempotent.

CREATE TABLE IF NOT EXISTS notification (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    channel VARCHAR(10) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    template_code VARCHAR(60) NULL,
    reference_key VARCHAR(120) NULL,
    subject VARCHAR(255) NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    UNIQUE KEY uq_notification_dedup (template_code, recipient, reference_key)
);
