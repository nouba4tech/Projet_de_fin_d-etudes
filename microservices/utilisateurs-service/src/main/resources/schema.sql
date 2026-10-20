-- Schema of utilisateurs-service (database mirador_utilisateurs). Idempotent.

CREATE TABLE IF NOT EXISTS utilisateur (
    code_user INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    compte VARCHAR(120) NOT NULL,
    psw VARCHAR(255) NOT NULL,
    nom VARCHAR(120),
    prenom VARCHAR(120),
    code_groupe INT DEFAULT 6,
    statut VARCHAR(30) DEFAULT 'Actif',
    UNIQUE KEY uk_utilisateur_compte (compte)
);

CREATE TABLE IF NOT EXISTS app_user_profile (
    code_user INT NOT NULL,
    email VARCHAR(255) NULL,
    role_name VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    PRIMARY KEY (code_user),
    UNIQUE KEY uk_app_user_profile_email (email)
);

CREATE TABLE IF NOT EXISTS groupe (
    code_groupe INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libelle TEXT
);

CREATE TABLE IF NOT EXISTS privilege (
    code_privilege INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_groupe INT,
    code_objet INT,
    statut TEXT
);

CREATE TABLE IF NOT EXISTS objets (
    code_objet INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libelle TEXT,
    type_objet TEXT
);

CREATE TABLE IF NOT EXISTS app_database_backup (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Disponible',
    size_in_bytes BIGINT DEFAULT 0,
    file_name VARCHAR(255)
);

INSERT INTO utilisateur (compte, psw, nom, prenom, code_groupe, statut)
SELECT 'noubasra', '629f6241ba9b0144cec1ebb169243f23', 'NOUBASRA', 'SAMUEL', 1, 'Actif'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM utilisateur WHERE compte = 'noubasra');

INSERT INTO app_user_profile (code_user, email, role_name, created_at)
SELECT u.code_user, NULL, 'Admin', NOW()
FROM utilisateur u
WHERE u.compte = 'noubasra'
  AND NOT EXISTS (SELECT 1 FROM app_user_profile p WHERE p.code_user = u.code_user)
LIMIT 1;
