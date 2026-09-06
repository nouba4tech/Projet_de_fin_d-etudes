-- ======================================================
-- SCHEMA COMPLET - Mirador Hotel
-- Fusion des tables modernes (app_*) et legacy
-- ======================================================

-- 1. Tables Utilisateurs et Authentification
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

-- 2. Tables Clients et Occupants
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

-- 3. Tables Chambres et Réservations
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

-- 4. Tables Comptabilité
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

CREATE TABLE IF NOT EXISTS cash_book (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date_entry DATE NOT NULL,
    libelle VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(20),
    reference VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tables "Compte_" (Auxiliaires)
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

-- 5. Tables Facturation et Règlements
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

-- 6. Tables Stock et Restaurant
CREATE TABLE IF NOT EXISTS depot (
    code_depot INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS boisson (
    code_boisson INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(100),
    type_boisson VARCHAR(30),
    numero_achat VARCHAR(20),
    numero_vente VARCHAR(20),
    unite_achat VARCHAR(20),
    prix_achat DECIMAL(12, 2),
    unite_vente VARCHAR(20),
    prix_vente DECIMAL(12, 2),
    stock_minimal DECIMAL(12, 2),
    ristourne DECIMAL(12, 2),
    code_depot INT,
    qte_stock DECIMAL(12, 2),
    qte_entree DECIMAL(12, 2),
    qte_sortie DECIMAL(12, 2),
    nb_unite INT,
    prix_vente_conso DECIMAL(12, 2),
    prix_vente_demi DECIMAL(12, 2)
);

CREATE TABLE IF NOT EXISTS type_plat (
    code_type INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS plat (
    code_plat INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10),
    libelle VARCHAR(50),
    montant DECIMAL(12, 2),
    code_type INT,
    code_depot INT,
    qte_stock DECIMAL(12, 2),
    qte_entree DECIMAL(12, 2),
    qte_sortie DECIMAL(12, 2)
);

CREATE TABLE IF NOT EXISTS stock_boisson (
    code_stock INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_boisson INT,
    qte DOUBLE,
    date_jour DATETIME,
    mouvement TEXT,
    libelle_operation TEXT,
    ref_production TEXT,
    code_depot INT
);

CREATE TABLE IF NOT EXISTS stock_plat (
    code_stock INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_plat INT,
    qte DOUBLE,
    date_jour DATETIME,
    mouvement TEXT,
    libelle_operation TEXT,
    ref_production TEXT,
    code_depot INT
);

CREATE TABLE IF NOT EXISTS app_stock_item (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(60) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(120) NOT NULL,
    quantity_value DECIMAL(12, 2) DEFAULT 0,
    unit_name VARCHAR(50) NOT NULL,
    unit_price DECIMAL(12, 2) DEFAULT 0,
    min_threshold DECIMAL(12, 2) DEFAULT 0,
    supplier_name VARCHAR(255) NULL,
    entity_scope VARCHAR(50) NOT NULL DEFAULT 'STOCK_MODULE',
    entity_reference VARCHAR(120) NULL,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_app_stock_item_scope_code (entity_scope, item_code)
);

CREATE TABLE IF NOT EXISTS app_stock_movement (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    stock_item_id BIGINT NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    quantity_value DECIMAL(12, 2) NOT NULL,
    reason_text VARCHAR(255) NOT NULL,
    reference_code VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stock_item_id) REFERENCES app_stock_item(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_stock_transfer (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    transfer_number VARCHAR(120) NOT NULL UNIQUE,
    transfer_date DATETIME NOT NULL,
    from_location VARCHAR(60) NOT NULL,
    to_location VARCHAR(60) NOT NULL,
    status_label VARCHAR(30) NOT NULL DEFAULT 'completed',
    notes TEXT NULL,
    requested_by VARCHAR(120) NULL,
    approved_by VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_stock_transfer_item (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    transfer_id BIGINT NOT NULL,
    stock_item_id BIGINT NOT NULL,
    quantity_value DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (transfer_id) REFERENCES app_stock_transfer(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_item_id) REFERENCES app_stock_item(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_supplier_invoice (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(120) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    invoice_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    subtotal_amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status_label VARCHAR(30) NOT NULL DEFAULT 'draft',
    notes TEXT NULL,
    created_by VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES fournisseur(code_fournisseur) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_supplier_invoice_item (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    item_code VARCHAR(60) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(120) NULL,
    quantity_value DECIMAL(12, 2) NOT NULL,
    unit_name VARCHAR(50) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES app_supplier_invoice(id) ON DELETE CASCADE
);


-- 7. Autres tables
CREATE TABLE IF NOT EXISTS autre_service (
    code_service INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20),
    libelle VARCHAR(100),
    prix_service DECIMAL(12, 2)
);

CREATE TABLE IF NOT EXISTS fournisseur (
    code_fournisseur INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20),
    nom VARCHAR(100),
    contact VARCHAR(100),
    solde DECIMAL(12, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pays (libelle VARCHAR(50));
CREATE TABLE IF NOT EXISTS parametre (
    idparametre INT NOT NULL DEFAULT 0,
    raison_sociale VARCHAR(100),
    activite VARCHAR(100),
    contact VARCHAR(100),
    ville VARCHAR(100),
    niu VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS transaction (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS lems (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS letransfert (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY);

-- 8. Tables Applicatives Modernes Restantes
CREATE TABLE IF NOT EXISTS app_employee (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_user INT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(80),
    position_name VARCHAR(120) NOT NULL,
    department_name VARCHAR(120) NOT NULL,
    hire_date DATE NOT NULL,
    salary_amount DECIMAL(12, 2) DEFAULT 0,
    status_label VARCHAR(30) DEFAULT 'Actif',
    role_name VARCHAR(50) DEFAULT 'Service',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_service_request (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code_client INT NOT NULL,
    service_type VARCHAR(60) NOT NULL,
    description_text TEXT NOT NULL,
    status_label VARCHAR(30) DEFAULT 'Demandé',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    price_amount DECIMAL(12, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app_restaurant_order (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL,
    status_label VARCHAR(30) DEFAULT 'En attente',
    total_amount DECIMAL(12, 2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    served_at DATETIME
);

CREATE TABLE IF NOT EXISTS app_restaurant_order_item (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity_value INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    KEY idx_app_restaurant_order_item_order (order_id)
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

CREATE TABLE IF NOT EXISTS app_database_backup (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Disponible',
    size_in_bytes BIGINT DEFAULT 0,
    file_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS main_courante (
    code_entry INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    entry_date DATE NOT NULL,
    entry_time VARCHAR(8) NOT NULL,
    category VARCHAR(20) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    reported_by VARCHAR(100),
    assigned_to VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    resolution TEXT,
    resolved_by VARCHAR(100),
    resolved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Compte administrateur par defaut
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
