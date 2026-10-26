-- One-time, idempotent indexes for the high-volume reservation read paths.
-- Run against the local microservice database after loading large datasets.
SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'mirador_reservations'
      AND table_name = 'occupation'
      AND index_name = 'idx_occupation_client'
);
SET @ddl = IF(@index_exists = 0,
    'CREATE INDEX idx_occupation_client ON mirador_reservations.occupation (code_client)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'mirador_reservations'
      AND table_name = 'occupation'
      AND index_name = 'idx_occupation_room_dates'
);
SET @ddl = IF(@index_exists = 0,
    'CREATE INDEX idx_occupation_room_dates ON mirador_reservations.occupation (code_chambre, date_debut, date_fin)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'mirador_reservations'
      AND table_name = 'occupation'
      AND index_name = 'idx_occupation_dates'
);
SET @ddl = IF(@index_exists = 0,
    'CREATE INDEX idx_occupation_dates ON mirador_reservations.occupation (date_debut, date_fin)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Reviews: the moderation list is ordered by (flagged, id) and filtered by status.
SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'mirador_avis'
      AND table_name = 'avis'
      AND index_name = 'idx_avis_flagged_id'
);
SET @ddl = IF(@index_exists = 0,
    'CREATE INDEX idx_avis_flagged_id ON mirador_avis.avis (flagged, id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = 'mirador_avis'
      AND table_name = 'avis'
      AND index_name = 'idx_avis_status_flagged_id'
);
SET @ddl = IF(@index_exists = 0,
    'CREATE INDEX idx_avis_status_flagged_id ON mirador_avis.avis (status, flagged, id)',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
