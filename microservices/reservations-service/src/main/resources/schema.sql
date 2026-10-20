-- Schema of reservations-service (database mirador_reservations). Idempotent.

CREATE TABLE IF NOT EXISTS occupant (
    code_occupant INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(200),
    jeune_fille VARCHAR(200),
    prenom VARCHAR(100),
    sexe VARCHAR(10),
    date_naiss DATE,
    ville_naiss VARCHAR(100),
    pays_naiss VARCHAR(50),
    pays_residence VARCHAR(50),
    ville_residence VARCHAR(200),
    nationalite VARCHAR(50),
    adresse_privee VARCHAR(200),
    telephone VARCHAR(50),
    profession VARCHAR(100),
    nom_societe VARCHAR(100),
    adresse_soc VARCHAR(100),
    tel_societe VARCHAR(50),
    telex VARCHAR(50),
    venant_de VARCHAR(50),
    rendant_a VARCHAR(50),
    type_identite VARCHAR(50),
    numero_identite VARCHAR(50),
    delivre_le DATE,
    delivre_a VARCHAR(100),
    accompagne_par VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS visite (
    code_visite INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_occupant INT,
    nom VARCHAR(200),
    prenom VARCHAR(200),
    observation VARCHAR(200),
    date_debut DATETIME,
    date_fin DATETIME
);

CREATE TABLE IF NOT EXISTS occupation (
    code INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_client INT,
    code_chambre VARCHAR(20),
    date_debut DATETIME,
    date_fin DATETIME,
    status VARCHAR(30),
    type_service VARCHAR(20),
    qte INT,
    code_occupant INT,
    code_facture VARCHAR(20),
    observation VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS app_reservation_state (
    occupation_code INT NOT NULL,
    status_label VARCHAR(30) NOT NULL DEFAULT 'Confirmée',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (occupation_code)
);
