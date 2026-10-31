# Ferro-Link API

## Prérequis
- Node.js 20+
- PostgreSQL 14+
- Un client OAuth Google (optionnel jusqu'à l'activation de la connexion Google)

## Installation
```bash
cd server
cp .env.example .env
# Modifier DATABASE_URL et SESSION_SECRET dans .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

L'API écoute par défaut sur http://localhost:4000. Vérifier avec GET /api/health.

## Connexion Google
Dans Google Cloud Console, créer un OAuth Client ID de type « Application Web ». Pour l'interface Google Identity Services, autoriser l'origine http://localhost:5173 et configurer VITE_GOOGLE_CLIENT_ID dans le frontend. Renseigner le même identifiant dans GOOGLE_CLIENT_ID côté serveur. Le serveur vérifie le jeton Google avant de créer ou retrouver le compte. Ne jamais exposer de secret Google dans le frontend.

## Sécurité / déploiement
- Le rôle par défaut est CANDIDATE; l'inscription publique ne peut pas créer un administrateur.
- Le premier SUPER_ADMIN doit être attribué manuellement en base après vérification de l'identité.
- En production, utiliser HTTPS, un SESSION_SECRET aléatoire, un magasin de sessions partagé et des origines CORS exactes.
- Les CV doivent être déposés dans un stockage privé; ne pas accepter de chemins arbitraires fournis par le client.
- Prévoir une procédure de réinitialisation du mot de passe par e-mail avant mise en production.
