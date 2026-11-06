# Déploiement sur Coolify

Le site et l'API tournent dans un seul conteneur, construit par le `Dockerfile` à la racine. La base de données est une ressource PostgreSQL séparée dans Coolify.

## 1. Base de données
1. Dans le projet Coolify, ajoutez une ressource **PostgreSQL** (version 17).
2. Notez son **URL interne** : elle servira pour `DATABASE_URL`.
3. Dans l'onglet **Backups** de la ressource, activez une sauvegarde quotidienne, de préférence vers un stockage S3 externe au serveur.

## 2. Application
1. Ajoutez une ressource **Application** à partir du dépôt GitHub et choisissez le build pack **Dockerfile**.
2. Port exposé : `4000`. Domaine : `https://votre-domaine`.
3. Dans **Persistent Storage**, ajoutez un volume (**Volume Mount**, pas un montage de dossier) sur `/data`. Il contient les CV et les images importées : sans lui, ils sont perdus à chaque déploiement.
4. Renseignez les variables ci-dessous, puis déployez. Les migrations s'appliquent automatiquement au démarrage.

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL interne de la base |
| `FRONTEND_URL` | `https://votre-domaine`, sans `/` final. Sert aux liens envoyés par e-mail et au sitemap |
| `SESSION_SECRET` | Résultat de `openssl rand -hex 32` |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Identifiant SMTP Brevo |
| `SMTP_PASS` | Clé SMTP Brevo (pas la clé API) |
| `SMTP_FROM` | `ferroLink <noreply@votre-domaine>` |
| `NOTIFICATION_EMAIL` | Facultatif : une boîte unique pour les alertes |

Si Cloudflare (ou un autre proxy) est placé devant Coolify, le serveur ne voit plus la vraie adresse des visiteurs et les limites de requêtes s'appliquent à tout le monde en même temps : le signaler avant de l'activer.

## 3. Brevo
1. Dans Brevo, ouvrez **Expéditeurs, domaines et IP dédiées** et authentifiez votre domaine en ajoutant les enregistrements DNS demandés. Sans cela, les e-mails sont refusés ou classés en spam.
2. Dans **SMTP & API**, récupérez l'identifiant et générez une clé SMTP.
3. L'adresse de `SMTP_FROM` doit appartenir au domaine authentifié.

## 4. Premier compte
Dans le terminal du conteneur (onglet **Terminal** de Coolify) :
```bash
ADMIN_EMAIL="prenom.nom@exemple.fr" ADMIN_NAME="Prénom Nom" npm run create-admin
```
Ouvrez le lien affiché (valable 24 heures) pour choisir le mot de passe, puis invitez l'équipe depuis « Utilisateurs & rôles ».

## 5. Avant d'ouvrir au public
- Remplacez les valeurs provisoires dans « Contenu du site » > « Mentions légales ».
- Faites relire les pages légales.
- Créez une vraie boîte de réception pour `contact@…` et mettez à jour l'adresse dans « Page contact ».
- Envoyez une candidature de test, passez-la à « Entretien » et vérifiez la réception des e-mails, y compris « Mot de passe oublié ».

## Sauvegarde des fichiers
Les sauvegardes Coolify couvrent la base, **pas le volume `/data`**. Sans sauvegarde du volume, une panne du serveur ferait perdre les CV alors que les dossiers resteraient en base. Depuis le serveur, en remplaçant `VOLUME` par le nom affiché par `docker volume ls` :
```bash
docker run --rm -v VOLUME:/data:ro -v /root/backups:/backup alpine \
  tar czf /backup/ferrolink-data-$(date +%F).tar.gz -C /data .
```
Planifiez cette commande chaque jour (cron) et copiez les archives hors du serveur. Elles contiennent des CV : leur accès doit rester restreint, et elles doivent être effacées au bout de quelques semaines pour respecter la durée de conservation annoncée.

Pour restaurer :
```bash
docker run --rm -v VOLUME:/data -v /root/backups:/backup alpine \
  sh -c "tar xzf /backup/ARCHIVE.tar.gz -C /data && chown -R 1000:1000 /data"
```
