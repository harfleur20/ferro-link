# Déploiement sur Coolify

`docker-compose.coolify.yml` lance tout : le site et l'API, la base PostgreSQL et une sauvegarde quotidienne. Coolify génère et conserve le mot de passe de la base, le secret de session et l'adresse du site. `docker-compose.yml` reste réservé au local.

## 1. Application
1. Ajoutez une ressource **Application** à partir du dépôt GitHub, branche `main`.
2. Choisissez le build pack **Docker Compose**, Base Directory `/`, fichier `/docker-compose.coolify.yml`.
3. Dans **Domains**, vérifiez que le service `app` reçoit le domaine sur le port `4000`. Coolify en génère un par défaut ; il peut être remplacé plus tard par le vôtre, en `https://votre-domaine:4000`.
4. Déployez. Les migrations s'appliquent automatiquement au démarrage.

Aucune variable n'est obligatoire pour démarrer. Sans les réglages SMTP, le site fonctionne mais n'envoie pas d'e-mails.

## 2. Variables à ajouter pour les e-mails
| Variable | Valeur |
|---|---|
| `SMTP_USER` | Identifiant SMTP Brevo |
| `SMTP_PASS` | Clé SMTP Brevo (pas la clé API) |
| `SMTP_FROM` | `ferroLink <noreply@votre-domaine>` |
| `NOTIFICATION_EMAIL` | Facultatif : une boîte unique pour les alertes |

Ne modifiez pas les variables `SERVICE_*` : changer `SERVICE_PASSWORD_POSTGRES` après le premier démarrage couperait l'accès à la base.

Si Cloudflare (ou un autre proxy) est placé devant Coolify, le serveur ne voit plus la vraie adresse des visiteurs et les limites de requêtes s'appliquent à tout le monde en même temps : le signaler avant de l'activer.

## 3. Brevo
1. Dans Brevo, ouvrez **Expéditeurs, domaines et IP dédiées** et authentifiez votre domaine en ajoutant les enregistrements DNS demandés. Sans cela, les e-mails sont refusés ou classés en spam.
2. Dans **SMTP & API**, récupérez l'identifiant et générez une clé SMTP.
3. L'adresse de `SMTP_FROM` doit appartenir au domaine authentifié.

## 4. Premier compte
Dans le terminal du conteneur `app` (onglet **Terminal** de Coolify) :
```bash
ADMIN_EMAIL="prenom.nom@exemple.fr" ADMIN_NAME="Prénom Nom" npm run create-admin
```
Ouvrez le lien affiché (valable 24 heures) pour choisir le mot de passe, puis invitez l'équipe depuis « Utilisateurs & rôles ».

## 5. Avant d'ouvrir au public
- Remplacez les valeurs provisoires dans « Contenu du site » > « Mentions légales ».
- Faites relire les pages légales.
- Créez une vraie boîte de réception pour `contact@…` et mettez à jour l'adresse dans « Page contact ».
- Envoyez une candidature de test, passez-la à « Entretien » et vérifiez la réception des e-mails, y compris « Mot de passe oublié ».

## Sauvegardes
Le service `backup` enregistre chaque jour la base et les fichiers (CV, images) dans le volume `backups`, et efface ce qui a plus de 14 jours. Ses logs signalent toute erreur par `ERREUR`.

Ce volume reste **sur le même serveur** : il protège d'une erreur ou d'une suppression, pas d'une panne du disque. Copiez régulièrement son contenu hors du serveur. Il contient des CV : son accès doit rester restreint.

Pour restaurer, depuis le serveur, en remplaçant `BACKUPS`, `DATA`, `DB` et `DATE` par les noms affichés par `docker volume ls` et `docker ps` :
```bash
docker run --rm -v BACKUPS:/backups -v DATA:/data alpine \
  sh -c "tar xzf /backups/fichiers-DATE.tar.gz -C /data && chown -R 1000:1000 /data"
docker run --rm -v BACKUPS:/backups alpine cat /backups/base-DATE.dump | \
  docker exec -i DB pg_restore -U ferrolink -d ferrolink --clean --if-exists
```
