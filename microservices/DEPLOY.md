# Mise en ligne (un serveur + Docker Compose)

> **Non testé** : ces étapes n'ont jamais été exécutées (Docker n'est pas installé sur la machine de développement).
> Prévoir une première mise en service avec quelques allers-retours.

## Ce qu'il faut

- Un serveur Linux (VPS) : **4 vCPU, 8 Go de RAM minimum** (12 JVM + MySQL), environ 10 à 20 €/mois chez
  Hetzner, OVH, DigitalOcean… Les offres gratuites ne suffisent pas.
- Un nom de domaine (optionnel mais conseillé, pour le HTTPS).
- Docker et le plugin Compose installés sur le serveur.

## Option gratuite : Oracle Cloud « Always Free » (la seule qui convienne)

Les offres gratuites habituelles (Render, Koyeb, Railway, Fly…) ne tiennent pas : 12 JVM + MySQL demandent
environ 4 Go de RAM, alors qu'elles donnent 512 Mo par service avec mise en veille. **Oracle Cloud Always Free**
offre à vie une machine **ARM Ampere A1 jusqu'à 4 cœurs et 24 Go de RAM**, largement suffisante. Contraintes :
inscription avec une carte bancaire (vérification, sans débit tant qu'on reste dans l'offre gratuite) et, parfois,
« Out of capacity » à la création de la machine (réessayer plus tard ou changer de région/domaine de disponibilité).

1. Créer le compte sur cloud.oracle.com, puis une instance **VM.Standard.A1.Flex** (Ubuntu 22.04, 4 OCPU, 24 Go).
   Les images fournies (MySQL, nginx, Temurin, Node, Maven) existent en ARM : rien à changer dans les Dockerfile.
2. Dans le réseau de l'instance (VCN → Security List), ajouter une règle entrante TCP sur les ports **80** et **443**.
3. Sur la machine, ouvrir aussi le pare-feu local (Ubuntu d'Oracle bloque tout sauf SSH) :
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
4. Installer Docker : `curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER` (se reconnecter).
5. Suivre les « Étapes » ci-dessous. Pour un lien HTTPS gratuit sans nom de domaine, un sous-domaine gratuit
   (DuckDNS, par exemple) pointé sur l'IP de la machine suffit avec Caddy.

## Étapes

```bash
git clone https://github.com/nouba4tech/Projet_de_fin_d-etudes.git
cd Projet_de_fin_d-etudes/microservices

cp .env.example .env
nano .env            # CHANGER les 3 secrets (openssl rand -hex 32), choisir WEB_PORT

docker compose up -d --build     # 5 à 15 min la première fois (compilation Maven)
docker compose ps                # tous les services doivent être "running"
```

L'application est alors sur `http://IP-DU-SERVEUR`. Seul le port web est publié : MySQL et la gateway restent
internes au réseau Docker.

## Obligatoire avant de partager le lien

Le compte administrateur créé au premier démarrage est `noubasra` / `noubasra`. Changer son mot de passe :

```bash
docker compose exec db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e \
  "UPDATE mirador_utilisateurs.utilisateur SET psw = MD5('"'"'NOUVEAU_MOT_DE_PASSE_FORT'"'"') WHERE compte = '"'"'noubasra'"'"';"'
```

Ne **pas** charger `sample-data.sql` sur un serveur public : il crée 9 comptes de démonstration au mot de passe
`Mirador123`. Si tu en as besoin pour la soutenance, charge-le puis change ou supprime ces comptes.

## HTTPS (conseillé)

Le plus simple : placer Caddy devant, avec un nom de domaine pointant sur le serveur.

```bash
sudo apt install -y caddy
echo 'ton-domaine.fr { reverse_proxy localhost:80 }' | sudo tee /etc/caddy/Caddyfile
sudo systemctl reload caddy      # certificat Let's Encrypt automatique
```

(et mettre `WEB_PORT=8081` dans `.env` si Caddy occupe déjà le port 80, avec `reverse_proxy localhost:8081`).

## Reprendre tes données actuelles

Les données de ton PC sont dans les bases `mirador_*` locales. Pour les envoyer :

```powershell
# sur ton PC
mysqldump -u root --databases mirador_utilisateurs mirador_chambres mirador_clients mirador_reservations mirador_paiements mirador_facturation mirador_personnel mirador_promotions mirador_avis mirador_notifications mirador_exploitation > export.sql
```
```bash
# sur le serveur (après un premier démarrage)
docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' < export.sql
```

## Mettre à jour

```bash
git pull && docker compose up -d --build
```

## Dépannage

- `docker compose logs -f <service>` (ex. `paiements-service`).
- Un service qui redémarre en boucle : souvent mémoire insuffisante (`free -h`) ou base pas encore prête.
- Page blanche ou erreurs `/api` : `docker compose logs frontend backend`.
