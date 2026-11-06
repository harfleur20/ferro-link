# ferroLink

Site vitrine ferroLink construit avec React et Vite.

## Prérequis

- Node.js 20.19+ ou 22.12+
- npm

## Développement local

```sh
npm install
npm run dev
``

## Lancer l'application avec Docker

Une seule commande démarre le site, l'API et la base de données :

```sh
docker compose up --build
```

Le site répond sur http://localhost:8080. Les données restent dans des volumes Docker entre deux lancements. Pour créer le premier compte :

```sh
docker compose exec -e ADMIN_EMAIL="prenom.nom@exemple.fr" -e ADMIN_NAME="Prénom Nom" app npm run create-admin
```

Pour changer le port ou activer les e-mails, placez `APP_PORT`, `FRONTEND_URL` et les variables `SMTP_*` dans un fichier `.env` à la racine. Si le port change, `FRONTEND_URL` doit changer aussi. La mise en ligne est décrite dans `DEPLOIEMENT.md`.

## Build de production

```sh
npm run build
npm run preview
``

Les images du site sont conservées dans `public/images`. La page principale est construite avec React dans `src/App.jsx` et les styles sont dans `src/styles/global.css`.

La vidéo du hero est chargée depuis Pexels, en lecture muette et en boucle. L’image de fond locale sert de repli lorsque la vidéo ne se charge pas ou si le visiteur préfère réduire les animations.
