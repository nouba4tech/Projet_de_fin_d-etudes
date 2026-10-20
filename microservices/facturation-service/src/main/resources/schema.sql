-- Schema of facturation-service (database mirador_facturation). Idempotent.

CREATE TABLE IF NOT EXISTS plan_comptable (
    numero VARCHAR(20) NOT NULL PRIMARY KEY,
    libelle_plan VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS lescompte (
    numcompte VARCHAR(30) NOT NULL PRIMARY KEY,
    numero VARCHAR(20),
    libelle_compte VARCHAR(255),
    solde DECIMAL(18, 2) DEFAULT 0,
    cumul_depot DECIMAL(18, 2) DEFAULT 0,
    cumul_retrait DECIMAL(18, 2) DEFAULT 0,
    type_compte VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS account_plan (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    class_name VARCHAR(50),
    balance DECIMAL(18, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Actif',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS caisse (
    code_caisse INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(30),
    libelle VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS operation (
    code_op BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date_op DATETIME,
    heure_op DATETIME,
    numcompte VARCHAR(30),
    credit DECIMAL(18, 2) DEFAULT 0,
    debit DECIMAL(18, 2) DEFAULT 0,
    type_operation VARCHAR(50),
    num_transaction DECIMAL(20,0),
    numpiece TEXT,
    libelle TEXT,
    codejournal TEXT,
    code_depot INT
);

CREATE TABLE IF NOT EXISTS accounting_operations (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date_operation DATETIME NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    journal_code VARCHAR(20),
    libelle VARCHAR(255),
    debit DECIMAL(18, 2) DEFAULT 0,
    credit DECIMAL(18, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Validé',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_book (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date_entry DATE NOT NULL,
    libelle VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20),
    reference VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compte_boisson (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_caisse (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_client (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_divers (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_facture (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_fournisseur (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_personnel (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_plat (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_reglement (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_service (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_type_chambre (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS compte_vivre (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS facture (
    code_facture VARCHAR(20) NOT NULL PRIMARY KEY,
    code_client INT,
    date_facture DATETIME DEFAULT CURRENT_TIMESTAMP,
    remise DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    net DECIMAL(12, 2) DEFAULT 0,
    code_fournisseur INT,
    code_depot INT,
    total_paye DECIMAL(12, 2) DEFAULT 0,
    paye INT
);

CREATE TABLE IF NOT EXISTS detail_facture (
    code_detail INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_facture VARCHAR(20),
    service VARCHAR(50),
    reference INT,
    pu DECIMAL(12, 2),
    libelle VARCHAR(100),
    qte INT,
    total DECIMAL(12, 2),
    date_detail DATETIME,
    code_depot INT
);

CREATE TABLE IF NOT EXISTS depot (
    code_depot INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50)
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
