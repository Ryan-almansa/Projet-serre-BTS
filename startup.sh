#!/bin/bash
# ========================================
# QUICK START - Démarrer le système
# ========================================
# Utilisation : bash startup.sh
# Ou : chmod +x startup.sh && ./startup.sh

echo "🌱 Démarrage du Système de Suivi des Données"
echo "=============================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "back/server.js" ]; then
    echo "❌ Erreur : back/server.js non trouvé"
    echo "Exécutez ce script depuis /var/www/html/Projet-serre-BTS/"
    exit 1
fi

# Fonction pour vérifier si MySQL est accessible
check_mysql() {
    mysql -u root -p"$1" -e "SELECT 1" > /dev/null 2>&1
    return $?
}

# Fonction pour créer la table si nécessaire
setup_database() {
    echo "📊 Configuration de la base de données..."
    
    # Essayer avec mot de passe vide d'abord
    if check_mysql ""; then
        echo "✓ MySQL accessible (sans mot de passe)"
        mysql -u root "$DB_NAME" < back/create_tables.sql
    elif check_mysql "root"; then
        echo "✓ MySQL accessible (mot de passe: root)"
        mysql -u root -p"root" "$DB_NAME" < back/create_tables.sql
    else
        echo "⚠️  Impossible de vérifier MySQL"
        echo "   La table sera créée automatiquement au démarrage du serveur"
    fi
}

# Configuration
DB_NAME="votre_base"  # À modifier si nécessaire
PORT=8080

echo ""
echo "⚙️  CONFIGURATION:"
echo "   Base de données : $DB_NAME"
echo "   Port : $PORT"
echo ""

# Setup base de données
setup_database

# Installer les dépendances si nécessaire
if [ ! -d "back/node_modules" ]; then
    echo "📦 Installation des dépendances..."
    cd back
    npm install
    cd ..
    echo "✓ Dépendances installées"
fi

# Démarrer le serveur
echo ""
echo "🚀 Démarrage du serveur..."
echo "=============================================="
echo ""

cd back
node server.js

# Afficher les instructions de fermeture
trap 'echo ""; echo "Serveur arrêté"; exit' INT

echo ""
echo "=============================================="
echo "Le serveur s'est arrêté"
echo ""
echo "Pour redémarrer :"
echo "  cd back && node server.js"
