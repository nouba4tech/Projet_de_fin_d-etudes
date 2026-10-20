-- Schema of promotions-service (database mirador_promotions). Idempotent.

CREATE TABLE IF NOT EXISTS promotion (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    libelle VARCHAR(150) NOT NULL,
    discount_type VARCHAR(10) NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL,
    min_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
