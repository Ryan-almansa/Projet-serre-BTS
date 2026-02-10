-- ========================================
-- CRÉATION DE LA TABLE D'HISTORIQUE DES DONNÉES
-- ========================================

-- Créer la table HistoriqueDonnees si elle n'existe pas
CREATE TABLE IF NOT EXISTS HistoriqueDonnees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5, 2) NOT NULL,
    humidite_sol DECIMAL(5, 2) NOT NULL,
    humidite_air DECIMAL(5, 2) DEFAULT NULL,
    luminosite INT DEFAULT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- CRÉATION D'UNE TÂCHE CRON POUR NETTOYER LES ANCIENNES DONNÉES
-- (Garder seulement 3 mois d'historique)
-- ========================================

-- Cette requête peut être exécutée périodiquement:
-- DELETE FROM HistoriqueDonnees WHERE timestamp < DATE_SUB(NOW(), INTERVAL 3 MONTH);
