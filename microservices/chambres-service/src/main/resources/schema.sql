-- Schema of chambres-service (database mirador_chambres). Idempotent.

CREATE TABLE IF NOT EXISTS type_chambre (
    codetype INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(120),
    nuite DECIMAL(12, 2) DEFAULT 0,
    sejour DECIMAL(12, 2) DEFAULT 0,
    sieste DECIMAL(12, 2) DEFAULT 0,
    numero VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS chambre (
    code_chambre VARCHAR(20) NOT NULL PRIMARY KEY,
    numero VARCHAR(20),
    code_type INT,
    type VARCHAR(50),
    prix DECIMAL(12, 2) DEFAULT 0,
    FOREIGN KEY (code_type) REFERENCES type_chambre(codetype) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS app_room_status (
    code_chambre VARCHAR(20) NOT NULL,
    status_label VARCHAR(30) NOT NULL DEFAULT 'Disponible',
    cleaning_status VARCHAR(30) NOT NULL DEFAULT 'Prêt',
    description_text TEXT NULL,
    capacity_value INT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (code_chambre),
    FOREIGN KEY (code_chambre) REFERENCES chambre(code_chambre) ON DELETE CASCADE
);
