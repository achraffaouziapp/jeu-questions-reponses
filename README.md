# Jeu Questions/Réponses (temps réel)

> Application web de quiz en temps réel (création/rejoindre une partie, questions, score) avec un backend Node.js/Socket.IO et un frontend React/Vite.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20Socket.IO%20%7C%20SQLite%20%7C%20React%20%7C%20Vite%20%7C%20TypeScript-informational)
![Statut](https://img.shields.io/badge/statut-en%20développement-yellow)

---

## Sommaire

- [Présentation](#présentation)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement](#lancement)
- [Variables d'environnement](#variables-denvironnement)
- [Tests](#tests)
- [Structure du projet](#structure-du-projet)
- [Équipe](#équipe)
- [Licence](#licence)

---

## Présentation

Ce projet est un jeu de questions/réponses jouable à plusieurs en temps réel. Le backend expose une API minimale (healthcheck) et gère la logique de jeu via WebSocket (Socket.IO). Le frontend fournit l’interface pour créer une partie, rejoindre un lobby, jouer et afficher le classement.

**Fonctionnalités principales :**

- Création et gestion de sessions de jeu (lobby)
- Communication temps réel via Socket.IO
- Questions stockées en base SQLite (seed automatique au premier lancement)
- Frontend React (Vite) avec navigation (React Router)

---

## Prérequis

Avant de commencer, assure-toi d'avoir installé :

| Outil | Version minimale | Lien |
|---|---|---|
| Node.js | 20.19+ | https://nodejs.org/ |
| npm | 10.x | https://docs.npmjs.com/ |

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/achraffaouziapp/jeu-questions-reponses.git
cd jeu-questions-reponses

# 2. Installer les dépendances
npm install
npm --prefix backend install
npm --prefix frontend install
```

---

## Lancement

### Mode développement (recommandé)

```bash
# Démarre backend + frontend (2 processus)
npm run dev
```

- Frontend : http://localhost:5173
- Backend : http://localhost:3001 (healthcheck : http://localhost:3001/health)

### Lancer séparément

```bash
# Backend uniquement
npm --prefix backend run dev

# Frontend uniquement
npm --prefix frontend run dev
```

### Build frontend (production)

```bash
npm --prefix frontend run build
npm --prefix frontend run preview
```

---

## Variables d'environnement

Le projet fonctionne sans configuration par défaut.

### Frontend (Vite)

Créer un fichier `frontend/.env.local` :

```env
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (Node.js)

Variables lues par le backend :

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
```

Exemple PowerShell (Windows) :

```powershell
$env:PORT=3001
$env:FRONTEND_ORIGIN="http://localhost:5173"
npm --prefix backend run dev
```

---

## Tests

```bash
# Lancer tous les tests (backend)
npm test

# Lancer un test spécifique (backend)
npm test -- backend/test/NomDuTest

# Lint (frontend)
npm run lint

# Typecheck + build (frontend)
npm --prefix frontend run build
```

**Couverture actuelle :** non mesurée

---

## Structure du projet

```
jeu-questions-reponses/
├── backend/             # API + Socket.IO + SQLite (Node.js/Express)
│   ├── data/            # Base SQLite (app.db)
│   └── src/             # Code serveur
├── frontend/            # UI React + TypeScript (Vite)
│   └── src/             # Pages, composants, state management
├── gabarit_readme.md    # Gabarit fourni
└── package.json         # Scripts racine (concurrently)
```

---

## Équipe

| Nom | Rôle | Contact |
|---|---|---|
| achraffaouziapp | Développement | https://github.com/achraffaouziapp |

---

## Licence

ISC

---

*Dernière mise à jour : 2026-03-18*
