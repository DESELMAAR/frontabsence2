
# Frontend - Gestion d'Absences (React + Vite + Tailwind)

Frontend prêt à l'emploi pour consommer votre API Spring Boot.
Compatible **Node 18** (Vite 5).

## 🚀 Installation
```bash
# 1) Cloner/copier ce dossier
cd gestion-absences-frontend

# 2) Facultatif: définir l'URL de l'API
cp .env.example .env
# puis éditer VITE_API_BASE_URL si besoin

# 3) Installer
npm install

# 4) Lancer
npm run dev
```

## 🔐 Authentification
- Page **/login** (login & password) → stocke le JWT.
- Les requêtes sont effectuées avec le header `Authorization: Bearer <token>`.

## 📚 Entités gérées (CRUD)
- Étudiants `/api/etudiants`
- Professeurs `/api/professeurs`
- Classes `/api/classes`
- Matières `/api/matieres`
- Salles `/api/salles`
- Cours `/api/cours`
- Séances `/api/seances` (+ check-conflit)

## 🗓 Emploi du temps
- **Voir le dernier**: `GET /api/emploi-du-temps/by-classe/{classeId}/latest`
- **Générer 16 séances**: `GET /api/emploi-du-temps/generate-weekly-16?classeId=ID&weekStart=YYYY-MM-DD`

## 🧩 Configuration
- Tout est centralisé dans `src/config/entities.js` (colonnes du tableau, champs du formulaire, endpoints, mapping du payload).

## 🧠 Notes
- Ce frontend suppose les endpoints REST fournis par ton backend.
- Tu peux facilement ajouter une nouvelle entité en éditant `entities.js`.
- Les champs `select` récupèrent leurs options via les endpoints configurés.
