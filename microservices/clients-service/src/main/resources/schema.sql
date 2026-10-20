-- Schema of clients-service (database mirador_clients). Idempotent.

CREATE TABLE IF NOT EXISTS client (
    code_client INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255),
    nom_client VARCHAR(100),
    contact VARCHAR(50),
    type_client VARCHAR(20),
    solde DECIMAL(12, 2) DEFAULT 0,
    email VARCHAR(255),
    numero VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS app_client_profile (
    code_client INT NOT NULL,
    email VARCHAR(255) NULL,
    address_line VARCHAR(255) NULL,
    id_document VARCHAR(120) NULL,
    company_name VARCHAR(255) NULL,
    status_label VARCHAR(30) NOT NULL DEFAULT 'Actif',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (code_client)
);
