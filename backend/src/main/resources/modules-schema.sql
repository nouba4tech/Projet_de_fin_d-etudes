-- Tables of the modules taken from the microservices (promotions, avis, notifications, facturation, paiements).
-- Copied from their schema.sql; run at startup by ModulesSchemaInitializer. Idempotent.

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

CREATE TABLE IF NOT EXISTS app_invoice_meta (
    code_facture VARCHAR(20) NOT NULL PRIMARY KEY,
    statut VARCHAR(30) NOT NULL DEFAULT 'EMISE',
    archived_at DATETIME NULL,
    archived_by VARCHAR(120) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS app_invoice_event (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_facture VARCHAR(20) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    detail VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_invoice_event_code (code_facture)
);

CREATE TABLE IF NOT EXISTS reglement (
    code_reg VARCHAR(20) NOT NULL PRIMARY KEY,
    code_facture TEXT,
    code_client INT,
    date_reglement DATETIME,
    montant DOUBLE,
    libelle VARCHAR(100),
    type_reg TEXT,
    code_caisse INT,
    letype TINYTEXT,
    code_fournisseur INT,
    code_personnel INT,
    code_depot INT
);

CREATE TABLE IF NOT EXISTS app_finance_transaction (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    transaction_type VARCHAR(60) NOT NULL,
    category_name VARCHAR(120) NOT NULL,
    description_text TEXT NOT NULL,
    amount_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    transaction_date DATE NOT NULL,
    reference_code VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paiement (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(40) NOT NULL UNIQUE,
    invoice_code VARCHAR(20) NOT NULL,
    client_id BIGINT NULL,
    amount DECIMAL(14,2) NOT NULL,
    method VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    failure_reason VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_paiement_invoice (invoice_code)
);

CREATE TABLE IF NOT EXISTS saga_execution (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    saga_type VARCHAR(60) NOT NULL,
    status VARCHAR(30) NOT NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME NULL,
    INDEX idx_saga_payment (payment_id)
);

CREATE TABLE IF NOT EXISTS saga_step (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    execution_id BIGINT NOT NULL,
    step_name VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL,
    detail VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_saga_step_exec (execution_id)
);

