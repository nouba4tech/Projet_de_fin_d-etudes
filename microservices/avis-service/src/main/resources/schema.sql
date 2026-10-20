-- Schema of avis-service (database mirador_avis). Idempotent.

CREATE TABLE IF NOT EXISTS avis (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    reservation_id BIGINT NULL,
    rating INT NOT NULL,
    title VARCHAR(150) NULL,
    comment_text TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    flagged TINYINT(1) NOT NULL DEFAULT 0,
    moderation_comment VARCHAR(500) NULL,
    moderated_by VARCHAR(120) NULL,
    moderated_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_avis_status (status),
    INDEX idx_avis_client (client_id)
);
