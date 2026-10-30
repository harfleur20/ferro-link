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

## Build de production

```sh
npm run build
npm run preview
``

Les images du site sont conservées dans `public/images`. La page principale est construite avec React dans `src/App.jsx` et les styles sont dans `src/styles/global.css`.

La vidéo du hero utilise une intégration YouTube en lecture muette et en boucle. L’image de fond locale sert de repli lorsque la vidéo ne se charge pas ou si le visiteur préfère réduire les animations.
