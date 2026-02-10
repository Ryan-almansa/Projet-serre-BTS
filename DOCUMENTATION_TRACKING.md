# 📊 Documentation - Système de Suivi Dynamique des Données

## 🎯 Vue d'ensemble

Un système complet de suivi et d'affichage des données de la serre en temps réel et historique, sans nécessiter de rechargement de page.

## 🏗️ Architecture

### Backend (Node.js + Express + MySQL)

#### Routes API

##### 1. **GET `/api/info`** (Protégé par JWT)
- **Description** : Récupère les données actuelles des capteurs (température, humidité)
- **Authentification** : Bearer Token requis
- **Réponse** :
```json
{
  "success": true,
  "temperature": 24.5,
  "humiditeSol": 65.2
}
```
- **Effet secondaire** : Insère les données dans la table `HistoriqueDonnees`

##### 2. **GET `/api/history`** (Protégé par JWT) ✨ **NOUVEAU**
- **Description** : Récupère l'historique des données des 24 dernières heures
- **Authentification** : Bearer Token requis
- **Paramètres** : Aucun
- **Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "temperature": 23.5,
      "humidity": 64.2,
      "timestamp": "2026-02-10T10:30:00.000Z"
    },
    {
      "id": 2,
      "temperature": 24.1,
      "humidity": 65.5,
      "timestamp": "2026-02-10T10:35:00.000Z"
    }
  ]
}
```

### Base de Données

#### Table : `HistoriqueDonnees`

```sql
CREATE TABLE HistoriqueDonnees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperature DECIMAL(5, 2) NOT NULL,
  humidite_sol DECIMAL(5, 2) NOT NULL,
  humidite_air DECIMAL(5, 2) DEFAULT NULL,
  luminosite INT DEFAULT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp),
  INDEX idx_created_at (created_at)
)
```

**Colonnes** :
- `id` : Identifiant unique
- `temperature` : Température en °C (2 décimales)
- `humidite_sol` : Humidité du sol en % (2 décimales)
- `humidite_air` : Humidité de l'air (optionnel)
- `luminosite` : Luminosité (optionnel)
- `timestamp` : Date/Heure de la mesure (UTC)
- `created_at` : Date/Heure de création (serveur)

### Frontend (JavaScript + Chart.js)

#### Variables Globales

```javascript
const CONFIG = {
    apiUrl: 'http://172.29.16.154/api',
    updateInterval: 5000,  // Polling toutes les 5 secondes
    chartMaxPoints: 20
};

const chartData = {
    timestamps: [],
    temperature: [],
    humidity: []
};
```

#### Fonctions Principales

##### 1. **loadHistoricalData()** ✨ **NOUVEAU**
- **Appel** : Au chargement de la page (DOMContentLoaded)
- **Fonction** : Récupère les 24 dernières heures de données
- **Affichage** : Remplit le graphique avec l'historique
- **Format timestamps** : HH:mm (format français)

```javascript
await loadHistoricalData();
// ↓
// Récupère /api/history
// ↓
// Remplit chartData.timestamps, chartData.temperature, chartData.humidity
// ↓
// updateCharts() affiche les données
```

##### 2. **fetchSensorData()**
- **Appel** : Toutes les 5 secondes (polling basé sur CONFIG.updateInterval)
- **Fonction** : Récupère les données actuelles
- **Effets** :
  - Insère automatiquement en base de données
  - Met à jour l'interface en temps réel
  - Ajoute à l'historique avec `addToHistory()`

##### 3. **addToHistory(data)**
- **Fonction** : Ajoute les nouvelles données au graphique
- **Limite** : Garde max 100 points pour éviter les ralentissements
- **Évite les doublons** : Vérifie pour ne pas ajouter deux fois la même donnée

##### 4. **updateCharts()**
- **Fonction** : Met à jour le graphique Chart.js
- **Appel automatique** : À chaque nouvelle donnée

## 🔄 Flux de Données

```
┌─────────────────────────────────────────────────────────┐
│                    PAGE CHARGÉE                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │  loadHistoricalData()     │
        │  (GET /api/history)       │
        └────────────┬─────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │ Remplit graphique avec 24h      │
    │ de données historiques          │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ startDataPolling() démarre      │
    │ polling toutes les 5 sec        │
    └────────────┬───────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   Polling 1      Polling 2      ... (Continu)
   GET /api/info  GET /api/info
        │                 │
        ▼                 ▼
  Insère en BDD   Insère en BDD
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌──────────────────────────┐
        │  updateCharts()           │
        │  (Animation fluide)       │
        └──────────────────────────┘
```

## 🚀 Installation & Configuration

### 1. Créer la table en base de données

Exécutez sur votre serveur MySQL :

```bash
mysql -u root -p votre_base < /var/www/html/Projet-serre-BTS/back/create_tables.sql
```

Ou manuellement dans phpMyAdmin/HeidiSQL :

```sql
CREATE TABLE HistoriqueDonnees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperature DECIMAL(5, 2) NOT NULL,
  humidite_sol DECIMAL(5, 2) NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp)
);
```

### 2. Redémarrer le serveur

```bash
cd /var/www/html/Projet-serre-BTS/back
node server.js
```

La table sera créée automatiquement si elle n'existe pas.

### 3. Vérifier le fonctionnement

1. Accédez à `http://votre-domaine/front/index.html`
2. Connectez-vous
3. Attendez quelques secondes pour voir l'historique se charger
4. Les graphiques se mettront à jour toutes les 5 secondes

## 📈 Graphiques

### Chart.js Configuration

- **Type** : Line chart
- **Datasets** : 2 (Température rouge, Humidité bleue)
- **Max points** : 100
- **Refresh** : Instantané (pas d'animation lente)
- **Format X-axis** : HH:mm (française)

## 🔐 Sécurité

- Toutes les routes API requièrent un JWT Bearer Token
- Les tokens expirent après 4h
- Les données ne sont accessibles que pour l'utilisateur connecté

## 🧹 Maintenance

### Nettoyer les anciennes données

Les données s'accumulent en base. Pour garder seulement 3 mois :

```sql
DELETE FROM HistoriqueDonnees WHERE timestamp < DATE_SUB(NOW(), INTERVAL 3 MONTH);
```

Ou créez une tâche CRON :

```bash
0 0 * * * mysql -u user -p db_name -e "DELETE FROM HistoriqueDonnees WHERE timestamp < DATE_SUB(NOW(), INTERVAL 3 MONTH);"
```

## 🐛 Dépannage

### "Aucune donnée historique disponible"
- Vérifiez que `/api/history` retourne des données
- Assurez-vous que la table `HistoriqueDonnees` existe
- Vérifiez le JWT Token n'est pas expiré

### Les graphiques ne se mettent pas à jour
- Vérifiez que `/api/info` retourne des données
- Vérifiez la console (F12) pour les erreurs
- Vérifiez que CONFIG.apiUrl est correct

### Les données ne s'insèrent pas en base
- Vérifiez les permissions MySQL sur la table
- Vérifiez les noms de colonnes (case-sensitive)
- Regardez les logs serveur Node.js

## 📝 Notes Importantes

1. **Timestamps** : Tous les timestamps API utilisent le format ISO 8601 (UTC)
2. **Format d'affichage** : Les graphiques affichent en format français (HH:mm)
3. **Performance** : Max 100 points dans les graphiques pour éviter les ralentissements
4. **Persistent storage** : Les données sont persistées en MySQL
5. **Real-time** : Les graphiques se mettent à jour toutes les 5 secondes minimum

## 🎯 Prochaines Améliorations Possibles

- [ ] Ajouter WebSockets pour une mise à jour vraiment en temps réel
- [ ] Exporter les données en CSV/PDF
- [ ] Ajouter des filtres de date pour l'historique
- [ ] Ajouter des statistiques (min, max, moyenne)
- [ ] Notifications push en cas de seuil dépassé
