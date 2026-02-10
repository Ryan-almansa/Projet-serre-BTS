// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Modbus = require('jsmodbus');
const net = require('net');
const bodyParser = require('body-parser');
dotenv.config();
const TCW241 = require('./TCW241.js');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const PORT = process.env.PORT;
const JWT_SECRET = process.env.CODE;

// ========================================
// 🔌 Connexion MySQL
// ========================================

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion MySQL :', err.message);
  } else {
    console.log('Connecté à la base de données MySQL');
    
    // Créer la table HistoriqueDonnees si elle n'existe pas
    createHistoriqueDonneesTable();
  }
});

// ========================================
// 📊 Création de la table HistoriqueDonnees
// ========================================

function createHistoriqueDonneesTable() {
  const createTableQuery = `
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  db.query(createTableQuery, (err) => {
    if (err) {
      console.error('Erreur lors de la création de la table HistoriqueDonnees :', err.message);
    } else {
      console.log('✓ Table HistoriqueDonnees vérifiée/créée avec succès');
    }
  });
}

// ========================================
// 🔐 JWT
// ========================================

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

const revokedTokens = new Set();
function revokeToken(jti) { revokedTokens.add(jti); }
function isRevoked(jti) { return revokedTokens.has(jti); }

function authMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Token manquant' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (isRevoked(payload.jti)) {
      return res.status(401).json({ success: false, message: 'Token révoqué' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
}

// ========================================
// 🔐 Route LOGIN
// ========================================

app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ success: false, message: 'Login et mot de passe requis' });
  }

  const query = 'SELECT * FROM Utilisateur WHERE login = ?';
  db.query(query, [login], (err, results) => {
    if (err) {
      console.error('Erreur lors de la requête MySQL :', err.message);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Nom d\'utilisateur inexistant' });
    }

    const user = results[0];
    bcrypt.compare(password, user.mdp, (err, isMatch) => {
      if (err) {
        console.error('Erreur lors de la comparaison des mots de passe :', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' });
      }

      const jti = uuidv4();
      const payload = { sub: user.Id || user.id || user.ID, login: user.Login, jti };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });

      return res.json({ success: true, message: 'Connexion réussie', token });
    });
  });
});

// Route d'inscription
app.post('/api/inscription', (req, res) => {
  const { prenom, nom, email, username, password } = req.body;
  if (!prenom || !nom || !email || !username || !password) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  const checkQuery = 'SELECT * FROM Utilisateur WHERE Login = ? OR Mail = ?';
  db.query(checkQuery, [username, email], (err, results) => {
    if (err) {
      console.error('Erreur lors de la requête MySQL :', err.message);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (results.length > 0) {
      return res.status(409).json({ success: false, message: 'Nom d\'utilisateur ou email déjà utilisé' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Erreur lors du hachage du mot de passe :', err.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur' });
      }

      const insertQuery = 'INSERT INTO Utilisateur (nom, prenom, mail, login, mdp) VALUES (?, ?, ?, ?, ?)';
      db.query(insertQuery, [nom, prenom, email, username, hashedPassword], (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'insertion dans la base de données :', err.message);
          return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }

        // Récupérer l'ID inséré si besoin
        const userId = results.insertId;
        const jti = uuidv4();
        const payload = { sub: userId, login: username, jti };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });

        return res.json({ success: true, message: 'Inscription réussie', token });
      });
    });
  });
});



// ========================================
// 🌡️ Lecture Modbus : température
// ========================================

async function get() {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const client = new Modbus.client.TCP(socket);

    socket.connect({ host: process.env.serverIP, port: process.env.portMod });

    socket.on('connect', async () => {
      try {
        const tcw = new TCW241();

        const temp = await tcw.getTemp(client);
        const h1 = await tcw.getH1(client);
        const h2 = await tcw.getH2(client);
        const h3 = await tcw.getH3(client);

        tcw.setTemperature(temp);
        tcw.setHumidites(h1, h2, h3);

        socket.end();
        resolve(tcw.toJSON());

      } catch (err) {
        socket.end();
        reject(err);
      }
    });

    socket.on('error', reject);
  });
}



// ========================================
// 🌍 EXPRESS
// ========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('/var/www/html/Serre'));

// Page principale
app.get('/', (req, res) => {
  res.sendFile(path.join('/var/www/html/Serre/front', 'index.html'));
});

// ========================================
// 🌡️ Route API protégée
// ========================================

app.get('/api/info', authMiddleware, async (req, res) => {
  try {
    const data = await get();
    
    // Insertion des données dans la base de données
    const query = 'INSERT INTO HistoriqueDonnees (temperature, humidite_sol, timestamp) VALUES (?, ?, NOW())';
    db.query(query, [data.temperature, data.humiditeSol], (err) => {
      if (err) {
        console.error('Erreur lors de l\'insertion dans HistoriqueDonnees :', err.message);
      }
    });
    
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================
// 📊 Route pour l'historique des données (24h)
// ========================================

app.get('/api/history', authMiddleware, (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        temperature,
        humidite_sol,
        timestamp
      FROM HistoriqueDonnees
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY timestamp ASC
      LIMIT 500
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération de l\'historique :', err.message);
        return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des données' });
      }

      if (!results || results.length === 0) {
        return res.json({ 
          success: true, 
          data: [],
          message: 'Aucune donnée historique disponible'
        });
      }

      const formattedData = results.map(row => ({
        id: row.id,
        temperature: parseFloat(row.temperature),
        humidity: parseFloat(row.humidite_sol),
        timestamp: new Date(row.timestamp).toISOString()
      }));

      res.json({ success: true, data: formattedData });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================
// 🚀 START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
