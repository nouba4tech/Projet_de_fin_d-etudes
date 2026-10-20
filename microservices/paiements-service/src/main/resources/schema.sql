-- Schema of paiements-service (database mirador_paiements). Idempotent.

CREATE TABLE IF NOT EXISTS app_cash_register_state (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    scope_name VARCHAR(60) NOT NULL,
    register_number VARCHAR(120) NOT NULL,
    opening_balance DECIMAL(12, 2) DEFAULT 0,
    current_balance DECIMAL(12, 2) DEFAULT 0,
    cash_in DECIMAL(12, 2) DEFAULT 0,
    cash_out DECIMAL(12, 2) DEFAULT 0,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    status_label VARCHAR(30) DEFAULT 'closed',
    opened_by VARCHAR(120),
    closed_by VARCHAR(120),
    opened_at DATETIME,
    closed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_app_cash_register_scope_number (scope_name, register_number)
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

CREATE TABLE IF NOT EXISTS transaction (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS lems (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS letransfert (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

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
