# Ferro-Link API

## Prérequis
- Node.js 20+
- PostgreSQL 14+
- Un client OAuth Google (optionnel jusqu'à l'activation de la connexion Google)

## Installation
```bash
cd server
cp .env.example .env
# Modifier DATABASE_URL, SESSION_SECRET et les paramètres SMTP dans .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

L'API écoute par défaut sur http://localhost:4000. Vérifier avec GET /api/health.

Sur cette machine Windows, la base de développement ferroLink est isolée dans
`%LOCALAPPDATA%\FerroLink\PostgreSQL18` et écoute sur le port 5433. Depuis la racine
du dépôt, démarrez-la avec `npm run db:start` et arrêtez-la avec `npm run db:stop`.

## Compte SuperAdmin de test (développement uniquement)
Après avoir configuré `server/.env` et appliqué les migrations, lancez `npm run seed:test-admin`
à la racine du dépôt (ou la même commande depuis le dossier `server`). La commande crée `test.admin@ferrolink.local` avec un mot de
passe aléatoire et l'affiche une seule fois dans le terminal. Pour choisir une autre
adresse, définissez `ADMIN_EMAIL` avant l'exécution. La commande refuse de modifier un
compte existant et ne fonctionne pas lorsque `NODE_ENV=production`.

La réinitialisation du mot de passe utilise `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
`SMTP_USER`, `SMTP_PASS` et `SMTP_FROM`. Configurez ces variables avec les paramètres
de votre fournisseur SMTP avant d'utiliser « Mot de passe oublié ? ». Les liens de
réinitialisation expirent après 30 minutes.

## Connexion Google
Dans Google Cloud Console, créer un OAuth Client ID de type « Application Web ». Pour l'interface Google Identity Services, autoriser l'origine http://localhost:5173 et configurer VITE_GOOGLE_CLIENT_ID dans le frontend. Renseigner le même identifiant dans GOOGLE_CLIENT_ID côté serveur. Le serveur vérifie le jeton Google avant de créer ou retrouver le compte. Ne jamais exposer de secret Google dans le frontend.

## Sécurité / déploiement
- Le rôle par défaut est CANDIDATE; l'inscription publique ne peut pas créer un administrateur.
- Le premier SUPER_ADMIN doit être attribué manuellement en base après vérification de l'identité.
- Les rôles d'administration sont SUPER_ADMIN (gestion complète et attribution des rôles), RECRUITMENT_ADMIN (Business Manager, gestion des offres et du recrutement) et RECRUITER (Chargé de recrutement, suivi des candidatures et consultation des offres).
- Les droits sont contrôlés par l'API : la gestion des offres est réservée au Business Manager et au SuperAdmin, et la gestion des rôles au SuperAdmin.
- Les offres sont stockées en base et gérées dans l'onglet « Offres d'emploi ». `GET /api/jobs` ne renvoie que les offres publiées ; l'équipe utilise `GET /api/staff/jobs`. Le lieu et le contrat sont obligatoires pour publier. Une candidature sans `jobId` est enregistrée comme candidature spontanée.
- Le Business Manager et le SuperAdmin disposent de l'onglet « Contenu du site ». Un sélecteur compact donne accès aux rubriques Identité/navigation, Accueil, Partenaires, À propos/valeurs, Contact, bandeau de contact, Pied de page et Thème. Les textes, images, listes d’expertises/métiers, coordonnées, réseaux sociaux, galeries et styles exposés dans ces rubriques sont enregistrés dans PostgreSQL et servis au site public. Les logos PNG, JPEG ou WebP (256 Ko maximum) et les images de contenu (5 Mo maximum) sont importés dans `server/public/site-assets` ; aucune URL d’image ne doit être saisie manuellement. L’aperçu intégré reflète les brouillons sans les publier.
- En production, utiliser HTTPS, un SESSION_SECRET aléatoire, un magasin de sessions partagé et des origines CORS exactes.
- Les CV doivent être déposés dans un stockage privé; ne pas accepter de chemins arbitraires fournis par le client.
- Vérifier la configuration SMTP et la délivrabilité des e-mails de réinitialisation avant mise en production.
