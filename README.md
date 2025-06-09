# 🎮 HypoMeter - Hypometer Dashboard

[LIEN](hypolegacy.vercel.app)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Twitch API](https://img.shields.io/badge/Twitch-API-9146FF.svg)](https://dev.twitch.tv/)

> **Système de mesure de hype en temps réel pour les conférences gaming et streams Twitch**

HypoMeter est un dashboard interactif qui analyse en temps réel les réactions du chat Twitch pour mesurer le niveau de "hype" lors d'annonces de jeux vidéo. Parfait pour les streamers, organisateurs d'événements gaming et analystes de communauté.

## ✨ Fonctionnalités

### 🎯 Analyse de Sentiment en Temps Réel

- **Détection automatique** des mots-clés positifs et négatifs dans le chat
- **Classification intelligente** des messages (positif/négatif/neutre)
- **Calcul de score** basé sur la différence entre réactions positives et négatives

### 🔗 Intégration Twitch Native

- Connexion OAuth sécurisée avec l'API Twitch
- Détection du statut live/offline

### 🏆 Système de Classement Dynamique

- **Leaderboard automatique** des jeux par score de hype
- Classement basé sur la différence positive/négative
- **Gestion manuelle** avec boutons +1/-1 pour ajustements
- Statistiques détaillées par jeu

### 🎛️ Gestion de Contexte de Jeu

- **Capture contextuelle** : démarrer l'analyse avant même de nommer le jeu
- **Workflow fluide** : nouvelle annonce → capture → confirmation
- **Historique complet** de toutes les annonces analysées

### 🔧 Personnalisation Avancée

- **Mots-clés personnalisables** (positifs/négatifs)
- **Import/Export** des données en JSON
- **Réinitialisation** des données
- **Suppression** individuelle des jeux du classement

## 🚀 Installation & Utilisation

### Prérequis

- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Compte Twitch pour la connexion OAuth

### Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/HypoMeter.git

# Aller dans le dossier
cd HypoMeter

# Lancer un serveur local (optionnel)
python -m http.server 8000
# ou
npx http-server
```

### Configuration Twitch

1. **Se connecter** avec votre compte Twitch via le bouton de connexion
2. **Autoriser** l'application à accéder au chat
3. L'application se connectera automatiquement à votre channel

### Utilisation

1. **Démarrer une nouvelle annonce** avant de révéler un jeu
2. **Les messages sont capturés** automatiquement pendant l'annonce
3. **Entrer le nom du jeu** pour finaliser et voir les résultats
4. **Consulter le classement** mis à jour en temps réel

## 🎮 Cas d'Usage

### Pour les Streamers

- Mesurer l'engagement de votre audience lors des annonces de jeux
- Identifier quels types de jeux génèrent le plus d'enthousiasme
- Créer du contenu interactif basé sur les réactions

### Pour les Événements Gaming

- Analyser les réactions pendant les conférences (E3, Gamescom, etc.)
- Comparer l'accueil de différentes annonces
- Générer des rapports d'engagement

### Pour l'Analyse Communautaire

- Étudier les tendances de réaction dans les communautés gaming
- Exporter les données pour des analyses plus poussées
- Suivre l'évolution au fil du temps

## 🛠️ Technologies Utilisées

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **API** : Twitch API v5 & Helix
- **Chat** : TMI.js (Twitch Messaging Interface)
- **Stockage** : LocalStorage API
- **OAuth** : Twitch OAuth 2.0

## 📊 Architecture

```
HypoMeter/
├── index.html          # Interface principale
├── app.js             # Logique principale et gestion d'état
├── styles.css         # Styles et animations
└── README.md          # Documentation
```

### Flux de Données

1. **Connexion Twitch** → OAuth → Token stocké
2. **Messages Chat** → Analyse sentiment → Mise à jour stats
3. **Calcul Score** → Tri classement → Affichage UI
4. **Export/Import** → Sauvegarde JSON → Persistance

## 🎨 Interface

### Dashboard Principal

- **Panneau de contrôle** : Connexion, gestion des jeux, mots-clés
- **Chat preview** : Aperçu des messages analysés avec code couleur
- **Classement live** : Leaderboard dynamique avec contrôles manuels

### Indicateurs Visuels

- 🟢 **Vert** : Messages positifs (hype)
- 🔴 **Rouge** : Messages négatifs
- ⚪ **Gris** : Messages neutres
- 🏆 **Podium** : Top 3 avec couleurs distinctes

## 🔮 Fonctionnalités Avancées

### Système de Scoring

```javascript
// Calcul du score basé sur la différence pondérée
const difference = positive - negative;
const ratio = total > 0 ? difference / total : 0;
const score = Math.round(ratio * 100);
```

### Détection de Mots-clés

- **Recherche flexible** : Détection de mots partiels
- **Priorité** : Positif vs négatif en cas de conflit
- **Personnalisation** : Ajout/suppression de mots-clés

### Gestion d'État

- **Auto-sauvegarde** dans localStorage
- **Récupération** après fermeture du navigateur
- **Merge intelligent** lors de l'import de données

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** sur la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Idées de Contributions

- 📱 Version mobile optimisée
- 📈 Graphiques de tendances temporelles
- 🔗 Intégration avec d'autres plateformes (YouTube, Discord)
- 🎵 Alertes sonores personnalisables
- 📋 Templates de mots-clés par genre de jeu

---

⭐ **N'hésitez pas à star le projet si il vous plaît !** ⭐
