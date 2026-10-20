-- Schema of personnel-service (database mirador_personnel). Idempotent.

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

CREATE TABLE IF NOT EXISTS app_employee_planning (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    post_name VARCHAR(100) NOT NULL,
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_planning_employee (employee_id),
    INDEX idx_planning_date (shift_date)
);
