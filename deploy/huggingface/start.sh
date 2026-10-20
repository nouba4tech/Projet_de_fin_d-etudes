#!/bin/bash
# Runs the whole system inside ONE container: nginx, MySQL 8, the 11 microservices and the gateway.
# Everything lives in /tmp (the disk of a free Space is ephemeral): demo data is rebuilt at every start.
set -u
export HOME=/tmp
LOGS=/tmp/logs; DATA=/tmp/data; SOCK=/tmp/mysql.sock; SQL=/app/sql; JARS=/app/jars
mkdir -p "$LOGS" "$DATA" /tmp/nginx
log() { echo "[start $(date +%H:%M:%S)] $*"; }

# ---- secrets ---------------------------------------------------------------------------------
: "${JWT_SECRET:=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')}"
: "${INTERNAL_TOKEN:=$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')}"
export JWT_SECRET INTERNAL_TOKEN
export MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 MYSQL_USERNAME=root MYSQL_SSL_MODE=DISABLED
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  log "ERREUR : le secret ADMIN_PASSWORD n'est pas defini (Settings > Variables and secrets du Space)."
  log "Par securite l'API ne sera pas ouverte au public tant qu'il manque."
fi

# ---- 1) web server first, so the Space is reported as running right away ----------------------
nginx -c /app/nginx.conf -g 'daemon off;' > "$LOGS/nginx.log" 2>&1 &
log "nginx demarre (port 7860)"

# ---- 2) MySQL --------------------------------------------------------------------------------
MYSQLD_OPTS=(--no-defaults --basedir=/usr --datadir="$DATA/mysql")
mysqld "${MYSQLD_OPTS[@]}" --initialize-insecure > "$LOGS/mysql-init.log" 2>&1 || { log "init MySQL en echec :"; tail -n 20 "$LOGS/mysql-init.log"; }
mysqld "${MYSQLD_OPTS[@]}" --socket="$SOCK" --pid-file=/tmp/mysql.pid --bind-address=127.0.0.1 --port=3306 \
  --mysqlx=OFF --skip-log-bin --performance-schema=OFF --innodb-buffer-pool-size=160M --max-connections=300 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci > "$LOGS/mysql.log" 2>&1 &
for i in $(seq 1 90); do mysqladmin --no-defaults -uroot -S "$SOCK" ping >/dev/null 2>&1 && break; sleep 2; done
mysqladmin --no-defaults -uroot -S "$SOCK" ping >/dev/null 2>&1 || { log "MySQL ne repond pas :"; tail -n 30 "$LOGS/mysql.log"; }
log "MySQL pret"
sql() { mysql --no-defaults -uroot -S "$SOCK" --default-character-set=utf8mb4 "$@"; }

# ---- 3) the 11 microservices (sequential: the free Space only has 2 vCPU) --------------------------
JVM=(-Xms32m -Xmx176m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -XX:MaxMetaspaceSize=128m -Xss512k -Dspring.main.banner-mode=off)
declare -A PORT=( [utilisateurs-service]=8081 [chambres-service]=8082 [clients-service]=8083 [reservations-service]=8084
                  [paiements-service]=8085 [facturation-service]=8086 [personnel-service]=8087 [promotions-service]=8088
                  [avis-service]=8089 [notifications-service]=8090 [exploitation-service]=8091 [api-gateway]=8080 )
ORDER=(utilisateurs-service chambres-service clients-service reservations-service paiements-service facturation-service
       personnel-service promotions-service avis-service notifications-service exploitation-service)
declare -A PID

start_service() {
  local name=$1
  java "${JVM[@]}" -jar "$JARS/$name.jar" > "$LOGS/$name.log" 2>&1 &
  PID[$name]=$!
  for i in $(seq 1 120); do
    (echo > "/dev/tcp/127.0.0.1/${PORT[$name]}") 2>/dev/null && { log "$name pret"; return 0; }
    kill -0 "${PID[$name]}" 2>/dev/null || { log "$name s'est arrete :"; tail -n 15 "$LOGS/$name.log"; return 1; }
    sleep 2
  done
  log "$name : delai depasse"; return 1
}
for name in "${ORDER[@]}"; do start_service "$name"; done

# ---- 4) demo data: monolith seed -> migrated into the per-service databases -> sample data ----------------
log "chargement des donnees de demonstration"
sql -e "CREATE DATABASE IF NOT EXISTS bd_mirador CHARACTER SET utf8mb4"
sql --force bd_mirador < "$SQL/schema-mysql.sql"      > "$LOGS/bootstrap-1-schema.log" 2>&1
sql --force bd_mirador < "$SQL/data-seed-clean.sql"   > "$LOGS/bootstrap-2-seed.log"   2>&1
sql --force            < "$SQL/migrate-data.sql"      > "$LOGS/bootstrap-3-migrate.log" 2>&1
sql --force            < "$SQL/sample-data.sql"       > "$LOGS/bootstrap-4-sample.log"  2>&1
sql -e "DROP DATABASE IF EXISTS bd_mirador"

# ---- 5) accounts: nothing keeps a known password -----------------------------------------------------
if [ -n "${ADMIN_PASSWORD:-}" ]; then
  esc=${ADMIN_PASSWORD//\\/\\\\}; esc=${esc//\'/\'\'}
  sql -e "UPDATE mirador_utilisateurs.utilisateur SET psw = MD5('$esc') WHERE compte = 'noubasra';
          UPDATE mirador_utilisateurs.utilisateur SET psw = MD5(UUID()) WHERE compte <> 'noubasra';"
  log "mot de passe administrateur applique ; comptes de demonstration desactives (mot de passe aleatoire)"
  # ---- 6) the gateway opens the API only now that the accounts are secured ----------------------------
  start_service api-gateway
  touch /tmp/ready
  log "APPLICATION PRETE : connexion avec l'utilisateur noubasra et le mot de passe du secret ADMIN_PASSWORD"
else
  log "API non ouverte (ADMIN_PASSWORD manquant)."
fi

# ---- 7) keep the container alive and restart a service that crashed -------------------------------------
while true; do
  sleep 30
  for name in "${!PID[@]}"; do
    if ! kill -0 "${PID[$name]}" 2>/dev/null; then
      log "$name est tombe, redemarrage"
      start_service "$name" || true
    fi
  done
done
